from django.db import models


class Payment(models.Model):
    """Payment transaction model (1-1 with Order)."""

    class Method(models.TextChoices):
        COD = "COD", "Tiền mặt khi nhận hàng"
        BANK_TRANSFER = "BANK_TRANSFER", "Chuyển khoản (VietQR)"

    class Status(models.TextChoices):
        UNPAID = "UNPAID", "Chưa thanh toán"
        PENDING = "PENDING", "Đang xử lý / Chờ đối soát"
        PAID = "PAID", "Đã thanh toán"
        FAILED = "FAILED", "Thất bại"
        REFUNDED = "REFUNDED", "Đã hoàn tiền"

    order = models.OneToOneField(
        "orders.Order",
        on_delete=models.CASCADE,
        related_name="payment",
        verbose_name="Đơn hàng",
    )
    method = models.CharField(
        max_length=30,
        choices=Method.choices,
        default=Method.COD,
        verbose_name="Phương thức thanh toán",
    )
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.UNPAID,
        verbose_name="Trạng thái thanh toán",
    )
    amount = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Số tiền"
    )
    transaction_reference = models.CharField(
        max_length=100,
        blank=True,
        default="",
        verbose_name="Mã giao dịch",
    )
    qr_code_url = models.TextField(
        blank=True, default="", verbose_name="Link mã VietQR"
    )
    paid_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Thời gian thanh toán"
    )
    actual_paid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Số tiền thực nhận (VietQR)",
        verbose_name="Số tiền thực nhận",
    )
    note = models.TextField(
        blank=True, default="", help_text="Ghi chú lệch tiền", verbose_name="Ghi chú"
    )
    verified_by = models.ForeignKey(
        "customers.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_payments",
        help_text="Nhân viên xác nhận thanh toán",
        verbose_name="Người xác nhận",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "payments"
        verbose_name = "Giao dịch thanh toán"
        verbose_name_plural = "Giao dịch thanh toán"

    def __str__(self) -> str:
        return f"Thanh toán đơn #{self.order_id} - {self.get_status_display()} ({self.amount:,.0f}đ)"
