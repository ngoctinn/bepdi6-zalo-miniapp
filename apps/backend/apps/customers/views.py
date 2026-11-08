from django.db import transaction
from rest_framework import permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.models import Address, Customer, StaffInviteToken, User
from apps.customers.permissions import (
    IsAdminOnlyUser,
    IsAuthenticatedCustomer,
    IsStaffOrAdminUser,
)
from apps.customers.serializers import (
    AddressSerializer,
    AdminCustomerSerializer,
    CustomerSerializer,
    StaffInviteAcceptSerializer,
    StaffInviteCreateSerializer,
    StaffUserSerializer,
    ZaloAuthRequestSerializer,
    ZaloLocationDecodeRequestSerializer,
    ZaloPhoneUpdateRequestSerializer,
)
from apps.customers.services import AuthService, get_current_customer


class ZaloAuthView(APIView):
    """
    POST /api/v1/auth/zalo
    Authenticates or registers customer via Zalo Token Exchange and issues JWT tokens.
    """

    permission_classes = [permissions.AllowAny]
    throttle_scope = "auth"

    def post(self, request):
        serializer = ZaloAuthRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        customer, access_token, refresh_token = (
            AuthService.authenticate_or_register_zalo_customer(
                zalo_token=data["zalo_token"],
                phone_token=data.get("phone_token", ""),
                name=data.get("name", ""),
                avatar_url=data.get("avatar_url", ""),
            )
        )

        return Response(
            {
                "success": True,
                "data": {
                    "access_token": access_token,
                    "refresh_token": refresh_token,
                    "customer": CustomerSerializer(customer).data,
                },
            },
            status=status.HTTP_200_OK,
        )


class ZaloLocationDecodeView(APIView):
    """
    POST /api/v1/customers/location/decode
    Decodes single-use location token from Zalo Mini App SDK into latitude, longitude, and address text.
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "geocoding"

    def post(self, request):
        serializer = ZaloLocationDecodeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        access_token = serializer.validated_data.get("access_token", "")

        result = AuthService.decode_zalo_location_token(
            token=token, access_token=access_token
        )

        if not result:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "LOCATION_DECODE_FAILED",
                        "message": "Không thể giải mã vị trí từ Zalo. Vui lòng thử lại hoặc chọn địa chỉ thủ công.",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "data": result,
            },
            status=status.HTTP_200_OK,
        )


class CustomerReverseGeocodeView(APIView):
    """
    GET /api/v1/customers/location/reverse-geocode?latitude=...&longitude=...
    Translates latitude and longitude into human-readable Vietnamese address.
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "geocoding"

    def get(self, request):
        lat_str = request.query_params.get("latitude")
        lng_str = request.query_params.get("longitude")

        if lat_str is None or lng_str is None:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "MISSING_COORDINATES",
                        "message": "Vui lòng cung cấp đầy đủ latitude và longitude.",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            latitude = float(lat_str)
            longitude = float(lng_str)
            if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
                raise ValueError("Out of range")
        except (ValueError, TypeError):
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "INVALID_COORDINATES",
                        "message": "Tọa độ latitude hoặc longitude không hợp lệ.",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        data = AuthService.reverse_geocode(latitude, longitude)
        return Response(
            {
                "success": True,
                "data": data,
            },
            status=status.HTTP_200_OK,
        )


class LocationSearchView(APIView):
    """
    GET /api/v1/customers/location/search?query=...&latitude=...&longitude=...&limit=5
    Searches address and place suggestions for autocomplete.
    """

    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = "geocoding"

    def get(self, request):
        query = request.query_params.get("query", "").strip()
        if len(query) < 2:
            return Response(
                {
                    "success": True,
                    "data": [],
                },
                status=status.HTTP_200_OK,
            )

        lat_str = request.query_params.get("latitude")
        lng_str = request.query_params.get("longitude")
        limit_str = request.query_params.get("limit", "5")

        try:
            limit = int(limit_str)
        except (ValueError, TypeError):
            limit = 5

        places = AuthService.search_places(
            query=query,
            lat=lat_str,
            lng=lng_str,
            limit=limit,
        )

        return Response(
            {
                "success": True,
                "data": places,
            },
            status=status.HTTP_200_OK,
        )


