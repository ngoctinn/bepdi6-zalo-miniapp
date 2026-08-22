from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from apps.customers.models import Address, Customer, User


@admin.register(User)
class UserAdmin(BaseUserAdmin, ModelAdmin):
    """Staff & Admin User management conforming to Django & Unfold best practices."""

    list_display = [
        "username",
        "email",
        "phone",
        "role_badge",
        "status_badge",
        "is_active",
        "is_staff",
        "date_joined_formatted",
    ]
    list_filter = ["role", "status", "is_staff", "is_superuser", "is_active"]
    search_fields = ["username", "email", "phone", "first_name", "last_name"]
    ordering = ["-date_joined"]

    fieldsets = (
        (None, {"fields": ("username", "password")}),
        (
            _("Thông tin cá nhân"),
            {"fields": ("first_name", "last_name", "email", "phone", "zalo_user_id")},
        ),
        (
            _("Phân quyền & Vai trò"),
            {
                "fields": (
                    "role",
                    "status",
                    "is_active",
                    "is_staff",
                    "is_superuser",
                    "groups",
                    "user_permissions",
                )
            },
        ),
        (_("Thời gian"), {"fields": ("last_login", "date_joined")}),
    )

    @display(
        description="Vai trò",
        ordering="role",
        label={
            User.Role.ADMIN: "danger",
            User.Role.STAFF: "info",
        },
    )
    def role_badge(self, obj):
        return obj.role, obj.get_role_display()

    @display(
        description="Trạng thái",
        ordering="status",
        label={
            User.Status.ACTIVE: "success",
            User.Status.INACTIVE: "danger",
        },
    )
    def status_badge(self, obj):
        return obj.status, obj.get_status_display()

    @display(description="Ngày tham gia", ordering="date_joined")
    def date_joined_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.date_joined)
        return local_time.strftime("%d/%m/%Y %H:%M")


class AddressInline(TabularInline):
    model = Address
    extra = 0
    hide_title = True
    fields = [
        "label",
        "recipient_name",
        "phone",
        "address_text",
        "latitude",
        "longitude",
        "is_default",
    ]


@admin.register(Customer)
class CustomerAdmin(ModelAdmin):
    """Zalo Mini App Customer management."""

    list_display = [
        "id",
        "name",
        "phone",
        "zalo_user_id",
        "address_count",
        "created_at_formatted",
    ]
    list_display_links = ["id", "name", "phone"]
    search_fields = ["name", "phone", "zalo_user_id"]
    ordering = ["-created_at"]
    inlines = [AddressInline]

    @display(description="Số địa chỉ lưu")
    def address_count(self, obj):
        return obj.addresses.count()

    @display(description="Ngày đăng ký", ordering="created_at")
    def created_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.created_at)
        return local_time.strftime("%d/%m/%Y %H:%M")


@admin.register(Address)
class AddressAdmin(ModelAdmin):
    """Customer shipping address management."""

    list_display = [
        "id",
        "customer",
        "label",
        "recipient_name",
        "phone",
        "address_text",
        "is_default_badge",
        "created_at_formatted",
    ]
    list_display_links = ["id", "recipient_name", "phone"]
    list_filter = ["is_default", "created_at"]
    search_fields = ["recipient_name", "phone", "address_text", "customer__name"]
    raw_id_fields = ["customer"]

    @display(
        description="Mặc định",
        ordering="is_default",
        label={
            True: "success",
            False: "danger",
        },
    )
    def is_default_badge(self, obj):
        return obj.is_default, "Có" if obj.is_default else "Không"

    @display(description="Ngày tạo", ordering="created_at")
    def created_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.created_at)
        return local_time.strftime("%d/%m/%Y %H:%M")
