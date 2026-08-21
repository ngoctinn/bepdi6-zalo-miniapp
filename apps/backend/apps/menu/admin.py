from django.contrib import admin
from django.utils.html import format_html

from apps.menu.models import Category, Option, OptionGroup, Product


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "thumbnail", "sort_order", "status", "created_at"]
    list_filter = ["status"]
    search_fields = ["name", "description"]

    @admin.display(description="Ảnh đại diện")
    def thumbnail(self, obj):
        url = obj.effective_image_url
        if url:
            return format_html(
                '<img src="{}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;" />',
                url,
            )
        return "-"


class OptionInline(admin.TabularInline):
    model = Option
    extra = 1


@admin.register(OptionGroup)
class OptionGroupAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "product",
        "name",
        "is_required",
        "min_select",
        "max_select",
        "sort_order",
    ]
    list_filter = ["is_required", "product"]
    search_fields = ["name"]
    inlines = [OptionInline]


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        "id",
        "name",
        "thumbnail",
        "category",
        "price",
        "status",
        "created_at",
    ]
    list_filter = ["category", "status"]
    search_fields = ["name", "description"]
    list_editable = ["status"]

    @admin.display(description="Ảnh món")
    def thumbnail(self, obj):
        url = obj.effective_image_url
        if url:
            return format_html(
                '<img src="{}" style="width: 45px; height: 45px; object-fit: cover; border-radius: 6px;" />',
                url,
            )
        return "-"


@admin.register(Option)
class OptionAdmin(admin.ModelAdmin):
    list_display = ["id", "name", "option_group", "price", "status", "sort_order"]
    list_filter = ["status", "option_group"]
    search_fields = ["name"]
