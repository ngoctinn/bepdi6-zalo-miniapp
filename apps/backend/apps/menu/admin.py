from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, StackedInline, TabularInline
from unfold.decorators import display

from apps.menu.models import Category, Option, OptionGroup, Product, ProductPromotion


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_display = [
        "id",
        "name",
        "thumbnail",
        "sort_order",
        "status",
        "created_at_formatted",
    ]
    list_display_links = ["id", "name"]
    list_editable = ["status"]
    list_filter = ["status"]
    search_fields = ["name", "description"]

    @display(description="Ảnh đại diện")
    def thumbnail(self, obj):
        url = obj.effective_image_url
        if url:
            return format_html(
                '<img src="{}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;" />',
                url,
            )
        return "-"

    @display(description="Ngày tạo", ordering="created_at")
    def created_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.created_at)
        return local_time.strftime("%d/%m/%Y %H:%M")


class OptionInline(StackedInline):
    model = Option
    extra = 1
    hide_title = True


class ProductPromotionInline(TabularInline):
    model = ProductPromotion
    extra = 0
    fields = [
        "promotional_price",
        "is_active",
        "valid_from",
        "valid_to",
        "note",
    ]
    readonly_fields = []
    verbose_name = "Giá ưu đãi"
    verbose_name_plural = "Giá ưu đãi (có thời hạn)"


@admin.register(OptionGroup)
class OptionGroupAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_display = [
        "id",
        "product",
        "name",
        "is_required_badge",
        "min_select",
        "max_select",
        "sort_order",
    ]
    list_display_links = ["id", "name"]
    list_select_related = ["product"]
    list_filter = ["is_required", "product"]
    search_fields = ["name"]
    raw_id_fields = ["product"]
    inlines = [OptionInline]

    @display(
        description="Bắt buộc chọn",
        ordering="is_required",
        label={
            True: "success",
            False: "danger",
        },
    )
    def is_required_badge(self, obj):
        return obj.is_required, "Có" if obj.is_required else "Không"


@admin.register(Product)
class ProductAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_display = [
        "id",
        "name",
        "thumbnail",
        "category",
        "price_display",
        "promo_display",
        "status",
        "created_at_formatted",
    ]
    list_display_links = ["id", "name"]
    list_select_related = ["category"]
    list_editable = ["status"]
    list_filter = ["category", "status"]
    search_fields = ["name", "description"]
    raw_id_fields = ["category"]
    inlines = [ProductPromotionInline]

    @display(description="Ảnh món")
    def thumbnail(self, obj):
        url = obj.effective_image_url
        if url:
            return format_html(
                '<img src="{}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;" />',
                url,
            )
        return "-"

    @display(description="Giá niêm yết", ordering="price")
    def price_display(self, obj):
        return f"{obj.price:,.0f} đ"

    @display(description="Giá ưu đãi")
    def promo_display(self, obj):
        promo = obj.active_promotion
        if not promo:
            return "-"
        pct = obj.discount_percent or 0
        return format_html(
            '<span style="color:#DC2626;font-weight:bold;">{:,.0f} đ</span>'
            ' <span style="background:#FEF2F2;color:#DC2626;padding:1px 6px;border-radius:4px;font-size:11px;">-{}%</span>',
            promo.promotional_price,
            pct,
        )

    @display(description="Ngày tạo", ordering="created_at")
    def created_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.created_at)
        return local_time.strftime("%d/%m/%Y %H:%M")

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        from apps.menu.views import invalidate_menu_cache

        invalidate_menu_cache(obj.id)

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        from apps.menu.views import invalidate_menu_cache

        invalidate_menu_cache(obj.id)


@admin.register(Option)
class OptionAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_display = [
        "id",
        "name",
        "option_group",
        "price_display",
        "status",
        "sort_order",
    ]
    list_display_links = ["id", "name"]
    list_select_related = ["option_group"]
    list_editable = ["status"]
    list_filter = ["status", "option_group"]
    search_fields = ["name"]
    raw_id_fields = ["option_group"]

    @display(description="Giá cộng thêm", ordering="price")
    def price_display(self, obj):
        return f"+{obj.price:,.0f} đ"


@admin.register(ProductPromotion)
class ProductPromotionAdmin(ModelAdmin):
    show_full_result_count = False
    list_per_page = 25
    list_display = [
        "id",
        "product",
        "promo_price_display",
        "discount_pct_display",
        "is_active",
        "valid_from",
        "valid_to",
        "note",
    ]
    list_display_links = ["id", "product"]
    list_select_related = ["product"]
    list_editable = ["is_active"]
    list_filter = ["is_active", "product"]
    search_fields = ["product__name", "note"]
    raw_id_fields = ["product"]
    date_hierarchy = "valid_from"

    @display(description="Giá ưu đãi", ordering="promotional_price")
    def promo_price_display(self, obj):
        return format_html(
            '<span style="color:#DC2626;font-weight:bold;">{:,.0f} đ</span>',
            obj.promotional_price,
        )

    @display(description="% Giảm")
    def discount_pct_display(self, obj):
        pct = obj.product.discount_percent
        if pct is not None:
            return format_html(
                '<span style="background:#FEF2F2;color:#DC2626;padding:2px 8px;border-radius:4px;font-weight:bold;">-{}%</span>',
                pct,
            )
        return "-"

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        from apps.menu.views import invalidate_menu_cache

        invalidate_menu_cache(obj.product_id)

    def delete_model(self, request, obj):
        super().delete_model(request, obj)
        from apps.menu.views import invalidate_menu_cache

        invalidate_menu_cache(obj.product_id)
