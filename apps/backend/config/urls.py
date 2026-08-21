"""URL configuration for Bep Di 6 backend."""

from django.contrib import admin
from django.urls import path

urlpatterns = [
    path("admin/", admin.site.urls),
    # API endpoints
    # path("api/v1/customers/", include("apps.customers.urls")),
    # path("api/v1/menu/", include("apps.menu.urls")),
    # path("api/v1/orders/", include("apps.orders.urls")),
    # path("api/v1/shipping/", include("apps.shipping.urls")),
    # path("api/v1/vouchers/", include("apps.vouchers.urls")),
    # path("api/v1/payments/", include("apps.payments.urls")),
    # path("api/v1/notifications/", include("apps.notifications.urls")),
]
