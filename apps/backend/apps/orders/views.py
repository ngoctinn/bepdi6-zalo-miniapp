from decimal import Decimal

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.models import Address
from apps.customers.permissions import IsStaffOrAdminUser
from apps.customers.views import get_current_customer
from apps.orders.models import Order
from apps.orders.serializers import (
    CheckoutPreviewRequestSerializer,
    OrderCreateRequestSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    PaymentSerializer,
)
from apps.orders.services import (
    InvalidStateTransitionError,
    OrderProcessingError,
    OrderService,
)
from apps.payments.models import Payment


class CheckoutPreviewView(APIView):
    """
    POST /api/v1/checkout/preview
    Calculates subtotal, shipping fee, distance, voucher discount, and total amount before placing order.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CheckoutPreviewRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = get_current_customer(request)
        address_id = data["address_id"]

        try:
            address = Address.objects.get(pk=address_id, customer=customer)
        except Address.DoesNotExist:
            raise NotFound("Địa chỉ giao hàng không tồn tại.") from None

        try:
            calc_result = OrderService.validate_and_calculate_cart(
                customer=customer,
                items_data=data["items"],
                address=address,
                voucher_code=data.get("voucher_code"),
            )
        except OrderProcessingError as e:
            raise ValidationError({"code": e.code, "message": e.message}) from None

        return Response(
            {
                "subtotal": calc_result["subtotal"],
                "distance_km": calc_result["distance_km"],
                "shipping_fee": calc_result["shipping_fee"],
                "discount": calc_result["discount"],
                "total_amount": calc_result["total_amount"],
                "is_deliverable": calc_result["is_deliverable"],
            }
        )


class OrderListCreateView(APIView):
    """
    POST /api/v1/orders - Creates an order (requires Idempotency-Key header)
    GET /api/v1/orders - Returns customer order history
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        customer = get_current_customer(request)
        queryset = Order.objects.filter(customer=customer).order_by("-created_at")

        status_filter = request.query_params.get("status")
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        serializer = OrderListSerializer(queryset, many=True)
        return Response(serializer.data)

    def post(self, request):
        idempotency_key = request.headers.get("Idempotency-Key")
        if not idempotency_key:
            raise ValidationError(
                {
                    "code": "MISSING_IDEMPOTENCY_KEY",
                    "message": "Header 'Idempotency-Key' là bắt buộc khi đặt đơn hàng.",
                }
            )

        serializer = OrderCreateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer = get_current_customer(request)
        address_id = data["address_id"]

        try:
            address = Address.objects.get(pk=address_id, customer=customer)
        except Address.DoesNotExist:
            raise NotFound("Địa chỉ giao hàng không tồn tại.") from None

        try:
            order = OrderService.create_order(
                customer=customer,
                idempotency_key=idempotency_key.strip(),
                address=address,
                items_data=data["items"],
                delivery_type=data.get("delivery_type", Order.DeliveryType.ASAP),
                payment_method=data.get(
                    "payment_method", Order.PaymentMethod.BANK_TRANSFER
                ),
                voucher_code=data.get("voucher_code"),
                note=data.get("note", ""),
                scheduled_delivery_at=data.get("scheduled_delivery_at"),
            )
        except OrderProcessingError as e:
            raise ValidationError({"code": e.code, "message": e.message}) from None

        payment_data = None
        if hasattr(order, "payment"):
            payment_data = PaymentSerializer(order.payment).data

        return Response(
            {
                "id": order.id,
                "order_code": order.order_code,
                "status": order.status,
                "total_amount": order.total_amount,
                "payment": payment_data,
            },
            status=status.HTTP_201_CREATED,
        )


class OrderDetailView(APIView):
    """
    GET /api/v1/orders/{id}
    Returns detailed order information including items and payment details.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        customer = get_current_customer(request)
        try:
            order = (
                Order.objects.prefetch_related("items__options")
                .select_related("payment")
                .get(pk=pk, customer=customer)
            )
        except Order.DoesNotExist:
            raise NotFound("Đơn hàng không tồn tại.") from None

        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)


class OrderPaymentDetailView(APIView):
    """
    GET /api/v1/orders/{id}/payment
    Returns payment information (method, status, QR code) for an order.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        customer = get_current_customer(request)
        try:
            order = Order.objects.select_related("payment").get(
                pk=pk, customer=customer
            )
        except Order.DoesNotExist:
            raise NotFound("Đơn hàng không tồn tại.") from None

        serializer = PaymentSerializer(order.payment)
        return Response(serializer.data)


# ----------------------------------------------------------------------
# Admin / Staff Order Management Views (BR-SEC-002, BR-ORD-004, BR-PAY-004)
# ----------------------------------------------------------------------


class AdminOrderListView(APIView):
    """
    GET /api/v1/admin/orders
    List all orders with query filters: status, date, search.
    """

    permission_classes = [IsStaffOrAdminUser]

    def get(self, request):
        queryset = (
            Order.objects.select_related("customer", "payment")
            .prefetch_related("items__options")
            .order_by("-created_at")
        )

        status_param = request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)

        date_param = request.query_params.get("date")
        if date_param:
            queryset = queryset.filter(created_at__date=date_param)

        search_param = request.query_params.get("search")
        if search_param:
            queryset = queryset.filter(
                Q(order_code__icontains=search_param)
                | Q(recipient_name__icontains=search_param)
                | Q(phone__icontains=search_param)
            )

        serializer = OrderDetailSerializer(queryset, many=True)
        return Response(serializer.data)


