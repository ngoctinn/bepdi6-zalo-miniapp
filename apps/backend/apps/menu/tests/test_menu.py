from decimal import Decimal

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.menu.models import Category, Option, OptionGroup, Product, ProductPromotion


@pytest.fixture
def api_client():
    cache.clear()
    return APIClient()


@pytest.fixture
def menu_data():
    cat1 = Category.objects.create(
        name="Cơm tấm", sort_order=1, status=Category.Status.ACTIVE
    )
    cat2 = Category.objects.create(
        name="Nước giải khát", sort_order=2, status=Category.Status.ACTIVE
    )
    cat_inactive = Category.objects.create(
        name="Món ẩn", sort_order=3, status=Category.Status.INACTIVE
    )

    prod1 = Product.objects.create(
        category=cat1,
        name="Cơm sườn nướng",
        price=Decimal("45000.00"),
        status=Product.Status.AVAILABLE,
    )
    prod2 = Product.objects.create(
        category=cat1,
        name="Cơm sườn bì chả",
        price=Decimal("65000.00"),
        status=Product.Status.OUT_OF_STOCK,
    )
    prod_inactive = Product.objects.create(
        category=cat2,
        name="Trà sữa thái",
        price=Decimal("25000.00"),
        status=Product.Status.INACTIVE,
    )

    group = OptionGroup.objects.create(
        product=prod1,
        name="Topping thêm",
        is_required=False,
        min_select=0,
        max_select=2,
    )
    opt1 = Option.objects.create(
        option_group=group,
        name="Thêm trứng ốp la",
        price=Decimal("10000.00"),
        status=Option.Status.AVAILABLE,
    )
    opt2 = Option.objects.create(
        option_group=group,
        name="Thêm chả cua",
        price=Decimal("15000.00"),
        status=Option.Status.INACTIVE,
    )

    return {
        "cat1": cat1,
        "cat2": cat2,
        "cat_inactive": cat_inactive,
        "prod1": prod1,
        "prod2": prod2,
        "prod_inactive": prod_inactive,
        "group": group,
        "opt1": opt1,
        "opt2": opt2,
    }


@pytest.mark.django_db
class TestCategoryList:
    def test_category_list_active_only(self, api_client, menu_data):
        response = api_client.get("/api/v1/categories")
        assert response.status_code == status.HTTP_200_OK
        category_names = [c["name"] for c in response.data]
        assert "Cơm tấm" in category_names
        assert "Nước giải khát" in category_names
        assert "Món ẩn" not in category_names


@pytest.mark.django_db
class TestProductList:
    def test_product_list_default_available_only(self, api_client, menu_data):
        response = api_client.get("/api/v1/products")
        assert response.status_code == status.HTTP_200_OK
        product_names = [p["name"] for p in response.data]
        assert "Cơm sườn nướng" in product_names
        assert "Trà sữa thái" not in product_names

    def test_product_list_filter_by_category(self, api_client, menu_data):
        response = api_client.get(
            f"/api/v1/products?category_id={menu_data['cat1'].id}"
        )
        assert response.status_code == status.HTTP_200_OK
        for prod in response.data:
            assert prod["category_id"] == menu_data["cat1"].id

    def test_product_list_search(self, api_client, menu_data):
        response = api_client.get("/api/v1/products?search=sườn")
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) >= 1
        assert "Cơm sườn nướng" in [p["name"] for p in response.data]


@pytest.mark.django_db
class TestProductDetail:
    def test_product_detail_with_options_and_promotion(self, api_client, menu_data):
        prod = menu_data["prod1"]
        # Add active promotion
        ProductPromotion.objects.create(
            product=prod,
            promotional_price=Decimal("39000.00"),
            is_active=True,
            valid_from=timezone.now() - timezone.timedelta(days=1),
            valid_to=timezone.now() + timezone.timedelta(days=1),
        )

        response = api_client.get(f"/api/v1/products/{prod.id}")
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["id"] == prod.id
        assert Decimal(str(data["effective_price"])) == Decimal("39000.00")
        assert data["has_promotion"] is True
        assert data["discount_percent"] > 0
        assert len(data["option_groups"]) == 1
        # Inactive option should not be included in customer detail view
        assert len(data["option_groups"][0]["options"]) == 1
        assert data["option_groups"][0]["options"][0]["name"] == "Thêm trứng ốp la"

    def test_product_detail_not_found(self, api_client):
        response = api_client.get("/api/v1/products/999999")
        assert response.status_code == status.HTTP_404_NOT_FOUND
