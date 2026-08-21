from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.customers.models import Customer
from apps.vouchers.models import Voucher


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_voucher():
    customer = Customer.objects.create(
        zalo_user_id="cust_voucher_api_test",
        name="Phạm Voucher",
        phone="0911223344",
    )
    voucher = Voucher.objects.create(
        code="GIAM20K",
        name="Giảm 20.000đ",
        discount_type=Voucher.DiscountType.FIXED,
        discount_value=Decimal("20000.00"),
        minimum_order_value=Decimal("100000.00"),
        start_at="2026-01-01T00:00:00Z",
        end_at="2026-12-31T23:59:59Z",
        status=Voucher.Status.ACTIVE,
    )
    return {"customer": customer, "voucher": voucher}


@pytest.mark.django_db
def test_voucher_validate_api_valid(api_client, test_voucher):
    customer = test_voucher["customer"]

    payload = {"code": "GIAM20K", "order_amount": "120000.00"}
    response = api_client.post(
        "/api/v1/vouchers/validate",
        payload,
        format="json",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["valid"] is True
    assert Decimal(str(data["data"]["discount"])) == Decimal("20000.00")


@pytest.mark.django_db
def test_voucher_validate_api_invalid_min_order(api_client, test_voucher):
    customer = test_voucher["customer"]

    payload = {"code": "GIAM20K", "order_amount": "50000.00"}
    response = api_client.post(
        "/api/v1/vouchers/validate",
        payload,
        format="json",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["data"]["valid"] is False
    assert data["data"]["reason"] == "VOUCHER_INVALID"
