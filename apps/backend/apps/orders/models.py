from django.db import models


class Order(models.Model):
    """Order master model."""

    class Status(models.TextChoices):
        PENDING_CONFIRMATION = "PENDING_CONFIRMATION", "Chờ xác nhận"
        CONFIRMED = "CONFIRMED", "Đã xác nhận"
        PREPARING = "PREPARING", "Đang chuẩn bị"
        READY = "READY", "Sẵn sàng giao"
        DELIVERING = "DELIVERING", "Đang giao hàng"
        COMPLETED = "COMPLETED", "Hoàn thành"
        CANCELLED = "CANCELLED", "Đã hủy"

    class DeliveryType(models.TextChoices):
        ASAP = "ASAP", "Giao ngay"
        SCHEDULED = "SCHEDULED", "Hẹn giờ"

    class PaymentMethod(models.TextChoices):
        COD = "COD", "Tiền mặt khi nhận hàng"
        BANK_TRANSFER = "BANK_TRANSFER", "Chuyển khoản (VietQR)"

    order_code = models.CharField(max_length=32, unique=True, db_index=True)
    idempotency_key = models.CharField(
        max_length=100,
        help_text="Định danh chống trùng đơn",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="orders",
    )
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.PENDING_CONFIRMATION,
    )
    delivery_type = models.CharField(
        max_length=20,
        choices=DeliveryType.choices,
        default=DeliveryType.ASAP,
    )

    # Shipping snapshot
    recipient_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    delivery_address = models.TextField()
    delivery_latitude = models.DecimalField(max_digits=10, decimal_places=8)
    delivery_longitude = models.DecimalField(max_digits=11, decimal_places=8)

    # Financial details
    distance_km = models.DecimalField(max_digits=6, decimal_places=2, default=0.00)
    shipping_fee = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    voucher = models.ForeignKey(
        "vouchers.Voucher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
    )
    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD,
    )
    note = models.TextField(blank=True, default="")

    # Timestamps
    scheduled_delivery_at = models.DateTimeField(null=True, blank=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)
    cancellation_reason = models.CharField(max_length=255, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "orders"
        verbose_name = "Đơn hàng"
        verbose_name_plural = "Đơn hàng"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["customer", "idempotency_key"],
                name="unique_customer_idempotency_order",
            )
        ]
        indexes = [
            models.Index(fields=["customer", "status", "created_at"]),
            models.Index(fields=["order_code"]),
        ]

    def __str__(self) -> str:
        return f"Đơn #{self.order_code} - {self.get_status_display()}"


class OrderItem(models.Model):
    """Order item snapshot model."""

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )
    product = models.ForeignKey(
        "menu.Product",
        on_delete=models.PROTECT,
        related_name="order_items",
    )
    product_name = models.CharField(max_length=255, help_text="Snapshot tên món")
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Snapshot giá tại thời điểm đặt",
    )
    quantity = models.IntegerField(default=1)
    note = models.CharField(max_length=255, blank=True, default="")
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "order_items"
        verbose_name = "Món trong đơn hàng"
        verbose_name_plural = "Món trong đơn hàng"
        indexes = [
            models.Index(fields=["order"]),
        ]

    def __str__(self) -> str:
        return f"{self.product_name} x{self.quantity}"


class OrderItemOption(models.Model):
    """Order item option snapshot model."""

    order_item = models.ForeignKey(
        OrderItem,
        on_delete=models.CASCADE,
        related_name="options",
    )
    option = models.ForeignKey(
        "menu.Option",
        on_delete=models.PROTECT,
        related_name="order_item_options",
    )
    option_name = models.CharField(max_length=255, help_text="Snapshot tên tùy chọn")
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        help_text="Snapshot giá tùy chọn",
    )
    quantity = models.IntegerField(default=1)

    class Meta:
        db_table = "order_item_options"
        verbose_name = "Tùy chọn món trong đơn"
        verbose_name_plural = "Tùy chọn món trong đơn"

    def __str__(self) -> str:
        return f"{self.option_name} (+{self.price:,.0f}đ)"


class AuditLog(models.Model):
    """Staff action audit log model."""

    user = models.ForeignKey(
        "customers.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="audit_logs",
    )
    action = models.CharField(
        max_length=100,
        help_text="UPDATE_ORDER_STATUS, VERIFY_PAYMENT...",
    )
    entity_type = models.CharField(
        max_length=50, help_text="ORDER, PRODUCT, PAYMENT..."
    )
    entity_id = models.BigIntegerField()
    old_data = models.JSONField(null=True, blank=True)
    new_data = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "audit_logs"
        verbose_name = "Nhật ký kiểm toán"
        verbose_name_plural = "Nhật ký kiểm toán"
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"{self.action} on {self.entity_type}:{self.entity_id}"
