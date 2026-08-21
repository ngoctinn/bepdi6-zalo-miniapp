from django.contrib import admin
from django.utils.html import format_html

from apps.orders.models import AuditLog, Order, OrderItem, OrderItemOption
from apps.payments.models import Payment


class OrderItemOptionInline(admin.TabularInline):
    model = OrderItemOption
    extra = 0
    readonly_fields = ["option_name", "price", "quantity"]


class OrderItemInline(admin.StackedInline):
    model = OrderItem
    extra = 0
    readonly_fields = ["product_name", "unit_price", "quantity", "subtotal", "note"]


class PaymentInline(admin.StackedInline):
    model = Payment
    extra = 0
    can_delete = False
    fields = [
        "method",
        "status",
        "amount",
        "actual_paid_amount",
        "note",
        "verified_by",
        "paid_at",
        "vietqr_preview",
    ]
    readonly_fields = ["vietqr_preview"]

    @admin.display(description="Mã VietQR Preview")
    def vietqr_preview(self, obj):
        if obj.qr_code_url:
            return format_html(
                '<a href="{}" target="_blank"><img src="{}" style="max-width: 200px; border-radius: 8px; border: 1px solid #ddd;" /></a>',
                obj.qr_code_url,
                obj.qr_code_url,
            )
        return "Không có"


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = [
        "order_code",
        "recipient_name",
        "phone",
        "status_badge",
        "payment_status_badge",
        "total_amount_display",
        "payment_method",
        "created_at",
    ]
    list_filter = ["status", "payment__status", "payment_method", "created_at"]
    search_fields = ["order_code", "recipient_name", "phone", "delivery_address"]
    readonly_fields = [
        "order_code",
        "idempotency_key",
        "customer",
        "subtotal",
        "shipping_fee",
        "discount",
        "total_amount",
        "created_at",
    ]
    inlines = [PaymentInline, OrderItemInline]
    actions = [
        "action_confirm_orders",
        "action_verify_vietqr_paid",
        "action_mark_preparing",
        "action_mark_ready",
        "action_mark_delivering",
        "action_mark_completed",
    ]

    @admin.display(description="Trạng thái đơn")
    def status_badge(self, obj):
        colors = {
            Order.Status.PENDING_CONFIRMATION: "#EAB308",  # Yellow
            Order.Status.CONFIRMED: "#3B82F6",  # Blue
            Order.Status.PREPARING: "#8B5CF6",  # Purple
            Order.Status.READY: "#06B6D4",  # Cyan
            Order.Status.DELIVERING: "#F97316",  # Orange
            Order.Status.COMPLETED: "#10B981",  # Green
            Order.Status.CANCELLED: "#EF4444",  # Red
        }
        color = colors.get(obj.status, "#6B7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 11px;">{}</span>',
            color,
            obj.get_status_display(),
        )

    @admin.display(description="Thanh toán")
    def payment_status_badge(self, obj):
        if not hasattr(obj, "payment"):
            return "-"
        status = obj.payment.status
        colors = {
            Payment.Status.PAID: "#10B981",  # Green
            Payment.Status.UNPAID: "#EF4444",  # Red
            Payment.Status.PENDING: "#F59E0B",  # Orange
            Payment.Status.REFUNDED: "#6B7280",  # Gray
        }
        color = colors.get(status, "#6B7280")
        return format_html(
            '<span style="background-color: {}; color: white; padding: 3px 8px; border-radius: 6px; font-weight: 600; font-size: 11px;">{}</span>',
            color,
            obj.payment.get_status_display(),
        )

    @admin.display(description="Tổng tiền")
    def total_amount_display(self, obj):
        formatted_price = f"{obj.total_amount:,.0f}đ"
        return format_html("<b>{}</b>", formatted_price)

    @admin.action(description="✅ [Nhân viên] Xác nhận ĐÃ NHẬN TIỀN VietQR (PAID)")
    def action_verify_vietqr_paid(self, request, queryset):
        from django.utils import timezone

        count = 0
        for order in queryset:
            if (
                hasattr(order, "payment")
                and order.payment.status != Payment.Status.PAID
            ):
                payment = order.payment
                payment.status = Payment.Status.PAID
                payment.actual_paid_amount = order.total_amount
                payment.paid_at = timezone.now()
                if request.user.is_authenticated:
                    payment.verified_by = request.user
                payment.save()
                count += 1
        self.message_user(
            request, f"Đã xác nhận thanh toán thành công cho {count} đơn hàng."
        )

    @admin.action(description="📞 [Nhân viên] Xác nhận đơn hàng (CONFIRMED)")
    def action_confirm_orders(self, request, queryset):
        from apps.orders.services import OrderService

        count = 0
        for order in queryset:
            if order.status == Order.Status.PENDING_CONFIRMATION:
                OrderService.update_order_status(
                    order, Order.Status.CONFIRMED, user=request.user
                )
                count += 1
        self.message_user(request, f"Đã xác nhận {count} đơn hàng.")

    @admin.action(description="🍳 Chuyển sang Đang chế biến (PREPARING)")
    def action_mark_preparing(self, request, queryset):
        from apps.orders.services import OrderService

        for order in queryset:
            if order.status == Order.Status.CONFIRMED:
                OrderService.update_order_status(
                    order, Order.Status.PREPARING, user=request.user
                )

    @admin.action(description="🍱 Chuyển sang Sẵn sàng giao (READY)")
    def action_mark_ready(self, request, queryset):
        from apps.orders.services import OrderService

        for order in queryset:
            if order.status == Order.Status.PREPARING:
                OrderService.update_order_status(
                    order, Order.Status.READY, user=request.user
                )

    @admin.action(description="🛵 Chuyển sang Đang giao hàng (DELIVERING)")
    def action_mark_delivering(self, request, queryset):
        from apps.orders.services import OrderService

        for order in queryset:
            if order.status == Order.Status.READY:
                OrderService.update_order_status(
                    order, Order.Status.DELIVERING, user=request.user
                )

    @admin.action(description="🎉 Chuyển sang Hoàn tất đơn (COMPLETED)")
    def action_mark_completed(self, request, queryset):
        from apps.orders.services import OrderService

        for order in queryset:
            if order.status == Order.Status.DELIVERING:
                OrderService.update_order_status(
                    order, Order.Status.COMPLETED, user=request.user
                )


@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):
    list_display = ["id", "order", "product_name", "unit_price", "quantity", "subtotal"]
    inlines = [OrderItemOptionInline]


admin.site.register(OrderItemOption)
admin.site.register(AuditLog)
