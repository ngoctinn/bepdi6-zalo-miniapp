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

    def test_admin_dispatch_rejects_terminal_state(self):
        """Terminal state guard in AdminOrderDispatchView."""
        from rest_framework.test import APIClient

        customer = Customer.objects.create(
            zalo_user_id="term_dispatch_cust",
            name="Khách Term Dispatch",
            phone="0911000222",
        )
        order = Order.objects.create(
            order_code="FO_TERM_DISP",
            idempotency_key="term_disp_key",
            customer=customer,
            status=Order.Status.COMPLETED,
            recipient_name="Khách Term",
            phone="0911000222",
            delivery_address="123 Đinh Tiên Hoàng",
            delivery_latitude=Decimal("10.77"),
            delivery_longitude=Decimal("106.70"),
            subtotal=Decimal("50000"),
            total_amount=Decimal("50000"),
        )
        staff_user = User.objects.create(
            username="staff_disp_01", role=User.Role.STAFF, is_staff=True
        )
        client = APIClient()
        client.force_authenticate(user=staff_user)

        res = client.post(
            f"/api/v1/admin/orders/{order.id}/dispatch",
            {
                "delivery_provider": "INTERNAL",
                "shipper_name": "Tài xế 1",
                "shipper_phone": "0900000000",
            },
            format="json",
        )
        assert res.status_code == 400
        assert res.data["error"]["code"] in [
            "ORDER_ALREADY_FINISHED",
            "TERMINAL_STATE_IMMUTABLE",
        ]

    def test_admin_payment_verify_idempotent_replay_and_terminal_guard(self):
        """Idempotent replay on verify and terminal guard on CANCELLED / COMPLETED."""
        from rest_framework.test import APIClient

        from apps.payments.models import Payment

        customer = Customer.objects.create(
            zalo_user_id="term_pay_cust", name="Khách Term Pay", phone="0911000333"
        )
        order = Order.objects.create(
            order_code="FO_TERM_PAY",
            idempotency_key="term_pay_key",
            customer=customer,
            status=Order.Status.READY,
            recipient_name="Khách Term",
            phone="0911000333",
            delivery_address="123 Đinh Tiên Hoàng",
            delivery_latitude=Decimal("10.77"),
            delivery_longitude=Decimal("106.70"),
            subtotal=Decimal("50000"),
            total_amount=Decimal("50000"),
        )
        Payment.objects.create(
            order=order,
            amount=Decimal("50000"),
            status=Payment.Status.PENDING,
            method=Payment.Method.BANK_TRANSFER,
        )
        staff_user = User.objects.create(
            username="staff_pay_01", role=User.Role.STAFF, is_staff=True
        )
        client = APIClient()
        client.force_authenticate(user=staff_user)

        # 1. Verify payment successfully with idempotency key
        headers = {"HTTP_IDEMPOTENCY_KEY": "pay_idemp_key_1"}
        res1 = client.post(
            f"/api/v1/admin/orders/{order.id}/payment/verify",
            {"actual_paid_amount": "50000"},
            format="json",
            **headers,
        )
        assert res1.status_code == 200
        pay_data = res1.data.get("data", res1.data)
        assert pay_data["status"] == "PAID"

        # 2. Replay with SAME idempotency key must succeed (200 OK) via cache
        res2 = client.post(
            f"/api/v1/admin/orders/{order.id}/payment/verify",
            {"actual_paid_amount": "50000"},
            format="json",
            **headers,
        )
        assert res2.status_code == 200
        pay_data2 = res2.data.get("data", res2.data)
        assert pay_data2["status"] == "PAID"

        # 2b. Attempting verify again with a DIFFERENT idempotency key must fail (BR-PAY-004)
        res2b = client.post(
            f"/api/v1/admin/orders/{order.id}/payment/verify",
            {"actual_paid_amount": "50000"},
            format="json",
            HTTP_IDEMPOTENCY_KEY="pay_idemp_key_different",
        )
        assert res2b.status_code == 400
        assert res2b.data["error"]["code"] == "PAYMENT_ALREADY_VERIFIED"

        # 3. Guard against CANCELLED / COMPLETED orders
        order.status = Order.Status.CANCELLED
        order.save()
        res3 = client.post(
            f"/api/v1/admin/orders/{order.id}/payment/verify",
            {"actual_paid_amount": "50000"},
            format="json",
            HTTP_IDEMPOTENCY_KEY="pay_idemp_key_2",
        )
        assert res3.status_code == 400
        assert res3.data["error"]["code"] == "INVALID_ORDER_STATUS"

    def test_voucher_usage_limit_exhaustion_on_subsequent_order(self):
        """
        Kiểm tra tính toàn vẹn của usage_limit: Khi voucher chỉ còn đúng 1 lượt dùng,
        khách hàng thứ nhất đặt đơn thành công làm cạn kiệt usage_limit,
        thì khách hàng thứ hai lập tức bị chặn với lỗi VOUCHER_USAGE_LIMIT.
        """
        now = timezone.now()
        Voucher.objects.create(
            code="SLOT_LIMIT_1",
            discount_type=Voucher.DiscountType.FIXED,
            discount_value=Decimal("20000"),
            minimum_order_value=Decimal("50000"),
            usage_limit=1,  # CHỈ CÒN ĐÚNG 1 LƯỢT DÙNG DUY NHẤT
            usage_per_customer=1,
            start_at=now - timezone.timedelta(days=1),
            end_at=now + timezone.timedelta(days=1),
            status=Voucher.Status.ACTIVE,
        )

        cust_a = Customer.objects.create(
            zalo_user_id="cust_slot_a", name="Khách A", phone="0901111111"
        )
        cust_b = Customer.objects.create(
            zalo_user_id="cust_slot_b", name="Khách B", phone="0902222222"
        )

        # 1. Khách A áp dụng thành công và chốt đơn
        with transaction.atomic():
            v_a, discount_a = VoucherService.validate_voucher(
                code="SLOT_LIMIT_1",
                order_amount=Decimal("60000"),
                customer=cust_a,
                lock=True,
            )
            order_a = Order.objects.create(
                order_code="FO_SLOT_A",
                idempotency_key="idemp_slot_a",
                customer=cust_a,
                status=Order.Status.PENDING_CONFIRMATION,
                recipient_name=cust_a.name,
                phone=cust_a.phone,
                delivery_address="123 Đinh Tiên Hoàng",
                delivery_latitude=Decimal("10.77"),
                delivery_longitude=Decimal("106.70"),
                subtotal=Decimal("60000"),
                discount=discount_a,
                total_amount=Decimal("40000"),
            )
            VoucherService.apply_voucher_to_order(
                voucher=v_a,
                customer=cust_a,
                order=order_a,
                discount_amount=discount_a,
            )

        # 2. Khách B thử áp dụng ngay sau đó -> Bắt buộc bị từ chối VOUCHER_USAGE_LIMIT
        from apps.vouchers.services import VoucherValidationError

        with pytest.raises(VoucherValidationError) as exc_info:
            with transaction.atomic():
                VoucherService.validate_voucher(
                    code="SLOT_LIMIT_1",
                    order_amount=Decimal("60000"),
                    customer=cust_b,
                    lock=True,
                )
        assert exc_info.value.code == "VOUCHER_USAGE_LIMIT"
        assert "hết lượt sử dụng" in exc_info.value.message
