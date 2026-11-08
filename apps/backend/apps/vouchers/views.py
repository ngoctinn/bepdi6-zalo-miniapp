from rest_framework import permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.permissions import IsAdminOnlyUser
from apps.customers.views import get_current_customer
from apps.vouchers.models import Voucher, VoucherUsage
from apps.vouchers.serializers import (
    VoucherSerializer,
    VoucherValidateRequestSerializer,
)
from apps.vouchers.services import VoucherService, VoucherValidationError


class VoucherBrowseView(APIView):
    """
    POST /api/v1/vouchers/browse
    Lists all active vouchers and dynamically calculates eligibility and discount amount
    for the given cart subtotal in-memory without database locking.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from decimal import Decimal

        from django.db.models import Count, Q
        from django.utils import timezone

        subtotal_raw = request.data.get("subtotal", 0)
        try:
            subtotal = Decimal(str(subtotal_raw))
        except Exception:
            subtotal = Decimal("0.00")

        customer = get_current_customer(request)
        now = timezone.now()

        active_vouchers_qs = Voucher.objects.filter(
            status=Voucher.Status.ACTIVE,
            start_at__lte=now,
            end_at__gte=now,
        )

        annotations = {
            "total_applied_count": Count(
                "usages",
                filter=Q(usages__status=VoucherUsage.Status.APPLIED),
                distinct=True,
            )
        }
        if customer:
            annotations["cust_applied_count"] = Count(
                "usages",
                filter=Q(
                    usages__customer=customer,
                    usages__status=VoucherUsage.Status.APPLIED,
                ),
                distinct=True,
            )

        active_vouchers = active_vouchers_qs.annotate(**annotations).order_by(
            "-discount_value"
        )

        results = []
        for voucher in active_vouchers:
            # Check eligibility
            is_eligible = True
            ineligible_reason = ""

            if subtotal < voucher.minimum_order_value:
                is_eligible = False
                needed = voucher.minimum_order_value - subtotal
                ineligible_reason = f"Mua thêm {needed:,.0f}đ để áp dụng"

            # Check usage limit if applicable
            if is_eligible and voucher.usage_limit > 0:
                total_applied = getattr(voucher, "total_applied_count", 0)
                if total_applied >= voucher.usage_limit:
                    is_eligible = False
                    ineligible_reason = "Voucher đã hết lượt sử dụng"

            if is_eligible and customer and voucher.usage_per_customer > 0:
                cust_applied = getattr(voucher, "cust_applied_count", 0)
                if cust_applied >= voucher.usage_per_customer:
                    is_eligible = False
                    ineligible_reason = "Bạn đã hết lượt dùng voucher này"

            # Compute estimated discount
            discount_amount = Decimal("0.00")
            if is_eligible:
                if voucher.discount_type == Voucher.DiscountType.FIXED:
                    discount_amount = voucher.discount_value
                elif voucher.discount_type == Voucher.DiscountType.PERCENTAGE:
                    discount_amount = subtotal * (
                        voucher.discount_value / Decimal("100")
                    )
                    if (
                        voucher.maximum_discount
                        and discount_amount > voucher.maximum_discount
                    ):
                        discount_amount = voucher.maximum_discount
                discount_amount = min(discount_amount, subtotal)

            results.append(
                {
                    "id": voucher.id,
                    "code": voucher.code,
                    "name": voucher.name,
                    "discount_type": voucher.discount_type,
                    "discount_value": float(voucher.discount_value),
                    "maximum_discount": float(voucher.maximum_discount)
                    if voucher.maximum_discount
                    else None,
                    "minimum_order_value": float(voucher.minimum_order_value),
                    "start_at": voucher.start_at.isoformat(),
                    "end_at": voucher.end_at.isoformat(),
                    "eligible": is_eligible,
                    "ineligible_reason": ineligible_reason,
                    "discount_amount": float(discount_amount),
                }
            )

        return Response({"success": True, "data": results})


class VoucherValidateView(APIView):
    """
    POST /api/v1/vouchers/validate
    Validates standalone voucher code for given order amount.
    """

    permission_classes = [permissions.AllowAny]
    throttle_scope = "voucher"

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

    permission_classes = [IsAdminOnlyUser]

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

    permission_classes = [IsAdminOnlyUser]

    def get(self, request, pk: int):
        try:
            voucher = Voucher.objects.get(pk=pk)
        except Voucher.DoesNotExist:
            raise NotFound("Voucher không tồn tại.") from None
        return Response(VoucherSerializer(voucher).data)

    def patch(self, request, pk: int):
        try:
            voucher = Voucher.objects.get(pk=pk)
        except Voucher.DoesNotExist:
            raise NotFound("Voucher không tồn tại.") from None
        serializer = VoucherSerializer(voucher, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk: int):
        try:
            voucher = Voucher.objects.get(pk=pk)
        except Voucher.DoesNotExist:
            raise NotFound("Voucher không tồn tại.") from None
        if voucher.usages.exists():
            voucher.status = Voucher.Status.INACTIVE
            voucher.save(update_fields=["status"])
            return Response(
                {
                    "success": True,
                    "message": "Voucher đã có lượt sử dụng, đã chuyển sang trạng thái Ngưng hoạt động thay vì xóa hoàn toàn.",
                    "status": voucher.status,
                },
                status=status.HTTP_200_OK,
            )
        voucher.delete()
        return Response({"success": True}, status=status.HTTP_200_OK)
