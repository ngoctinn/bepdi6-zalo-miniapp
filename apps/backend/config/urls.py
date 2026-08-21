"""URL configuration for Bep Di 6 backend."""

from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    # API endpoints
    path("api/v1/", include("apps.customers.urls")),
    path("api/v1/", include("apps.menu.urls")),
    path("api/v1/", include("apps.orders.urls")),
    # path("api/v1/shipping/", include("apps.shipping.urls")),
    path("api/v1/", include("apps.vouchers.urls")),
    # path("api/v1/payments/", include("apps.payments.urls")),
    path("api/v1/", include("apps.notifications.urls")),
]
