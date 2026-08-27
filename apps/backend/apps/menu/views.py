from django.core.cache import cache
from django.db.models import Prefetch
from rest_framework import permissions, status
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.customers.permissions import IsStaffOrAdminUser
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.menu.serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)

MENU_CACHE_TIMEOUT = 600  # 10 minutes
CACHE_KEY_CATEGORIES = "menu:categories:list"
CACHE_KEY_PRODUCTS_PREFIX = "menu:products:list"
CACHE_KEY_PRODUCT_DETAIL_PREFIX = "menu:product:detail"


def invalidate_menu_cache(product_id: int | None = None) -> None:
    """
    Invalidates menu-related caches.
    Clears category list, product list queries, and specific/all product details.
    """
    keys_to_delete = [
        CACHE_KEY_CATEGORIES,
        f"{CACHE_KEY_PRODUCTS_PREFIX}:all:available",
        f"{CACHE_KEY_PRODUCTS_PREFIX}:all:OUT_OF_STOCK",
        f"{CACHE_KEY_PRODUCTS_PREFIX}:all:INACTIVE",
    ]
    if product_id is not None:
        keys_to_delete.append(f"{CACHE_KEY_PRODUCT_DETAIL_PREFIX}:{product_id}")

    # Delete known static cache keys
    cache.delete_many(keys_to_delete)

    # Invalidate pattern-based keys if supported by cache backend (e.g. redis or local fallback)
    try:
        if hasattr(cache, "delete_pattern"):
            cache.delete_pattern("menu:*")
    except Exception:
        pass


class CategoryListView(APIView):
    """
    GET /api/v1/categories
    Returns list of ACTIVE categories ordered by sort_order.
    Cached for fast response.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        cached_data = cache.get(CACHE_KEY_CATEGORIES)
        if cached_data is not None:
            return Response(cached_data)

        categories = Category.objects.filter(status=Category.Status.ACTIVE).order_by(
            "sort_order", "id"
        )
        serializer = CategorySerializer(categories, many=True)
        data = serializer.data
        cache.set(CACHE_KEY_CATEGORIES, data, timeout=MENU_CACHE_TIMEOUT)
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
            cache_key = f"{CACHE_KEY_PRODUCTS_PREFIX}:{category_id or 'all'}:{status_param or 'available'}"
            cached_data = cache.get(cache_key)
            if cached_data is not None:
                return Response(cached_data)

        queryset = Product.objects.select_related("category").order_by(
            "category__sort_order", "id"
        )

        if category_id:
            queryset = queryset.filter(category_id=category_id)

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
        cache_key = f"{CACHE_KEY_PRODUCT_DETAIL_PREFIX}:{pk}"
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
                Product.objects.prefetch_related(active_groups_prefetch)
                .select_related("category")
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
        products = Product.objects.select_related("category").all().order_by("id")
        serializer = ProductListSerializer(products, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = ProductListSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        product = serializer.save()
        invalidate_menu_cache(product_id=product.id)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AdminProductDetailView(APIView):
    """
    GET /api/v1/admin/products/{id} - Get product detail
    PATCH /api/v1/admin/products/{id} - Update product
    """

    permission_classes = [IsStaffOrAdminUser]

    def get_object(self, pk: int) -> Product:
        try:
            return (
                Product.objects.prefetch_related(
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
                .select_related("category")
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
        return Response(serializer.data)


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
