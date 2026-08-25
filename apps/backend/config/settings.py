"""Django settings for Bep Di 6 project."""

import os
import sys
from datetime import timedelta
from pathlib import Path

import environ
from corsheaders.defaults import default_headers
from django.templatetags.static import static

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent
ROOT_DIR = BASE_DIR.parent.parent

env = environ.Env(
    DEBUG=(bool, False),
    SECRET_KEY=(str, "django-insecure-default-change-me"),
    ALLOWED_HOSTS=(list, ["localhost", "127.0.0.1"]),
    DATABASE_URL=(str, "postgres://postgres:postgres@localhost:5432/bepdi6_db"),
    REDIS_URL=(str, "redis://localhost:6379/0"),
    CELERY_BROKER_URL=(str, "redis://localhost:6379/1"),
    ZALO_APP_ID=(str, ""),
    ZALO_APP_SECRET=(str, ""),
    ZALO_OA_ID=(str, ""),
    ZALO_OA_SECRET=(str, ""),
    ZALO_OA_ACCESS_TOKEN=(str, ""),
    ENABLE_ZNS_NOTIFICATION=(bool, False),
    SHOP_LATITUDE=(float, 10.7769),
    SHOP_LONGITUDE=(float, 106.7009),
    MAX_DELIVERY_RADIUS_KM=(float, 7.0),
    HAVERSINE_MULTIPLIER=(float, 1.3),
    VIETQR_BANK_ID=(str, "MB"),
    VIETQR_ACCOUNT_NO=(str, ""),
    VIETQR_ACCOUNT_NAME=(str, "BEP DI 6"),
)

# Read .env file if it exists in ROOT_DIR or BASE_DIR
environ.Env.read_env(ROOT_DIR / ".env")

SECRET_KEY = env("SECRET_KEY")
DEBUG = env("DEBUG")
ALLOWED_HOSTS = env("ALLOWED_HOSTS")

# Application definition
DJANGO_APPS = [
    "unfold",  # Must be before django.contrib.admin
    "unfold.contrib.filters",
    "unfold.contrib.forms",
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
]

LOCAL_APPS = [
    "apps.customers.apps.CustomersConfig",
    "apps.menu.apps.MenuConfig",
    "apps.orders.apps.OrdersConfig",
    "apps.shipping.apps.ShippingConfig",
    "apps.vouchers.apps.VouchersConfig",
    "apps.payments.apps.PaymentsConfig",
    "apps.notifications.apps.NotificationsConfig",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# Database
DATABASES = {
    "default": env.db(
        "DATABASE_URL", default="postgres://postgres:postgres@localhost:5432/bepdi6_db"
    )
}
if "pytest" in sys.modules or os.environ.get("USE_SQLITE_TEST", "").lower() in (
    "true",
    "1",
):
    DATABASES["default"] = {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": ":memory:",
    }

# Cache (Redis)
CACHES = {
    "default": {
        "BACKEND": "django_redis.cache.RedisCache"
        if False
        else "django.core.cache.backends.redis.RedisCache",
        "LOCATION": env("REDIS_URL"),
    }
}

# Custom User Model
AUTH_USER_MODEL = "customers.User"

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

# Internationalization
LANGUAGE_CODE = "vi"
TIME_ZONE = "Asia/Ho_Chi_Minh"
USE_I18N = True
USE_TZ = True

# Date/Time format configurations for Admin UI
DATETIME_FORMAT = "d/m/Y H:i"
DATE_FORMAT = "d/m/Y"
SHORT_DATETIME_FORMAT = "d/m/Y H:i"
SHORT_DATE_FORMAT = "d/m/Y"

# Static files (CSS, JavaScript, Images)
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [
    BASE_DIR / "static",
]

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

# Cloudflare R2 / AWS S3 Storage configuration
USE_S3_STORAGE = env.bool("USE_S3_STORAGE", default=False)
if USE_S3_STORAGE:
    AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default="")
    AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default="")
    AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", default="")
    AWS_S3_ENDPOINT_URL = env(
        "AWS_S3_ENDPOINT_URL", default=""
    )  # Cloudflare R2 endpoint
    AWS_S3_CUSTOM_DOMAIN = env("AWS_S3_CUSTOM_DOMAIN", default="")  # CDN domain
    AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}
    AWS_DEFAULT_ACL = None
    AWS_QUERYSTRING_AUTH = False

    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3boto3.S3Boto3Storage",
        },
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
        },
    }

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# CORS settings
CORS_ALLOW_ALL_ORIGINS = True
CORS_ALLOW_HEADERS = list(default_headers) + [
    "idempotency-key",
    "x-requested-with",
]

# Django REST Framework
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_RENDERER_CLASSES": (
        "config.renderers.EnvelopeJSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ),
    "EXCEPTION_HANDLER": "config.exceptions.custom_exception_handler",
}

# Simple JWT settings
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=7),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

