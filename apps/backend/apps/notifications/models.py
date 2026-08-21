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
    )
    order = models.ForeignKey(
        "orders.Order",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="notifications",
    )
    type = models.CharField(
        max_length=50,
        choices=NotificationType.choices,
        default=NotificationType.ORDER_STATUS,
    )
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

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
