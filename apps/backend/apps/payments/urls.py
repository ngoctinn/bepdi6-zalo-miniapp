from django.urls import path

from apps.payments.views import PaymentWebhookView

urlpatterns = [
    path(
        "payments/webhook/sepay/",
        PaymentWebhookView.as_view(),
        name="payment-webhook-sepay",
    ),
    path(
        "payments/webhook/casso/",
        PaymentWebhookView.as_view(),
        name="payment-webhook-casso",
    ),
    path(
        "payments/webhook/",
        PaymentWebhookView.as_view(),
        name="payment-webhook-universal",
    ),
]
