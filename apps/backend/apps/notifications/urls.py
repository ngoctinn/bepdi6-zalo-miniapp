from django.urls import path

from apps.notifications.views import NotificationListView, NotificationMarkReadView

urlpatterns = [
    path("notifications", NotificationListView.as_view(), name="notification-list"),
    path(
        "notifications/<int:pk>/read",
        NotificationMarkReadView.as_view(),
        name="notification-mark-read",
    ),
]
