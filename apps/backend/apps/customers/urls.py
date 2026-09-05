from django.urls import path

from apps.customers.views import (
    AddressDetailView,
    AddressListCreateView,
    CustomerMeView,
    CustomerPhoneUpdateView,
    CustomerReverseGeocodeView,
    LocationSearchView,
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
    path(
        "customers/location/reverse-geocode",
        CustomerReverseGeocodeView.as_view(),
        name="customer-location-reverse-geocode",
    ),
    path(
        "customers/location/search",
        LocationSearchView.as_view(),
        name="customer-location-search",
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
