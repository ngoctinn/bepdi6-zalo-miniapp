from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse(
        {
            "success": True,
            "data": {
                "status": "ok",
                "app": "bepdi6-backend",
            },
        }
    )


def custom_404_handler(request, exception=None):
    return JsonResponse(
        {
            "success": False,
            "error": {
                "code": "NOT_FOUND",
                "message": "Đường dẫn không tồn tại.",
            },
        },
        status=404,
    )


def custom_500_handler(request):
    return JsonResponse(
        {
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Đã xảy ra lỗi máy chủ nội bộ.",
            },
        },
        status=500,
    )


handler404 = "config.urls.custom_404_handler"
handler500 = "config.urls.custom_500_handler"

urlpatterns = [
    path("healthz", health_check, name="healthz-no-slash"),
    path("healthz/", health_check, name="healthz"),
    path("health/", health_check, name="health-check"),
    path("api/health/", health_check, name="api-health-check"),
    path("admin/", admin.site.urls),
    # API endpoints
    path("api/v1/", include("apps.customers.urls")),
    path("api/v1/", include("apps.menu.urls")),
    path("api/v1/", include("apps.orders.urls")),
    path("api/v1/", include("apps.shipping.urls")),
    path("api/v1/", include("apps.vouchers.urls")),
    path("api/v1/", include("apps.notifications.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
