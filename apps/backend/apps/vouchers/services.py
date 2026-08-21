from decimal import Decimal

from django.utils import timezone

from apps.customers.models import Customer
from apps.orders.models import Order
from apps.vouchers.models import Voucher, VoucherUsage


class VoucherValidationError(Exception):
    """Base exception for voucher validation."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


class VoucherService:
    """Service handling validation, calculation, locking, and releasing vouchers."""

    @classmethod
    def validate_voucher(
        cls,
        code: str,
        order_amount: Decimal | float,
        customer: Customer | None = None,
    ) -> tuple[Voucher, Decimal]:
        """
        Validates voucher eligibility based on:
        - BR-VOU-001: Active status, valid date range, system-wide usage limit.
        - BR-VOU-002: Minimum order amount requirement.
        - BR-VOU-003: Per-customer usage limit.
        - BR-VOU-004: Discount calculation and maximum discount cap.

        Returns: (Voucher, discount_amount: Decimal)
        Raises: VoucherValidationError with standard error codes.
        """
        amount = Decimal(str(order_amount))

        try:
            voucher = Voucher.objects.get(code=code.strip().upper())
        except Voucher.DoesNotExist:
            raise VoucherValidationError(
                "VOUCHER_INVALID", "Mã giảm giá không tồn tại."
            ) from None

        # Check Active status
        if voucher.status != Voucher.Status.ACTIVE:
            raise VoucherValidationError(
                "VOUCHER_INVALID", "Mã giảm giá hiện không hoạt động."
            )

        # Check Datetime validity
        now = timezone.now()
        if now < voucher.start_at:
            raise VoucherValidationError(
                "VOUCHER_INVALID", "Chương trình giảm giá chưa bắt đầu."
            )
        if now > voucher.end_at:
            raise VoucherValidationError(
                "VOUCHER_EXPIRED", "Mã giảm giá đã hết hạn sử dụng."
            )

        # Check Minimum Order Value
        if amount < voucher.minimum_order_value:
            raise VoucherValidationError(
                "VOUCHER_INVALID",
                f"Đơn hàng chưa đạt giá trị tối thiểu {voucher.minimum_order_value:,.0f}đ.",
            )

        # Check System-wide usage limit (0 means unlimited)
        if voucher.usage_limit > 0:
            total_applied = voucher.usages.filter(
                status=VoucherUsage.Status.APPLIED
            ).count()
            if total_applied >= voucher.usage_limit:
                raise VoucherValidationError(
                    "VOUCHER_USAGE_LIMIT", "Mã giảm giá đã hết lượt sử dụng."
                )

        # Check Per-customer usage limit
        if customer is not None and voucher.usage_per_customer > 0:
            customer_applied = voucher.usages.filter(
                customer=customer,
                status=VoucherUsage.Status.APPLIED,
            ).count()
            if customer_applied >= voucher.usage_per_customer:
                raise VoucherValidationError(
                    "VOUCHER_USAGE_LIMIT",
                    "Bạn đã sử dụng hết số lần cho phép của mã giảm giá này.",
                )

        # Calculate Discount Amount
        if voucher.discount_type == Voucher.DiscountType.FIXED:
            discount = voucher.discount_value
        elif voucher.discount_type == Voucher.DiscountType.PERCENTAGE:
            discount = amount * (voucher.discount_value / Decimal("100"))
            if voucher.maximum_discount and discount > voucher.maximum_discount:
                discount = voucher.maximum_discount
        else:
            discount = Decimal("0.00")

        # Discount cannot exceed order subtotal
        if discount > amount:
            discount = amount

        return voucher, Decimal(str(round(discount, 2)))

    @classmethod
    def apply_voucher_to_order(
        cls,
        voucher: Voucher,
        customer: Customer,
        order: Order,
        discount_amount: Decimal,
    ) -> VoucherUsage:
        """Records voucher usage when order is placed."""
        return VoucherUsage.objects.create(
            voucher=voucher,
            customer=customer,
            order=order,
            discount_amount=discount_amount,
            status=VoucherUsage.Status.APPLIED,
        )

    @classmethod
    def release_voucher(cls, order: Order) -> None:
        """
        Releases applied voucher usage when order is cancelled or edited (BR-VOU-005).
        """
        VoucherUsage.objects.filter(
            order=order,
            status=VoucherUsage.Status.APPLIED,
        ).update(status=VoucherUsage.Status.RELEASED)
