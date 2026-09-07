from django.db import models


class Notification(models.Model):
    """In-app customer notification model."""

    class NotificationType(models.TextChoices):
        ORDER_STATUS = "ORDER_STATUS", "Trạng thái đơn hàng"
        PROMOTION = "PROMOTION", "Khuyến mãi"

    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.CASCADE,
        related_name="notifications",
        verbose_name="Khách hàng",
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
        verbose_name="Đơn hàng",
    )
    type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.ORDER_STATUS,
        verbose_name="Loại thông báo",
    )
    title = models.CharField(max_length=255, verbose_name="Tiêu đề")
    message = models.TextField(verbose_name="Nội dung thông báo")
    is_read = models.BooleanField(default=False, verbose_name="Đã đọc")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian gửi")
    read_at = models.DateTimeField(null=True, blank=True, verbose_name="Thời gian đọc")

    class Meta:
        db_table = "notifications"
        verbose_name = "Thông báo"
        verbose_name_plural = "Thông báo"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["customer", "is_read"]),
        ]

    def __str__(self) -> str:
        return f"{self.title} -> Khách #{self.customer_id}"


class ZaloOACredential(models.Model):
    """Zalo OA OAuth 2.0 credentials store for API access & automatic token rotation."""

    oa_id = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="Zalo OA ID",
        help_text="Định danh OA trên Zalo",
    )
    access_token = models.TextField(
        verbose_name="Access Token",
        help_text="Token truy cập Zalo OpenAPI (thời hạn 25 giờ)",
    )
    refresh_token = models.TextField(
        verbose_name="Refresh Token",
        help_text="Token làm mới dùng 1 lần (thời hạn 3 tháng)",
    )
    expires_at = models.DateTimeField(
        verbose_name="Thời gian hết hạn",
        help_text="Mốc thời gian access token hết hiệu lực",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Cập nhật lần cuối")

    class Meta:
        db_table = "zalo_oa_credentials"
        verbose_name = "Zalo OA Credential"
        verbose_name_plural = "Zalo OA Credentials"

    def __str__(self) -> str:
        return f"Zalo OA #{self.oa_id}"
