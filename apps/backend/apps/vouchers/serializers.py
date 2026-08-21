from decimal import Decimal

from rest_framework import serializers

from apps.vouchers.models import Voucher


class VoucherValidateRequestSerializer(serializers.Serializer):
    code = serializers.CharField(required=True)
    order_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=True, min_value=Decimal("0.00")
    )


class VoucherSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = [
            "id",
            "code",
            "name",
            "discount_type",
            "discount_value",
            "minimum_order_value",
            "maximum_discount",
            "usage_limit",
            "usage_per_customer",
            "start_at",
            "end_at",
            "status",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]
