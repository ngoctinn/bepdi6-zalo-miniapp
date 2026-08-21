from django.urls import path

from apps.menu.views import (
    AdminCategoryDetailView,
    AdminCategoryListCreateView,
    AdminProductDetailView,
    AdminProductListCreateView,
    AdminProductToggleStatusView,
    CategoryListView,
    ProductDetailView,
    ProductListView,
)

urlpatterns = [
    # Customer APIs
    path("categories", CategoryListView.as_view(), name="category-list"),
    path("products", ProductListView.as_view(), name="product-list"),
    path("products/<int:pk>", ProductDetailView.as_view(), name="product-detail"),
    # Admin APIs
    path(
        "admin/categories",
        AdminCategoryListCreateView.as_view(),
        name="admin-category-list-create",
    ),
    path(
        "admin/categories/<int:pk>",
        AdminCategoryDetailView.as_view(),
        name="admin-category-detail",
    ),
    path(
        "admin/products",
        AdminProductListCreateView.as_view(),
        name="admin-product-list-create",
    ),
    path(
        "admin/products/<int:pk>",
        AdminProductDetailView.as_view(),
        name="admin-product-detail",
    ),
    path(
        "admin/products/<int:pk>/toggle-status",
        AdminProductToggleStatusView.as_view(),
        name="admin-product-toggle-status",
    ),
]