class CustomerPhoneUpdateView(APIView):
    """
    POST /api/v1/customers/me/phone
    Decodes single-use phone token from Zalo Mini App SDK and updates customer profile.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ZaloPhoneUpdateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone_token = serializer.validated_data["phone_token"]
        access_token = serializer.validated_data.get("access_token", "")

        customer = get_current_customer(request)
        phone_number = AuthService.update_customer_phone(
            customer=customer,
            phone_token=phone_token,
            access_token=access_token,
        )

        if not phone_number:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "PHONE_DECODE_FAILED",
                        "message": "Không thể lấy số điện thoại từ Zalo. Vui lòng thử lại.",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "success": True,
                "data": CustomerSerializer(customer).data,
            },
            status=status.HTTP_200_OK,
        )


class CustomerMeView(APIView):
    """
    GET /api/v1/customers/me - Get current customer profile
    PATCH /api/v1/customers/me - Update profile (name, phone, avatar_url)
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        customer = get_current_customer(request)
        serializer = CustomerSerializer(customer)
        return Response({"success": True, "data": serializer.data})

    def patch(self, request):
        customer = get_current_customer(request)
        serializer = CustomerSerializer(customer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "data": serializer.data})


class AddressListCreateView(APIView):
    """
    GET /api/v1/customers/me/addresses - List customer addresses
    POST /api/v1/customers/me/addresses - Create new address
    """

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        customer = get_current_customer(request)
        addresses = Address.objects.filter(customer=customer).order_by(
            "-is_default", "-created_at"
        )
        serializer = AddressSerializer(addresses, many=True)
        return Response({"success": True, "data": serializer.data})

    def post(self, request):
        customer = get_current_customer(request)
        serializer = AddressSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        is_default = serializer.validated_data.get("is_default", False)

        with transaction.atomic():
            # If this is the first address or marked is_default, update existing
            existing_count = Address.objects.filter(customer=customer).count()
            if existing_count == 0 or is_default:
                is_default = True
                Address.objects.filter(customer=customer, is_default=True).update(
                    is_default=False
                )

            address = serializer.save(customer=customer, is_default=is_default)

        return Response(
            {"success": True, "data": AddressSerializer(address).data},
            status=status.HTTP_201_CREATED,
        )


class AddressDetailView(APIView):
    """
    PATCH /api/v1/customers/me/addresses/{id} - Update address
    DELETE /api/v1/customers/me/addresses/{id} - Delete address
    """

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request, pk: int) -> Address:
        customer = get_current_customer(request)
        try:
            return Address.objects.get(pk=pk, customer=customer)
        except Address.DoesNotExist:
            raise NotFound("Địa chỉ không tồn tại.") from None

    def patch(self, request, pk: int):
        address = self.get_object(request, pk)
        serializer = AddressSerializer(address, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)

        is_default = serializer.validated_data.get("is_default")
        with transaction.atomic():
            if is_default:
                Address.objects.filter(
                    customer=address.customer, is_default=True
                ).exclude(pk=address.pk).update(is_default=False)
            serializer.save()

        return Response({"success": True, "data": serializer.data})

    def delete(self, request, pk: int):
        address = self.get_object(request, pk)
        customer = address.customer
        was_default = address.is_default
        address.delete()

        # If deleted address was default, make latest remaining address default
        if was_default:
            first_remaining = Address.objects.filter(customer=customer).first()
            if first_remaining:
                first_remaining.is_default = True
                first_remaining.save(update_fields=["is_default"])

        return Response({"success": True}, status=status.HTTP_200_OK)


class AdminCustomerListView(APIView):
    """
    GET /api/v1/admin/customers
    List customers with order statistics and search capability.
    """

    permission_classes = [IsStaffOrAdminUser]

    def get(self, request):
        from decimal import Decimal

        from django.db.models import Count, Max, Q, Sum
        from django.db.models.functions import Coalesce

        search_query = request.query_params.get("search", "").strip()

        # Aggregate total orders and total spent
        customers = Customer.objects.annotate(
            total_orders=Count("orders"),
            total_spent=Coalesce(
                Sum("orders__total_amount"),
                Decimal("0.00"),
            ),
            last_order_at=Max("orders__created_at"),
        ).order_by("-created_at")

        if search_query:
            customers = customers.filter(
                Q(name__icontains=search_query)
                | Q(phone__icontains=search_query)
                | Q(zalo_user_id__icontains=search_query)
            )

        serializer = AdminCustomerSerializer(customers, many=True)
        return Response({"success": True, "data": serializer.data})


