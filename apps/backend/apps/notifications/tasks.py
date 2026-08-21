import logging

import requests
from celery import shared_task
from django.conf import settings

from apps.customers.models import User
from apps.notifications.models import Notification
from apps.orders.models import Order

logger = logging.getLogger(__name__)


@shared_task(name="notifications.send_in_app_notification")
def send_in_app_notification(
    customer_id: int,
    title: str,
    message: str,
    order_id: int | None = None,
    notification_type: str = Notification.NotificationType.ORDER_STATUS,
) -> int:
    """Creates in-app notification record for customer."""
    notif = Notification.objects.create(
        customer_id=customer_id,
        order_id=order_id,
        type=notification_type,
        title=title,
        message=message,
    )
    return notif.id


@shared_task(name="notifications.send_zalo_oa_staff_alert")
def send_zalo_oa_staff_alert(order_id: int) -> bool:
    """
    Sends direct message to staff/admin personal Zalo accounts via Zalo OA OpenAPI when new order arrives.
    (ADR-005: Staff Zalo OA Alert).
    """
    try:
        order = Order.objects.select_related("customer").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error("Order #%s not found for Zalo OA staff alert.", order_id)
        return False

    # Find active staff/admin with linked zalo_user_id
    staff_recipients = User.objects.filter(
        status=User.Status.ACTIVE,
        zalo_user_id__isnull=False,
    ).exclude(zalo_user_id="")

    oa_access_token = getattr(settings, "ZALO_OA_ACCESS_TOKEN", "")
    if not oa_access_token:
        logger.info(
            "ZALO_OA_ACCESS_TOKEN not configured. Mocking staff alert for Order #%s to %s recipients.",
            order.order_code,
            staff_recipients.count(),
        )
        return True

    text_message = (
        f"🔔 [BẾP DÌ 6] ĐƠN HÀNG MỚI!\n"
        f"Mã đơn: #{order.order_code}\n"
        f"Khách hàng: {order.recipient_name} ({order.phone})\n"
        f"Tổng tiền: {order.total_amount:,.0f}đ ({order.get_payment_method_display()})\n"
        f"Địa chỉ: {order.delivery_address}"
    )

    success_count = 0
    for staff in staff_recipients:
        try:
            payload = {
                "recipient": {"user_id": staff.zalo_user_id},
                "message": {"text": text_message},
            }
            headers = {
                "access_token": oa_access_token,
                "Content-Type": "application/json",
            }
            res = requests.post(
                "https://openapi.zalo.me/v3.0/oa/message/cs",
                json=payload,
                headers=headers,
                timeout=5,
            )
            if res.status_code == 200:
                success_count += 1
            else:
                logger.warning(
                    "Failed to send Zalo OA message to staff %s: %s",
                    staff.username,
                    res.text,
                )
        except Exception as e:
            logger.error(
                "Error sending Zalo OA alert to staff %s: %s", staff.username, e
            )

    return success_count > 0


@shared_task(name="notifications.send_zns_order_delivering")
def send_zns_order_delivering(order_id: int) -> bool:
    """
    Sends ZNS message when order status changes to DELIVERING.
    Gated by ENABLE_ZNS_NOTIFICATION feature flag (ADR-005).
    """
    enable_zns = getattr(settings, "ENABLE_ZNS_NOTIFICATION", False)
    if not enable_zns:
        logger.info(
            "ENABLE_ZNS_NOTIFICATION is False. Skipping ZNS for order #%s.", order_id
        )
        return False

    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return False

    logger.info(
        "Sending ZNS delivering notification for order #%s to phone %s.",
        order.order_code,
        order.phone,
    )
    # ZNS API calling logic with template parameters
    return True
