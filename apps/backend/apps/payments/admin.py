from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin
from unfold.decorators import display

from apps.payments.models import Payment


@admin.register(Payment)
class PaymentAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_select_related = ["order", "verified_by"]
    list_display = [
        "id",
        "order",
        "method",
        "status_badge",
        "amount_display",
        "actual_paid_amount_display",
        "verified_by",
        "paid_at_formatted",
    ]
    list_display_links = ["id", "order"]
    list_filter = ["status", "method", "paid_at"]
    search_fields = ["order__order_code", "transaction_reference", "note"]
    readonly_fields = ["order", "method", "amount", "qr_code_url", "vietqr_preview"]

    @display(
        description="Trạng thái",
        ordering="status",
        label={
            Payment.Status.UNPAID: "warning",
            Payment.Status.PENDING: "warning",
            Payment.Status.PAID: "success",
            Payment.Status.FAILED: "danger",
            Payment.Status.REFUNDED: "info",
        },
    )
    def status_badge(self, obj):
        return obj.status, obj.get_status_display()

    @display(description="Số tiền", ordering="amount")
    def amount_display(self, obj):
        return f"{obj.amount:,.0f} đ"

    @display(description="Thực nhận", ordering="actual_paid_amount")
    def actual_paid_amount_display(self, obj):
        if obj.actual_paid_amount is not None:
            return f"{obj.actual_paid_amount:,.0f} đ"
        return "-"

    @display(description="Thời gian thanh toán", ordering="paid_at")
    def paid_at_formatted(self, obj):
        if obj.paid_at:
            from django.utils import timezone

            local_time = timezone.localtime(obj.paid_at)
            return local_time.strftime("%d/%m/%Y %H:%M")
        return "-"

    @display(description="Mã VietQR Preview")
    def vietqr_preview(self, obj):
        if not obj or not obj.order:
            return "Không có"
        if obj.method == Payment.Method.BANK_TRANSFER:
            from apps.orders.services import OrderService

            qr_url = obj.qr_code_url or OrderService.generate_vietqr_url(
                obj.amount, obj.order.order_code
            )
            return format_html(
                '<div style="margin-top: 4px;">'
                '<a href="{}" target="_blank" title="Bấm để mở ảnh QR kích thước lớn">'
                '<img src="{}" style="max-width: 250px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />'
                "</a>"
                '<p style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">(Bấm vào ảnh để xem toàn màn hình)</p>'
                "</div>",
                qr_url,
                qr_url,
            )
        return "Không áp dụng (Tiền mặt COD)"
