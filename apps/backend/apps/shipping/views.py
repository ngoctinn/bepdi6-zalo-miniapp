from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.permissions import IsAdminOnlyUser, IsStaffOrAdminUser
from apps.orders.models import AuditLog
from apps.shipping.models import ShopConfig
from apps.shipping.serializers import (
    AdminShopConfigSerializer,
    PublicShopInfoSerializer,
)


class PublicShopInfoView(APIView):
    """
    GET /api/v1/shop/info
    Public API for Mini App customers to view shop details, operational status, hotline, and VietQR info.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        config = ShopConfig.get_solo()
        serializer = PublicShopInfoSerializer(config)
        return Response(serializer.data)


class AdminShopConfigView(APIView):
    """
    GET /api/v1/admin/shop/config (Staff/Admin - View configuration)
    PATCH / PUT /api/v1/admin/shop/config (Admin only - Update configuration, records AuditLog)
    """

    def get_permissions(self):
        if self.request.method in ["PATCH", "PUT"]:
            return [IsAdminOnlyUser()]
        return [IsStaffOrAdminUser()]

    def get(self, request):
        config = ShopConfig.get_solo()
        serializer = AdminShopConfigSerializer(config)
        return Response(serializer.data)

    def patch(self, request):
        return self._update_config(request, partial=True)

    def put(self, request):
        return self._update_config(request, partial=False)

    def _update_config(self, request, partial: bool):
        config = ShopConfig.get_solo()
        old_data = AdminShopConfigSerializer(config).data

        serializer = AdminShopConfigSerializer(
            config, data=request.data, partial=partial
        )
        serializer.is_valid(raise_exception=True)
        updated_config = serializer.save()

        new_data = AdminShopConfigSerializer(updated_config).data

        # Record AuditLog (BR-SHOP-005)
        AuditLog.objects.create(
            user=request.user if request.user.is_authenticated else None,
            action="UPDATE_SHOP_CONFIG",
            entity_type="SHOP_CONFIG",
            entity_id=updated_config.id,
            old_data=old_data,
            new_data=new_data,
        )

        return Response(serializer.data, status=status.HTTP_200_OK)
