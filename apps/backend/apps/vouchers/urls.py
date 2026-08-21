from django.urls import path

from apps.vouchers.views import (
    AdminVoucherDetailView,
    AdminVoucherListCreateView,
    VoucherValidateView,
)

urlpatterns = [
    path("vouchers/validate", VoucherValidateView.as_view(), name="voucher-validate"),
    path(
        "admin/vouchers",
        AdminVoucherListCreateView.as_view(),
        name="admin-voucher-list-create",
    ),
    path(
        "admin/vouchers/<int:pk>",
        AdminVoucherDetailView.as_view(),
        name="admin-voucher-detail",
    ),
]
