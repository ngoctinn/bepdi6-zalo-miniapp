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
