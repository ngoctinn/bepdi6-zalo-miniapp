from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.customers.models import Customer, User
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.orders.models import Order
from apps.shipping.models import ShopConfig
from apps.vouchers.models import Voucher


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_data(db):
    customer = Customer.objects.create(
        zalo_user_id="zalo_checkout_tester",
        name="Khách Hàng Test",
        phone="0911223344",
    )
    user = User.objects.create(
        username="zalo_zalo_checkout_tester",
        zalo_user_id=customer.zalo_user_id,
        role=User.Role.CUSTOMER,
    )
    category = Category.objects.create(name="Cà Phê", sort_order=1)
    product = Product.objects.create(
        category=category,
        name="Cà Phê Sữa Đá",
        price=Decimal("25000"),
        status=Product.Status.AVAILABLE,
    )
    opt_group = OptionGroup.objects.create(
        product=product,
        name="Đường",
        is_required=False,
        max_select=1,
    )
    opt_item = Option.objects.create(
        option_group=opt_group,
        name="Ít đường",
        price=Decimal("2000"),
        status=Option.Status.AVAILABLE,
    )

    voucher = Voucher.objects.create(
        code="GIAM10K",
        name="Giảm 10K Test",
        discount_type=Voucher.DiscountType.FIXED,
        discount_value=Decimal("10000"),
        minimum_order_value=Decimal("20000"),
        start_at=timezone.now() - timezone.timedelta(days=1),
        end_at=timezone.now() + timezone.timedelta(days=1),
        status=Voucher.Status.ACTIVE,
    )

    return {
        "customer": customer,
        "user": user,
        "product": product,
        "opt_item": opt_item,
        "voucher": voucher,
    }


@pytest.fixture
def configured_shop_config(db):
    config = ShopConfig.get_solo()
    config.latitude = Decimal("10.78000000")
    config.longitude = Decimal("106.70000000")
    config.max_delivery_radius_km = Decimal("5.00")
    config.min_order_amount = Decimal("0.00")
    config.min_order_for_freeship = Decimal("50000.00")
    config.shipping_tiers = [
        {"from_km": 0.0, "to_km": 5.0, "fee": 10000.0},
    ]
    config.save()
    return config


@pytest.mark.django_db
class TestCheckoutPreviewAPI:
    def test_checkout_preview_pickup_no_shipping_fee(self, api_client, test_data):
        url = reverse("checkout-preview")
        payload = {
            "delivery_type": Order.DeliveryType.PICKUP,
            "items": [
                {
                    "product_id": test_data["product"].id,
                    "quantity": 2,
                    "option_ids": [test_data["opt_item"].id],
                }
            ],
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == 200
        res = response.json()
        assert res["success"] is True
        data = res["data"]
        # Subtotal: (25000 + 2000) * 2 = 54000
        assert Decimal(str(data["subtotal"])) == Decimal("54000")
        assert Decimal(str(data["shipping_fee"])) == Decimal("0")
        assert Decimal(str(data["total_amount"])) == Decimal("54000")
        assert data["shipping_status"] == "PICKUP"
        assert data["fee_reason"] == "PICKUP"
        assert data["can_checkout"] is True

    def test_checkout_preview_marks_valid_freeship_explicitly(
        self, api_client, test_data, configured_shop_config
    ):
        response = api_client.post(
            reverse("checkout-preview"),
            {
                "delivery_type": Order.DeliveryType.DELIVERY,
                "delivery_latitude": float(configured_shop_config.latitude),
                "delivery_longitude": float(configured_shop_config.longitude),
                "items": [{"product_id": test_data["product"].id, "quantity": 2}],
            },
            format="json",
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert Decimal(str(data["shipping_fee"])) == Decimal("0.00")
        assert data["shipping_status"] == "FREESHIP"
        assert data["fee_reason"] == "ORDER_SUBTOTAL_THRESHOLD"
        assert data["can_checkout"] is True

    def test_checkout_preview_marks_out_of_radius_zero_fee_as_not_checkoutable(
        self, api_client, test_data, configured_shop_config
    ):
        response = api_client.post(
            reverse("checkout-preview"),
            {
                "delivery_type": Order.DeliveryType.DELIVERY,
                "delivery_latitude": 11.0,
                "delivery_longitude": float(configured_shop_config.longitude),
                "items": [{"product_id": test_data["product"].id, "quantity": 1}],
            },
            format="json",
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert Decimal(str(data["shipping_fee"])) == Decimal("0.00")
        assert data["shipping_status"] == "OUT_OF_RADIUS"
        assert data["fee_reason"] == "OUT_OF_DELIVERY_RADIUS"
        assert data["can_checkout"] is False

    def test_checkout_preview_without_delivery_address_is_not_a_free_quote(
        self, api_client, test_data, configured_shop_config
    ):
        response = api_client.post(
            reverse("checkout-preview"),
            {
                "delivery_type": Order.DeliveryType.DELIVERY,
                "items": [{"product_id": test_data["product"].id, "quantity": 1}],
            },
            format="json",
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["shipping_status"] == "NOT_CALCULATED"
        assert data["fee_reason"] == "MISSING_ADDRESS"
        assert data["can_checkout"] is False

    def test_checkout_preview_with_voucher_discount(self, api_client, test_data):
        url = reverse("checkout-preview")
        payload = {
            "delivery_type": Order.DeliveryType.PICKUP,
            "voucher_code": "GIAM10K",
            "items": [
                {
                    "product_id": test_data["product"].id,
                    "quantity": 1,
                }
            ],
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == 200
        res = response.json()
        assert res["success"] is True
        data = res["data"]
        # Subtotal: 25000, discount: 10000, total: 15000
        assert Decimal(str(data["subtotal"])) == Decimal("25000")
        assert Decimal(str(data["discount"])) == Decimal("10000")
        assert Decimal(str(data["total_amount"])) == Decimal("15000")

    def test_checkout_preview_delivery_distance_and_shipping(
        self, api_client, test_data
    ):
        url = reverse("checkout-preview")
        payload = {
            "delivery_type": Order.DeliveryType.DELIVERY,
            "delivery_latitude": 10.762622,
            "delivery_longitude": 106.660172,
            "items": [
                {
                    "product_id": test_data["product"].id,
                    "quantity": 1,
                }
            ],
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == 200
        res = response.json()
        assert res["success"] is True
        data = res["data"]
        assert "distance_km" in data
        assert "shipping_fee" in data
        assert data["is_deliverable"] is True
        assert Decimal(str(data["total_amount"])) >= Decimal(str(data["subtotal"]))
