from rest_framework import serializers

from apps.shipping.models import ShopConfig, normalize_shipping_tiers


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
        try:
            return normalize_shipping_tiers(value)
        except ValueError as exc:
            raise serializers.ValidationError(str(exc)) from exc

    def validate(self, attrs):
        """Validate a PATCH against its existing tier schedule as well."""
        tiers = attrs.get("shipping_tiers")
        if tiers is None and self.instance is not None:
            try:
                normalize_shipping_tiers(self.instance.shipping_tiers)
            except ValueError as exc:
                raise serializers.ValidationError({"shipping_tiers": str(exc)}) from exc
        return attrs
