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
)
from apps.customers.services import AuthService


def get_current_customer(request) -> Customer:
    """Helper to resolve customer from authenticated user or fallback header for dev/testing."""
    if hasattr(request.user, "customer_profile"):
        return request.user.customer_profile

    zalo_user_id = getattr(request.user, "zalo_user_id", None)
    if zalo_user_id:
        customer, _ = Customer.objects.get_or_create(
            zalo_user_id=zalo_user_id,
            defaults={"name": request.user.username or "Khách Zalo"},
        )
        return customer

    cust_id = request.headers.get("X-Customer-ID") or request.query_params.get(
        "customer_id"
    )
    if cust_id:
        try:
            return Customer.objects.get(pk=cust_id)
        except Customer.DoesNotExist:
            pass

    customer, _ = Customer.objects.get_or_create(
        zalo_user_id="zalo_default_guest",
        defaults={"name": "Khách mặc định", "phone": "0900000000"},
    )
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

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ZaloLocationDecodeRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        token = serializer.validated_data["token"]
        access_token = serializer.validated_data.get("access_token", "")

        result = AuthService.decode_zalo_location_token(
            token=token, access_token=access_token
        )

        return Response(
            {
                "success": True,
                "data": result,
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
        return Response(serializer.data)

    def patch(self, request):
        customer = get_current_customer(request)
        serializer = CustomerSerializer(customer, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


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
        return Response(serializer.data)

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

        return Response(AddressSerializer(address).data, status=status.HTTP_201_CREATED)


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

        return Response(serializer.data)

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
