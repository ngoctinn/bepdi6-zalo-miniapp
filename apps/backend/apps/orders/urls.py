from django.urls import path

from apps.orders.views import (
    AdminOrderCancelView,
    AdminOrderConfirmView,
    AdminOrderListView,
    AdminOrderPaymentVerifyView,
    AdminOrderStatusUpdateView,
    CheckoutPreviewView,
    CustomerOrderCancelView,
    OrderDetailView,
    OrderListCreateView,
    OrderPaymentDetailView,
)

urlpatterns = [
    # Customer APIs
    path("checkout/preview", CheckoutPreviewView.as_view(), name="checkout-preview"),
    path("orders", OrderListCreateView.as_view(), name="order-list-create"),
    path("orders/<int:pk>", OrderDetailView.as_view(), name="order-detail"),
    path(
        "orders/<int:pk>/cancel",
        CustomerOrderCancelView.as_view(),
        name="customer-order-cancel",
    ),
    path(
        "orders/<int:pk>/payment",
        OrderPaymentDetailView.as_view(),
        name="order-payment-detail",
    ),
    # Admin / Staff APIs
    path("admin/orders", AdminOrderListView.as_view(), name="admin-order-list"),
    path(
        "admin/orders/<int:pk>/confirm",
        AdminOrderConfirmView.as_view(),
        name="admin-order-confirm",
    ),
    path(
        "admin/orders/<int:pk>/cancel",
        AdminOrderCancelView.as_view(),
        name="admin-order-cancel",
    ),
    path(
        "admin/orders/<int:pk>/status",
        AdminOrderStatusUpdateView.as_view(),
        name="admin-order-status",
    ),
    path(
        "admin/orders/<int:pk>/payment/verify",
        AdminOrderPaymentVerifyView.as_view(),
        name="admin-order-payment-verify",
    ),
]
