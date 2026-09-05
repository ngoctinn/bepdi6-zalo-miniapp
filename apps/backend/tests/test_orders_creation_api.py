import uuid
from decimal import Decimal

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.customers.models import Address, Customer, User
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.orders.models import Order
from apps.shipping.models import ShopConfig
from apps.vouchers.models import Voucher


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def order_fixture(db):
    customer = Customer.objects.create(
        zalo_user_id="zalo_order_test_999",
        name="Lê Văn Test Order",
        phone="0933445566",
    )
    user = User.objects.create(
        username="zalo_zalo_order_test_999",
        zalo_user_id=customer.zalo_user_id,
        role=User.Role.CUSTOMER,
    )
    category = Category.objects.create(name="Trà & Cà phê", sort_order=1)
    product = Product.objects.create(
        category=category,
        name="Trà Đào Cam Sả",
        price=Decimal("30000"),
        status=Product.Status.AVAILABLE,
    )
    opt_group = OptionGroup.objects.create(
        product=product,
        name="Topping",
        is_required=False,
        max_select=2,
    )
    opt_item = Option.objects.create(
        option_group=opt_group,
        name="Thêm Đào",
        price=Decimal("5000"),
        status=Option.Status.AVAILABLE,
    )
    voucher = Voucher.objects.create(
        code="DEAL5K",
        name="Giảm 5K",
        discount_type=Voucher.DiscountType.FIXED,
        discount_value=Decimal("5000"),
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


@pytest.mark.django_db
class TestOrderCreationAPI:
    def test_create_order_with_snapshot_and_idempotency(
        self, api_client, order_fixture
    ):
        customer, user = order_fixture["customer"], order_fixture["user"]
        api_client.force_authenticate(user=user)

        idempotency_key = str(uuid.uuid4())
        url = reverse("order-list-create")
        payload = {
            "delivery_type": Order.DeliveryType.PICKUP,
            "recipient_name": "Lê Văn Test Order",
            "phone": "0933445566",
            "payment_method": Order.PaymentMethod.COD,
            "items": [
                {
                    "product_id": order_fixture["product"].id,
                    "quantity": 1,
                    "option_ids": [order_fixture["opt_item"].id],
                }
            ],
            "voucher_code": "DEAL5K",
        }

        # First request: create order
        response = api_client.post(
            url, payload, format="json", HTTP_IDEMPOTENCY_KEY=idempotency_key
        )
        assert response.status_code == 201
        res = response.json()
        assert res["success"] is True
        order_id = res["data"]["id"]
        order_code = res["data"]["order_code"]
        # (30000 + 5000) - 5000 = 30000
        assert Decimal(str(res["data"]["total_amount"])) == Decimal("30000")

        # Verify DB Snapshot integrity
        order = Order.objects.get(id=order_id)
        assert order.order_code == order_code
        assert order.status == Order.Status.PENDING_CONFIRMATION
        assert order.delivery_type == Order.DeliveryType.PICKUP
        assert order.items.count() == 1

        item = order.items.first()
        assert item.product_name == "Trà Đào Cam Sả"
        assert item.unit_price == Decimal("30000")
        assert item.options.count() == 1
        opt = item.options.first()
        assert opt.option_name == "Thêm Đào"
        assert opt.price == Decimal("5000")

        # Second request with SAME idempotency key (must return existing order without creating duplicate)
        response_retry = api_client.post(
            url, payload, format="json", HTTP_IDEMPOTENCY_KEY=idempotency_key
        )
        assert response_retry.status_code in [200, 201]
        res_retry = response_retry.json()
        assert res_retry["success"] is True
        assert res_retry["data"]["id"] == order_id
        assert Order.objects.filter(customer=customer).count() == 1

    def test_delivery_without_a_complete_address_is_rejected(
        self, api_client, order_fixture
    ):
        api_client.force_authenticate(user=order_fixture["user"])
        response = api_client.post(
            reverse("order-list-create"),
            {
                "delivery_type": Order.DeliveryType.DELIVERY,
                "items": [{"product_id": order_fixture["product"].id, "quantity": 1}],
            },
            format="json",
            HTTP_IDEMPOTENCY_KEY=str(uuid.uuid4()),
        )
        assert response.status_code == 400
        assert Order.objects.filter(customer=order_fixture["customer"]).count() == 0

    def test_delivery_retry_does_not_persist_an_unsaved_address(
        self, api_client, order_fixture
    ):
        customer, user = order_fixture["customer"], order_fixture["user"]
        config = ShopConfig.get_solo()
        config.is_open = True
        config.min_order_amount = Decimal("0.00")
        config.min_order_for_freeship = Decimal("0.00")
        config.shipping_tiers = [{"from_km": 0, "to_km": 5, "fee": 10000}]
        config.save()
        api_client.force_authenticate(user=user)
        payload = {
            "delivery_type": Order.DeliveryType.DELIVERY,
            "recipient_name": customer.name,
            "phone": customer.phone,
            "delivery_address": "Vị trí tạm thời",
            "delivery_latitude": str(config.latitude),
            "delivery_longitude": str(config.longitude),
            "payment_method": Order.PaymentMethod.COD,
            "items": [{"product_id": order_fixture["product"].id, "quantity": 1}],
        }
        key = str(uuid.uuid4())
        first = api_client.post(
            reverse("order-list-create"),
            payload,
            format="json",
            HTTP_IDEMPOTENCY_KEY=key,
        )
        retry = api_client.post(
            reverse("order-list-create"),
            payload,
            format="json",
            HTTP_IDEMPOTENCY_KEY=key,
        )
        assert first.status_code == 201
        assert retry.status_code in (200, 201)
        assert Address.objects.filter(customer=customer).count() == 0
        assert Order.objects.filter(customer=customer).count() == 1

    def test_create_order_ignores_client_tampered_pricing(
        self, api_client, order_fixture
    ):
        user = order_fixture["user"]
        api_client.force_authenticate(user=user)

        idempotency_key = str(uuid.uuid4())
        url = reverse("order-list-create")
        # Attacker injects tampered price into request payload
        payload = {
            "delivery_type": Order.DeliveryType.PICKUP,
            "recipient_name": "Hacker",
            "phone": "0900000000",
            "payment_method": Order.PaymentMethod.COD,
            "subtotal": 1000,
            "total_amount": 1000,
            "items": [
                {
                    "product_id": order_fixture["product"].id,
                    "quantity": 1,
                    "price": 1000,
                }
            ],
        }

        response = api_client.post(
            url, payload, format="json", HTTP_IDEMPOTENCY_KEY=idempotency_key
        )
        assert response.status_code == 201
        res = response.json()
        assert res["success"] is True
        # Must be backend calculated price (30000), not 1000
        assert Decimal(str(res["data"]["total_amount"])) == Decimal("30000")
