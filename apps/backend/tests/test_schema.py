from decimal import Decimal

import pytest

from apps.customers.models import Address, Customer
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.orders.models import Order
from apps.vouchers.models import Voucher


@pytest.mark.django_db
def test_create_menu_and_customer_models():
    """Test instantiating core models in SQLite/Postgres test db."""
    # 1. Customer & Address
    customer = Customer.objects.create(
        zalo_user_id="zalo_123456",
        name="Nguyễn Văn A",
        phone="0901234567",
    )
    address = Address.objects.create(
        customer=customer,
        label="Nhà",
        recipient_name="Nguyễn Văn A",
        phone="0901234567",
        address_text="123 Lê Lợi, Q.1, TP.HCM",
        latitude=Decimal("10.77690000"),
        longitude=Decimal("106.70090000"),
        is_default=True,
    )
    assert customer.addresses.count() == 1
    assert address.is_default is True

    # 2. Category, Product, OptionGroup, Option
    category = Category.objects.create(name="Cơm tấm", sort_order=1)
    product = Product.objects.create(
        category=category,
        name="Cơm sườn nướng",
        price=Decimal("45000.00"),
    )
    group = OptionGroup.objects.create(
        product=product,
        name="Thêm món",
        min_select=0,
        max_select=2,
    )
    option = Option.objects.create(
        option_group=group,
        name="Trứng ốp la",
        price=Decimal("10000.00"),
    )
    assert product.option_groups.count() == 1
    assert group.options.first() == option

    # 3. Voucher
    voucher = Voucher.objects.create(
        code="GIAM10K",
        name="Giảm 10k cho đơn đầu",
        discount_type=Voucher.DiscountType.FIXED,
        discount_value=Decimal("10000.00"),
        start_at="2026-01-01T00:00:00Z",
        end_at="2026-12-31T23:59:59Z",
    )
    assert voucher.code == "GIAM10K"

    # 4. Order (UniqueConstraint idempotency test)
    order = Order.objects.create(
        order_code="FO26080001",
        idempotency_key="idemp_unique_abc",
        customer=customer,
        recipient_name=address.recipient_name,
        phone=address.phone,
        delivery_address=address.address_text,
        delivery_latitude=address.latitude,
        delivery_longitude=address.longitude,
        subtotal=Decimal("45000.00"),
        total_amount=Decimal("45000.00"),
    )
    assert order.status == Order.Status.PENDING_CONFIRMATION

    from django.db import IntegrityError

    # Test idempotency unique constraint
    with pytest.raises(IntegrityError):
        Order.objects.create(
            order_code="FO26080002",
            idempotency_key="idemp_unique_abc",  # Duplicate key for same customer
            customer=customer,
            recipient_name=address.recipient_name,
            phone=address.phone,
            delivery_address=address.address_text,
            delivery_latitude=address.latitude,
            delivery_longitude=address.longitude,
            subtotal=Decimal("45000.00"),
            total_amount=Decimal("45000.00"),
        )
