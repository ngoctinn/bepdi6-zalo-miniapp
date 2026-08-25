from rest_framework import serializers

from apps.shipping.models import ShopConfig


class PublicShopInfoSerializer(serializers.ModelSerializer):
    """Serializer for public customer-facing shop information."""

    class Meta:
        model = ShopConfig
        fields = [
            "shop_name",
            "hotline",
            "address_text",
            "announcement_banner",
            "is_open",
            "open_time",
            "close_time",
            "prep_time_minutes",
            "min_order_amount",
            "min_order_for_freeship",
            "max_delivery_radius_km",
            "vietqr_bank_id",
            "vietqr_account_no",
            "vietqr_account_name",
        ]


class AdminShopConfigSerializer(serializers.ModelSerializer):
    """Serializer for admin shop configuration management with validation."""

    class Meta:
        model = ShopConfig
        fields = [
            "shop_name",
            "hotline",
            "address_text",
            "announcement_banner",
            "latitude",
            "longitude",
            "max_delivery_radius_km",
            "haversine_multiplier",
            "is_open",
            "open_time",
            "close_time",
            "prep_time_minutes",
            "min_order_amount",
            "min_order_for_freeship",
            "shipping_tiers",
            "vietqr_bank_id",
            "vietqr_account_no",
            "vietqr_account_name",
            "updated_at",
        ]
        read_only_fields = ["updated_at"]

    def validate_shipping_tiers(self, value):
        if not isinstance(value, list):
            raise serializers.ValidationError(
                "shipping_tiers phải là một danh sách các mốc cự ly."
            )

        for index, tier in enumerate(value):
            if not isinstance(tier, dict):
                raise serializers.ValidationError(
                    f"Mốc thứ {index + 1} phải là một object."
                )

            if "from_km" not in tier or "to_km" not in tier or "fee" not in tier:
                raise serializers.ValidationError(
                    f"Mốc thứ {index + 1} phải chứa đầy đủ: from_km, to_km, fee."
                )

            try:
                from_km = float(tier["from_km"])
                to_km = float(tier["to_km"])
                fee = float(tier["fee"])
            except (ValueError, TypeError):
                raise serializers.ValidationError(
                    f"Các giá trị trong mốc thứ {index + 1} phải là số."
                ) from None

            if from_km < 0 or to_km <= from_km:
                raise serializers.ValidationError(
                    f"Mốc thứ {index + 1}: to_km ({to_km}) phải lớn hơn from_km ({from_km}) và >= 0."
                )
            if fee < 0:
                raise serializers.ValidationError(
                    f"Mốc thứ {index + 1}: fee ({fee}) không được âm."
                )

        return value
