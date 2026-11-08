import hmac
import json
import logging
import re
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.http import JsonResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.views import APIView

from apps.orders.models import Order
from apps.payments.models import Payment

logger = logging.getLogger(__name__)


def extract_order_code(content: str) -> str | None:
    """Extract order code from bank transfer memo/content.

    Standard order codes are 8 uppercase alphanumeric chars, e.g. '24110801' or 'ORDER123'.
    Matches patterns like 'BEPDI6 24110801', '24110801', 'DH24110801', 'DH-24110801'.
    """
    if not content:
        return None
    # 1. Match candidates: standard 8-char codes or prefixed with DH/DH-
    cleaned_content = content.upper().replace("-", " ")
    matches = re.findall(r"(?:DH\s*)?([A-Z0-9]{8})\b", cleaned_content)
    if not matches:
        # Fallback to any 6-12 uppercase alphanumeric sequence
        matches = re.findall(r"\b([A-Z0-9]{6,12})\b", cleaned_content)

    for candidate in matches:
        if Order.objects.filter(order_code=candidate).exists():
            return candidate
    return None


def verify_webhook_auth(request) -> bool:
    """Verify webhook authentication token using constant-time comparison (Fail-Closed)."""
    expected_token = getattr(settings, "PAYMENT_WEBHOOK_API_KEY", "")
    # In production or standard mode, reject if no API key is configured (Fail-Closed)
    if not expected_token:
        # If in DEBUG mode and explicitly allowed for local testing
        if getattr(settings, "DEBUG", False):
            return True
        logger.error(
            "[Payment Webhook] PAYMENT_WEBHOOK_API_KEY is not configured in production."
        )
        return False

    auth_token = None
    # 1. Check Authorization header: 'Apikey <token>' or 'Bearer <token>' or raw token
    auth_header = request.headers.get("Authorization", "")
    if auth_header:
        parts = auth_header.split()
        if len(parts) == 2:
            auth_token = parts[1]
        else:
            auth_token = auth_header

    # 2. Check X-API-KEY or secure-token header (Casso / SePay custom header)
    if not auth_token:
        auth_token = request.headers.get("X-API-KEY") or request.headers.get(
            "secure-token"
        )

    if not auth_token:
        return False

    # Constant-time comparison to prevent timing attacks
    return hmac.compare_digest(auth_token, expected_token)


