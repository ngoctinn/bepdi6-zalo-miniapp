from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.customers.models import Address, Customer
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.vouchers.models import Voucher


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def checkout_setup():
    customer = Customer.objects.create(
        zalo_user_id="cust_checkout_test",
        name="Trần Thị C",
        phone="0933445566",
    )
    address = Address.objects.create(
        customer=customer,
        label="Nhà riêng",
        recipient_name="Trần Thị C",
        phone="0933445566",
        address_text="123 Nguyễn Trãi, Q.1",
        latitude=Decimal("10.7721"),
        longitude=Decimal("106.6983"),
        is_default=True,
    )
    cat = Category.objects.create(name="Cơm")
    prod = Product.objects.create(
        category=cat,
        name="Cơm tấm đặc biệt",
        price=Decimal("55000.00"),
        status=Product.Status.AVAILABLE,
    )
    group = OptionGroup.objects.create(product=prod, name="Thêm")
    opt = Option.objects.create(
        option_group=group, name="Canh rong biển", price=Decimal("10000.00")
    )

    voucher = Voucher.objects.create(
        code="GIAM15K",
        name="Giảm 15k",
        discount_type=Voucher.DiscountType.FIXED,
        discount_value=Decimal("15000.00"),
        minimum_order_value=Decimal("50000.00"),
        start_at="2026-01-01T00:00:00Z",
        end_at="2026-12-31T23:59:59Z",
        status=Voucher.Status.ACTIVE,
    )

    return {
        "customer": customer,
        "address": address,
        "prod": prod,
        "opt": opt,
        "voucher": voucher,
    }


@pytest.mark.django_db
def test_checkout_preview_api(api_client, checkout_setup):
    customer = checkout_setup["customer"]
    address = checkout_setup["address"]
    prod = checkout_setup["prod"]
    opt = checkout_setup["opt"]

    payload = {
        "items": [
            {
                "product_id": prod.id,
                "quantity": 2,
                "option_ids": [opt.id],
                "note": "Ít mỡ hành",
            }
        ],
        "address_id": address.id,
        "delivery_type": "ASAP",
        "voucher_code": "GIAM15K",
        "payment_method": "BANK_TRANSFER",
    }

    response = api_client.post(
        "/api/v1/checkout/preview",
        payload,
        format="json",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    result = data["data"]
    # 2 * (55k + 10k) = 130k subtotal
    assert Decimal(str(result["subtotal"])) == Decimal("130000.00")
    # Distance in Q1 <= 2km -> shipping fee 10k
    assert Decimal(str(result["shipping_fee"])) == Decimal("10000.00")
    # Discount 15k
    assert Decimal(str(result["discount"])) == Decimal("15000.00")
    # Total: 130k + 10k - 15k = 125k
    assert Decimal(str(result["total_amount"])) == Decimal("125000.00")
    assert result["is_deliverable"] is True


@pytest.mark.django_db
def test_order_create_and_get_detail_api(api_client, checkout_setup):
    customer = checkout_setup["customer"]
    address = checkout_setup["address"]
    prod = checkout_setup["prod"]

    payload = {
        "items": [
            {
                "product_id": prod.id,
                "quantity": 1,
                "option_ids": [],
            }
        ],
        "address_id": address.id,
        "payment_method": "BANK_TRANSFER",
        "note": "Giao trước 12h",
    }

    # 1. Missing Idempotency-Key
    res_missing_idemp = api_client.post(
        "/api/v1/orders",
        payload,
        format="json",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )
    assert res_missing_idemp.status_code == 400
    assert res_missing_idemp.json()["success"] is False

    # 2. Valid Order Creation with Idempotency-Key
    res_create = api_client.post(
        "/api/v1/orders",
        payload,
        format="json",
        HTTP_X_CUSTOMER_ID=str(customer.id),
        HTTP_IDEMPOTENCY_KEY="idemp_api_test_001",
    )
    assert res_create.status_code == 201
    order_data = res_create.json()["data"]
    order_id = order_data["id"]
    assert order_data["order_code"].startswith("FO")
    assert order_data["status"] == "PENDING_CONFIRMATION"
    assert order_data["payment"]["method"] == "BANK_TRANSFER"
    assert "vietqr.io" in order_data["payment"]["qr_code_url"]

    # 3. GET /orders (List)
    res_list = api_client.get(
        "/api/v1/orders",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )
    assert res_list.status_code == 200
    orders_list = res_list.json()["data"]
    assert len(orders_list) == 1
    assert orders_list[0]["id"] == order_id

    # 4. GET /orders/{id} (Detail)
    res_detail = api_client.get(
        f"/api/v1/orders/{order_id}",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )
    assert res_detail.status_code == 200
    detail = res_detail.json()["data"]
    assert detail["recipient_name"] == address.recipient_name
    assert len(detail["items"]) == 1
    assert detail["items"][0]["product_name"] == prod.name

    # 5. Customer cancels order while in PENDING_CONFIRMATION -> Success (BR-ORD-005)
    res_cancel = api_client.post(
        f"/api/v1/orders/{order_id}/cancel",
        {"reason": "Đặt nhầm món"},
        format="json",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )
    assert res_cancel.status_code == 200
    assert res_cancel.json()["data"]["status"] == "CANCELLED"

    # 6. Re-cancelling or cancelling when not PENDING_CONFIRMATION -> Rejected
    res_re_cancel = api_client.post(
        f"/api/v1/orders/{order_id}/cancel",
        format="json",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )
    assert res_re_cancel.status_code == 400
    assert res_re_cancel.json()["error"]["code"] == "INVALID_STATE_TRANSITION"
