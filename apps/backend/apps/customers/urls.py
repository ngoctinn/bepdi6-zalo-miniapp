from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.customers.views import (
    AddressDetailView,
    AddressListCreateView,
    AdminCustomerListView,
    AdminStaffInviteView,
    AdminStaffManageView,
    CustomerMeView,
    CustomerPhoneUpdateView,
    CustomerReverseGeocodeView,
    LocationSearchView,
    StaffInviteAcceptView,
    ZaloAuthView,
    ZaloLocationDecodeView,
)

urlpatterns = [
    path(
        "admin/customers", AdminCustomerListView.as_view(), name="admin-customer-list"
    ),
    path(
        "admin/staff/invites/",
        AdminStaffInviteView.as_view(),
        name="admin-staff-invite-create",
    ),
    path(
        "admin/staff/",
        AdminStaffManageView.as_view(),
        name="admin-staff-list",
    ),
    path(
        "admin/staff/<int:staff_id>/",
        AdminStaffManageView.as_view(),
        name="admin-staff-detail",
    ),
    path(
        "staff/accept-invite/",
        StaffInviteAcceptView.as_view(),
        name="staff-accept-invite",
    ),
    path("auth/zalo", ZaloAuthView.as_view(), name="auth-zalo"),
    path("auth/token/refresh", TokenRefreshView.as_view(), name="token-refresh"),
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
