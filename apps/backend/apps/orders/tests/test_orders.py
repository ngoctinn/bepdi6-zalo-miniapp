from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Address, Customer, User
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.orders.models import Order
from apps.orders.services import InvalidStateTransitionError, OrderService
from apps.shipping.models import ShopConfig
from apps.vouchers.models import Voucher


@pytest.fixture
def setup_environment():
    ShopConfig.get_solo()
    user = User.objects.create_user(
        username="zalo_order_test_user",
        zalo_user_id="order_test_user",
        phone="0911223344",
        role=User.Role.CUSTOMER,
    )
    customer = Customer.objects.create(
        zalo_user_id="order_test_user",
        name="Order Tester",
        phone="0911223344",
    )
    address = Address.objects.create(
        customer=customer,
        recipient_name="Order Tester",
        phone="0911223344",
        address_text="123 Nguyễn Huệ, Quận 1, TP.HCM",
        latitude=Decimal("10.77690000"),
        longitude=Decimal("106.70090000"),
        is_default=True,
    )
    cat = Category.objects.create(name="Cơm", sort_order=1)
    prod = Product.objects.create(
        category=cat,
        name="Cơm sườn",
        price=Decimal("50000.00"),
        status=Product.Status.AVAILABLE,
    )
    group = OptionGroup.objects.create(
        product=prod,
        name="Tùy chọn",
        is_required=False,
        min_select=0,
        max_select=1,
    )
    opt = Option.objects.create(
        option_group=group,
        name="Trứng ốp la",
        price=Decimal("10000.00"),
        status=Option.Status.AVAILABLE,
    )
    voucher = Voucher.objects.create(
        code="GIAM10K",
        name="Giảm 10K",
        discount_type=Voucher.DiscountType.FIXED,
        discount_value=Decimal("10000.00"),
        minimum_order_value=Decimal("40000.00"),
        usage_limit=100,
        usage_per_customer=5,
        start_at=timezone.now() - timezone.timedelta(days=1),
        end_at=timezone.now() + timezone.timedelta(days=1),
        status=Voucher.Status.ACTIVE,
    )

    refresh = RefreshToken.for_user(user)
    refresh["customer_id"] = customer.id
    refresh["zalo_user_id"] = customer.zalo_user_id
    refresh["role"] = user.role

    return {
        "user": user,
        "customer": customer,
        "address": address,
        "product": prod,
        "option": opt,
        "voucher": voucher,
        "token": str(refresh.access_token),
    }


@pytest.fixture
def api_client(setup_environment):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {setup_environment['token']}")
    return client


