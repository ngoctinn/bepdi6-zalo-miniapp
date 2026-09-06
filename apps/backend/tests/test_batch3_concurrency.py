from decimal import Decimal

import pytest
from django.db import transaction
from django.utils import timezone

from apps.customers.models import Customer, User
from apps.menu.models import Category, Product
from apps.orders.models import Order
from apps.orders.services import InvalidStateTransitionError, OrderService
from apps.shipping.models import ShopConfig
from apps.vouchers.models import Voucher
from apps.vouchers.services import VoucherService


@pytest.mark.django_db
class TestBatch3ConcurrencyAndIntegrity:
    def test_terminal_state_guard_prevents_modifying_cancelled_order(self):
        """F7: Orders in CANCELLED state cannot transition to any other status."""
        customer = Customer.objects.create(
            zalo_user_id="term_guard_cust", name="Khách Terminal", phone="0911000111"
        )
        order = Order.objects.create(
            order_code="FO_TERM_01",
            idempotency_key="term_key_01",
            customer=customer,
            status=Order.Status.CANCELLED,
            recipient_name="Khách Terminal",
            phone="0911000111",
            delivery_address="123 Đinh Tiên Hoàng",
            delivery_latitude=Decimal("10.77"),
            delivery_longitude=Decimal("106.70"),
            subtotal=Decimal("50000"),
            total_amount=Decimal("50000"),
        )

        staff_user = User.objects.create(
            username="staff_term_01", role=User.Role.STAFF, is_staff=True
        )

        with pytest.raises(InvalidStateTransitionError) as exc_info:
            OrderService.update_order_status(
                order=order,
                new_status=Order.Status.CONFIRMED,
                user=staff_user,
            )
        assert "trạng thái kết thúc" in str(exc_info.value)

        # Also confirm_order must reject
        with pytest.raises(InvalidStateTransitionError) as exc_info2:
            OrderService.confirm_order(
                order=order,
                user=staff_user,
            )
        assert "trạng thái kết thúc" in str(exc_info2.value)

    def test_terminal_state_guard_prevents_modifying_completed_order(self):
        """F7: Orders in COMPLETED state cannot transition to any other status."""
        customer = Customer.objects.create(
            zalo_user_id="comp_guard_cust", name="Khách Completed", phone="0911000222"
        )
        order = Order.objects.create(
            order_code="FO_COMP_01",
            idempotency_key="comp_key_01",
            customer=customer,
            status=Order.Status.COMPLETED,
            recipient_name="Khách Completed",
            phone="0911000222",
            delivery_address="123 Đinh Tiên Hoàng",
            delivery_latitude=Decimal("10.77"),
            delivery_longitude=Decimal("106.70"),
            subtotal=Decimal("50000"),
            total_amount=Decimal("50000"),
        )

        with pytest.raises(InvalidStateTransitionError) as exc_info:
            OrderService.update_order_status(
                order=order,
                new_status=Order.Status.CANCELLED,
            )
        assert "trạng thái kết thúc" in str(exc_info.value)

    def test_idempotency_savepoint_preserves_outer_transaction(self):
        """F8: IntegrityError inside create_order is handled inside savepoint, preserving transaction."""
        ShopConfig.get_solo()
        customer = Customer.objects.create(
            zalo_user_id="idem_savepoint_cust", name="Khách Idem", phone="0911000333"
        )
        category = Category.objects.create(name="Ăn vặt")
        product = Product.objects.create(
            category=category,
            name="Khoai Tây Chiên",
            price=Decimal("30000"),
            status=Product.Status.AVAILABLE,
        )

        items_data = [{"product_id": product.id, "quantity": 1, "option_ids": []}]

        # Create original order
        orig_order = OrderService.create_order(
            customer=customer,
            idempotency_key="same_key_999",
            items_data=items_data,
            delivery_type=Order.DeliveryType.PICKUP,
        )

        # Concurrent call with identical idempotency key returns existing order cleanly
        duplicate_order = OrderService.create_order(
            customer=customer,
            idempotency_key="same_key_999",
            items_data=items_data,
            delivery_type=Order.DeliveryType.PICKUP,
        )

        assert duplicate_order.id == orig_order.id
        assert duplicate_order.order_code == orig_order.order_code

    def test_voucher_locking_in_transaction(self):
        """F6: VoucherService locks row with select_for_update in atomic transaction."""
        now = timezone.now()
        voucher = Voucher.objects.create(
            code="CONCUR10",
            status=Voucher.Status.ACTIVE,
            start_at=now - timezone.timedelta(days=1),
            end_at=now + timezone.timedelta(days=1),
            minimum_order_value=Decimal("50000"),
            discount_type=Voucher.DiscountType.FIXED,
            discount_value=Decimal("10000"),
            usage_limit=1,
            usage_per_customer=1,
        )
        customer = Customer.objects.create(
            zalo_user_id="voucher_lock_cust", name="Khách Voucher", phone="0911000444"
        )

        with transaction.atomic():
            v_locked, discount = VoucherService.validate_voucher(
                code="CONCUR10",
                order_amount=Decimal("60000"),
                customer=customer,
                lock=True,
            )
            assert v_locked.id == voucher.id
            assert discount == Decimal("10000")
