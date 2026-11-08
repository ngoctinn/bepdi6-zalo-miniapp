from rest_framework import serializers

from apps.customers.models import Address, Customer, User


class StaffInviteCreateSerializer(serializers.Serializer):
    role = serializers.ChoiceField(
        choices=[(User.Role.STAFF, "STAFF"), (User.Role.ADMIN, "ADMIN")],
        default=User.Role.STAFF,
    )


class StaffInviteAcceptSerializer(serializers.Serializer):
    token = serializers.CharField(required=True, max_length=64)


class StaffUserSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source="first_name", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "phone",
            "zalo_user_id",
            "role",
            "name",
            "is_staff",
            "date_joined",
            "created_at",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = Customer
        fields = [
            "id",
            "zalo_user_id",
            "name",
            "phone",
            "avatar_url",
            "role",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "zalo_user_id",
            "phone",
            "role",
            "created_at",
            "updated_at",
        ]

    def get_role(self, obj) -> str:
        from django.conf import settings

        from apps.customers.models import User

        # 0. Check if role or user is already attached / annotated / cached on instance
        annotated_role = getattr(obj, "user_role", None) or getattr(
            obj, "_cached_role", None
        )
        if annotated_role:
            if annotated_role in [User.Role.ADMIN, "ADMIN"]:
                return User.Role.ADMIN
            if annotated_role in [User.Role.STAFF, "STAFF"]:
                return User.Role.STAFF
            return User.Role.CUSTOMER

        user_obj = getattr(obj, "_user", None) or getattr(obj, "user", None)
        if user_obj is not None:
            if getattr(user_obj, "role", None) in [User.Role.ADMIN, User.Role.STAFF]:
                return user_obj.role
            if getattr(user_obj, "is_superuser", False):
                return User.Role.ADMIN
            if getattr(user_obj, "is_staff", False):
                return User.Role.STAFF

        # 1. Check Whitelist ADMIN_ZALO_IDS (O(1) set lookup)
        admin_zalo_ids = getattr(settings, "ADMIN_ZALO_IDS", ())
        if not isinstance(admin_zalo_ids, (set, frozenset)):
            admin_zalo_ids = {str(x) for x in admin_zalo_ids if x}
        else:
            admin_zalo_ids = {str(x) for x in admin_zalo_ids if x}

        if obj.zalo_user_id and str(obj.zalo_user_id) in admin_zalo_ids:
            return User.Role.ADMIN

        # Check serializer context cache if available
        if isinstance(self.context, dict):
            context_users_by_zalo = self.context.get("users_by_zalo_id")
            if (
                context_users_by_zalo
                and obj.zalo_user_id
                and obj.zalo_user_id in context_users_by_zalo
            ):
                u = context_users_by_zalo[obj.zalo_user_id]
                if u:
                    if u.role in [User.Role.ADMIN, User.Role.STAFF]:
                        return u.role
                    if u.is_superuser:
                        return User.Role.ADMIN
                    if u.is_staff:
                        return User.Role.STAFF
                    return User.Role.CUSTOMER

            context_users_by_phone = self.context.get("users_by_phone")
            if (
                context_users_by_phone
                and obj.phone
                and obj.phone in context_users_by_phone
            ):
                u = context_users_by_phone[obj.phone]
                if u:
                    if u.role in [User.Role.ADMIN, User.Role.STAFF]:
                        return u.role
                    if u.is_superuser:
                        return User.Role.ADMIN
                    if u.is_staff:
                        return User.Role.STAFF
                    return User.Role.CUSTOMER

        # 2. Tìm User theo zalo_user_id (ưu tiên Admin / staff / superuser)
        if obj.zalo_user_id:
            users = User.objects.filter(zalo_user_id=obj.zalo_user_id)
            for u in users:
                if u.role in [User.Role.ADMIN, User.Role.STAFF]:
                    return u.role
                if u.is_superuser:
                    return User.Role.ADMIN
                if u.is_staff:
                    return User.Role.STAFF

        return User.Role.CUSTOMER


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

    def to_internal_value(self, data):
        """
        Auto-rounds GPS coordinates from mobile/ZMP SDK to 8 decimal places
        to ensure compatibility with max_digits=10 (lat) and max_digits=11 (lng).
        """
        if isinstance(data, dict):
            data = data.copy()
            for coord_field in ("latitude", "longitude"):
                if coord_field in data and data[coord_field] is not None:
                    try:
                        val = float(data[coord_field])
                        data[coord_field] = f"{val:.8f}"
                    except (ValueError, TypeError):
                        pass
        return super().to_internal_value(data)


class ZaloAuthRequestSerializer(serializers.Serializer):
    zalo_token = serializers.CharField(required=False, allow_blank=True, default="")
    access_token = serializers.CharField(required=False, allow_blank=True, default="")
    phone_token = serializers.CharField(required=False, allow_blank=True, default="")
    name = serializers.CharField(required=False, allow_blank=True, default="")
    avatar_url = serializers.CharField(required=False, allow_blank=True, default="")

    def validate(self, attrs):
        token = attrs.get("zalo_token") or attrs.get("access_token")
        if not token:
            raise serializers.ValidationError(
                {"zalo_token": "Trường zalo_token hoặc access_token là bắt buộc."}
            )
        attrs["zalo_token"] = token
        return attrs


class ZaloLocationDecodeRequestSerializer(serializers.Serializer):
    token = serializers.CharField(
        required=True,
        help_text="Token vị trí 1 lần nhận từ SDK ZMP getLocation()",
    )
    access_token = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Zalo User Access Token để xác thực với Zalo Open API",
    )


class ZaloPhoneUpdateRequestSerializer(serializers.Serializer):
    phone_token = serializers.CharField(
        required=True,
        help_text="Token số điện thoại 1 lần nhận từ SDK ZMP getPhoneNumber()",
    )
    access_token = serializers.CharField(
        required=False,
        allow_blank=True,
        default="",
        help_text="Zalo User Access Token để xác thực với Zalo Open API",
    )


class AdminCustomerSerializer(serializers.ModelSerializer):
    total_orders = serializers.IntegerField(read_only=True)
    total_spent = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True
    )
    last_order_at = serializers.DateTimeField(read_only=True, allow_null=True)

    class Meta:
        model = Customer
        fields = [
            "id",
            "zalo_user_id",
            "name",
            "phone",
            "avatar_url",
            "total_orders",
            "total_spent",
            "last_order_at",
            "created_at",
            "updated_at",
        ]
