from django.db.models import Prefetch
from rest_framework import permissions
from rest_framework.exceptions import NotFound
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.menu.models import Category, Option, OptionGroup, Product
from apps.menu.serializers import (
    CategorySerializer,
    ProductDetailSerializer,
    ProductListSerializer,
)


class CategoryListView(APIView):
    """
    GET /api/v1/categories
    Returns list of ACTIVE categories ordered by sort_order.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        categories = Category.objects.filter(status=Category.Status.ACTIVE).order_by(
            "sort_order", "id"
        )
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class ProductListView(APIView):
    """
    GET /api/v1/products
    Query parameters:
    - category_id: Filter by category ID
    - status: Filter by product status (default: AVAILABLE)
    - search: Search by product name (case-insensitive)
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        queryset = Product.objects.select_related("category").all()

        category_id = request.query_params.get("category_id")
        if category_id:
            queryset = queryset.filter(category_id=category_id)

        product_status = request.query_params.get("status")
        if product_status:
            queryset = queryset.filter(status=product_status)
        else:
            # Default to available only
            queryset = queryset.filter(status=Product.Status.AVAILABLE)

        search = request.query_params.get("search")
        if search:
            queryset = queryset.filter(name__icontains=search.strip())

        queryset = queryset.order_by("category__sort_order", "id")
        serializer = ProductListSerializer(queryset, many=True)
        return Response(serializer.data)


class ProductDetailView(APIView):
    """
    GET /api/v1/products/{id}
    Returns product details with nested option groups and options.
    Optimized with prefetch_related('option_groups__options') to prevent N+1 queries.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
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
        return Response(serializer.data)
