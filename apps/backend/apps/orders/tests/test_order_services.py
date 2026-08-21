from decimal import Decimal

import pytest

from apps.customers.models import Address, Customer
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.orders.models import Order
from apps.orders.services import (
    InvalidStateTransitionError,
    OrderProcessingError,
    OrderService,
)
from apps.payments.models import Payment


@pytest.fixture
def test_setup():
    customer = Customer.objects.create(
        zalo_user_id="cust_order_test_1",
        name="Lê Văn B",
        phone="0988776655",
    )
    address = Address.objects.create(
        customer=customer,
        label="Công ty",
        recipient_name="Lê Văn B",
        phone="0988776655",
        address_text="123 Nguyễn Huệ, Q.1",
        latitude=Decimal("10.7721"),
        longitude=Decimal("106.6983"),
        is_default=True,
    )
    category = Category.objects.create(name="Món chính")
    product = Product.objects.create(
        category=category,
        name="Bún thịt nướng",
        price=Decimal("50000.00"),
        status=Product.Status.AVAILABLE,
    )
    group = OptionGroup.objects.create(
        product=product,
        name="Thêm",
        min_select=0,
        max_select=2,
    )
    option = Option.objects.create(
        option_group=group,
        name="Thêm chả giò",
        price=Decimal("12000.00"),
        status=Option.Status.AVAILABLE,
    )
    return {
        "customer": customer,
        "address": address,
        "product": product,
        "option": option,
    }


@pytest.mark.django_db
def test_create_order_success_with_idempotency(test_setup):
    customer = test_setup["customer"]
    address = test_setup["address"]
    product = test_setup["product"]
    option = test_setup["option"]

    items_data = [
        {
            "product_id": product.id,
            "quantity": 2,
            "option_ids": [option.id],
            "note": "Ít ớt",
        }
    ]

    idempotency_key = "idemp_test_key_100"

    # First attempt: Order created
    order1 = OrderService.create_order(
        customer=customer,
        idempotency_key=idempotency_key,
        address=address,
        items_data=items_data,
        payment_method=Order.PaymentMethod.BANK_TRANSFER,
    )

    assert order1.id is not None
    assert order1.status == Order.Status.PENDING_CONFIRMATION
    # 2 items * (50k + 12k) = 124k + 10k shipping = 134k
    assert order1.subtotal == Decimal("124000.00")
    assert order1.total_amount == Decimal("134000.00")
    assert order1.items.count() == 1
    assert order1.items.first().options.count() == 1

    # Payment record created (VietQR)
    payment = Payment.objects.get(order=order1)
    assert payment.method == Order.PaymentMethod.BANK_TRANSFER
    assert "vietqr.io" in payment.qr_code_url

    # Second attempt with same idempotency_key: returns existing order without creating duplicate
    order2 = OrderService.create_order(
        customer=customer,
        idempotency_key=idempotency_key,
        address=address,
        items_data=items_data,
        payment_method=Order.PaymentMethod.BANK_TRANSFER,
    )
    assert order1.id == order2.id
    assert Order.objects.filter(customer=customer).count() == 1


@pytest.mark.django_db
def test_order_out_of_stock_rejected(test_setup):
    customer = test_setup["customer"]
    address = test_setup["address"]
    product = test_setup["product"]
    product.status = Product.Status.OUT_OF_STOCK
    product.save()

    items_data = [{"product_id": product.id, "quantity": 1}]

    with pytest.raises(OrderProcessingError) as exc:
        OrderService.create_order(
            customer=customer,
            idempotency_key="idemp_out_of_stock",
            address=address,
            items_data=items_data,
        )
    assert exc.value.code == "PRODUCT_OUT_OF_STOCK"


@pytest.mark.django_db
def test_order_status_state_machine_transitions(test_setup):
    customer = test_setup["customer"]
    address = test_setup["address"]
    product = test_setup["product"]

    order = OrderService.create_order(
        customer=customer,
        idempotency_key="idemp_stat_01",
        address=address,
        items_data=[{"product_id": product.id, "quantity": 1}],
    )

    # PENDING -> CONFIRMED (Valid)
    order = OrderService.update_order_status(
        order=order, new_status=Order.Status.CONFIRMED
    )
    assert order.status == Order.Status.CONFIRMED
    assert order.confirmed_at is not None

    # CONFIRMED -> DELIVERING (Invalid, must be PREPARING or CANCELLED)
    with pytest.raises(InvalidStateTransitionError):
        OrderService.update_order_status(
            order=order, new_status=Order.Status.DELIVERING
        )

    # CONFIRMED -> PREPARING -> READY -> DELIVERING -> COMPLETED (Valid path)
    order = OrderService.update_order_status(
        order=order, new_status=Order.Status.PREPARING
    )
    order = OrderService.update_order_status(order=order, new_status=Order.Status.READY)
    order = OrderService.update_order_status(
        order=order, new_status=Order.Status.DELIVERING
    )
    order = OrderService.update_order_status(
        order=order, new_status=Order.Status.COMPLETED
    )
    assert order.status == Order.Status.COMPLETED
    assert order.completed_at is not None

    # COMPLETED cannot be cancelled (Terminal state)
    with pytest.raises(InvalidStateTransitionError):
        OrderService.update_order_status(order=order, new_status=Order.Status.CANCELLED)


@pytest.mark.django_db
def test_order_option_group_bounds_validation(test_setup):
    customer = test_setup["customer"]
    address = test_setup["address"]
    product = test_setup["product"]
    option = test_setup["option"]

    # Make option group required with min=1, max=1
    group = test_setup["product"].option_groups.first()
    group.is_required = True
    group.min_select = 1
    group.max_select = 1
    group.save()

    # 1. Missing required option selection -> Error
    with pytest.raises(OrderProcessingError) as exc:
        OrderService.create_order(
            customer=customer,
            idempotency_key="idemp_missing_opt",
            address=address,
            items_data=[{"product_id": product.id, "quantity": 1, "option_ids": []}],
        )
    assert exc.value.code == "INVALID_OPTION"

    # 2. Duplicate option id selection -> Error
    with pytest.raises(OrderProcessingError) as exc_dup:
        OrderService.create_order(
            customer=customer,
            idempotency_key="idemp_dup_opt",
            address=address,
            items_data=[
                {
                    "product_id": product.id,
                    "quantity": 1,
                    "option_ids": [option.id, option.id],
                }
            ],
        )
    assert exc_dup.value.code == "INVALID_OPTION"

    # 3. Valid single option -> Success
    valid_order = OrderService.create_order(
        customer=customer,
        idempotency_key="idemp_valid_opt",
        address=address,
        items_data=[
            {"product_id": product.id, "quantity": 1, "option_ids": [option.id]}
        ],
    )
    assert valid_order.id is not None
