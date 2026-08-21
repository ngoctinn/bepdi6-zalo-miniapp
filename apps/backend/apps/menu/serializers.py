from rest_framework import serializers

from apps.menu.models import Category, Option, OptionGroup, Product


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
    image_url = serializers.CharField(source="effective_image_url", read_only=True)
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


class ProductDetailSerializer(serializers.ModelSerializer):
    option_groups = OptionGroupSerializer(many=True, read_only=True)
    image_url = serializers.CharField(source="effective_image_url", read_only=True)
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


class CategorySerializer(serializers.ModelSerializer):
    image_url = serializers.CharField(source="effective_image_url", read_only=True)
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
