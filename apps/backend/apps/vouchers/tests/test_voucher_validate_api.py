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


@pytest.mark.django_db
def test_voucher_browse_api(api_client, test_voucher):
    """TDD Test for Task 3.1: Browse available vouchers based on subtotal."""
    customer = test_voucher["customer"]

    # Tạo thêm 1 voucher % với min_order cao hơn
    Voucher.objects.create(
        code="GIAM10PCT",
        name="Giảm 10% từ 200k",
        discount_type=Voucher.DiscountType.PERCENTAGE,
        discount_value=Decimal("10.00"),
        maximum_discount=Decimal("30000.00"),
        minimum_order_value=Decimal("200000.00"),
        start_at="2026-01-01T00:00:00Z",
        end_at="2026-12-31T23:59:59Z",
        status=Voucher.Status.ACTIVE,
    )

    # 1. Browse với subtotal = 120.000: GIAM20K eligible, GIAM10PCT not eligible
    res1 = api_client.post(
        "/api/v1/vouchers/browse",
        {"subtotal": "120000.00"},
        format="json",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )
    assert res1.status_code == 200
    vouchers = res1.json()["data"]
    assert len(vouchers) == 2

    giam20k = next(v for v in vouchers if v["code"] == "GIAM20K")
    assert giam20k["eligible"] is True
    assert Decimal(str(giam20k["discount_amount"])) == Decimal("20000.00")

    giam10pct = next(v for v in vouchers if v["code"] == "GIAM10PCT")
    assert giam10pct["eligible"] is False
    assert (
        "80" in giam10pct["ineligible_reason"]
        or "200" in giam10pct["ineligible_reason"]
    )

    # 2. Browse với subtotal = 250.000: Cả hai đều eligible
    res2 = api_client.post(
        "/api/v1/vouchers/browse",
        {"subtotal": "250000.00"},
        format="json",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )
    assert res2.status_code == 200
    vouchers2 = res2.json()["data"]
    giam10pct_eligible = next(v for v in vouchers2 if v["code"] == "GIAM10PCT")
    assert giam10pct_eligible["eligible"] is True
    assert Decimal(str(giam10pct_eligible["discount_amount"])) == Decimal("25000.00")
