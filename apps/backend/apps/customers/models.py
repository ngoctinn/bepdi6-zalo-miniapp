from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Staff / Admin user model."""

    class Role(models.TextChoices):
        STAFF = "STAFF", "Nhân viên"
        ADMIN = "ADMIN", "Quản trị viên"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Đang hoạt động"
        INACTIVE = "INACTIVE", "Ngưng hoạt động"

    zalo_user_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Định danh Zalo nhận thông báo OA",
    )
    phone = models.CharField(max_length=20, unique=True, blank=True, null=True)
    role = models.CharField(
        max_length=50,
        choices=Role.choices,
        default=Role.STAFF,
    )
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.ACTIVE,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta(AbstractUser.Meta):
        db_table = "users"
        verbose_name = _("Người dùng")
        verbose_name_plural = _("Người dùng")

    def __str__(self) -> str:
        return f"{self.username} ({self.get_role_display()})"


class Customer(models.Model):
    """Zalo Mini App end customer model."""

    zalo_user_id = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="Định danh Zalo của khách hàng",
    )
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20, blank=True, default="")
    avatar_url = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "customers"
        verbose_name = "Khách hàng"
        verbose_name_plural = "Khách hàng"
        indexes = [
            models.Index(fields=["zalo_user_id"]),
        ]

    def __str__(self) -> str:
        return f"{self.name} ({self.phone or self.zalo_user_id})"


class Address(models.Model):
    """Customer shipping address model."""

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="addresses",
    )
    label = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text='Nhãn địa chỉ, ví dụ: "Nhà", "Công ty"',
    )
    recipient_name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    address_text = models.TextField()
    latitude = models.DecimalField(max_digits=10, decimal_places=8)
    longitude = models.DecimalField(max_digits=11, decimal_places=8)
    is_default = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "addresses"
        verbose_name = "Địa chỉ"
        verbose_name_plural = "Địa chỉ"
        ordering = ["-is_default", "-created_at"]

    def __str__(self) -> str:
        return f"{self.recipient_name} - {self.address_text}"