class PaymentWebhookView(APIView):
    """Universal Webhook handler for SePay and Casso payment notifications.

    Receives incoming transfer alerts, parses the order code, verifies the amount,
    and updates the Order/Payment status idempotently inside an atomic transaction.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request, *args, **kwargs):
        if not verify_webhook_auth(request):
            logger.warning("[Payment Webhook] Unauthorized request attempt")
            return JsonResponse(
                {
                    "success": False,
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "Invalid webhook token",
                    },
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        try:
            data = (
                request.data
                if isinstance(request.data, dict)
                else json.loads(request.body)
            )
        except Exception:
            return JsonResponse(
                {
                    "success": False,
                    "error": {
                        "code": "INVALID_JSON",
                        "message": "Malformed JSON payload",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        logger.info("[Payment Webhook] Incoming transaction alert received")

        # Normalize transactions list (Casso V1/V2 or SePay)
        transactions = []
        if "transferAmount" in data:
            # SePay format: { transferAmount, content, referenceCode, ... }
            transactions.append(
                {
                    "amount": data.get("transferAmount", 0),
                    "content": data.get("content") or data.get("description", ""),
                    "reference": str(data.get("referenceCode") or data.get("id", "")),
                }
            )
        elif "data" in data:
            # Casso format: data can be a dict (V2) or a list (V1)
            casso_data = data["data"]
            if isinstance(casso_data, dict):
                transactions.append(
                    {
                        "amount": casso_data.get("amount", 0),
                        "content": casso_data.get("description", ""),
                        "reference": str(
                            casso_data.get("reference") or casso_data.get("id", "")
                        ),
                    }
                )
            elif isinstance(casso_data, list):
                for item in casso_data:
                    transactions.append(
                        {
                            "amount": item.get("amount", 0),
                            "content": item.get("description", ""),
                            "reference": str(
                                item.get("reference")
                                or item.get("id")
                                or item.get("tid", "")
                            ),
                        }
                    )

        processed_orders = []

        for tx in transactions:
            try:
                transfer_amount = Decimal(str(tx["amount"]))
            except Exception:
                continue

            if transfer_amount <= 0:
                continue

            content = tx["content"]
            order_code = extract_order_code(content)
            if not order_code:
                logger.info("[Payment Webhook] No matching order code found in memo")
                continue

            reference = tx["reference"].strip()

            with transaction.atomic():
                try:
                    order = Order.objects.select_for_update().get(order_code=order_code)
                except Order.DoesNotExist:
                    logger.warning(
                        "[Payment Webhook] Order %s does not exist", order_code
                    )
                    continue

                # Rule: Do not modify order/payment for terminal state orders (COMPLETED, CANCELLED)
                if order.status in [Order.Status.COMPLETED, Order.Status.CANCELLED]:
                    logger.warning(
                        "[Payment Webhook] Order %s is in terminal state %s. Skipping modification.",
                        order_code,
                        order.status,
                    )
                    processed_orders.append(
                        {"order_code": order_code, "status": f"IGNORED_{order.status}"}
                    )
                    continue

                # Rule: Only BANK_TRANSFER orders can be marked via VietQR webhook
                if order.payment_method != Order.PaymentMethod.BANK_TRANSFER:
                    logger.warning(
                        "[Payment Webhook] Order %s payment method is %s, not BANK_TRANSFER",
                        order_code,
                        order.payment_method,
                    )
                    continue

                # Check double-spending / Replay attack: ensure reference is not already used on another order
                if (
                    reference
                    and Payment.objects.filter(transaction_reference=reference)
                    .exclude(order=order)
                    .exists()
                ):
                    logger.error(
                        "[Payment Webhook] Replay attack detected: Reference %s already used on another payment!",
                        reference,
                    )
                    processed_orders.append(
                        {"order_code": order_code, "status": "DUPLICATE_REFERENCE"}
                    )
                    continue

                payment, _ = Payment.objects.select_for_update().get_or_create(
                    order=order,
                    defaults={
                        "amount": order.total_amount,
                        "method": Payment.Method.BANK_TRANSFER,
                        "status": Payment.Status.UNPAID,
                    },
                )

                # Idempotency: if already paid, skip
                if payment.status == Payment.Status.PAID:
                    logger.info(
                        "[Payment Webhook] Order %s already PAID. Skipping.", order_code
                    )
                    processed_orders.append(
                        {"order_code": order_code, "status": "ALREADY_PAID"}
                    )
                    continue

                now = timezone.now()
                payment.actual_paid_amount = transfer_amount
                payment.transaction_reference = reference

                # Compare transfer amount with expected amount
                if transfer_amount >= order.total_amount:
                    payment.status = Payment.Status.PAID
                    payment.paid_at = now
                    payment.note = (
                        f"Thanh toán tự động qua Webhook: {transfer_amount:,.0f}đ"
                    )
                    payment.save(
                        update_fields=[
                            "status",
                            "actual_paid_amount",
                            "transaction_reference",
                            "paid_at",
                            "note",
                            "updated_at",
                        ]
                    )

                    # If order was PENDING_CONFIRMATION, automatically transition to PREPARING
                    if order.status == Order.Status.PENDING_CONFIRMATION:
                        order.status = Order.Status.PREPARING
                        order.save(update_fields=["status", "updated_at"])

                    processed_orders.append(
                        {"order_code": order_code, "status": "PAID"}
                    )
                    logger.info(
                        "[Payment Webhook] Successfully marked order %s as PAID",
                        order_code,
                    )
                else:
                    # Underpaid: keep PENDING / UNPAID and record note for staff
                    payment.status = Payment.Status.PENDING
                    payment.note = f"Khách chuyển thiếu: Nhận {transfer_amount:,.0f}đ / Cần {order.total_amount:,.0f}đ"
                    payment.save(
                        update_fields=[
                            "status",
                            "actual_paid_amount",
                            "transaction_reference",
                            "note",
                            "updated_at",
                        ]
                    )
                    processed_orders.append(
                        {"order_code": order_code, "status": "UNDERPAID"}
                    )
                    logger.warning(
                        "[Payment Webhook] Order %s underpaid: %s < %s",
                        order_code,
                        transfer_amount,
                        order.total_amount,
                    )

        return JsonResponse(
            {
                "success": True,
                "data": {
                    "processed": processed_orders,
                },
            },
            status=status.HTTP_200_OK,
        )
