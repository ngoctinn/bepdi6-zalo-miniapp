from decimal import Decimal

import pytest
from django.test import Client

from apps.customers.models import Customer
from apps.orders.models import Order
from apps.payments.models import Payment


@pytest.fixture
def webhook_client():
    return Client()


@pytest.fixture
def sample_order(db, settings):
    settings.PAYMENT_WEBHOOK_API_KEY = ""
    settings.DEBUG = True
    customer = Customer.objects.create(
        zalo_user_id="zalo_customer_test",
        name="Nguyen Van Khach",
        phone="0901234567",
    )
    order = Order.objects.create(
        customer=customer,
        order_code="24110801",
        idempotency_key="idempotency_test_123",
        delivery_type=Order.DeliveryType.PICKUP,
        status=Order.Status.PENDING_CONFIRMATION,
        payment_method=Order.PaymentMethod.BANK_TRANSFER,
        recipient_name="Khach Test",
        phone="0901234567",
        delivery_address="Quan 1, HCM",
        delivery_latitude=Decimal("10.7769"),
        delivery_longitude=Decimal("106.7009"),
        subtotal=Decimal("65000.00"),
        shipping_fee=Decimal("0.00"),
        discount=Decimal("0.00"),
        total_amount=Decimal("65000.00"),
    )
    return order


@pytest.mark.django_db
def test_sepay_webhook_success(webhook_client, sample_order):
    payload = {
        "id": 10001,
        "gateway": "MBBank",
        "transactionDate": "2026-11-08 21:00:00",
        "accountNumber": "2907200329",
        "content": "BEPDI6 24110801 chuyen tien com ga",
        "transferType": "in",
        "transferAmount": 65000,
        "referenceCode": "FT2611089999",
    }
    response = webhook_client.post(
        "/api/v1/payments/webhook/sepay/",
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True

    payment = Payment.objects.get(order=sample_order)
    assert payment.status == Payment.Status.PAID
    assert payment.actual_paid_amount == Decimal("65000.00")
    assert payment.transaction_reference == "FT2611089999"

    sample_order.refresh_from_db()
    assert sample_order.status == Order.Status.PREPARING


@pytest.mark.django_db
def test_casso_webhook_v2_success(webhook_client, sample_order):
    payload = {
        "error": 0,
        "data": {
            "id": 20002,
            "reference": "CASSO_REF_123",
            "description": "CHUYEN KHOAN DON 24110801",
            "amount": 65000,
            "accountNumber": "2907200329",
        },
    }
    response = webhook_client.post(
        "/api/v1/payments/webhook/casso/",
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["success"] is True

    payment = Payment.objects.get(order=sample_order)
    assert payment.status == Payment.Status.PAID


@pytest.mark.django_db
def test_webhook_underpaid(webhook_client, sample_order):
    payload = {
        "transferAmount": 50000,
        "content": "DON 24110801 thieu tien",
        "referenceCode": "FT_UNDERPAID",
    }
    response = webhook_client.post(
        "/api/v1/payments/webhook/",
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 200

    payment = Payment.objects.get(order=sample_order)
    assert payment.status == Payment.Status.PENDING
    assert payment.actual_paid_amount == Decimal("50000.00")
    assert "Khách chuyển thiếu" in payment.note
    sample_order.refresh_from_db()
    # Order remains PENDING_CONFIRMATION
    assert sample_order.status == Order.Status.PENDING_CONFIRMATION


@pytest.mark.django_db
def test_webhook_idempotency(webhook_client, sample_order):
    # Mark paid first
    Payment.objects.create(
        order=sample_order,
        amount=sample_order.total_amount,
        status=Payment.Status.PAID,
        method=Payment.Method.BANK_TRANSFER,
    )
    payload = {
        "transferAmount": 65000,
        "content": "24110801",
        "referenceCode": "FT_REPEAT",
    }
    response = webhook_client.post(
        "/api/v1/payments/webhook/",
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    res_data = response.json()
    assert res_data["data"]["processed"][0]["status"] == "ALREADY_PAID"


@pytest.mark.django_db
def test_webhook_fail_closed_without_auth(webhook_client, sample_order, settings):
    settings.PAYMENT_WEBHOOK_API_KEY = "test_webhook_key_12345"
    settings.DEBUG = False

    payload = {
        "transferAmount": 65000,
        "content": "24110801",
        "referenceCode": "FT_ATTACK",
    }
    # Unauthenticated request
    response = webhook_client.post(
        "/api/v1/payments/webhook/",
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"

    # Authenticated request
    response_auth = webhook_client.post(
        "/api/v1/payments/webhook/",
        data=payload,
        content_type="application/json",
        HTTP_AUTHORIZATION="Apikey test_webhook_key_12345",
    )
    assert response_auth.status_code == 200
    assert response_auth.json()["success"] is True


@pytest.mark.django_db
def test_webhook_replay_attack_rejected(webhook_client, sample_order, settings):
    settings.PAYMENT_WEBHOOK_API_KEY = ""
    settings.DEBUG = True

    # Pre-existing payment with the same reference code on another order
    another_order = Order.objects.create(
        customer=sample_order.customer,
        order_code="24110802",
        idempotency_key="idempotency_test_456",
        delivery_type=Order.DeliveryType.PICKUP,
        status=Order.Status.CONFIRMED,
        payment_method=Order.PaymentMethod.BANK_TRANSFER,
        recipient_name="Khach Test 2",
        phone="0901234567",
        delivery_address="Quan 1, HCM",
        delivery_latitude=Decimal("10.7769"),
        delivery_longitude=Decimal("106.7009"),
        subtotal=Decimal("65000.00"),
        shipping_fee=Decimal("0.00"),
        discount=Decimal("0.00"),
        total_amount=Decimal("65000.00"),
    )
    Payment.objects.create(
        order=another_order,
        amount=another_order.total_amount,
        status=Payment.Status.PAID,
        method=Payment.Method.BANK_TRANSFER,
        transaction_reference="FT_REUSED_123",
    )

    # Attempt to replay the same reference code for sample_order
    payload = {
        "transferAmount": 65000,
        "content": "24110801",
        "referenceCode": "FT_REUSED_123",
    }
    response = webhook_client.post(
        "/api/v1/payments/webhook/",
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json()["data"]["processed"][0]["status"] == "DUPLICATE_REFERENCE"

    # sample_order must NOT be marked PAID
    sample_order.refresh_from_db()
    assert sample_order.status == Order.Status.PENDING_CONFIRMATION


@pytest.mark.django_db
def test_webhook_terminal_order_skipped(webhook_client, sample_order, settings):
    settings.PAYMENT_WEBHOOK_API_KEY = ""
    settings.DEBUG = True

    sample_order.status = Order.Status.CANCELLED
    sample_order.save(update_fields=["status"])

    payload = {
        "transferAmount": 65000,
        "content": "24110801",
        "referenceCode": "FT_TERMINAL_CHECK",
    }
    response = webhook_client.post(
        "/api/v1/payments/webhook/",
        data=payload,
        content_type="application/json",
    )
    assert response.status_code == 200
    assert response.json()["data"]["processed"][0]["status"] == "IGNORED_CANCELLED"
