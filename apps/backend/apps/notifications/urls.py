from django.urls import path

from apps.notifications.views import (
    NotificationListView,
    NotificationMarkReadView,
    ZaloOAuthCallbackView,
)

urlpatterns = [
    path("notifications", NotificationListView.as_view(), name="notification-list"),
    path(
        "notifications/<int:pk>/read",
        NotificationMarkReadView.as_view(),
        name="notification-mark-read",
    ),
    path(
        "notifications/zalo/oauth/callback",
        ZaloOAuthCallbackView.as_view(),
        name="zalo-oauth-callback",
    ),
]