@pytest.mark.django_db
class TestCheckoutPreview:
    def test_checkout_preview_calculation(self, api_client, setup_environment):
        payload = {
            "address_id": setup_environment["address"].id,
            "delivery_type": "DELIVERY",
            "items": [
                {
                    "product_id": setup_environment["product"].id,
                    "quantity": 2,
                    "option_ids": [setup_environment["option"].id],
                }
            ],
            "voucher_code": "GIAM10K",
        }
        response = api_client.post("/api/v1/checkout/preview", payload, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["success"] is True
        # Subtotal: (50,000 + 10,000) * 2 = 120,000
        assert Decimal(str(data["subtotal"])) == Decimal("120000.00")
        assert Decimal(str(data["discount"])) == Decimal("10000.00")
        assert Decimal(str(data["total_amount"])) == Decimal(
            str(data["subtotal"])
        ) + Decimal(str(data["shipping_fee"])) - Decimal("10000.00")


@pytest.mark.django_db
class TestOrderCreateAndIdempotency:
    def test_create_order_with_idempotency_key(self, api_client, setup_environment):
        payload = {
            "address_id": setup_environment["address"].id,
            "delivery_type": "DELIVERY",
            "payment_method": "COD",
            "items": [
                {
                    "product_id": setup_environment["product"].id,
                    "quantity": 1,
                    "option_ids": [setup_environment["option"].id],
                }
            ],
            "voucher_code": "GIAM10K",
            "note": "Giao giờ trưa",
        }
        idempotency_key = "idemp-key-test-12345"

        # 1. First order creation request
        response1 = api_client.post(
            "/api/v1/orders",
            payload,
            format="json",
            HTTP_IDEMPOTENCY_KEY=idempotency_key,
        )
        assert response1.status_code == status.HTTP_201_CREATED
        order_code = response1.data["data"]["order_code"]
        assert Order.objects.filter(order_code=order_code).count() == 1

        # 2. Re-send identical request with same idempotency key
        response2 = api_client.post(
            "/api/v1/orders",
            payload,
            format="json",
            HTTP_IDEMPOTENCY_KEY=idempotency_key,
        )
        assert response2.status_code in [status.HTTP_200_OK, status.HTTP_201_CREATED]
        assert response2.data["data"]["order_code"] == order_code
        # Ensure no duplicate order was created in DB
        assert Order.objects.filter(customer=setup_environment["customer"]).count() == 1


@pytest.mark.django_db
class TestOrderStateTransitions:
    def test_full_order_lifecycle(self, setup_environment):
        order = OrderService.create_order(
            customer=setup_environment["customer"],
            idempotency_key="idemp-lifecycle-1",
            address=setup_environment["address"],
            items_data=[
                {
                    "product_id": setup_environment["product"].id,
                    "quantity": 1,
                    "option_ids": [],
                }
            ],
            payment_method="COD",
        )
        assert order.status == Order.Status.PENDING_CONFIRMATION

        # PENDING_CONFIRMATION -> CONFIRMED
        order = OrderService.update_order_status(order, Order.Status.CONFIRMED)
        assert order.status == Order.Status.CONFIRMED
        assert order.confirmed_at is not None

        # CONFIRMED -> PREPARING
        order = OrderService.update_order_status(order, Order.Status.PREPARING)
        assert order.status == Order.Status.PREPARING

        # PREPARING -> READY
        order = OrderService.update_order_status(order, Order.Status.READY)
        assert order.status == Order.Status.READY

        # READY -> DELIVERING
        order = OrderService.update_order_status(order, Order.Status.DELIVERING)
        assert order.status == Order.Status.DELIVERING

        # DELIVERING -> COMPLETED
        order = OrderService.update_order_status(order, Order.Status.COMPLETED)
        assert order.status == Order.Status.COMPLETED
        assert order.completed_at is not None

    def test_terminal_state_immutability(self, setup_environment):
        order = OrderService.create_order(
            customer=setup_environment["customer"],
            idempotency_key="idemp-terminal-test",
            address=setup_environment["address"],
            items_data=[
                {
                    "product_id": setup_environment["product"].id,
                    "quantity": 1,
                    "option_ids": [],
                }
            ],
            payment_method="COD",
        )
        # Advance to COMPLETED
        order = OrderService.update_order_status(order, Order.Status.CONFIRMED)
        order = OrderService.update_order_status(order, Order.Status.PREPARING)
        order = OrderService.update_order_status(order, Order.Status.READY)
        order = OrderService.update_order_status(order, Order.Status.DELIVERING)
        order = OrderService.update_order_status(order, Order.Status.COMPLETED)

        # Attempt to modify completed order must fail
        with pytest.raises(InvalidStateTransitionError):
            OrderService.update_order_status(order, Order.Status.CANCELLED)

        with pytest.raises(InvalidStateTransitionError):
            OrderService.update_order_status(order, Order.Status.CONFIRMED)

    def test_customer_cancel_pending_order(self, api_client, setup_environment):
        order = OrderService.create_order(
            customer=setup_environment["customer"],
            idempotency_key="idemp-cancel-test",
            address=setup_environment["address"],
            items_data=[
                {
                    "product_id": setup_environment["product"].id,
                    "quantity": 1,
                    "option_ids": [],
                }
            ],
            payment_method="COD",
            voucher_code="GIAM10K",
        )
        response = api_client.post(
            f"/api/v1/orders/{order.id}/cancel",
            {"reason": "Đổi ý không mua nữa"},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        order.refresh_from_db()
        assert order.status == Order.Status.CANCELLED


@pytest.fixture
def staff_client(setup_environment):
    staff_user = User.objects.create_user(
        username="staff_test_user",
        phone="0988776655",
        role=User.Role.STAFF,
        is_staff=True,
    )
    refresh = RefreshToken.for_user(staff_user)
    refresh["role"] = staff_user.role

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.mark.django_db
class TestAdminOrderPaymentVerify:
    def test_verify_payment_missing_idempotency_key(
        self, staff_client, setup_environment
    ):
        order = OrderService.create_order(
            customer=setup_environment["customer"],
            idempotency_key="idemp-pay-verify-1",
            address=setup_environment["address"],
            items_data=[
                {
                    "product_id": setup_environment["product"].id,
                    "quantity": 1,
                    "option_ids": [],
                }
            ],
            payment_method="BANK_TRANSFER",
        )
        response = staff_client.post(
            f"/api/v1/admin/orders/{order.id}/payment/verify",
            {},
            format="json",
        )
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert response.data["error"]["code"] == "MISSING_IDEMPOTENCY_KEY"

    def test_verify_payment_success_with_idempotency_key(
        self, staff_client, setup_environment
    ):
        order = OrderService.create_order(
            customer=setup_environment["customer"],
            idempotency_key="idemp-pay-verify-2",
            address=setup_environment["address"],
            items_data=[
                {
                    "product_id": setup_environment["product"].id,
                    "quantity": 1,
                    "option_ids": [],
                }
            ],
            payment_method="BANK_TRANSFER",
        )
        response = staff_client.post(
            f"/api/v1/admin/orders/{order.id}/payment/verify",
            {},
            format="json",
            HTTP_IDEMPOTENCY_KEY="idemp-verify-staff-1",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["status"] == "PAID"

        # Double verification guard check
        response_dup = staff_client.post(
            f"/api/v1/admin/orders/{order.id}/payment/verify",
            {},
            format="json",
            HTTP_IDEMPOTENCY_KEY="idemp-verify-staff-2",
        )
        assert response_dup.status_code == status.HTTP_400_BAD_REQUEST
        assert response_dup.data["error"]["code"] == "PAYMENT_ALREADY_VERIFIED"
