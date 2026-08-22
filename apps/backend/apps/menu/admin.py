from django.contrib import admin
from django.utils.html import format_html
from unfold.admin import ModelAdmin, StackedInline
from unfold.decorators import display

from apps.menu.models import Category, Option, OptionGroup, Product


@admin.register(Category)
class CategoryAdmin(ModelAdmin):
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


@admin.register(OptionGroup)
class OptionGroupAdmin(ModelAdmin):
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
    list_filter = ["is_required", "product"]
    search_fields = ["name"]
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
    list_display = [
        "id",
        "name",
        "thumbnail",
        "category",
        "price_display",
        "status",
        "created_at_formatted",
    ]
    list_display_links = ["id", "name"]
    list_editable = ["status"]
    list_filter = ["category", "status"]
    search_fields = ["name", "description"]

    @display(description="Ảnh món")
    def thumbnail(self, obj):
        url = obj.effective_image_url
        if url:
            return format_html(
                '<img src="{}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 6px;" />',
                url,
            )
        return "-"

    @display(description="Giá bán", ordering="price")
    def price_display(self, obj):
        return f"{obj.price:,.0f} đ"

    @display(description="Ngày tạo", ordering="created_at")
    def created_at_formatted(self, obj):
        from django.utils import timezone

        local_time = timezone.localtime(obj.created_at)
        return local_time.strftime("%d/%m/%Y %H:%M")


@admin.register(Option)
class OptionAdmin(ModelAdmin):
    list_display = [
        "id",
        "name",
        "option_group",
        "price_display",
        "status",
        "sort_order",
    ]
    list_display_links = ["id", "name"]
    list_editable = ["status"]
    list_filter = ["status", "option_group"]
    search_fields = ["name"]

    @display(description="Giá cộng thêm", ordering="price")
    def price_display(self, obj):
        return f"+{obj.price:,.0f} đ"
