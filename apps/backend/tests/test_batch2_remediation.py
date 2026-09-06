from decimal import Decimal

import pytest
from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory
from django.utils import timezone

from apps.customers.models import Customer, User
from apps.menu.models import Category, Product, ProductPromotion
from apps.orders.admin import OrderAdmin
from apps.orders.models import Order
from apps.orders.services import OrderProcessingError, OrderService
from apps.shipping.models import ShopConfig


@pytest.mark.django_db
class TestBatch2Remediation:
    def test_promotion_price_used_in_cart_and_order(self):
        """F4: Promotion price must be honored in cart calculation and order placement."""
        ShopConfig.get_solo()
        customer = Customer.objects.create(
            zalo_user_id="promo_cust_01",
            name="Khách Mua Khuyến Mãi",
            phone="0912345678",
        )
        category = Category.objects.create(name="Trà & Cà phê")
        product = Product.objects.create(
            category=category,
            name="Trà Sữa Trân Châu Đặc Biệt",
            price=Decimal("100000"),
            status=Product.Status.AVAILABLE,
        )
        # Create active promotion
        ProductPromotion.objects.create(
            product=product,
            promotional_price=Decimal("70000"),
            is_active=True,
            valid_from=timezone.now() - timezone.timedelta(days=1),
            valid_to=timezone.now() + timezone.timedelta(days=1),
        )

        items_data = [
            {
                "product_id": product.id,
                "quantity": 2,
                "option_ids": [],
            }
        ]

        cart_result = OrderService.validate_and_calculate_cart(
            customer=customer,
            items_data=items_data,
            delivery_type=Order.DeliveryType.PICKUP,
        )

        # 2 x 70,000 = 140,000 (not 200,000)
        assert cart_result["subtotal"] == Decimal("140000")
        assert cart_result["total_amount"] == Decimal("140000")
        assert cart_result["validated_items"][0]["unit_price"] == Decimal("70000")

        # Place order and verify snapshot
        order = OrderService.create_order(
            customer=customer,
            idempotency_key="promo_order_key_001",
            items_data=items_data,
            recipient_name="Khách Promo",
            phone="0912345678",
            delivery_type=Order.DeliveryType.PICKUP,
        )
        assert order.subtotal == Decimal("140000")
        assert order.total_amount == Decimal("140000")
        item = order.items.first()
        assert item is not None
        assert item.unit_price == Decimal("70000")

    def test_admin_bulk_cancel_action(self):
        """F5: OrderAdmin.action_cancel_orders must not crash with kwarg error."""
        customer = Customer.objects.create(
            zalo_user_id="admin_cancel_cust",
            name="Khách Hàng",
            phone="0933333333",
        )
        admin_user = User.objects.create(
            username="admin_cancel_test",
            role=User.Role.ADMIN,
            is_staff=True,
        )
        order = Order.objects.create(
            order_code="FO_ADMIN_CANCEL",
            idempotency_key="admin_cancel_key_001",
            customer=customer,
            status=Order.Status.PENDING_CONFIRMATION,
            delivery_type=Order.DeliveryType.PICKUP,
            recipient_name="Khách Hàng",
            phone="0933333333",
            delivery_address="",
            delivery_latitude=Decimal("10.77"),
            delivery_longitude=Decimal("106.70"),
            subtotal=Decimal("50000"),
            total_amount=Decimal("50000"),
        )

        from unittest.mock import MagicMock

        rf = RequestFactory()
        req = rf.post("/admin/orders/order/")
        req.user = admin_user
        req._messages = MagicMock()

        site = AdminSite()
        order_admin = OrderAdmin(Order, site)
        queryset = Order.objects.filter(id=order.id)

        # Call bulk cancel action
        order_admin.action_cancel_orders(req, queryset)

        order.refresh_from_db()
        assert order.status == Order.Status.CANCELLED

    def test_confirm_order_enforces_min_order_amount_on_edit(self):
        """Batch 2: confirm_order with edited items must enforce min_order_amount for delivery."""
        shop_config = ShopConfig.get_solo()
        shop_config.min_order_amount = Decimal("100000")
        shop_config.save()

        customer = Customer.objects.create(
            zalo_user_id="min_order_cust",
            name="Khách Hàng",
            phone="0944444444",
        )
        category = Category.objects.create(name="Món Chính")
        product = Product.objects.create(
            category=category,
            name="Cơm Tấm",
            price=Decimal("40000"),
            status=Product.Status.AVAILABLE,
        )

        staff_user = User.objects.create(
            username="staff_confirm_test",
            role=User.Role.STAFF,
            is_staff=True,
        )

        order = Order.objects.create(
            order_code="FO_MIN_ORD_TEST",
            idempotency_key="min_ord_key_001",
            customer=customer,
            status=Order.Status.PENDING_CONFIRMATION,
            delivery_type=Order.DeliveryType.DELIVERY,
            recipient_name="Khách Hàng",
            phone="0944444444",
            delivery_address="123 Lê Lợi, Q1",
            delivery_latitude=Decimal("10.77"),
            delivery_longitude=Decimal("106.70"),
            subtotal=Decimal("120000"),
            total_amount=Decimal("140000"),
            shipping_fee=Decimal("20000"),
        )

        # Staff edits items down to 1 item (40,000 < 100,000 min order)
        edited_items = [{"product_id": product.id, "quantity": 1, "option_ids": []}]

        with pytest.raises(OrderProcessingError) as exc_info:
            OrderService.confirm_order(
                order=order,
                user=staff_user,
                edited_items=edited_items,
            )
        assert exc_info.value.code == "ORDER_AMOUNT_BELOW_MINIMUM"
