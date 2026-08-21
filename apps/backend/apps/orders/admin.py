from django.contrib import admin

from apps.orders.models import AuditLog, Order, OrderItem, OrderItemOption

admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(OrderItemOption)
admin.site.register(AuditLog)
