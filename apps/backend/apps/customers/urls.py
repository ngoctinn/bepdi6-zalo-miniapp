from django.urls import path

from apps.customers.views import (
    AddressDetailView,
    AddressListCreateView,
    CustomerMeView,
    ZaloAuthView,
)

urlpatterns = [
    path("auth/zalo", ZaloAuthView.as_view(), name="auth-zalo"),
    path("customers/me", CustomerMeView.as_view(), name="customer-me"),
    path(
        "customers/me/addresses",
        AddressListCreateView.as_view(),
        name="customer-address-list-create",
    ),
    path(
        "customers/me/addresses/<int:pk>",
        AddressDetailView.as_view(),
        name="customer-address-detail",
    ),
]
