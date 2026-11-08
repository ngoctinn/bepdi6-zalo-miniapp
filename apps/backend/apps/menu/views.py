import logging
import uuid

from django.core.cache import cache
from django.core.files.storage import default_storage
from django.db import transaction
from django.db.models import Exists, OuterRef, Prefetch, Q, Subquery
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.exceptions import NotFound, ValidationError
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.permissions import IsStaffOrAdminUser
from apps.menu.models import Category, Option, OptionGroup, Product, ProductPromotion
from apps.menu.serializers import (
    MAX_IMAGE_SIZE_BYTES,
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)
from apps.menu.utils import optimize_image_to_webp

MENU_CACHE_TIMEOUT = 600  # 10 minutes
MENU_CACHE_VERSION_KEY = "menu_cache_version"

logger = logging.getLogger(__name__)
CACHE_KEY_CATEGORIES = "menu:categories:list"
CACHE_KEY_PRODUCTS_PREFIX = "menu:products:list"
CACHE_KEY_PRODUCT_DETAIL_PREFIX = "menu:product:detail"


def get_menu_cache_version() -> int:
    """
    Get current menu cache version.
    Initializes to 1 if not set or expired.
    """
    try:
        version = cache.get(MENU_CACHE_VERSION_KEY)
        if version is None:
            cache.set(MENU_CACHE_VERSION_KEY, 1, timeout=None)
            return 1
        return int(version)
    except Exception:
        return 1


def active_promotion_queryset():
    now = timezone.now()
    return (
        ProductPromotion.objects.filter(
            product=OuterRef("pk"),
            is_active=True,
        )
        .filter(Q(valid_from__isnull=True) | Q(valid_from__lte=now))
        .filter(Q(valid_to__isnull=True) | Q(valid_to__gte=now))
        .order_by("-created_at")
    )


def with_active_promotion(queryset):
    active_promotions = active_promotion_queryset()
    return queryset.annotate(
        active_promotion_price=Subquery(
            active_promotions.values("promotional_price")[:1]
        ),
        has_active_promotion=Exists(active_promotions),
    )


def invalidate_menu_cache(product_id: int | None = None) -> None:
    """
    Invalidates menu-related caches using Cache Key Versioning.
    Incrementing menu_cache_version provides instant O(1) non-blocking invalidation
    across all categories, product lists, and product detail caches without Redis keys() scan.
    """
    try:
        try:
            cache.incr(MENU_CACHE_VERSION_KEY)
        except (ValueError, TypeError):
            current = cache.get(MENU_CACHE_VERSION_KEY) or 1
            cache.set(MENU_CACHE_VERSION_KEY, int(current) + 1, timeout=None)
    except Exception:
        logger.exception(
            "Không thể tăng menu cache version key: %s", MENU_CACHE_VERSION_KEY
        )


class CategoryListView(APIView):
    """
    GET /api/v1/categories
    Returns list of ACTIVE categories ordered by sort_order.
    Cached for fast response.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        version = get_menu_cache_version()
        cache_key = f"menu_v{version}:categories:list"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        categories = Category.objects.filter(status=Category.Status.ACTIVE).order_by(
            "sort_order", "id"
        )
        serializer = CategorySerializer(categories, many=True)
        data = serializer.data
        cache.set(cache_key, data, timeout=MENU_CACHE_TIMEOUT)
        return Response(data)


class ProductListView(APIView):
    """
    GET /api/v1/products
    Query params:
    - category_id: filter by category
    - status: filter by product status (defaults to AVAILABLE + OUT_OF_STOCK)
    - search: search by product name
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        category_id = request.query_params.get("category_id")
        status_param = request.query_params.get("status")
        search_query = request.query_params.get("search")

        # Cache standard default query (no search param)
        cache_key = None
        if not search_query:
            version = get_menu_cache_version()
            cache_key = f"menu_v{version}:products:list:{category_id or 'all'}:{status_param or 'available'}"
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)

        active_options_prefetch = Prefetch(
            "options",
            queryset=Option.objects.filter(status=Option.Status.AVAILABLE).order_by(
                "sort_order", "id"
            ),
        )
        active_groups_prefetch = Prefetch(
            "option_groups",
            queryset=OptionGroup.objects.prefetch_related(
                active_options_prefetch
            ).order_by("sort_order", "id"),
        )

        queryset = (
            with_active_promotion(Product.objects.select_related("category"))
            .prefetch_related(active_groups_prefetch)
            .order_by("category__sort_order", "id")
        )

        if category_id:
            try:
                queryset = queryset.filter(category_id=int(category_id))
            except ValueError:
                pass

        if status_param:
            queryset = queryset.filter(status=status_param)
        else:
            queryset = queryset.filter(status=Product.Status.AVAILABLE)

        if search_query:
            queryset = queryset.filter(name__icontains=search_query.strip())

        serializer = ProductListSerializer(queryset, many=True)
        data = serializer.data

        if cache_key:
            cache.set(cache_key, data, timeout=MENU_CACHE_TIMEOUT)

        return Response(data)