# Celery Configuration
CELERY_BROKER_URL = env("CELERY_BROKER_URL")
CELERY_RESULT_BACKEND = env("REDIS_URL")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE

# Business & Shop Configs
SHOP_LATITUDE = env("SHOP_LATITUDE")
SHOP_LONGITUDE = env("SHOP_LONGITUDE")
MAX_DELIVERY_RADIUS_KM = env("MAX_DELIVERY_RADIUS_KM")
HAVERSINE_MULTIPLIER = env("HAVERSINE_MULTIPLIER")
ENABLE_ZNS_NOTIFICATION = env("ENABLE_ZNS_NOTIFICATION")
ZALO_APP_ID = env("ZALO_APP_ID")
ZALO_APP_SECRET = env("ZALO_APP_SECRET")
ZALO_OA_ID = env("ZALO_OA_ID")
ZALO_OA_SECRET = env("ZALO_OA_SECRET")
ZALO_OA_ACCESS_TOKEN = env("ZALO_OA_ACCESS_TOKEN")
VIETQR_BANK_ID = env("VIETQR_BANK_ID")
VIETQR_ACCOUNT_NO = env("VIETQR_ACCOUNT_NO")
VIETQR_ACCOUNT_NAME = env("VIETQR_ACCOUNT_NAME")

# Django Unfold Theme Configuration
UNFOLD = {
    "SITE_TITLE": "Bếp Dì 6 - Quản Trị",
    "SITE_HEADER": "Bếp Dì 6 Admin",
    "SITE_SUBHEADER": "Hệ thống quản lý đặt món",
    "SITE_SYMBOL": "restaurant",
    "SHOW_HISTORY": True,
    "SHOW_VIEW_ON_SITE": False,
    "STYLES": [
        lambda request: static("admin/css/admin_custom.css"),
    ],
    "COLORS": {
        "primary": {
            "50": "254 242 242",
            "100": "254 226 226",
            "200": "254 202 202",
            "300": "252 165 165",
            "400": "248 113 113",
            "500": "239 68 68",
            "600": "220 38 38",
            "700": "185 28 28",
            "800": "153 27 27",
            "900": "127 29 29",
            "950": "69 10 10",
        },
    },
    "SIDEBAR": {
        "show_search": True,
        "show_all_applications": False,
        "navigation": [
            {
                "title": "Vận Hành Đơn Hàng",
                "separator": True,
                "items": [
                    {
                        "title": "Đơn hàng",
                        "icon": "receipt_long",
                        "link": lambda request: "/admin/orders/order/",
                    },
                    {
                        "title": "Giao dịch thanh toán",
                        "icon": "payments",
                        "link": lambda request: "/admin/payments/payment/",
                    },
                    {
                        "title": "Lịch sử giao dịch",
                        "icon": "history",
                        "link": lambda request: "/admin/orders/auditlog/",
                    },
                ],
            },
            {
                "title": "Quản Lý Thực Đơn",
                "separator": True,
                "items": [
                    {
                        "title": "Danh mục món",
                        "icon": "category",
                        "link": lambda request: "/admin/menu/category/",
                    },
                    {
                        "title": "Món ăn",
                        "icon": "restaurant",
                        "link": lambda request: "/admin/menu/product/",
                    },
                    {
                        "title": "Nhóm tùy chọn",
                        "icon": "tune",
                        "link": lambda request: "/admin/menu/optiongroup/",
                    },
                    {
                        "title": "Tùy chọn món",
                        "icon": "checklist",
                        "link": lambda request: "/admin/menu/option/",
                    },
                ],
            },
            {
                "title": "Khách Hàng & Khuyến Mãi",
                "separator": True,
                "items": [
                    {
                        "title": "Khách hàng Zalo",
                        "icon": "people",
                        "link": lambda request: "/admin/customers/customer/",
                    },
                    {
                        "title": "Địa chỉ giao hàng",
                        "icon": "location_on",
                        "link": lambda request: "/admin/customers/address/",
                    },
                    {
                        "title": "Mã giảm giá",
                        "icon": "loyalty",
                        "link": lambda request: "/admin/vouchers/voucher/",
                    },
                    {
                        "title": "Lịch sử dùng mã",
                        "icon": "history_edu",
                        "link": lambda request: "/admin/vouchers/voucherusage/",
                    },
                ],
            },
            {
                "title": "Hệ Thống và Cài Đặt",
                "separator": True,
                "items": [
                    {
                        "title": "Cấu hình quán",
                        "icon": "storefront",
                        "link": lambda request: "/admin/shipping/shopconfig/",
                    },
                    {
                        "title": "Tài khoản nhân viên",
                        "icon": "badge",
                        "link": lambda request: "/admin/customers/user/",
                    },
                    {
                        "title": "Thông báo hệ thống",
                        "icon": "notifications",
                        "link": lambda request: "/admin/notifications/notification/",
                    },
                ],
            },
        ],
    },
}
