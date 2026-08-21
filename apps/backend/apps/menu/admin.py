from django.contrib import admin
from apps.menu.models import Category, Product, OptionGroup, Option

admin.site.register(Category)
admin.site.register(Product)
admin.site.register(OptionGroup)
admin.site.register(Option)
