import pytest
from rest_framework.test import APIClient

from apps.customers.models import User
from apps.menu.models import Category, Product


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


@pytest.mark.django_db
def test_admin_product_and_category_image_size_validation(admin_client):
    from django.core.files.uploadedfile import SimpleUploadedFile

    cat = Category.objects.create(name="Ăn vặt", sort_order=2)

    # Fake oversized image (> 5MB)
    large_content = b"x" * (5 * 1024 * 1024 + 1024)
    oversized_file = SimpleUploadedFile(
        "large.png", large_content, content_type="image/png"
    )

    res = admin_client.post(
        "/api/v1/admin/products",
        {
            "category_id": cat.id,
            "name": "Bánh tráng phơi sương",
            "price": "25000.00",
            "image": oversized_file,
            "status": "AVAILABLE",
        },
        format="multipart",
    )
    assert res.status_code == 400
    assert "Kích thước file ảnh không được vượt quá 5MB" in str(res.json())


@pytest.mark.django_db
def test_admin_category_delete_guard_with_products(admin_client):
    from decimal import Decimal

    cat = Category.objects.create(name="Tráng miệng", sort_order=10)
    prod = Product.objects.create(
        category=cat,
        name="Chè bưởi",
        price=Decimal("20000.00"),
    )

    # Attempt to delete category when products exist -> 400
    res_del_fail = admin_client.delete(f"/api/v1/admin/categories/{cat.id}")
    assert res_del_fail.status_code == 400
    assert "Không thể xóa danh mục đang có món ăn" in str(res_del_fail.json())
    assert Category.objects.filter(pk=cat.id).exists()

    # Delete product first
    prod.delete()

    # Now category deletion succeeds
    res_del_ok = admin_client.delete(f"/api/v1/admin/categories/{cat.id}")
    assert res_del_ok.status_code == 200
    assert not Category.objects.filter(pk=cat.id).exists()


@pytest.mark.django_db
def test_admin_upload_image_webp(admin_client):
    import io

    from PIL import Image

    # 1. Valid image upload
    img = Image.new("RGB", (100, 100), color="blue")
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format="PNG")
    img_byte_arr.seek(0)
    img_byte_arr.name = "test.png"

    res = admin_client.post(
        "/api/v1/admin/upload-image",
        {"image": img_byte_arr},
        format="multipart",
    )
    assert res.status_code == 201
    assert "image_url" in res.json()["data"]
    assert res.json()["data"]["image_url"].endswith(".webp")

    # 2. Missing image file -> 400
    res_err = admin_client.post("/api/v1/admin/upload-image", {}, format="multipart")
    assert res_err.status_code == 400
    assert "MISSING_IMAGE_FILE" in str(res_err.json())


@pytest.mark.django_db
def test_admin_product_nested_option_groups_and_delete(admin_client):
    from decimal import Decimal

    from apps.orders.models import Order, OrderItem

    cat = Category.objects.create(name="Trà & Cà phê", sort_order=1)

    # 1. Create product with nested option_groups & options
    payload = {
        "category_id": cat.id,
        "name": "Trà Sữa Trân Châu",
        "price": "30000.00",
        "status": "AVAILABLE",
        "option_groups": [
            {
                "name": "Chọn Size",
                "is_required": True,
                "min_select": 1,
                "max_select": 1,
                "options": [
                    {"name": "Size M", "price": "0.00"},
                    {"name": "Size L", "price": "5000.00"},
                ],
            },
            {
                "name": "Topping thêm",
                "is_required": False,
                "min_select": 0,
                "max_select": 3,
                "options": [
                    {"name": "Trân châu đen", "price": "5000.00"},
                    {"name": "Thạch phô mai", "price": "7000.00"},
                ],
            },
        ],
    }

    res_create = admin_client.post("/api/v1/admin/products", payload, format="json")
    assert res_create.status_code == 201
    prod_data = res_create.json()["data"]
    prod_id = prod_data["id"]
    assert len(prod_data["option_groups"]) == 2
    assert len(prod_data["option_groups"][0]["options"]) == 2

    # 2. Update product and option_groups via PATCH
    group1_id = prod_data["option_groups"][0]["id"]
    opt1_id = prod_data["option_groups"][0]["options"][0]["id"]
    update_payload = {
        "price": "32000.00",
        "option_groups": [
            {
                "id": group1_id,
                "name": "Chọn Cỡ Ly",
                "is_required": True,
                "min_select": 1,
                "max_select": 1,
                "options": [
                    {"id": opt1_id, "name": "Ly Vừa", "price": "0.00"},
                    {"name": "Ly Lớn", "price": "6000.00"},
                ],
            }
        ],
    }
    res_patch = admin_client.patch(
        f"/api/v1/admin/products/{prod_id}", update_payload, format="json"
    )
    assert res_patch.status_code == 200
    patched_data = res_patch.json()["data"]
    assert len(patched_data["option_groups"]) == 1
    assert patched_data["option_groups"][0]["name"] == "Chọn Cỡ Ly"

    # 3. Soft-delete product if attached to an OrderItem
    from apps.customers.models import Customer

    customer = Customer.objects.create(
        zalo_user_id="zalo_test_12345",
        name="Test Customer",
        phone="0987654321",
    )
    order = Order.objects.create(
        customer=customer,
        order_code="ORD-TEST-001",
        idempotency_key="idemp_test_001",
        recipient_name="Test Customer",
        phone="0987654321",
        delivery_address="123 Lê Lợi, Q1, TP.HCM",
        delivery_latitude=Decimal("10.776889"),
        delivery_longitude=Decimal("106.700806"),
        subtotal=Decimal("50000.00"),
        total_amount=Decimal("50000.00"),
    )
    prod = Product.objects.get(pk=prod_id)
    OrderItem.objects.create(
        order=order,
        product=prod,
        product_name=prod.name,
        unit_price=prod.price,
        quantity=1,
        subtotal=prod.price,
    )

    res_del_soft = admin_client.delete(f"/api/v1/admin/products/{prod_id}")
    assert res_del_soft.status_code == 200
    assert res_del_soft.json()["data"]["soft_deleted"] is True
    prod.refresh_from_db()
    assert prod.status == Product.Status.INACTIVE

    # 4. Hard-delete product if no orders attached
    prod_standalone = Product.objects.create(
        category=cat,
        name="Món Ăn Thử",
        price=Decimal("15000.00"),
    )
    res_del_hard = admin_client.delete(f"/api/v1/admin/products/{prod_standalone.id}")
    assert res_del_hard.status_code == 200
    assert res_del_hard.json()["data"]["soft_deleted"] is False
    assert not Product.objects.filter(pk=prod_standalone.id).exists()


