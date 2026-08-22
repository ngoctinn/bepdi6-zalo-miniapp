from rest_framework import serializers

from apps.menu.models import Category, Option, OptionGroup, Product
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


class ProductListSerializer(serializers.ModelSerializer):
    category_id = serializers.IntegerField(required=True)
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


class ProductDetailSerializer(serializers.ModelSerializer):
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
            "status",
            "option_groups",
        ]

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
