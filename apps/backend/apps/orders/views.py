from rest_framework import permissions, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.models import Address, Customer
from apps.orders.models import Order
from apps.orders.serializers import (
    CheckoutPreviewRequestSerializer,
    OrderCreateRequestSerializer,
    OrderDetailSerializer,
    OrderListSerializer,
    PaymentSerializer,
)
from apps.orders.services import OrderProcessingError, OrderService


def get_current_customer(request) -> Customer:
    """Helper to resolve customer from authenticated user or fallback header for dev/testing."""
    if hasattr(request.user, "customer_profile"):
        return request.user.customer_profile

    # For dev / JWT authenticated customer mapping
    zalo_user_id = getattr(request.user, "zalo_user_id", None)
    if zalo_user_id:
        customer, _ = Customer.objects.get_or_create(
            zalo_user_id=zalo_user_id,
            defaults={"name": request.user.username or "Khách Zalo"},
        )
        return customer

    # Dev/Mock fallback
    cust_id = request.headers.get("X-Customer-ID") or request.query_params.get(
        "customer_id"
    )
    if cust_id:
        try:
            return Customer.objects.get(pk=cust_id)
        except Customer.DoesNotExist:
            pass

    # Default fallback customer for initial development
    customer, _ = Customer.objects.get_or_create(
        zalo_user_id="zalo_default_guest",
        defaults={"name": "Khách mặc định", "phone": "0900000000"},
    )
    return customer


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