class AdminOrderConfirmView(APIView):
    """
    POST /api/v1/admin/orders/{id}/confirm
    Staff confirms order via phone call.
    BR-ORD-004: Cannot edit items if payment method is BANK_TRANSFER (VietQR).
    """

    permission_classes = [IsStaffOrAdminUser]

    def post(self, request, pk: int):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            raise NotFound("Đơn hàng không tồn tại.") from None

        # Check if staff tries to modify items on a VietQR order
        edited_items = request.data.get("items")
        if edited_items and order.payment_method == Order.PaymentMethod.BANK_TRANSFER:
            raise ValidationError(
                {
                    "code": "CANNOT_MODIFY_VIETQR_ORDER",
                    "message": "Không được phép sửa đơn thanh toán qua VietQR. Phải hủy đơn để khách đặt lại (BR-ORD-004).",
                }
            )

        # Update order status to CONFIRMED
        try:
            updated_order = OrderService.update_order_status(
                order=order,
                new_status=Order.Status.CONFIRMED,
                user=request.user if request.user.is_authenticated else None,
            )
        except InvalidStateTransitionError as e:
            raise ValidationError({"code": e.code, "message": e.message}) from None

        return Response(OrderDetailSerializer(updated_order).data)


class AdminOrderCancelView(APIView):
    """
    POST /api/v1/admin/orders/{id}/cancel
    Cancels order with mandatory cancellation reason.
    """

    permission_classes = [IsStaffOrAdminUser]

    def post(self, request, pk: int):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            raise NotFound("Đơn hàng không tồn tại.") from None

        reason = str(request.data.get("reason", "")).strip()
        if not reason:
            raise ValidationError(
                {
                    "code": "MISSING_CANCEL_REASON",
                    "message": "Bắt buộc phải nhập lý do hủy đơn hàng.",
                }
            )

        try:
            cancelled_order = OrderService.update_order_status(
                order=order,
                new_status=Order.Status.CANCELLED,
                user=request.user if request.user.is_authenticated else None,
                reason=reason,
            )
        except InvalidStateTransitionError as e:
            raise ValidationError({"code": e.code, "message": e.message}) from None

        return Response(OrderDetailSerializer(cancelled_order).data)


class AdminOrderStatusUpdateView(APIView):
    """
    POST /api/v1/admin/orders/{id}/status
    Updates order status according to strict state machine.
    """

    permission_classes = [IsStaffOrAdminUser]

    def post(self, request, pk: int):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            raise NotFound("Đơn hàng không tồn tại.") from None

        new_status = request.data.get("status")
        if not new_status:
            raise ValidationError(
                {
                    "code": "MISSING_STATUS",
                    "message": "Trường 'status' là bắt buộc.",
                }
            )

        reason = str(request.data.get("reason", "")).strip()
        try:
            updated_order = OrderService.update_order_status(
                order=order,
                new_status=new_status,
                user=request.user if request.user.is_authenticated else None,
                reason=reason,
            )
        except InvalidStateTransitionError as e:
            raise ValidationError({"code": e.code, "message": e.message}) from None

        return Response(OrderDetailSerializer(updated_order).data)


class AdminOrderPaymentVerifyView(APIView):
    """
    POST /api/v1/admin/orders/{id}/payment/verify
    Verifies bank transfer / VietQR payment manually (BR-PAY-004).
    """

    permission_classes = [IsStaffOrAdminUser]

    def post(self, request, pk: int):
        try:
            order = Order.objects.select_related("payment").get(pk=pk)
        except Order.DoesNotExist:
            raise NotFound("Đơn hàng không tồn tại.") from None

        payment = getattr(order, "payment", None)
        if not payment:
            raise ValidationError(
                {
                    "code": "PAYMENT_NOT_FOUND",
                    "message": "Đơn hàng chưa có thông tin thanh toán.",
                }
            )

        actual_paid = request.data.get("actual_paid_amount")
        if actual_paid is None:
            actual_paid = order.total_amount
        actual_paid = Decimal(str(actual_paid))

        note = str(request.data.get("note", "")).strip()
        if actual_paid != order.total_amount and not note:
            raise ValidationError(
                {
                    "code": "PAYMENT_AMOUNT_MISMATCH",
                    "message": "Số tiền thực nhận bị lệch so với tổng đơn. Bắt buộc phải nhập ghi chú (note) lý do (BR-PAY-004).",
                }
            )

        with transaction.atomic():
            payment.status = Payment.Status.PAID
            payment.paid_at = timezone.now()
            payment.actual_paid_amount = actual_paid
            payment.note = note
            if request.user.is_authenticated:
                payment.verified_by = request.user
            payment.save()

        return Response(PaymentSerializer(payment).data)
