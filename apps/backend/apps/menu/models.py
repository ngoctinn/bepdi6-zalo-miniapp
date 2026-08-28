from decimal import Decimal

from django.db import models
from django.utils import timezone


class Category(models.Model):
    """Menu category model."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Đang hoạt động"
        INACTIVE = "INACTIVE", "Ngưng hoạt động"

    name = models.CharField(max_length=255, verbose_name="Tên danh mục")
    description = models.TextField(blank=True, default="", verbose_name="Mô tả")
    image = models.ImageField(
        upload_to="categories/%Y/%m/",
        blank=True,
        null=True,
        help_text="File ảnh danh mục",
        verbose_name="File ảnh",
    )
    image_url = models.TextField(
        blank=True,
        default="",
        help_text="URL ảnh danh mục (tự động lấy từ file tải lên hoặc dán link ngoài)",
        verbose_name="Đường dẫn ảnh",
    )
    sort_order = models.IntegerField(
        default=0, db_index=True, verbose_name="Thứ tự hiển thị"
    )
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
        verbose_name="Trạng thái",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "categories"
        verbose_name = "Danh mục món"
        verbose_name_plural = "Danh mục món"
        ordering = ["sort_order", "id"]
        indexes = [
            models.Index(fields=["status", "sort_order"], name="idx_cat_status_sort"),
        ]

    def __str__(self) -> str:
        return self.name

    @property
    def effective_image_url(self) -> str:
        if self.image:
            return self.image.url
        return self.image_url


class Product(models.Model):
    """Product (food/beverage item) model."""

    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Đang bán"
        OUT_OF_STOCK = "OUT_OF_STOCK", "Hết hàng"
        INACTIVE = "INACTIVE", "Ngưng bán"

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="products",
        verbose_name="Danh mục",
    )
    name = models.CharField(max_length=255, verbose_name="Tên món")
    description = models.TextField(blank=True, default="", verbose_name="Mô tả")
    image = models.ImageField(
        upload_to="products/%Y/%m/",
        blank=True,
        null=True,
        help_text="File ảnh món ăn",
        verbose_name="File ảnh",
    )
    image_url = models.TextField(
        blank=True,
        default="",
        help_text="URL ảnh món ăn (tự động lấy từ file tải lên hoặc dán link ngoài)",
        verbose_name="Đường dẫn ảnh",
    )
    price = models.DecimalField(max_digits=12, decimal_places=2, verbose_name="Giá bán")
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.AVAILABLE,
        db_index=True,
        verbose_name="Trạng thái",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "products"
        verbose_name = "Món ăn"
        verbose_name_plural = "Món ăn"
        ordering = ["id"]
        indexes = [
            models.Index(fields=["status", "category"], name="idx_prod_status_cat"),
            models.Index(fields=["category", "status"], name="idx_prod_cat_status"),
        ]

    def __str__(self) -> str:
        return self.name

    @property
    def effective_image_url(self) -> str:
        if self.image:
            return self.image.url
        return self.image_url

    @property
    def active_promotion(self):
        """Return the currently active ProductPromotion, or None."""
        now = timezone.now()
        try:
            return (
                self.promotions.filter(
                    is_active=True,
                )
                .filter(
                    models.Q(valid_from__isnull=True) | models.Q(valid_from__lte=now),
                )
                .filter(
                    models.Q(valid_to__isnull=True) | models.Q(valid_to__gte=now),
                )
                .order_by("-created_at")
                .first()
            )
        except Exception:
            return None

    @property
    def effective_price(self) -> Decimal:
        """Return promotional price if active, else regular price."""
        promo = self.active_promotion
        if promo:
            return promo.promotional_price
        return self.price

    @property
    def has_promotion(self) -> bool:
        return self.active_promotion is not None

    @property
    def discount_percent(self) -> int | None:
        """Return integer discount %, or None if no active promotion."""
        promo = self.active_promotion
        if promo and self.price and self.price > 0:
            pct = round((1 - float(promo.promotional_price) / float(self.price)) * 100)
            return max(0, pct)
        return None


class OptionGroup(models.Model):
    """Option group for custom product modifiers (e.g. Size, Topping)."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="option_groups",
        verbose_name="Món ăn",
    )
    name = models.CharField(
        max_length=255,
        help_text='Ví dụ: "Chọn nước", "Thêm topping"',
        verbose_name="Tên nhóm tùy chọn",
    )
    is_required = models.BooleanField(default=False, verbose_name="Bắt buộc chọn")
    min_select = models.IntegerField(default=0, verbose_name="Số lượng chọn tối thiểu")
    max_select = models.IntegerField(default=1, verbose_name="Số lượng chọn tối đa")
    sort_order = models.IntegerField(
        default=0, db_index=True, verbose_name="Thứ tự hiển thị"
    )

    class Meta:
        db_table = "option_groups"
        verbose_name = "Nhóm tùy chọn"
        verbose_name_plural = "Nhóm tùy chọn"
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return f"{self.product.name} - {self.name}"


class Option(models.Model):
    """Specific choice in an option group."""

    class Status(models.TextChoices):
        AVAILABLE = "AVAILABLE", "Đang bán"
        INACTIVE = "INACTIVE", "Ngưng bán"

    option_group = models.ForeignKey(
        OptionGroup,
        on_delete=models.CASCADE,
        related_name="options",
        verbose_name="Nhóm tùy chọn",
    )
    name = models.CharField(max_length=255, verbose_name="Tên tùy chọn")
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text="Giá cộng thêm",
        verbose_name="Giá cộng thêm",
    )
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.AVAILABLE,
        db_index=True,
        verbose_name="Trạng thái",
    )
    sort_order = models.IntegerField(
        default=0, db_index=True, verbose_name="Thứ tự hiển thị"
    )

    class Meta:
        db_table = "options"
        verbose_name = "Tùy chọn món"
        verbose_name_plural = "Tùy chọn món"
        ordering = ["sort_order", "id"]
        indexes = [
            models.Index(
                fields=["option_group", "status"], name="idx_opt_group_status"
            ),
        ]

    def __str__(self) -> str:
        return f"{self.name} (+{self.price:,.0f}đ)"


class ProductPromotion(models.Model):
    """Time-bounded promotional price for a product."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="promotions",
        verbose_name="Món ăn",
    )
    promotional_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Giá ưu đãi",
        help_text="Giá bán trong thời gian khuyến mãi",
    )
    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name="Đang kích hoạt",
    )
    valid_from = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hiệu lực từ",
        help_text="Để trống = áp dụng ngay",
    )
    valid_to = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="Hết hạn lúc",
        help_text="Để trống = không giới hạn",
    )
    note = models.CharField(
        max_length=255,
        blank=True,
        default="",
        verbose_name="Ghi chú nội bộ",
        help_text="Ví dụ: Flash sale 12h, Combo cuối tuần",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "product_promotions"
        verbose_name = "Giá ưu đãi"
        verbose_name_plural = "Giá ưu đãi"
        ordering = ["-created_at"]
        indexes = [
            models.Index(
                fields=["product", "is_active"], name="idx_promo_product_active"
            ),
        ]

    def __str__(self) -> str:
        price_fmt = f"{self.promotional_price:,.0f}đ"
        if self.valid_to:
            from django.utils import timezone as tz

            local = tz.localtime(self.valid_to)
            return (
                f"{self.product.name} — {price_fmt} (đến {local.strftime('%d/%m/%Y')})"
            )
        return f"{self.product.name} — {price_fmt} (không thời hạn)"
