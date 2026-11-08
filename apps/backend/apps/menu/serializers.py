from django.db import transaction
from rest_framework import serializers

from apps.menu.models import Category, Option, OptionGroup, Product, ProductPromotion
from apps.menu.utils import optimize_image_to_webp

MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


class MaxSizeImageField(serializers.ImageField):
    def to_internal_value(self, data):
        if data and getattr(data, "size", 0) > MAX_IMAGE_SIZE_BYTES:
            raise serializers.ValidationError(
                "Kích thước file ảnh không được vượt quá 5MB."
            )
        return super().to_internal_value(data)


class OptionSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(required=False)

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
    id = serializers.IntegerField(required=False)
    options = OptionSerializer(many=True, required=False)

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


class BaseProductSerializer(serializers.ModelSerializer):
    effective_price = serializers.SerializerMethodField()
    has_promotion = serializers.SerializerMethodField()
    discount_percent = serializers.SerializerMethodField()

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


class ProductListSerializer(BaseProductSerializer):
    category_id = serializers.IntegerField(required=True)
    category_name = serializers.CharField(source="category.name", read_only=True)
    image_url = serializers.CharField(required=False, allow_blank=True, default="")
    image = MaxSizeImageField(required=False, allow_null=True, write_only=True)

    option_groups = OptionGroupSerializer(many=True, required=False)
    promotion = ProductPromotionSerializer(required=False, allow_null=True)

    class Meta:
        model = Product
        fields = [
            "id",
            "category_id",
            "category_name",
            "name",
            "description",
            "image",
            "image_url",
            "price",
            "effective_price",
            "has_promotion",
            "discount_percent",
            "is_featured",
            "sort_order",
            "status",
            "option_groups",
            "promotion",
        ]

    def validate_image(self, value):
        if value and getattr(value, "size", 0) > MAX_IMAGE_SIZE_BYTES:
            raise serializers.ValidationError(
                "Kích thước file ảnh không được vượt quá 5MB."
            )
        return value

    def _save_option_groups(self, product: Product, option_groups_data: list[dict]):
        retained_group_ids = []

        for group_idx, group_data in enumerate(option_groups_data):
            options_data = group_data.pop("options", [])
            group_id = group_data.get("id")

            group_defaults = {
                "name": group_data.get("name", ""),
                "is_required": group_data.get("is_required", False),
                "min_select": group_data.get("min_select", 0),
                "max_select": group_data.get("max_select", 1),
                "sort_order": group_data.get("sort_order", group_idx),
            }

            if (
                group_id
                and OptionGroup.objects.filter(id=group_id, product=product).exists()
            ):
                group = OptionGroup.objects.get(id=group_id, product=product)
                for key, val in group_defaults.items():
                    setattr(group, key, val)
                group.save()
            else:
                group = OptionGroup.objects.create(product=product, **group_defaults)

            retained_group_ids.append(group.id)

            retained_option_ids = []
            for opt_idx, opt_data in enumerate(options_data):
                opt_id = opt_data.get("id")
                opt_defaults = {
                    "name": opt_data.get("name", ""),
                    "price": opt_data.get("price", 0),
                    "status": opt_data.get("status", Option.Status.AVAILABLE),
                    "sort_order": opt_data.get("sort_order", opt_idx),
                }

                if (
                    opt_id
                    and Option.objects.filter(id=opt_id, option_group=group).exists()
                ):
                    opt = Option.objects.get(id=opt_id, option_group=group)
                    for key, val in opt_defaults.items():
                        setattr(opt, key, val)
                    opt.save()
                else:
                    opt = Option.objects.create(option_group=group, **opt_defaults)

                retained_option_ids.append(opt.id)

            # Xóa các option không còn trong group
            group.options.exclude(id__in=retained_option_ids).delete()

        # Xóa các group không còn trong product
        product.option_groups.exclude(id__in=retained_group_ids).delete()

    def _save_promotion(self, product: Product, promotion_data: dict | None):
        if promotion_data is None:
            return
        promotional_price = promotion_data.get("promotional_price")
        if promotional_price is not None:
            # Lấy promotion gần nhất nếu có hoặc tạo mới
            promo = product.promotions.order_by("-created_at").first()
            if promo:
                promo.promotional_price = promotional_price
                promo.is_active = promotion_data.get("is_active", True)
                if "valid_from" in promotion_data:
                    promo.valid_from = promotion_data["valid_from"]
                if "valid_to" in promotion_data:
                    promo.valid_to = promotion_data["valid_to"]
                if "note" in promotion_data:
                    promo.note = promotion_data["note"]
                promo.save()
            else:
                ProductPromotion.objects.create(
                    product=product,
                    promotional_price=promotional_price,
                    is_active=promotion_data.get("is_active", True),
                    valid_from=promotion_data.get("valid_from"),
                    valid_to=promotion_data.get("valid_to"),
                    note=promotion_data.get("note", ""),
                )

    @transaction.atomic
    def create(self, validated_data):
        option_groups_data = validated_data.pop("option_groups", None)
        promotion_data = validated_data.pop("promotion", None)
        image = validated_data.get("image")
        if image:
            validated_data["image"] = optimize_image_to_webp(image)
        product = super().create(validated_data)
        if option_groups_data is not None:
            self._save_option_groups(product, option_groups_data)
        if promotion_data is not None:
            self._save_promotion(product, promotion_data)
        return product

    @transaction.atomic
    def update(self, instance, validated_data):
        option_groups_data = validated_data.pop("option_groups", None)
        promotion_data = validated_data.pop("promotion", None)
        image = validated_data.get("image")
        if image:
            validated_data["image"] = optimize_image_to_webp(image)
        product = super().update(instance, validated_data)
        if option_groups_data is not None:
            self._save_option_groups(product, option_groups_data)
        if promotion_data is not None:
            self._save_promotion(product, promotion_data)
        return product


class ProductDetailSerializer(BaseProductSerializer):
    option_groups = OptionGroupSerializer(many=True, read_only=True)
    image_url = serializers.CharField(required=False, allow_blank=True, default="")
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)

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
            "is_featured",
            "sort_order",
            "status",
            "option_groups",
        ]


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.CharField(required=False, allow_blank=True, default="")
    image = MaxSizeImageField(required=False, allow_null=True, write_only=True)

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

    def validate_image(self, value):
        if value and getattr(value, "size", 0) > MAX_IMAGE_SIZE_BYTES:
            raise serializers.ValidationError(
                "Kích thước file ảnh không được vượt quá 5MB."
            )
        return value

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
