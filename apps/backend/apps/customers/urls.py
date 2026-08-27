from django.urls import path

from apps.customers.views import (
    AddressDetailView,
    AddressListCreateView,
    CustomerMeView,
    CustomerPhoneUpdateView,
    ZaloAuthView,
    ZaloLocationDecodeView,
)

urlpatterns = [
    path("auth/zalo", ZaloAuthView.as_view(), name="auth-zalo"),
    path(
        "customers/location/decode",
        ZaloLocationDecodeView.as_view(),
        name="customer-location-decode",
    ),
    path("customers/me", CustomerMeView.as_view(), name="customer-me"),
    path(
        "customers/me/phone",
        CustomerPhoneUpdateView.as_view(),
        name="customer-phone-update",
    ),
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
