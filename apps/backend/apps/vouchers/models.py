from django.db import models


class Voucher(models.Model):
    """Voucher discount campaign model."""

    class DiscountType(models.TextChoices):
        FIXED = "FIXED", "Số tiền cố định"
        PERCENTAGE = "PERCENTAGE", "Phần trăm"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Đang hoạt động"
        INACTIVE = "INACTIVE", "Ngưng hoạt động"

    code = models.CharField(max_length=50, unique=True, db_index=True)
    name = models.CharField(max_length=255)
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
        default=DiscountType.FIXED,
    )
    discount_value = models.DecimalField(max_digits=12, decimal_places=2)
    minimum_order_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
    )
    maximum_discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Áp dụng khi discount_type là PERCENTAGE",
    )
    usage_limit = models.IntegerField(
        default=0,
        help_text="Tổng lượt dùng toàn hệ thống (0 = không giới hạn)",
    )
    usage_per_customer = models.IntegerField(
        default=1,
        help_text="Lượt dùng tối đa trên từng khách",
    )
    start_at = models.DateTimeField()
    end_at = models.DateTimeField()
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "vouchers"
        verbose_name = "Mã giảm giá"
        verbose_name_plural = "Mã giảm giá"
        indexes = [
            models.Index(fields=["code", "status"]),
        ]

    def __str__(self) -> str:
        return f"{self.code} - {self.name}"


class VoucherUsage(models.Model):
    """Voucher usage history per customer and order."""

    class Status(models.TextChoices):
        APPLIED = "APPLIED", "Đã áp dụng"
        RELEASED = "RELEASED", "Đã hoàn trả/nhả mã"

    voucher = models.ForeignKey(
        Voucher,
        on_delete=models.CASCADE,
        related_name="usages",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.CASCADE,
        related_name="voucher_usages",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="voucher_usages",
    )
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.APPLIED,
    )
    used_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "voucher_usages"
        verbose_name = "Lịch sử dùng mã giảm giá"
        verbose_name_plural = "Lịch sử dùng mã giảm giá"
        indexes = [
            models.Index(fields=["voucher", "customer"]),
        ]

    def __str__(self) -> str:
        return f"Khách {self.customer_id} dùng {self.voucher.code} cho đơn #{self.order_id} ({self.status})"
