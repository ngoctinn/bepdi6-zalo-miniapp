from django.contrib import admin
from unfold.admin import ModelAdmin, TabularInline
from unfold.decorators import display

from apps.vouchers.models import Voucher, VoucherUsage


class VoucherUsageInline(TabularInline):
    model = VoucherUsage
    extra = 0
    hide_title = True
    readonly_fields = ["customer", "order", "discount_amount", "status", "used_at"]
    can_delete = False


@admin.register(Voucher)
class VoucherAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_display = [
        "code",
        "name",
        "discount_type",
        "discount_display",
        "minimum_order_value_display",
        "usage_status",
        "status_badge",
        "start_at_formatted",
        "end_at_formatted",
    ]
    list_display_links = ["code", "name"]
    list_filter = ["status", "discount_type", "start_at", "end_at"]
    search_fields = ["code", "name"]
    inlines = [VoucherUsageInline]

    def get_queryset(self, request):
        from django.db.models import Count, Q

        qs = super().get_queryset(request)
        return qs.annotate(
            _applied_count=Count(
                "usages", filter=Q(usages__status=VoucherUsage.Status.APPLIED)
            )
        )

    @display(description="Mức giảm", ordering="discount_value")
    def discount_display(self, obj):
        if obj.discount_type == Voucher.DiscountType.FIXED:
            return f"{obj.discount_value:,.0f} đ"
        max_cap = (
            f" (tối đa {obj.maximum_discount:,.0f} đ)" if obj.maximum_discount else ""
        )
        return f"{obj.discount_value:.0f}%{max_cap}"

    @display(description="Đơn tối thiểu", ordering="minimum_order_value")
    def minimum_order_value_display(self, obj):
        return f"{obj.minimum_order_value:,.0f} đ"

    @display(description="Lượt dùng", ordering="_applied_count")
    def usage_status(self, obj):
        if hasattr(obj, "_applied_count"):
            applied_count = obj._applied_count
        else:
            applied_count = obj.usages.filter(
                status=VoucherUsage.Status.APPLIED
            ).count()
        limit_str = str(obj.usage_limit) if obj.usage_limit > 0 else "∞"
        return f"{applied_count} / {limit_str}"

    @display(
        description="Trạng thái",
        ordering="status",
        label={
            Voucher.Status.ACTIVE: "success",
            Voucher.Status.INACTIVE: "danger",
        },
    )
    def status_badge(self, obj):
        return obj.status, obj.get_status_display()

    @display(description="Bắt đầu", ordering="start_at")
    def start_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.start_at)
        return local_time.strftime("%d/%m/%Y %H:%M")

    @display(description="Kết thúc", ordering="end_at")
    def end_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.end_at)
        return local_time.strftime("%d/%m/%Y %H:%M")


@admin.register(VoucherUsage)
class VoucherUsageAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_select_related = ["voucher", "customer", "order"]
    list_display = [
        "id",
        "voucher",
        "customer",
        "order",
        "discount_amount_display",
        "status_badge",
        "used_at_formatted",
    ]
    list_display_links = ["id", "voucher"]
    list_filter = ["status", "used_at"]
    search_fields = [
        "voucher__code",
        "customer__name",
        "customer__phone",
        "order__order_code",
    ]
    raw_id_fields = ["voucher", "customer", "order"]

    @display(description="Số tiền giảm", ordering="discount_amount")
    def discount_amount_display(self, obj):
        return f"{obj.discount_amount:,.0f} đ"

    @display(
        description="Trạng thái",
        ordering="status",
        label={
            VoucherUsage.Status.APPLIED: "success",
            VoucherUsage.Status.RELEASED: "info",
        },
    )
    def status_badge(self, obj):
        return obj.status, obj.get_status_display()

    @display(description="Thời gian dùng", ordering="used_at")
    def used_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.used_at)
        return local_time.strftime("%d/%m/%Y %H:%M")
