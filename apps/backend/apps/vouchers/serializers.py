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

    def validate(self, data):
        start_at = data.get("start_at") or getattr(self.instance, "start_at", None)
        end_at = data.get("end_at") or getattr(self.instance, "end_at", None)
        if start_at and end_at and start_at >= end_at:
            raise serializers.ValidationError(
                {"end_at": "Thời gian kết thúc phải sau thời gian bắt đầu."}
            )

        discount_type = data.get("discount_type") or getattr(
            self.instance, "discount_type", None
        )
        discount_value = data.get("discount_value") or getattr(
            self.instance, "discount_value", None
        )
        if discount_value is not None and discount_value <= Decimal("0.00"):
            raise serializers.ValidationError(
                {"discount_value": "Mức giảm giá phải lớn hơn 0."}
            )

        if (
            discount_type == Voucher.DiscountType.PERCENTAGE
            and discount_value is not None
        ):
            if discount_value > Decimal("100.00"):
                raise serializers.ValidationError(
                    {
                        "discount_value": "Phần trăm giảm giá phải nằm trong khoảng từ 1% đến 100%."
                    }
                )
        return data
