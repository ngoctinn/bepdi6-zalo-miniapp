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
        DELIVERY = "DELIVERY", "Giao tận nơi"
        PICKUP = "PICKUP", "Tự đến lấy tại quán"
        ASAP = "ASAP", "Giao ngay (Cũ)"
        SCHEDULED = "SCHEDULED", "Hẹn giờ (Cũ)"

    class PaymentMethod(models.TextChoices):
        COD = "COD", "Tiền mặt khi nhận hàng"
        BANK_TRANSFER = "BANK_TRANSFER", "Chuyển khoản (VietQR)"

    order_code = models.CharField(
        max_length=32,
        unique=True,
        db_index=True,
        verbose_name="Mã đơn hàng",
    )
    idempotency_key = models.CharField(
        max_length=100,
        help_text="Định danh chống trùng đơn",
        verbose_name="Khóa chống trùng",
    )
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="orders",
        verbose_name="Khách hàng",
    )
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.PENDING_CONFIRMATION,
        verbose_name="Trạng thái đơn",
    )
    delivery_type = models.CharField(
        max_length=20,
        choices=DeliveryType.choices,
        default=DeliveryType.DELIVERY,
        verbose_name="Hình thức nhận hàng",
    )

    # Shipping snapshot
    recipient_name = models.CharField(max_length=255, verbose_name="Người nhận")
    phone = models.CharField(max_length=20, verbose_name="Số điện thoại")
    delivery_address = models.TextField(verbose_name="Địa chỉ giao")
    delivery_latitude = models.DecimalField(
        max_digits=10, decimal_places=8, verbose_name="Vĩ độ giao"
    )
    delivery_longitude = models.DecimalField(
        max_digits=11, decimal_places=8, verbose_name="Kinh độ giao"
    )

    # Financial details
    distance_km = models.DecimalField(
        max_digits=6, decimal_places=2, default=0.00, verbose_name="Khoảng cách (km)"
    )
    shipping_fee = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00, verbose_name="Phí ship"
    )
    subtotal = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Tạm tính"
    )
    discount = models.DecimalField(
        max_digits=12, decimal_places=2, default=0.00, verbose_name="Giảm giá"
    )
    total_amount = models.DecimalField(
        max_digits=12, decimal_places=2, verbose_name="Tổng tiền"
    )
    voucher = models.ForeignKey(
        "vouchers.Voucher",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="orders",
        verbose_name="Voucher áp dụng",
    )
    payment_method = models.CharField(
        max_length=30,
        choices=PaymentMethod.choices,
        default=PaymentMethod.COD,
        verbose_name="Hình thức thanh toán",
    )
    note = models.TextField(blank=True, default="", verbose_name="Ghi chú đơn")

    # Timestamps
    scheduled_delivery_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Hẹn giờ giao lúc"
    )
    confirmed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Xác nhận lúc"
    )
    completed_at = models.DateTimeField(
        null=True, blank=True, verbose_name="Hoàn tất lúc"
    )
    cancelled_at = models.DateTimeField(null=True, blank=True, verbose_name="Hủy lúc")
    cancellation_reason = models.CharField(
        max_length=255, blank=True, default="", verbose_name="Lý do hủy"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Thời gian đặt")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Cập nhật lúc")

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
        return f"#{self.order_code}"


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
