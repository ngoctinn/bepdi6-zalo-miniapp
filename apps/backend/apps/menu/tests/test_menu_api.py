from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.menu.models import Category, Option, OptionGroup, Product


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def menu_data():
    cat1 = Category.objects.create(name="Món chính", sort_order=1)
    cat2 = Category.objects.create(
        name="Món ngưng", sort_order=2, status=Category.Status.INACTIVE
    )

    p1 = Product.objects.create(
        category=cat1,
        name="Cơm tấm sườn nướng",
        price=Decimal("45000.00"),
        status=Product.Status.AVAILABLE,
    )
    p2 = Product.objects.create(
        category=cat1,
        name="Cơm tấm sườn bì chả",
        price=Decimal("60000.00"),
        status=Product.Status.OUT_OF_STOCK,
    )

    group = OptionGroup.objects.create(
        product=p1,
        name="Topping thêm",
        min_select=0,
        max_select=2,
    )
    opt1 = Option.objects.create(
        option_group=group,
        name="Trứng ốp la",
        price=Decimal("8000.00"),
        status=Option.Status.AVAILABLE,
    )
    opt2 = Option.objects.create(
        option_group=group,
        name="Chả thêm",
        price=Decimal("12000.00"),
        status=Option.Status.AVAILABLE,
    )
    opt_inactive = Option.objects.create(
        option_group=group,
        name="Topping ẩn",
        price=Decimal("5000.00"),
        status=Option.Status.INACTIVE,
    )

    return {
        "cat1": cat1,
        "cat2": cat2,
        "p1": p1,
        "p2": p2,
        "group": group,
        "opt1": opt1,
        "opt2": opt2,
        "opt_inactive": opt_inactive,
    }


@pytest.mark.django_db
def test_get_categories_api(api_client, menu_data):
    response = api_client.get("/api/v1/categories")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    # Only active category returned
    categories = data["data"]
    assert len(categories) == 1
    assert categories[0]["name"] == "Món chính"


@pytest.mark.django_db
def test_get_products_api(api_client, menu_data):
    # Default: only available products
    response = api_client.get("/api/v1/products")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    products = data["data"]
    assert len(products) == 1
    assert products[0]["name"] == "Cơm tấm sườn nướng"

    # Filter with status=OUT_OF_STOCK
    res_stock = api_client.get("/api/v1/products?status=OUT_OF_STOCK")
    assert len(res_stock.json()["data"]) == 1
    assert res_stock.json()["data"][0]["name"] == "Cơm tấm sườn bì chả"

    # Search filter
    res_search = api_client.get("/api/v1/products?search=sườn nướng")
    assert len(res_search.json()["data"]) == 1


@pytest.mark.django_db
def test_get_product_detail_nested_and_queries(
    api_client, menu_data, django_assert_num_queries
):
    from django.core.cache import cache

    cache.clear()

    p1 = menu_data["p1"]

    # First request: 3 queries (Product+Category, OptionGroups, Options), then saved to cache
    with django_assert_num_queries(3):
        response = api_client.get(f"/api/v1/products/{p1.id}")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["name"] == "Cơm tấm sườn nướng"
    assert len(data["option_groups"]) == 1

    group = data["option_groups"][0]
    assert group["name"] == "Topping thêm"
    # Only 2 active options returned (inactive excluded)
    assert len(group["options"]) == 2
    option_names = [opt["name"] for opt in group["options"]]
    assert "Trứng ốp la" in option_names
    assert "Chả thêm" in option_names
    assert "Topping ẩn" not in option_names

    # Second request: HIT CACHE -> 0 database queries!
    with django_assert_num_queries(0):
        cached_response = api_client.get(f"/api/v1/products/{p1.id}")
    assert cached_response.status_code == 200
    assert cached_response.json()["data"]["name"] == "Cơm tấm sườn nướng"


@pytest.mark.django_db
def test_get_product_not_found(api_client):
    response = api_client.get("/api/v1/products/99999")
    assert response.status_code == 404
    data = response.json()
    assert data["success"] is False
    assert data["error"]["code"] == "NOT_FOUND"
