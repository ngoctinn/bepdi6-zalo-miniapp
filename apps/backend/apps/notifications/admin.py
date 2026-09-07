from django.contrib import admin
from unfold.admin import ModelAdmin
from unfold.decorators import display

from apps.notifications.models import Notification, ZaloOACredential


@admin.register(Notification)
class NotificationAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_display = [
        "id",
        "customer",
        "type",
        "title",
        "read_badge",
        "order",
        "created_at_formatted",
    ]
    list_display_links = ["id", "title"]
    list_filter = ["is_read", "type", "created_at"]
    list_select_related = ["customer", "order"]
    search_fields = [
        "title",
        "message",
        "customer__name",
        "customer__phone",
        "order__order_code",
    ]
    raw_id_fields = ["customer", "order"]
    readonly_fields = ["created_at", "read_at"]

    @display(
        description="Đã đọc",
        ordering="is_read",
        label={
            True: "success",
            False: "warning",
        },
    )
    def read_badge(self, obj):
        return obj.is_read, "Đã đọc" if obj.is_read else "Chưa đọc"

    @display(description="Thời gian tạo", ordering="created_at")
    def created_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.created_at)
        return local_time.strftime("%d/%m/%Y %H:%M")


@admin.register(ZaloOACredential)
class ZaloOACredentialAdmin(ModelAdmin):
    list_display = [
        "oa_id",
        "valid_badge",
        "masked_access_token",
        "expires_at_formatted",
        "updated_at_formatted",
    ]
    search_fields = ["oa_id"]
    readonly_fields = ["created_at", "updated_at"]

    @display(
        description="Trạng thái Token",
        label={
            True: "success",
            False: "danger",
        },
    )
    def valid_badge(self, obj):
        from django.utils import timezone

        is_valid = obj.expires_at > timezone.now()
        return is_valid, "Còn hiệu lực" if is_valid else "Đã hết hạn"

    @display(description="Access Token (Masked)")
    def masked_access_token(self, obj):
        if len(obj.access_token) > 16:
            return f"{obj.access_token[:8]}...{obj.access_token[-8:]}"
        return "***"

    @display(description="Thời gian hết hạn", ordering="expires_at")
    def expires_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.expires_at)
        return local_time.strftime("%d/%m/%Y %H:%M")

    @display(description="Cập nhật lần cuối", ordering="updated_at")
    def updated_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.updated_at)
        return local_time.strftime("%d/%m/%Y %H:%M")
