from django.urls import path

from apps.orders.views import (
    CheckoutPreviewView,
    OrderDetailView,
    OrderListCreateView,
    OrderPaymentDetailView,
)

urlpatterns = [
    path("checkout/preview", CheckoutPreviewView.as_view(), name="checkout-preview"),
    path("orders", OrderListCreateView.as_view(), name="order-list-create"),
    path("orders/<int:pk>", OrderDetailView.as_view(), name="order-detail"),
    path(
        "orders/<int:pk>/payment",
        OrderPaymentDetailView.as_view(),
        name="order-payment-detail",
    ),
]
