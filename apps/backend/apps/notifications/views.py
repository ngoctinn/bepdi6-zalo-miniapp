from django.utils import timezone
from rest_framework import permissions
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer
from apps.orders.views import get_current_customer


class NotificationListView(APIView):
    """
    GET /api/v1/notifications
    Returns notification history for customer.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        customer = get_current_customer(request)
        notifications = Notification.objects.filter(customer=customer).order_by(
            "-created_at"
        )
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data)


class NotificationMarkReadView(APIView):
    """
    POST /api/v1/notifications/{id}/read
    Marks a notification as read.
    """

    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        customer = get_current_customer(request)
        try:
            notification = Notification.objects.get(pk=pk, customer=customer)
        except Notification.DoesNotExist:
            raise NotFound("Thông báo không tồn tại.") from None

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])

        return Response({"success": True})
