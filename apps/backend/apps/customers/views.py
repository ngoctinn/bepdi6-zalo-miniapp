from django.db import transaction
from rest_framework import permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.models import Address, Customer
from apps.customers.serializers import (
    AddressSerializer,
    CustomerSerializer,
    ZaloAuthRequestSerializer,
    ZaloLocationDecodeRequestSerializer,
    ZaloPhoneUpdateRequestSerializer,
)
from apps.customers.services import AuthService


def get_current_customer(request) -> Customer:
    """
    Helper to resolve customer from authenticated user or fallback header for dev/testing.
    Caches the resolved Customer instance on request._cached_customer to prevent duplicate DB hits.
    """
    if hasattr(request, "_cached_customer"):
        return request._cached_customer

    customer: Customer | None = None

    if hasattr(request.user, "customer_profile"):
        customer = request.user.customer_profile
    else:
        zalo_user_id = getattr(request.user, "zalo_user_id", None)
        if zalo_user_id:
            customer, _ = Customer.objects.get_or_create(
                zalo_user_id=zalo_user_id,
                defaults={"name": request.user.username or "Khách Zalo"},
            )
        else:
            cust_id = request.headers.get("X-Customer-ID") or request.query_params.get(
                "customer_id"
            )
            if cust_id:
                try:
                    customer = Customer.objects.get(pk=cust_id)
                except Customer.DoesNotExist:
                    pass

    if customer is None:
        customer, _ = Customer.objects.get_or_create(
            zalo_user_id="zalo_default_guest",
            defaults={"name": "Khách mặc định", "phone": "0900000000"},
        )

    request._cached_customer = customer
    return customer


class ZaloAuthView(APIView):
    """
    POST /api/v1/auth/zalo
    Authenticates or registers customer via Zalo Token Exchange and issues JWT tokens.
    """

    permission_classes = [permissions.AllowAny]

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
