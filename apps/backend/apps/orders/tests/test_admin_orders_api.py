from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.customers.models import Customer, User
from apps.orders.models import Order
from apps.payments.models import Payment


@pytest.fixture
def admin_setup():
    staff_user = User.objects.create_user(
        username="staff_admin_test",
        password="password123",
        role=User.Role.STAFF,
    )
    customer = Customer.objects.create(
        zalo_user_id="cust_admin_order_test",
        name="Nguyễn Khách",
        phone="0911556677",
    )
    order = Order.objects.create(
        order_code="FO2608ADMIN01",
        idempotency_key="idemp_admin_01",
        customer=customer,
        recipient_name=customer.name,
        phone=customer.phone,
        delivery_address="789 Admin Street",
        delivery_latitude=Decimal("10.77"),
        delivery_longitude=Decimal("106.70"),
        subtotal=Decimal("100000.00"),
        total_amount=Decimal("100000.00"),
        payment_method=Order.PaymentMethod.BANK_TRANSFER,
        status=Order.Status.PENDING_CONFIRMATION,
    )
    payment = Payment.objects.create(
        order=order,
        method=Order.PaymentMethod.BANK_TRANSFER,
        status=Payment.Status.UNPAID,
        amount=order.total_amount,
    )

    client = APIClient()
    client.force_authenticate(user=staff_user)

    return {
        "client": client,
        "staff": staff_user,
        "customer": customer,
        "order": order,
        "payment": payment,
    }


@pytest.mark.django_db
def test_admin_order_list_and_confirm(admin_setup):
    client = admin_setup["client"]
    order = admin_setup["order"]

    # 1. GET /admin/orders
    res_list = client.get("/api/v1/admin/orders")
    assert res_list.status_code == 200
    orders = res_list.json()["data"]
    assert len(orders) == 1
    assert orders[0]["order_code"] == order.order_code

    # 2. Try modifying items on VietQR order -> Rejected (BR-ORD-004)
    res_bad_confirm = client.post(
        f"/api/v1/admin/orders/{order.id}/confirm",
        {"items": [{"product_id": 1, "quantity": 2}]},
        format="json",
    )
    assert res_bad_confirm.status_code == 400
    assert res_bad_confirm.json()["error"]["code"] == "CANNOT_MODIFY_VIETQR_ORDER"

    # 3. Confirm order normally
    res_confirm = client.post(f"/api/v1/admin/orders/{order.id}/confirm")
    assert res_confirm.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.Status.CONFIRMED


@pytest.mark.django_db
def test_admin_order_status_update_and_vietqr_verify(admin_setup):
    client = admin_setup["client"]
    order = admin_setup["order"]
    payment = admin_setup["payment"]

    # 1. Update status to PREPARING
    order.status = Order.Status.CONFIRMED
    order.save()

    res_stat = client.post(
        f"/api/v1/admin/orders/{order.id}/status",
        {"status": "PREPARING"},
        format="json",
    )
    assert res_stat.status_code == 200
    order.refresh_from_db()
    assert order.status == Order.Status.PREPARING

    # 2. Verify VietQR payment with mismatch amount without note -> Rejected (BR-PAY-004)
    res_bad_pay = client.post(
        f"/api/v1/admin/orders/{order.id}/payment/verify",
        {"actual_paid_amount": "90000.00"},
        format="json",
    )
    assert res_bad_pay.status_code == 400
    assert res_bad_pay.json()["error"]["code"] == "PAYMENT_AMOUNT_MISMATCH"

    # 3. Verify VietQR payment with note -> Success
    res_verify = client.post(
        f"/api/v1/admin/orders/{order.id}/payment/verify",
        {
            "actual_paid_amount": "90000.00",
            "note": "Khách thiếu 10k, bù tiền mặt khi nhận hàng",
        },
        format="json",
    )
    assert res_verify.status_code == 200
    payment.refresh_from_db()
    assert payment.status == Payment.Status.PAID
    assert payment.actual_paid_amount == Decimal("90000.00")
    assert payment.verified_by == admin_setup["staff"]
