from rest_framework import serializers

from apps.customers.models import Address, Customer


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id",
            "zalo_user_id",
            "name",
            "phone",
            "avatar_url",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "zalo_user_id", "created_at", "updated_at"]


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "label",
            "recipient_name",
            "phone",
            "address_text",
            "latitude",
            "longitude",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]


class ZaloAuthRequestSerializer(serializers.Serializer):
    zalo_token = serializers.CharField(required=True)
    phone_token = serializers.CharField(required=False, allow_blank=True, default="")
    name = serializers.CharField(required=False, allow_blank=True, default="")
    avatar_url = serializers.CharField(required=False, allow_blank=True, default="")