class ProductDetailView(APIView):
    """
    GET /api/v1/products/{id}
    Returns detailed product info with nested OptionGroups and AVAILABLE Options.
    Cached for instant response.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        version = get_menu_cache_version()
        cache_key = f"menu_v{version}:product:detail:{pk}"
        cached_data = cache.get(cache_key)
        if cached_data is not None:
            return Response(cached_data)

        try:
            active_options_prefetch = Prefetch(
                "options",
                queryset=Option.objects.filter(status=Option.Status.AVAILABLE).order_by(
                    "sort_order", "id"
                ),
            )
            active_groups_prefetch = Prefetch(
                "option_groups",
                queryset=OptionGroup.objects.prefetch_related(
                    active_options_prefetch
                ).order_by("sort_order", "id"),
            )

            product = (
                with_active_promotion(Product.objects.select_related("category"))
                .prefetch_related(active_groups_prefetch)
                .get(pk=pk)
            )
        except Product.DoesNotExist:
            raise NotFound(f"Món ăn #{pk} không tồn tại.") from None

        serializer = ProductDetailSerializer(product)
        data = serializer.data
        cache.set(cache_key, data, timeout=MENU_CACHE_TIMEOUT)
        return Response(data)


# ----------------------------------------------------------------------
# Admin Menu Management Views (BR-SEC-002)
# ----------------------------------------------------------------------


class AdminCategoryListCreateView(APIView):
    """
    GET /api/v1/admin/categories - List all categories
    POST /api/v1/admin/categories - Create category
    """

    permission_classes = [IsStaffOrAdminUser]

    def get(self, request):
        categories = Category.objects.all().order_by("sort_order", "id")
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        invalidate_menu_cache()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminCategoryDetailView(APIView):
    """
    GET /api/v1/admin/categories/{id} - Get category
    PATCH /api/v1/admin/categories/{id} - Update category
    DELETE /api/v1/admin/categories/{id} - Delete category
    """

    permission_classes = [IsStaffOrAdminUser]

    def get_object(self, pk: int) -> Category:
        try:
            return Category.objects.get(pk=pk)
        except Category.DoesNotExist:
            raise NotFound("Danh mục không tồn tại.") from None

    def get(self, request, pk: int):
        category = self.get_object(pk)
        return Response(CategorySerializer(category).data)

    def patch(self, request, pk: int):
        category = self.get_object(pk)
        serializer = CategorySerializer(category, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        invalidate_menu_cache()
        return Response(serializer.data)

    def delete(self, request, pk: int):
        category = self.get_object(pk)
        if category.products.exists():
            raise ValidationError(
                "Không thể xóa danh mục đang có món ăn. Vui lòng chuyển hoặc xóa các món ăn thuộc danh mục này trước."
            )
        category.delete()
        invalidate_menu_cache()
        return Response({"success": True}, status=status.HTTP_200_OK)


class AdminProductListCreateView(APIView):
    """
    GET /api/v1/admin/products - List all products
    POST /api/v1/admin/products - Create product
    """

    permission_classes = [IsStaffOrAdminUser]

    def get(self, request):
        products = (
            with_active_promotion(Product.objects.select_related("category"))
            .prefetch_related(
                Prefetch(
                    "option_groups",
                    queryset=OptionGroup.objects.prefetch_related(
                        Prefetch(
                            "options",
                            queryset=Option.objects.order_by("sort_order", "id"),
                        )
                    ).order_by("sort_order", "id"),
                )
            )
            .order_by("id")
        )
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        invalidate_menu_cache(product_id=product.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminUploadImageView(APIView):
    """
    POST /api/v1/admin/upload-image
    Uploads image (multipart/form-data), compresses to WebP, and saves to MEDIA_ROOT/uploads/%Y/%m/.
    Returns {"image_url": media_url}.
    """

    permission_classes = [IsStaffOrAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        image_file = request.FILES.get("image") or request.FILES.get("file")
        if not image_file:
            raise ValidationError(
                {
                    "code": "MISSING_IMAGE_FILE",
                    "message": "Vui lòng chọn file ảnh để tải lên (tham số 'image' hoặc 'file').",
                }
            )

        if getattr(image_file, "size", 0) > MAX_IMAGE_SIZE_BYTES:
            raise ValidationError(
                {
                    "code": "IMAGE_TOO_LARGE",
                    "message": "Kích thước file ảnh không được vượt quá 5MB.",
                }
            )

        try:
            webp_content = optimize_image_to_webp(image_file)
        except Exception as e:
            raise ValidationError(
                {
                    "code": "INVALID_IMAGE_FILE",
                    "message": f"File ảnh không hợp lệ hoặc bị lỗi: {str(e)}",
                }
            ) from e

        now = timezone.now()
        unique_prefix = uuid.uuid4().hex[:8]
        file_name = f"{unique_prefix}_{webp_content.name}"
        save_path = f"uploads/{now.strftime('%Y/%m')}/{file_name}"

        saved_name = default_storage.save(save_path, webp_content)
        media_url = default_storage.url(saved_name)

        return Response({"image_url": media_url}, status=status.HTTP_201_CREATED)


class AdminProductDetailView(APIView):
    """
    GET /api/v1/admin/products/{id} - Get product detail
    PATCH /api/v1/admin/products/{id} - Update product
    """

    permission_classes = [IsStaffOrAdminUser]

    def get_object(self, pk: int) -> Product:
        try:
            return (
                with_active_promotion(Product.objects.select_related("category"))
                .prefetch_related(
                    Prefetch(
                        "option_groups",
                        queryset=OptionGroup.objects.prefetch_related(
                            Prefetch(
                                "options",
                                queryset=Option.objects.order_by("sort_order", "id"),
                            )
                        ).order_by("sort_order", "id"),
                    )
                )
                .get(pk=pk)
            )
        except Product.DoesNotExist:
            raise NotFound("Món ăn không tồn tại.") from None

    def get(self, request, pk: int):
        product = self.get_object(pk)
        return Response(ProductDetailSerializer(product).data)

    def patch(self, request, pk: int):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            raise NotFound("Món ăn không tồn tại.") from None

        serializer = ProductListSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        invalidate_menu_cache(product_id=product.id)
        refetched_product = self.get_object(product.id)
        return Response(ProductListSerializer(refetched_product).data)

    @transaction.atomic
    def delete(self, request, pk: int):
        from apps.orders.models import OrderItem

        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            raise NotFound("Món ăn không tồn tại.") from None

        has_orders = OrderItem.objects.filter(product=product).exists()
        if has_orders:
            product.status = Product.Status.INACTIVE
            product.save(update_fields=["status"])
            invalidate_menu_cache(product_id=pk)
            return Response(
                {
                    "id": pk,
                    "soft_deleted": True,
                    "status": Product.Status.INACTIVE,
                    "message": "Món ăn đã có trong đơn hàng trước đây, được chuyển sang trạng thái Ngưng bán (INACTIVE) để bảo toàn lịch sử đơn hàng.",
                },
                status=status.HTTP_200_OK,
            )
        else:
            product.delete()
            invalidate_menu_cache(product_id=pk)
            return Response(
                {
                    "id": pk,
                    "soft_deleted": False,
                    "message": "Đã xóa hoàn toàn món ăn khỏi hệ thống.",
                },
                status=status.HTTP_200_OK,
            )


class AdminProductToggleStatusView(APIView):
    """
    POST /api/v1/admin/products/{id}/toggle-status
    Quickly toggles product status between AVAILABLE and OUT_OF_STOCK.
    """

    permission_classes = [IsStaffOrAdminUser]

    def post(self, request, pk: int):
        try:
            product = Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            raise NotFound("Món ăn không tồn tại.") from None

        if product.status == Product.Status.AVAILABLE:
            product.status = Product.Status.OUT_OF_STOCK
        else:
            product.status = Product.Status.AVAILABLE

        product.save(update_fields=["status"])
        invalidate_menu_cache(product_id=product.id)
        return Response(
            {"id": product.id, "name": product.name, "status": product.status}
        )
