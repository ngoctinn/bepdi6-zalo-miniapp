from django.utils import timezone
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.permissions import IsAuthenticatedCustomer
from apps.customers.views import get_current_customer
from apps.notifications.models import Notification
from apps.notifications.serializers import NotificationSerializer


class NotificationListView(APIView):
    """
    GET /api/v1/notifications
    Returns notification history for customer.
    """

    permission_classes = [IsAuthenticatedCustomer]

    def get(self, request):
        customer = get_current_customer(request)
        if not customer:
            return Response({"success": True, "data": []})
        notifications = Notification.objects.filter(customer=customer).order_by(
            "-created_at"
        )
        serializer = NotificationSerializer(notifications, many=True)
        return Response({"success": True, "data": serializer.data})


class NotificationMarkReadView(APIView):
    """
    POST /api/v1/notifications/{id}/read
    Marks a notification as read.
    """

    permission_classes = [IsAuthenticatedCustomer]

    def post(self, request, pk):
        customer = get_current_customer(request)
        if not customer:
            raise NotFound("Thông báo không tồn tại.") from None
        try:
            notification = Notification.objects.get(pk=pk, customer=customer)
        except Notification.DoesNotExist:
            raise NotFound("Thông báo không tồn tại.") from None

        if not notification.is_read:
            notification.is_read = True
            notification.read_at = timezone.now()
            notification.save(update_fields=["is_read", "read_at"])

        return Response({"success": True})


class ZaloOAuthCallbackView(APIView):
    """
    GET /api/v1/notifications/zalo/oauth/callback?code=...&oa_id=...
    Endpoint receiving authorization code after Admin grants permission on Zalo OAuth portal.
    Exchanges code for access_token and refresh_token, saving to DB & Redis.
    """

    permission_classes = []  # Handled via code verification and state

    def get(self, request):
        code = request.query_params.get("code")
        oa_id = request.query_params.get("oa_id")
        code_verifier = request.query_params.get("code_verifier", "")

        if not code:
            return Response(
                {
                    "success": False,
                    "error": {
                        "code": "MISSING_CODE",
                        "message": "Mã xác thực code là bắt buộc.",
                    },
                },
                status=400,
            )

        from apps.notifications.services import ZaloOATokenService

        try:
            res_data = ZaloOATokenService.exchange_authorization_code(
                code=code,
                code_verifier=code_verifier,
                oa_id=oa_id,
            )
            if res_data.get("error"):
                return Response(
                    {
                        "success": False,
                        "error": {
                            "code": "ZALO_ERROR",
                            "message": res_data.get("message"),
                        },
                    },
                    status=400,
                )
            return Response(
                {
                    "success": True,
                    "data": {
                        "message": "Ủy quyền Zalo OA thành công! Token đã được lưu và kích hoạt tự động làm mới.",
                    },
                }
            )
        except Exception as e:
            return Response(
                {
                    "success": False,
                    "error": {"code": "EXCHANGE_FAILED", "message": str(e)},
                },
                status=500,
            )