@pytest.mark.django_db
def test_admin_create_and_update_product_promotion(admin_client):
    """
    Test TDD: Admin tạo và cập nhật món ăn có khuyến mãi (promotional_price).
    Backend ProductListSerializer phải lưu và cập nhật ProductPromotion tương ứng.
    """
    from decimal import Decimal

    cat = Category.objects.create(name="Ăn vặt")

    # 1. Tạo món ăn kèm khuyến mãi
    create_payload = {
        "category_id": cat.id,
        "name": "Trà Sữa Trân Châu Ưu Đãi",
        "price": 35000,
        "promotion": {
            "promotional_price": 25000,
            "is_active": True,
            "note": "Flash Sale Khai Trương",
        },
    }
    res_create = admin_client.post(
        "/api/v1/admin/products", create_payload, format="json"
    )
    assert res_create.status_code == 201
    prod_id = res_create.json()["data"]["id"]
    prod_data = res_create.json()["data"]
    assert prod_data["effective_price"] == 25000.0
    assert prod_data["has_promotion"] is True
    assert prod_data["discount_percent"] == 29

    prod = Product.objects.get(pk=prod_id)
    promo = prod.active_promotion
    assert promo is not None
    assert promo.promotional_price == Decimal("25000.00")
    assert promo.note == "Flash Sale Khai Trương"

    # 2. Cập nhật tắt khuyến mãi
    update_payload = {
        "promotion": {
            "promotional_price": 28000,
            "is_active": False,
        }
    }
    res_update = admin_client.patch(
        f"/api/v1/admin/products/{prod_id}", update_payload, format="json"
    )
    assert res_update.status_code == 200
    updated_data = res_update.json()["data"]
    assert updated_data["has_promotion"] is False
    assert updated_data["effective_price"] == 35000.0


@pytest.mark.django_db
def test_product_is_featured_and_sort_order(admin_client):
    """TDD Test for Task 1.4: Product is_featured and sort_order fields."""
    cat = Category.objects.create(name="Test Category", sort_order=1)
    payload = {
        "name": "Bánh mì đặc biệt",
        "category_id": cat.id,
        "price": 45000,
        "is_featured": True,
        "sort_order": 10,
    }
    res = admin_client.post("/api/v1/admin/products", payload, format="json")
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["is_featured"] is True
    assert data["sort_order"] == 10

    prod_id = data["id"]
    prod = Product.objects.get(pk=prod_id)
    assert prod.is_featured is True
    assert prod.sort_order == 10

    # Test update
    update_res = admin_client.patch(
        f"/api/v1/admin/products/{prod_id}",
        {"is_featured": False, "sort_order": 5},
        format="json",
    )
    assert update_res.status_code == 200
    assert update_res.json()["data"]["is_featured"] is False
    assert update_res.json()["data"]["sort_order"] == 5
