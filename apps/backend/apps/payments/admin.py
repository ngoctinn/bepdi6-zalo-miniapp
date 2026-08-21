from django.contrib import admin
from django.utils.html import format_html

from apps.payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "order",
        "method",
        "status",
        "amount",
        "actual_paid_amount",
        "verified_by",
        "paid_at",
    ]
    list_filter = ["status", "method", "paid_at"]
    search_fields = ["order__order_code", "transaction_reference", "note"]
    readonly_fields = ["order", "method", "amount", "qr_code_url", "vietqr_preview"]

    @admin.display(description="Mã VietQR Preview")
    def vietqr_preview(self, obj):
        if obj.qr_code_url:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="max-width: 250px; border-radius: 8px; border: 1px solid #ddd;" /></a>',
                obj.qr_code_url,
                obj.qr_code_url,
            )
        return "Không có"
