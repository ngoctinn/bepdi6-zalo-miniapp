from django.contrib import admin
from unfold.admin import ModelAdmin
from unfold.decorators import display

from apps.notifications.models import Notification


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
