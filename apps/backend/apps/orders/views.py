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
from apps.menu.models import Product
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
        address_id = data.get("address_id")
        lat = data.get("delivery_latitude")
        lng = data.get("delivery_longitude")

        delivery_type = data.get("delivery_type", Order.DeliveryType.DELIVERY)
        address = None

        if delivery_type != Order.DeliveryType.PICKUP:
            if address_id:
                try:
                    address = Address.objects.get(pk=address_id, customer=customer)
                except Address.DoesNotExist:
                    raise NotFound("Địa chỉ giao hàng không tồn tại.") from None
            elif lat is not None and lng is not None:
                address = Address(
                    customer=customer,
                    recipient_name=customer.name or "Khách hàng",
                    phone=customer.phone or "0900000000",
                    address_text="Vị trí đã chọn",
                    latitude=lat,
                    longitude=lng,
                )
            else:
                address = Address.objects.filter(
                    customer=customer, is_default=True
                ).first()
                if not address:
                    address = Address.objects.filter(customer=customer).first()
                if not address:
                    address = Address(
                        customer=customer,
                        recipient_name=customer.name or "Khách hàng",
                        phone=customer.phone or "0900000000",
                        address_text="TP.HCM",
                        latitude=Decimal("10.762622"),
                        longitude=Decimal("106.660172"),
                    )

        try:
            calc_result = OrderService.validate_and_calculate_cart(
                customer=customer,
                items_data=data["items"],
                address=address,
                voucher_code=data.get("voucher_code"),
                delivery_type=delivery_type,
            )
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
        except OrderProcessingError as e:
            if e.code in [
                "OUT_OF_DELIVERY_RADIUS",
                "ORDER_AMOUNT_BELOW_MINIMUM",
                "MISSING_ADDRESS",
            ]:
                # Tính subtotal chính xác từ Product trong database
                subtotal = Decimal("0.00")
                for item in data.get("items", []):
                    qty = int(item.get("quantity", 1))
                    pid = item.get("product_id")
                    p = Product.objects.filter(pk=pid).first()
                    if p:
                        subtotal += p.price * qty

                return Response(
                    {
                        "subtotal": subtotal,
                        "distance_km": Decimal("0.00"),
                        "shipping_fee": Decimal("0.00"),
                        "discount": Decimal("0.00"),
                        "total_amount": subtotal,
                        "is_deliverable": False,
                        "message": e.message,
                    }
                )
            raise ValidationError({"code": e.code, "message": e.message}) from None


class OrderListCreateView(APIView):
    """
    POST /api/v1/orders - Creates an order (requires Idempotency-Key header)
    GET /api/v1/orders - Returns customer order history
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.db.models import Count

        customer = get_current_customer(request)
        queryset = (
            Order.objects.filter(customer=customer)
            .annotate(item_count=Count("items"))
            .order_by("-created_at")
        )

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
        delivery_type = data.get("delivery_type", Order.DeliveryType.DELIVERY)
        address_id = data.get("address_id")
        rec_name = data.get("recipient_name") or customer.name or "Khách hàng"
        phone_num = data.get("phone") or customer.phone or "0900000000"

        address = None
        if delivery_type != Order.DeliveryType.PICKUP:
            if address_id:
                try:
                    address = Address.objects.get(pk=address_id, customer=customer)
                except Address.DoesNotExist:
                    raise NotFound("Địa chỉ giao hàng không tồn tại.") from None
            else:
                lat = data.get("delivery_latitude") or Decimal("10.762622")
                lng = data.get("delivery_longitude") or Decimal("106.660172")
                addr_text = data.get("delivery_address") or "Địa chỉ giao hàng"
                address = Address.objects.create(
                    customer=customer,
                    recipient_name=rec_name,
                    phone=phone_num,
                    address_text=addr_text,
                    latitude=lat,
                    longitude=lng,
                    is_default=False,
                )

        try:
            order = OrderService.create_order(
                customer=customer,
                idempotency_key=idempotency_key.strip(),
                address=address,
                recipient_name=rec_name,
                phone=phone_num,
                items_data=data["items"],
                delivery_type=delivery_type,
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


class CustomerOrderCancelView(APIView):
    """
    POST /api/v1/orders/{id}/cancel
    Customer cancels own order when in PENDING_CONFIRMATION (BR-ORD-005).
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, pk: int):
        customer = get_current_customer(request)
        try:
            order = Order.objects.get(pk=pk, customer=customer)
        except Order.DoesNotExist:
            raise NotFound("Đơn hàng không tồn tại.") from None

        reason = str(request.data.get("reason", "")).strip() or "Khách hàng tự hủy đơn"

        try:
            cancelled_order = OrderService.cancel_order_by_customer(
                order=order,
                customer=customer,
                reason=reason,
            )
        except (OrderProcessingError, InvalidStateTransitionError) as e:
            raise ValidationError({"code": e.code, "message": e.message}) from None

        return Response(OrderDetailSerializer(cancelled_order).data)


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
    Allows editing items for COD orders and recalculates totals / voucher.
    """

    permission_classes = [IsStaffOrAdminUser]

    def post(self, request, pk: int):
        try:
            order = Order.objects.get(pk=pk)
        except Order.DoesNotExist:
            raise NotFound("Đơn hàng không tồn tại.") from None

        edited_items = request.data.get("items")
        note = request.data.get("note")
        scheduled_delivery_at = request.data.get("scheduled_delivery_at")

        try:
            updated_order = OrderService.confirm_order(
                order=order,
                user=request.user if request.user.is_authenticated else None,
                edited_items=edited_items,
                note=note,
                scheduled_delivery_at=scheduled_delivery_at,
            )
        except (OrderProcessingError, InvalidStateTransitionError) as e:
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
