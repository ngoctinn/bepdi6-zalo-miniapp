from decimal import Decimal

import pytest
from django.db import connection, reset_queries
from django.test import RequestFactory

from apps.customers.models import Customer
from apps.menu.models import Category, Product
from apps.orders.models import Order, OrderItem
from apps.orders.views import OrderListCreateView


@pytest.mark.django_db
class TestOrderListOptimization:
    def test_order_list_query_efficiency(self):
        customer = Customer.objects.create(
            zalo_user_id="cust_opt_test",
            name="Opt Customer",
            phone="0911223344",
        )
        category = Category.objects.create(name="Mon An")
        product = Product.objects.create(
            category=category, name="Com Ga", price=Decimal("45000")
        )

        # Create 10 orders with items
        for i in range(10):
            order = Order.objects.create(
                order_code=f"FO_OPT_{i}",
                idempotency_key=f"opt_key_{i}",
                customer=customer,
                recipient_name="Opt Customer",
                phone="0911223344",
                delivery_address="123 Duong 1",
                delivery_latitude=Decimal("10.77"),
                delivery_longitude=Decimal("106.70"),
                subtotal=Decimal("45000"),
                total_amount=Decimal("45000"),
            )
            OrderItem.objects.create(
                order=order,
                product=product,
                product_name="Com Ga",
                unit_price=Decimal("45000"),
                quantity=2,
                subtotal=Decimal("90000"),
            )

        from django.conf import settings

        settings.DEBUG = True

        rf = RequestFactory()
        req = rf.get("/api/v1/orders", HTTP_X_CUSTOMER_ID=str(customer.id))

        reset_queries()
        response = OrderListCreateView.as_view()(req)

        assert response.status_code == 200
        data = response.data
        assert len(data) == 10
        assert data[0]["item_count"] == 1

        # We expect no N+1 query: at most 2 queries (1 for customer resolution, 1 for orders + annotated count)
        assert len(connection.queries) <= 3
