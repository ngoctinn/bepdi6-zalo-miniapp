from rest_framework import serializers

from apps.menu.models import Category, Option, OptionGroup, Product, ProductPromotion
from apps.menu.utils import optimize_image_to_webp


class OptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Option
        fields = [
            "id",
            "name",
            "price",
            "status",
            "sort_order",
        ]


class OptionGroupSerializer(serializers.ModelSerializer):
    options = OptionSerializer(many=True, read_only=True)

    class Meta:
        model = OptionGroup
        fields = [
            "id",
            "name",
            "is_required",
            "min_select",
            "max_select",
            "sort_order",
            "options",
        ]


class ProductPromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductPromotion
        fields = [
            "id",
            "promotional_price",
            "is_active",
            "valid_from",
            "valid_to",
            "note",
        ]


class ProductListSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(required=True)
    image_url = serializers.CharField(required=False, allow_blank=True, default="")
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)

    # Computed promotion fields (read-only)
    effective_price = serializers.SerializerMethodField()
    has_promotion = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "category_id",
            "name",
            "description",
            "image",
            "image_url",
            "price",
            "effective_price",
            "has_promotion",
            "discount_percent",
            "status",
        ]

    def get_effective_price(self, obj: Product):
        active_price = getattr(obj, "active_promotion_price", None)
        has_active_promotion = getattr(obj, "has_active_promotion", None)
        if active_price is not None:
            return float(active_price)
        if has_active_promotion is not None:
            return float(obj.price)
        return float(obj.effective_price)

    def get_has_promotion(self, obj: Product) -> bool:
        has_active_promotion = getattr(obj, "has_active_promotion", None)
        if has_active_promotion is not None:
            return bool(has_active_promotion)
        return obj.has_promotion

    def get_discount_percent(self, obj: Product):
        active_price = getattr(obj, "active_promotion_price", None)
        has_active_promotion = getattr(obj, "has_active_promotion", None)
        if active_price is not None and obj.price and obj.price > 0:
            pct = round((1 - float(active_price) / float(obj.price)) * 100)
            return max(0, pct)
        if has_active_promotion is not None:
            return None
        return obj.discount_percent

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["image_url"] = instance.effective_image_url
        return data

    def create(self, validated_data):
        image = validated_data.get("image")
        if image:
            validated_data["image"] = optimize_image_to_webp(image)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image = validated_data.get("image")
        if image:
            validated_data["image"] = optimize_image_to_webp(image)
        return super().update(instance, validated_data)


class ProductDetailSerializer(serializers.ModelSerializer):
    option_groups = OptionGroupSerializer(many=True, read_only=True)
    image_url = serializers.CharField(required=False, allow_blank=True, default="")
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)

    # Computed promotion fields (read-only)
    effective_price = serializers.SerializerMethodField()
    has_promotion = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "category_id",
            "name",
            "description",
            "image",
            "image_url",
            "price",
            "effective_price",
            "has_promotion",
            "discount_percent",
            "status",
            "option_groups",
        ]

    def get_effective_price(self, obj: Product):
        active_price = getattr(obj, "active_promotion_price", None)
        has_active_promotion = getattr(obj, "has_active_promotion", None)
        if active_price is not None:
            return float(active_price)
        if has_active_promotion is not None:
            return float(obj.price)
        return float(obj.effective_price)

    def get_has_promotion(self, obj: Product) -> bool:
        has_active_promotion = getattr(obj, "has_active_promotion", None)
        if has_active_promotion is not None:
            return bool(has_active_promotion)
        return obj.has_promotion

    def get_discount_percent(self, obj: Product):
        active_price = getattr(obj, "active_promotion_price", None)
        has_active_promotion = getattr(obj, "has_active_promotion", None)
        if active_price is not None and obj.price and obj.price > 0:
            pct = round((1 - float(active_price) / float(obj.price)) * 100)
            return max(0, pct)
        if has_active_promotion is not None:
            return None
        return obj.discount_percent

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["image_url"] = instance.effective_image_url
        return data


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.CharField(required=False, allow_blank=True, default="")
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "description",
            "image",
            "image_url",
            "sort_order",
            "status",
        ]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data["image_url"] = instance.effective_image_url
        return data

    def create(self, validated_data):
        image = validated_data.get("image")
        if image:
            validated_data["image"] = optimize_image_to_webp(image)
        return super().create(validated_data)

    def update(self, instance, validated_data):
        image = validated_data.get("image")
        if image:
            validated_data["image"] = optimize_image_to_webp(image)
        return super().update(instance, validated_data)
