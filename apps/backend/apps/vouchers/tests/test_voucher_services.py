from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.customers.models import Customer
from apps.orders.models import Order
from apps.vouchers.models import Voucher, VoucherUsage
from apps.vouchers.services import VoucherService, VoucherValidationError


@pytest.fixture
def customer():
    return Customer.objects.create(
        zalo_user_id="cust_test_voucher_1",
        name="Tester",
        phone="0911223344",
    )


@pytest.fixture
def active_fixed_voucher():
    now = timezone.now()
    return Voucher.objects.create(
        code="GIAM20K",
        name="Giảm 20.000đ",
        discount_type=Voucher.DiscountType.FIXED,
        discount_value=Decimal("20000.00"),
        minimum_order_value=Decimal("50000.00"),
        usage_limit=10,
        usage_per_customer=1,
        start_at=now - timedelta(days=1),
        end_at=now + timedelta(days=1),
        status=Voucher.Status.ACTIVE,
    )


@pytest.fixture
def percentage_voucher():
    now = timezone.now()
    return Voucher.objects.create(
        code="GIAM10PCT",
        name="Giảm 10% tối đa 30k",
        discount_type=Voucher.DiscountType.PERCENTAGE,
        discount_value=Decimal("10.00"),
        minimum_order_value=Decimal("100000.00"),
        maximum_discount=Decimal("30000.00"),
        usage_limit=0,
        usage_per_customer=2,
        start_at=now - timedelta(days=1),
        end_at=now + timedelta(days=1),
        status=Voucher.Status.ACTIVE,
    )


@pytest.mark.django_db
def test_validate_voucher_success_fixed(customer, active_fixed_voucher):
    voucher, discount = VoucherService.validate_voucher(
        code="GIAM20K",
        order_amount=Decimal("100000.00"),
        customer=customer,
    )
    assert voucher == active_fixed_voucher
    assert discount == Decimal("20000.00")


@pytest.mark.django_db
def test_validate_voucher_success_percentage(customer, percentage_voucher):
    # 10% of 200,000 is 20,000 (< max 30,000)
    _, discount = VoucherService.validate_voucher(
        code="GIAM10PCT",
        order_amount=Decimal("200000.00"),
        customer=customer,
    )
    assert discount == Decimal("20000.00")

    # 10% of 500,000 is 50,000 -> capped at max 30,000
    _, capped_discount = VoucherService.validate_voucher(
        code="GIAM10PCT",
        order_amount=Decimal("500000.00"),
        customer=customer,
    )
    assert capped_discount == Decimal("30000.00")


@pytest.mark.django_db
def test_validate_voucher_expired():
    now = timezone.now()
    expired = Voucher.objects.create(
        code="HETHAN",
        name="Mã hết hạn",
        discount_type=Voucher.DiscountType.FIXED,
        discount_value=Decimal("10000.00"),
        start_at=now - timedelta(days=10),
        end_at=now - timedelta(days=1),
        status=Voucher.Status.ACTIVE,
    )
    with pytest.raises(VoucherValidationError) as exc:
        VoucherService.validate_voucher(code=expired.code, order_amount=100000)
    assert exc.value.code == "VOUCHER_EXPIRED"


@pytest.mark.django_db
def test_validate_voucher_below_minimum_order(active_fixed_voucher):
    with pytest.raises(VoucherValidationError) as exc:
        VoucherService.validate_voucher(
            code=active_fixed_voucher.code,
            order_amount=Decimal("30000.00"),  # min is 50,000
        )
    assert exc.value.code == "VOUCHER_INVALID"


@pytest.mark.django_db
def test_validate_voucher_usage_limits(customer, active_fixed_voucher):
    order = Order.objects.create(
        order_code="FO_TEST_VOU_01",
        idempotency_key="idemp_vou_01",
        customer=customer,
        recipient_name="Tester",
        phone="0911223344",
        delivery_address="123 Street",
        delivery_latitude=Decimal("10.77"),
        delivery_longitude=Decimal("106.70"),
        subtotal=Decimal("100000.00"),
        discount=Decimal("20000.00"),
        total_amount=Decimal("80000.00"),
    )

    # 1st time apply
    VoucherService.apply_voucher_to_order(
        voucher=active_fixed_voucher,
        customer=customer,
        order=order,
        discount_amount=Decimal("20000.00"),
    )

    # 2nd time should fail due to usage_per_customer = 1
    with pytest.raises(VoucherValidationError) as exc:
        VoucherService.validate_voucher(
            code=active_fixed_voucher.code,
            order_amount=Decimal("100000.00"),
            customer=customer,
        )
    assert exc.value.code == "VOUCHER_USAGE_LIMIT"

    # When order cancelled -> release voucher
    VoucherService.release_voucher(order=order)
    usage = VoucherUsage.objects.get(order=order)
    assert usage.status == VoucherUsage.Status.RELEASED

    # Now customer can use it again!
    voucher, discount = VoucherService.validate_voucher(
        code=active_fixed_voucher.code,
        order_amount=Decimal("100000.00"),
        customer=customer,
    )
    assert voucher == active_fixed_voucher
    assert discount == Decimal("20000.00")
