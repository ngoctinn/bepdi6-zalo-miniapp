from rest_framework import serializers

from apps.orders.models import Order, OrderItem, OrderItemOption
from apps.payments.models import Payment


class OrderItemOptionInputSerializer(serializers.Serializer):
    id = serializers.IntegerField()


class CartItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(required=True)
    quantity = serializers.IntegerField(required=True, min_value=1)
    option_ids = serializers.ListField(
        child=serializers.IntegerField(), required=False, default=list
    )
    options = serializers.ListField(required=False, default=list)
    note = serializers.CharField(required=False, allow_blank=True, default="")

    def to_internal_value(self, data):
        ret = super().to_internal_value(data)
        if not ret.get("option_ids") and "options" in data:
            raw_options = data.get("options", [])
            extracted_ids = []
            for opt in raw_options:
                if isinstance(opt, dict):
                    opt_id = opt.get("option_id") or opt.get("id") or opt.get("option")
                    if opt_id is not None:
                        extracted_ids.append(int(opt_id))
                elif isinstance(opt, (int, str)) and str(opt).isdigit():
                    extracted_ids.append(int(opt))
            ret["option_ids"] = extracted_ids
        return ret


class CheckoutPreviewRequestSerializer(serializers.Serializer):
    items = CartItemInputSerializer(many=True, required=True, allow_empty=False)
    address_id = serializers.IntegerField(required=False, allow_null=True)
    delivery_latitude = serializers.DecimalField(
        max_digits=10, decimal_places=8, required=False, allow_null=True
    )
    delivery_longitude = serializers.DecimalField(
        max_digits=11, decimal_places=8, required=False, allow_null=True
    )
    delivery_type = serializers.ChoiceField(
        choices=Order.DeliveryType.choices, default=Order.DeliveryType.DELIVERY
    )
    voucher_code = serializers.CharField(
        required=False, allow_blank=True, allow_null=True
    )
    payment_method = serializers.ChoiceField(
        choices=Order.PaymentMethod.choices, default=Order.PaymentMethod.COD
    )


class OrderCreateRequestSerializer(CheckoutPreviewRequestSerializer):
    recipient_name = serializers.CharField(required=False, allow_blank=True, default="")
    phone = serializers.CharField(required=False, allow_blank=True, default="")
    delivery_address = serializers.CharField(
        required=False, allow_blank=True, default=""
    )
    note = serializers.CharField(required=False, allow_blank=True, default="")
    scheduled_delivery_at = serializers.DateTimeField(required=False, allow_null=True)


class OrderItemOptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItemOption
        fields = [
            "id",
            "option_id",
            "option_name",
            "price",
            "quantity",
        ]


class OrderItemSerializer(serializers.ModelSerializer):
    options = OrderItemOptionSerializer(many=True, read_only=True)

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_id",
            "product_name",
            "unit_price",
            "quantity",
            "note",
            "subtotal",
            "options",
        ]


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "method",
            "status",
            "amount",
            "qr_code_url",
            "paid_at",
        ]


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_code",
            "status",
            "delivery_type",
            "recipient_name",
            "phone",
            "delivery_address",
            "delivery_latitude",
            "delivery_longitude",
            "distance_km",
            "shipping_fee",
            "subtotal",
            "discount",
            "total_amount",
            "payment_method",
            "note",
            "scheduled_delivery_at",
            "confirmed_at",
            "completed_at",
            "cancelled_at",
            "cancellation_reason",
            "created_at",
            "items",
            "payment",
        ]


class OrderListSerializer(serializers.ModelSerializer):
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "order_code",
            "status",
            "delivery_type",
            "scheduled_delivery_at",
            "total_amount",
            "payment_method",
            "item_count",
            "created_at",
        ]
