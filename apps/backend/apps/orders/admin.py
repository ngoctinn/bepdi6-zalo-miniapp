from django.contrib import admin
from django.utils.html import format_html, format_html_join
from django.utils.safestring import mark_safe
from unfold.admin import ModelAdmin, StackedInline, TabularInline
from unfold.decorators import action, display

from apps.orders.models import AuditLog, Order, OrderItem, OrderItemOption
from apps.payments.models import Payment


class OrderItemOptionInline(TabularInline):
    model = OrderItemOption
    extra = 0
    hide_title = True
    readonly_fields = ["option_name", "price", "quantity"]


class OrderItemInline(StackedInline):
    model = OrderItem
    extra = 0
    hide_title = True
    readonly_fields = [
        "product_name",
        "unit_price",
        "quantity",
        "subtotal",
        "note",
        "options_display",
    ]
    fields = [
        "product_name",
        "unit_price",
        "quantity",
        "subtotal",
        "note",
        "options_display",
    ]

    @display(description="Tùy chọn đã chọn")
    def options_display(self, obj):
        options = obj.options.all()
        if not options.exists():
            return "-"
        items_html = format_html_join(
            "",
            '<li style="margin-bottom: 2px;">• <b>{}</b> (+{:,.0f}đ x{})</li>',
            ((opt.option_name, opt.price, opt.quantity) for opt in options),
        )
        return format_html(
            '<ul style="margin: 0; padding-left: 0; list-style-type: none; font-size: 0.875rem;">{}</ul>',
            items_html,
        )


class PaymentInline(StackedInline):
    model = Payment
    extra = 0
    can_delete = False
    hide_title = True
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
                '<img src="{}" style="max-width: 220px; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 1px 3px rgba(0,0,0,0.1);" />'
                "</a>"
                '<p style="font-size: 0.75rem; color: #64748b; margin-top: 4px;">(Bấm vào ảnh để xem toàn màn hình)</p>'
                "</div>",
                qr_url,
                qr_url,
            )
        return "Không áp dụng (Tiền mặt COD)"


