from django.urls import path

from apps.shipping.views import (
    AdminShopConfigView,
    PublicShopInfoView,
)

urlpatterns = [
    # Customer APIs
    path("shop/info", PublicShopInfoView.as_view(), name="shop-info"),
    # Admin APIs
    path("admin/shop/config", AdminShopConfigView.as_view(), name="admin-shop-config"),
]
