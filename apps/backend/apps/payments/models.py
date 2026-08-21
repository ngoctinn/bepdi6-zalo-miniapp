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
    )
    method = models.CharField(
        max_length=30,
        choices=Method.choices,
        default=Method.COD,
    )
    status = models.CharField(
        max_length=30,
        choices=Status.choices,
        default=Status.UNPAID,
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_reference = models.CharField(max_length=100, blank=True, default="")
    qr_code_url = models.TextField(blank=True, default="")
    paid_at = models.DateTimeField(null=True, blank=True)
    actual_paid_amount = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Số tiền thực nhận (VietQR)",
    )
    note = models.TextField(blank=True, default="", help_text="Ghi chú lệch tiền")
    verified_by = models.ForeignKey(
        "customers.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="verified_payments",
        help_text="Nhân viên xác nhận thanh toán",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "payments"
        verbose_name = "Thanh toán"
        verbose_name_plural = "Thanh toán"

    def __str__(self) -> str:
        return f"Thanh toán đơn #{self.order_id} - {self.get_status_display()} ({self.amount:,.0f}đ)"
