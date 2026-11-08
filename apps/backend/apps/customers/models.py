from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils.translation import gettext_lazy as _


class User(AbstractUser):
    """Staff / Admin user model."""

    class Role(models.TextChoices):
        STAFF = "STAFF", "Nhân viên"
        ADMIN = "ADMIN", "Quản trị viên"
        CUSTOMER = "CUSTOMER", "Khách hàng"

    class Status(models.TextChoices):
        ACTIVE = "ACTIVE", "Đang hoạt động"
        INACTIVE = "INACTIVE", "Ngưng hoạt động"

    zalo_user_id = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Định danh Zalo nhận thông báo OA",
        verbose_name="Zalo User ID",
    )
    phone = models.CharField(
        max_length=20, unique=True, blank=True, null=True, verbose_name="Số điện thoại"
    )
    role = models.CharField(
        max_length=50,
        choices=Role.choices,
        default=Role.CUSTOMER,
        verbose_name="Vai trò",
    )
    status = models.CharField(
        max_length=50,
        choices=Status.choices,
        default=Status.ACTIVE,
        verbose_name="Trạng thái",
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

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
        verbose_name="Zalo User ID",
    )
    name = models.CharField(max_length=255, verbose_name="Tên khách hàng")
    phone = models.CharField(
        max_length=20, blank=True, default="", verbose_name="Số điện thoại"
    )
    avatar_url = models.TextField(blank=True, default="", verbose_name="Ảnh đại diện")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày đăng ký")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "customers"
        verbose_name = "Khách hàng"
        verbose_name_plural = "Khách hàng"

    def __str__(self) -> str:
        return f"{self.name} ({self.phone or self.zalo_user_id})"


class Address(models.Model):
    """Customer shipping address model."""

    customer = models.ForeignKey(
        Customer,
        on_delete=models.CASCADE,
        related_name="addresses",
        verbose_name="Khách hàng",
    )
    label = models.CharField(
        max_length=100,
        blank=True,
        default="",
        help_text='Nhãn địa chỉ, ví dụ: "Nhà", "Công ty"',
        verbose_name="Nhãn địa chỉ",
    )
    recipient_name = models.CharField(max_length=255, verbose_name="Người nhận")
    phone = models.CharField(max_length=20, verbose_name="Số điện thoại")
    address_text = models.TextField(verbose_name="Địa chỉ chi tiết")
    latitude = models.DecimalField(
        max_digits=10, decimal_places=8, verbose_name="Vĩ độ"
    )
    longitude = models.DecimalField(
        max_digits=11, decimal_places=8, verbose_name="Kinh độ"
    )
    is_default = models.BooleanField(default=False, verbose_name="Địa chỉ mặc định")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Ngày cập nhật")

    class Meta:
        db_table = "addresses"
        verbose_name = "Địa chỉ giao hàng"
        verbose_name_plural = "Địa chỉ giao hàng"
        ordering = ["-is_default", "-created_at"]

    def __str__(self) -> str:
        return f"{self.recipient_name} - {self.address_text}"


class StaffInviteToken(models.Model):
    """Secure One-Time Token for dynamic staff/admin invitation via Zalo."""

    token = models.CharField(
        max_length=64,
        unique=True,
        db_index=True,
        verbose_name="Mã mời bí mật",
    )
    role = models.CharField(
        max_length=50,
        choices=[(User.Role.STAFF, "Nhân viên"), (User.Role.ADMIN, "Quản trị viên")],
        default=User.Role.STAFF,
        verbose_name="Vai trò được cấp",
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name="created_invites",
        verbose_name="Người tạo lời mời",
    )
    used_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="accepted_invites",
        verbose_name="Người sử dụng",
    )
    expires_at = models.DateTimeField(verbose_name="Thời hạn hết hạn")
    is_used = models.BooleanField(
        default=False, db_index=True, verbose_name="Đã sử dụng"
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Ngày tạo")

    class Meta:
        db_table = "staff_invite_tokens"
        verbose_name = "Mã mời nhân viên"
        verbose_name_plural = "Mã mời nhân viên"
        ordering = ["-created_at"]

    def save(self, *args, **kwargs):
        if not self.token:
            import uuid

            self.token = uuid.uuid4().hex
        if not self.expires_at:
            from datetime import timedelta

            from django.utils import timezone

            self.expires_at = timezone.now() + timedelta(minutes=15)
        super().save(*args, **kwargs)

    @property
    def is_valid(self) -> bool:
        from django.utils import timezone

        return not self.is_used and self.expires_at > timezone.now()

    def __str__(self) -> str:
        return f"Invite {self.role} ({'USED' if self.is_used else 'ACTIVE'})"
