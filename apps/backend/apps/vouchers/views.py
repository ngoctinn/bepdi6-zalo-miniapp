from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.permissions import IsStaffOrAdminUser
from apps.customers.views import get_current_customer
from apps.vouchers.models import Voucher
from apps.vouchers.serializers import (
    VoucherSerializer,
    VoucherValidateRequestSerializer,
)
from apps.vouchers.services import VoucherService, VoucherValidationError


class VoucherValidateView(APIView):
    """
    POST /api/v1/vouchers/validate
    Validates standalone voucher code for given order amount.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = VoucherValidateRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        code = data["code"]
        order_amount = data["order_amount"]
        customer = get_current_customer(request)

        try:
            _, discount = VoucherService.validate_voucher(
                code=code,
                order_amount=order_amount,
                customer=customer,
            )
            return Response(
                {
                    "valid": True,
                    "discount": discount,
                },
                status=status.HTTP_200_OK,
            )
        except VoucherValidationError as e:
            return Response(
                {
                    "valid": False,
                    "reason": e.code,
                    "message": e.message,
                },
                status=status.HTTP_200_OK,
            )


class AdminVoucherListCreateView(APIView):
    """
    GET /api/v1/admin/vouchers - List all vouchers (Admin)
    POST /api/v1/admin/vouchers - Create voucher (Admin)
    """

    permission_classes = [IsStaffOrAdminUser]

    def get(self, request):
        vouchers = Voucher.objects.all().order_by("-created_at")
        serializer = VoucherSerializer(vouchers, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = VoucherSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminVoucherDetailView(APIView):
    """
    GET /api/v1/admin/vouchers/{id} - Get voucher detail
    PATCH /api/v1/admin/vouchers/{id} - Update voucher
    DELETE /api/v1/admin/vouchers/{id} - Delete voucher
    """

    permission_classes = [IsStaffOrAdminUser]

    def get(self, request, pk: int):
        try:
            voucher = Voucher.objects.get(pk=pk)
        except Voucher.DoesNotExist:
            return Response(
                {"code": "NOT_FOUND", "message": "Voucher không tồn tại."},
                status=status.HTTP_404_NOT_FOUND,
            )
        return Response(VoucherSerializer(voucher).data)

    def patch(self, request, pk: int):
        try:
            voucher = Voucher.objects.get(pk=pk)
        except Voucher.DoesNotExist:
            return Response(
                {"code": "NOT_FOUND", "message": "Voucher không tồn tại."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = VoucherSerializer(voucher, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk: int):
        try:
            voucher = Voucher.objects.get(pk=pk)
        except Voucher.DoesNotExist:
            return Response(
                {"code": "NOT_FOUND", "message": "Voucher không tồn tại."},
                status=status.HTTP_404_NOT_FOUND,
            )
        voucher.delete()
        return Response({"success": True}, status=status.HTTP_200_OK)
