import uuid
from decimal import Decimal

import pytest
from django.conf import settings
from django.db import connection, reset_queries
from django.test import RequestFactory
from django.urls import reverse
from rest_framework.test import APIClient

from apps.customers.models import Customer, User
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.orders.models import Order
from apps.orders.views import CheckoutPreviewView
from apps.shipping.models import ShopConfig


@pytest.fixture
def performance_dataset(db):
    # Pre-create singleton ShopConfig
    ShopConfig.get_solo()

    customer = Customer.objects.create(
        zalo_user_id="perf_user_001",
        name="Performance Test User",
        phone="0911223344",
    )
    user = User.objects.create(
        username="perf_user_001",
        zalo_user_id=customer.zalo_user_id,
        role=User.Role.CUSTOMER,
    )
    category = Category.objects.create(name="Đồ uống & Món chính")

    products = []
    option_items = []
    for i in range(5):
        p = Product.objects.create(
            category=category,
            name=f"Món ăn số {i}",
            price=Decimal("40000"),
            status=Product.Status.AVAILABLE,
        )
        og = OptionGroup.objects.create(
            product=p,
            name=f"Topping {i}",
            is_required=False,
            max_select=2,
        )
        opt1 = Option.objects.create(
            option_group=og,
            name=f"Topping A cho món {i}",
            price=Decimal("5000"),
            status=Option.Status.AVAILABLE,
        )
        opt2 = Option.objects.create(
            option_group=og,
            name=f"Topping B cho món {i}",
            price=Decimal("10000"),
            status=Option.Status.AVAILABLE,
        )
        products.append(p)
        option_items.append((opt1, opt2))

    return {
        "customer": customer,
        "user": user,
        "products": products,
        "options": option_items,
    }


@pytest.mark.django_db
class TestOrdersQueryPerformance:
    def test_checkout_preview_query_count_is_constant(self, performance_dataset):
        """
        Preview giỏ hàng gồm 5 món x 2 options không được sinh ra N+1 query.
        Số query chỉ gồm:
        1. customer lookup
        2. ShopConfig singleton lookup
        3. Product batch query + OptionGroup prefetch + Option prefetch (3 queries)
        Tổng cộng <= 5 queries cho toàn bộ 5 sản phẩm.
        """
        settings.DEBUG = True
        customer = performance_dataset["customer"]
        items_payload = []
        for i, p in enumerate(performance_dataset["products"]):
            opt1, opt2 = performance_dataset["options"][i]
            items_payload.append(
                {
                    "product_id": p.id,
                    "quantity": 2,
                    "option_ids": [opt1.id, opt2.id],
                    "note": f"Ghi chú món {i}",
                }
            )

        payload = {
            "delivery_type": Order.DeliveryType.PICKUP,
            "items": items_payload,
        }

        rf = RequestFactory()
        req = rf.post(
            "/api/v1/checkout/preview",
            data=payload,
            content_type="application/json",
            HTTP_X_CUSTOMER_ID=str(customer.id),
        )

        reset_queries()
        response = CheckoutPreviewView.as_view()(req)
        assert response.status_code == 200

        query_count = len(connection.queries)
        assert query_count <= 5, f"Expected <= 5 queries, got {query_count}"

    def test_order_creation_query_count_is_constant(self, performance_dataset):
        """
        Tạo đơn hàng 5 món x 2 options với bulk_create không được sinh ra N single inserts.
        """
        settings.DEBUG = True
        user = performance_dataset["user"]
        items_payload = []
        for i, p in enumerate(performance_dataset["products"]):
            opt1, opt2 = performance_dataset["options"][i]
            items_payload.append(
                {
                    "product_id": p.id,
                    "quantity": 2,
                    "option_ids": [opt1.id, opt2.id],
                    "note": f"Ghi chú món {i}",
                }
            )

        payload = {
            "delivery_type": Order.DeliveryType.PICKUP,
            "recipient_name": "Test Bulk",
            "phone": "0911223344",
            "payment_method": Order.PaymentMethod.COD,
            "items": items_payload,
        }

        client = APIClient()
        client.force_authenticate(user=user)

        idempotency_key = str(uuid.uuid4())
        reset_queries()
        response = client.post(
            reverse("order-list-create"),
            payload,
            format="json",
            HTTP_IDEMPOTENCY_KEY=idempotency_key,
        )

        assert response.status_code == 201
        # Queries involved:
        # User auth, customer lookup, idempotency check, shop_config, batch products prefetch (3 queries),
        # order insert, bulk order items insert (1 query), bulk order item options insert (1 query), payment insert.
        # Total queries should be <= 14 queries (constant and bounded, no N+1 for 5 items x 2 options).
        query_count = len(connection.queries)
        assert query_count <= 14, (
            f"Expected <= 14 queries for order creation, got {query_count}"
        )
