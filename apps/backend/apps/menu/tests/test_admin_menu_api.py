import pytest
from rest_framework.test import APIClient

from apps.customers.models import User
from apps.menu.models import Product


@pytest.fixture
def admin_client():
    staff_user = User.objects.create_user(
        username="staff_menu_admin",
        password="password123",
        role=User.Role.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client


@pytest.mark.django_db
def test_admin_category_crud_and_product_toggle(admin_client):
    # 1. POST /admin/categories
    res_cat = admin_client.post(
        "/api/v1/admin/categories",
        {"name": "Món Nhậu", "description": "Món nhậu hấp dẫn", "sort_order": 5},
        format="json",
    )
    assert res_cat.status_code == 201
    cat_id = res_cat.json()["data"]["id"]

    # 2. POST /admin/products
    res_prod = admin_client.post(
        "/api/v1/admin/products",
        {
            "category_id": cat_id,
            "name": "Bắp xào bơ tỏi",
            "price": "35000.00",
            "status": "AVAILABLE",
        },
        format="json",
    )
    assert res_prod.status_code == 201
    prod_id = res_prod.json()["data"]["id"]

    # 3. POST /admin/products/{id}/toggle-status
    res_toggle = admin_client.post(f"/api/v1/admin/products/{prod_id}/toggle-status")
    assert res_toggle.status_code == 200
    prod = Product.objects.get(pk=prod_id)
    assert prod.status == Product.Status.OUT_OF_STOCK

    # 4. Toggle back
    res_toggle2 = admin_client.post(f"/api/v1/admin/products/{prod_id}/toggle-status")
    assert res_toggle2.status_code == 200
    prod.refresh_from_db()
    assert prod.status == Product.Status.AVAILABLE

    # 5. Create product with direct CDN image_url (BR-PROD-007)
    cdn_url = "https://cdn.bepdi6.vn/images/food/bap-xao.webp"
    res_cdn_prod = admin_client.post(
        "/api/v1/admin/products",
        {
            "category_id": cat_id,
            "name": "Bắp xào phô mai",
            "price": "40000.00",
            "image_url": cdn_url,
            "status": "AVAILABLE",
        },
        format="json",
    )
    assert res_cdn_prod.status_code == 201
    assert res_cdn_prod.json()["data"]["image_url"] == cdn_url
    prod2 = Product.objects.get(pk=res_cdn_prod.json()["data"]["id"])
    assert prod2.image_url == cdn_url
    assert prod2.effective_image_url == cdn_url


@pytest.mark.django_db
def test_admin_product_detail_prefetch_and_queries(
    admin_client, django_assert_num_queries
):
    from decimal import Decimal

    from apps.menu.models import Category, Option, OptionGroup, Product

    cat = Category.objects.create(name="Đồ uống", sort_order=1)
    prod = Product.objects.create(
        category=cat,
        name="Trà sữa trân châu",
        price=Decimal("30000.00"),
    )
    group1 = OptionGroup.objects.create(product=prod, name="Size", sort_order=1)
    Option.objects.create(
        option_group=group1, name="Size M", price=Decimal("0.00"), sort_order=1
    )
    Option.objects.create(
        option_group=group1, name="Size L", price=Decimal("5000.00"), sort_order=2
    )

    group2 = OptionGroup.objects.create(product=prod, name="Topping", sort_order=2)
    Option.objects.create(
        option_group=group2,
        name="Trân châu đen",
        price=Decimal("5000.00"),
        sort_order=1,
    )

    # 3 queries max: Product + Category (select_related), OptionGroup (prefetch), Option (prefetch)
    with django_assert_num_queries(3):
        res = admin_client.get(f"/api/v1/admin/products/{prod.id}")

    assert res.status_code == 200
    data = res.json()["data"]
    assert data["name"] == "Trà sữa trân châu"
    assert len(data["option_groups"]) == 2
    assert len(data["option_groups"][0]["options"]) == 2
    assert len(data["option_groups"][1]["options"]) == 1
