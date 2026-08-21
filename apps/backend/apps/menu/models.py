from django.db import models


class Category(models.Model):
    """Menu category model."""

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Đang hoạt động"
        INACTIVE = "INACTIVE", "Ngưng hoạt động"

    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    image_url = models.TextField(blank=True, default="")
    sort_order = models.IntegerField(default=0)
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "categories"
        verbose_name = "Danh mục món"
        verbose_name_plural = "Danh mục món"
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return str(self.name)


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
    )
    name = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    image_url = models.TextField(blank=True, default="")
    price = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "products"
        verbose_name = "Món ăn"
        verbose_name_plural = "Món ăn"
        ordering = ["id"]

    def __str__(self) -> str:
        return str(self.name)


class OptionGroup(models.Model):
    """Option group for custom product modifiers (e.g. Size, Topping)."""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="option_groups",
    )
    name = models.CharField(
        max_length=255, help_text='Ví dụ: "Chọn nước", "Thêm topping"'
    )
    is_required = models.BooleanField(default=False)
    min_select = models.IntegerField(default=0)
    max_select = models.IntegerField(default=1)
    sort_order = models.IntegerField(default=0)

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
    )
    name = models.CharField(max_length=255)
    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00,
        help_text="Giá cộng thêm",
    )
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.AVAILABLE,
    )
    sort_order = models.IntegerField(default=0)

    class Meta:
        db_table = "options"
        verbose_name = "Tùy chọn"
        verbose_name_plural = "Tùy chọn"
        ordering = ["sort_order", "id"]

    def __str__(self) -> str:
        return f"{self.name} (+{self.price:,.0f}đ)"
