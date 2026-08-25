from django.contrib import admin
from unfold.admin import ModelAdmin
from unfold.decorators import display

from apps.shipping.models import ShopConfig


@admin.register(ShopConfig)
class ShopConfigAdmin(ModelAdmin):
    """Admin interface for managing store configuration and delivery parameters."""

    list_display = [
        "shop_name",
        "hotline",
        "open_status_badge",
        "operating_hours",
        "max_delivery_radius_km",
        "vietqr_bank_id",
        "vietqr_account_no",
        "updated_at_formatted",
    ]

    fieldsets = (
        (
            "Thông tin cửa hàng & CSKH",
            {
                "fields": (
                    "shop_name",
                    "hotline",
                    "address_text",
                    "announcement_banner",
                )
            },
        ),
        (
            "Vận hành & Trạng thái mở quán",
            {
                "fields": (
                    "is_open",
                    "open_time",
                    "close_time",
                    "prep_time_minutes",
                    "min_order_amount",
                )
            },
        ),
        (
            "Cấu hình Vận chuyển & Biểu phí ship",
            {
                "fields": (
                    "latitude",
                    "longitude",
                    "max_delivery_radius_km",
                    "haversine_multiplier",
                    "min_order_for_freeship",
                    "shipping_tiers",
                )
            },
        ),
        (
            "Tài khoản thanh toán VietQR",
            {
                "fields": (
                    "vietqr_bank_id",
                    "vietqr_account_no",
                    "vietqr_account_name",
                )
            },
        ),
    )

    def has_add_permission(self, request):
        # Singleton: allow add only if no instance exists
        return not ShopConfig.objects.exists()

    def has_delete_permission(self, request, obj=None):
        # Prevent accidental deletion of store configuration
        return False

    @display(
        description="Trạng thái nhận đơn",
        ordering="is_open",
        label={
            True: "success",
            False: "danger",
        },
    )
    def open_status_badge(self, obj):
        return obj.is_open, "Đang mở cửa" if obj.is_open else "Tạm đóng cửa"

    @display(description="Khung giờ hoạt động")
    def operating_hours(self, obj):
        if obj.open_time and obj.close_time:
            return f"{obj.open_time.strftime('%H:%M')} - {obj.close_time.strftime('%H:%M')}"
        return "Cả ngày"

    @display(description="Cập nhật lần cuối", ordering="updated_at")
    def updated_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.updated_at)
        return local_time.strftime("%d/%m/%Y %H:%M")