@admin.register(Order)
class OrderAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 20
    list_display = [
        "order_code",
        "items_summary_display",
        "recipient_name",
        "phone",
        "status_badge",
        "payment_badge",
        "total_amount_formatted",
        "created_at_formatted",
    ]
    list_display_links = ["order_code", "items_summary_display"]
    list_filter = ["status", "payment__status", "payment_method", "created_at"]
    search_fields = [
        "order_code",
        "recipient_name",
        "phone",
        "delivery_address",
        "items__product_name",
    ]
    date_hierarchy = "created_at"
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
    inlines = [OrderItemInline, PaymentInline]
    actions = [
        "action_confirm_orders",
        "action_mark_preparing",
        "action_mark_ready",
        "action_mark_delivering",
        "action_mark_completed",
        "action_verify_vietqr_paid",
        "action_cancel_orders",
    ]

    def get_queryset(self, request):
        return (
            super()
            .get_queryset(request)
            .select_related("customer", "payment", "voucher")
            .prefetch_related("items__options")
        )

    @display(description="Món đặt")
    def items_summary_display(self, obj):
        items = obj.items.all()
        if not items:
            return "-"
        parts = []
        for item in items:
            parts.append(
                format_html(
                    "<div><b>{}</b> x{}</div>", item.product_name, item.quantity
                )
            )
            for o in item.options.all():
                parts.append(
                    format_html(
                        '<div style="color: #64748b; font-size: 0.8125rem; padding-left: 6px;">+ {}</div>',
                        o.option_name,
                    )
                )
            if item.note:
                parts.append(
                    format_html(
                        '<div style="color: #0284c7; font-size: 0.8125rem; padding-left: 6px; font-style: italic;">{}</div>',
                        item.note,
                    )
                )
        if obj.note:
            parts.append(
                format_html(
                    '<div style="color: #b45309; font-size: 0.8125rem; font-style: italic;">{}</div>',
                    obj.note,
                )
            )
        return format_html(
            '<div style="line-height: 1.35; display: flex; flex-direction: column; gap: 4px; text-align: left;">{}</div>',
            mark_safe("".join(str(p) for p in parts)),
        )

    @display(
        description="Trạng thái đơn",
        ordering="status",
        label={
            Order.Status.PENDING_CONFIRMATION: "warning",
            Order.Status.CONFIRMED: "info",
            Order.Status.PREPARING: "info",
            Order.Status.READY: "info",
            Order.Status.DELIVERING: "info",
            Order.Status.COMPLETED: "success",
            Order.Status.CANCELLED: "danger",
        },
    )
    def status_badge(self, obj):
        return obj.status, obj.get_status_display()

    @display(
        description="Thanh toán",
        ordering="payment__status",
        label={
            Payment.Status.UNPAID: "warning",
            Payment.Status.PENDING: "warning",
            Payment.Status.PAID: "success",
            Payment.Status.FAILED: "danger",
            Payment.Status.REFUNDED: "info",
        },
    )
    def payment_badge(self, obj):
        if not hasattr(obj, "payment"):
            return None, "-"
        return obj.payment.status, obj.payment.get_status_display()

    @display(description="Tổng tiền", ordering="total_amount")
    def total_amount_formatted(self, obj):
        return f"{obj.total_amount:,.0f} đ"

    @display(description="Thời gian đặt", ordering="created_at")
    def created_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.created_at)
        return local_time.strftime("%d/%m/%Y %H:%M")

    @action(description="✅ Xác nhận đơn")
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

    @action(description="🍳 Chuyển bếp làm món")
    def action_mark_preparing(self, request, queryset):
        from apps.orders.services import OrderService

        count = 0
        for order in queryset:
            if order.status == Order.Status.CONFIRMED:
                OrderService.update_order_status(
                    order, Order.Status.PREPARING, user=request.user
                )
                count += 1
        self.message_user(request, f"Đã chuyển {count} đơn sang làm món.")

    @action(description="📦 Báo đã làm xong")
    def action_mark_ready(self, request, queryset):
        from apps.orders.services import OrderService

        count = 0
        for order in queryset:
            if order.status == Order.Status.PREPARING:
                OrderService.update_order_status(
                    order, Order.Status.READY, user=request.user
                )
                count += 1
        self.message_user(request, f"Đã chuyển {count} đơn sang sẵn sàng giao.")

    @action(description="🛵 Bàn giao shipper")
    def action_mark_delivering(self, request, queryset):
        from apps.orders.services import OrderService

        count = 0
        for order in queryset:
            if order.status == Order.Status.READY:
                OrderService.update_order_status(
                    order, Order.Status.DELIVERING, user=request.user
                )
                count += 1
        self.message_user(request, f"Đã chuyển {count} đơn sang đang giao.")

    @action(description="🎉 Giao thành công")
    def action_mark_completed(self, request, queryset):
        from apps.orders.services import OrderService

        count = 0
        for order in queryset:
            if order.status == Order.Status.DELIVERING:
                OrderService.update_order_status(
                    order, Order.Status.COMPLETED, user=request.user
                )
                count += 1
        self.message_user(request, f"Đã hoàn tất {count} đơn hàng.")

    @action(description="💳 Xác nhận thanh toán")
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
        self.message_user(request, f"Đã xác nhận thanh toán {count} đơn hàng.")

    @action(description="❌ Hủy đơn hàng")
    def action_cancel_orders(self, request, queryset):
        from apps.orders.services import OrderService

        count = 0
        for order in queryset:
            if order.status in [
                Order.Status.PENDING_CONFIRMATION,
                Order.Status.CONFIRMED,
                Order.Status.PREPARING,
                Order.Status.READY,
            ]:
                OrderService.update_order_status(
                    order,
                    Order.Status.CANCELLED,
                    cancellation_reason="Hủy bởi quản trị viên",
                    user=request.user,
                )
                count += 1
        self.message_user(request, f"Đã hủy {count} đơn hàng.")


@admin.register(OrderItem)
class OrderItemAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_select_related = ["order"]
    list_display = [
        "id",
        "order",
        "product_name",
        "unit_price_display",
        "quantity",
        "subtotal_display",
    ]
    list_display_links = ["id", "product_name"]
    inlines = [OrderItemOptionInline]

    @display(description="Đơn giá", ordering="unit_price")
    def unit_price_display(self, obj):
        return f"{obj.unit_price:,.0f} đ"

    @display(description="Thành tiền", ordering="subtotal")
    def subtotal_display(self, obj):
        return f"{obj.subtotal:,.0f} đ"


@admin.register(OrderItemOption)
class OrderItemOptionAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_select_related = ["order_item__order"]
    list_display = ["id", "order_item", "option_name", "price_display", "quantity"]
    list_display_links = ["id", "option_name"]
    search_fields = ["option_name", "order_item__order__order_code"]
    raw_id_fields = ["order_item"]

    @display(description="Giá", ordering="price")
    def price_display(self, obj):
        return f"+{obj.price:,.0f} đ"


@admin.register(AuditLog)
class AuditLogAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_select_related = ["user"]
    list_display = [
        "id",
        "action",
        "entity_type",
        "entity_id",
        "user",
        "created_at_formatted",
    ]
    list_display_links = ["id", "action"]
    list_filter = ["action", "entity_type", "created_at"]
    search_fields = ["action", "entity_type", "entity_id", "user__username"]
    readonly_fields = [
        "user",
        "action",
        "entity_type",
        "entity_id",
        "old_data",
        "new_data",
        "created_at",
    ]

    @display(description="Thời gian ghi nhận", ordering="created_at")
    def created_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.created_at)
        return local_time.strftime("%d/%m/%Y %H:%M")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