class AdminStaffInviteView(APIView):
    """
    POST /api/v1/admin/staff/invites/
    Tạo link mời bí mật (dùng 1 lần, hết hạn sau 15p) cho nhân viên/quản trị viên mới.
    """

    permission_classes = [IsAdminOnlyUser]

    def post(self, request):
        serializer = StaffInviteCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        role = serializer.validated_data["role"]

        invite = StaffInviteToken.objects.create(
            role=role,
            created_by=request.user,
        )

        return Response(
            {
                "success": True,
                "data": {
                    "token": invite.token,
                    "role": invite.role,
                    "expires_at": invite.expires_at.isoformat(),
                },
            },
            status=status.HTTP_201_CREATED,
        )


class StaffInviteAcceptView(APIView):
    """
    POST /api/v1/staff/accept-invite/
    Nhân viên bấm xác nhận từ link Zalo để kích hoạt quyền STAFF/ADMIN.
    """

    permission_classes = [IsAuthenticatedCustomer]

    def post(self, request):
        from rest_framework_simplejwt.tokens import RefreshToken

        serializer = StaffInviteAcceptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]

        with transaction.atomic():
            invite = (
                StaffInviteToken.objects.select_for_update().filter(token=token).first()
            )

            if not invite or not invite.is_valid:
                return Response(
                    {
                        "success": False,
                        "error": {
                            "code": "INVALID_INVITE_TOKEN",
                            "message": "Mã mời không tồn tại, đã hết hạn hoặc đã được sử dụng.",
                        },
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Cập nhật quyền cho User hiện tại
            user = request.user
            user.role = invite.role
            user.is_staff = True
            if invite.role == User.Role.ADMIN:
                user.is_superuser = True
            user.save(update_fields=["role", "is_staff", "is_superuser", "updated_at"])

            # Đánh dấu token đã được sử dụng
            invite.is_used = True
            invite.used_by = user
            invite.save(update_fields=["is_used", "used_by"])

        # Cấp Refresh/Access JWT mới chứa role đã được cập nhật
        refresh = RefreshToken.for_user(user)
        refresh["role"] = user.role
        if getattr(user, "zalo_user_id", None):
            refresh["zalo_user_id"] = user.zalo_user_id

        return Response(
            {
                "success": True,
                "data": {
                    "role": user.role,
                    "access_token": str(refresh.access_token),
                    "refresh_token": str(refresh),
                },
            },
            status=status.HTTP_200_OK,
        )


class AdminStaffManageView(APIView):
    """
    GET /api/v1/admin/staff/ - Danh sách nhân viên và quản trị viên
    DELETE /api/v1/admin/staff/<id>/ - Tước quyền nhân viên về CUSTOMER
    """

    permission_classes = [IsAdminOnlyUser]

    def get(self, request):
        staff_users = User.objects.filter(
            role__in=[User.Role.ADMIN, User.Role.STAFF]
        ).order_by("-date_joined")
        serializer = StaffUserSerializer(staff_users, many=True)
        return Response({"success": True, "data": serializer.data})

    def delete(self, request, staff_id):
        if str(request.user.id) == str(staff_id):
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "CANNOT_REVOKE_SELF",
                        "message": "Không thể tự tước quyền quản trị của chính mình.",
                    },
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        target_user = User.objects.filter(id=staff_id).first()
        if not target_user:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "USER_NOT_FOUND",
                        "message": "Không tìm thấy người dùng.",
                    },
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        target_user.role = User.Role.CUSTOMER
        target_user.is_staff = False
        target_user.is_superuser = False
        target_user.save(
            update_fields=["role", "is_staff", "is_superuser", "updated_at"]
        )

        return Response(
            {
                "success": True,
                "data": {"message": "Đã thu hồi quyền nhân sự thành công."},
            },
            status=status.HTTP_200_OK,
        )
