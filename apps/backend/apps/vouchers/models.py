from django.db import models


class Voucher(models.Model):
    """Voucher discount campaign model."""

    class DiscountType(models.TextChoices):
        FIXED = "FIXED", "Số tiền cố định"
        PERCENTAGE = "PERCENTAGE", "Phần trăm"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Đang hoạt động"
        INACTIVE = "INACTIVE", "Ngưng hoạt động"

    code = models.CharField(
        max_length=50,
        unique=True,
        db_index=True,
        verbose_name="Mã giảm giá",
    )
    name = models.CharField(max_length=255, verbose_name="Tên chương trình")
    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
        default=DiscountType.FIXED,
        verbose_name="Loại giảm giá",
    )
    discount_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Mức giảm",
    )
    minimum_order_value = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        verbose_name="Đơn tối thiểu",
    )
    maximum_discount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Áp dụng khi discount_type là PERCENTAGE",
        verbose_name="Giảm tối đa",
    )
    usage_limit = models.IntegerField(
        default=0,
        help_text="Tổng lượt dùng toàn hệ thống (0 = không giới hạn)",
        verbose_name="Giới hạn toàn hệ thống",
    )
    usage_per_customer = models.IntegerField(
        default=1,
        help_text="Lượt dùng tối đa trên từng khách",
        verbose_name="Giới hạn mỗi khách",
    )
    start_at = models.DateTimeField(verbose_name="Thời gian bắt đầu")
    end_at = models.DateTimeField(verbose_name="Thời gian kết thúc")
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="Trạng thái",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

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
        verbose_name="Mã giảm giá",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.CASCADE,
        related_name="voucher_usages",
        verbose_name="Khách hàng",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="voucher_usages",
        verbose_name="Đơn hàng",
    )
    discount_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Số tiền đã giảm",
    )
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.APPLIED,
        verbose_name="Trạng thái",
    )
    used_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian dùng")

    class Meta:
        db_table = "voucher_usages"
        verbose_name = "Lịch sử dùng mã giảm giá"
        verbose_name_plural = "Lịch sử dùng mã giảm giá"
        indexes = [
            models.Index(fields=["voucher", "customer"]),
        ]

    def __str__(self) -> str:
        return f"Khách {self.customer_id} dùng {self.voucher.code} cho đơn #{self.order_id} ({self.status})"
