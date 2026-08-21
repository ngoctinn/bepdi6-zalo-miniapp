from decimal import Decimal

import pytest
from rest_framework.test import APIClient

from apps.customers.models import Customer, User
from apps.notifications.models import Notification
from apps.notifications.tasks import (
    send_in_app_notification,
    send_zalo_oa_staff_alert,
    send_zns_order_delivering,
)
from apps.orders.models import Order


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def test_data():
    customer = Customer.objects.create(
        zalo_user_id="cust_notif_test",
        name="Lê Văn Notif",
        phone="0911002233",
    )
    staff = User.objects.create_user(
        username="staff_01",
        password="password123",
        role=User.Role.STAFF,
        zalo_user_id="staff_zalo_12345",
        status=User.Status.ACTIVE,
    )
    order = Order.objects.create(
        order_code="FO2608NOTIF01",
        idempotency_key="idemp_notif_01",
        customer=customer,
        recipient_name=customer.name,
        phone=customer.phone,
        delivery_address="123 Street",
        delivery_latitude=Decimal("10.77"),
        delivery_longitude=Decimal("106.70"),
        subtotal=Decimal("50000.00"),
        total_amount=Decimal("50000.00"),
    )
    return {"customer": customer, "staff": staff, "order": order}


@pytest.mark.django_db
def test_send_in_app_notification_task(test_data):
    customer = test_data["customer"]
    order = test_data["order"]

    notif_id = send_in_app_notification(
        customer_id=customer.id,
        order_id=order.id,
        title="Đơn hàng đã được tiếp nhận",
        message="Bếp Dì 6 đang chuẩn bị món ăn cho bạn!",
    )
    assert notif_id is not None
    notif = Notification.objects.get(pk=notif_id)
    assert notif.is_read is False
    assert notif.title == "Đơn hàng đã được tiếp nhận"


@pytest.mark.django_db
def test_send_zalo_oa_staff_alert_task(test_data):
    order = test_data["order"]
    # Without ZALO_OA_ACCESS_TOKEN configured in test, mock succeeds gracefully
    result = send_zalo_oa_staff_alert(order_id=order.id)
    assert result is True


@pytest.mark.django_db
def test_send_zns_order_delivering_gated(test_data):
    order = test_data["order"]
    # By default, ENABLE_ZNS_NOTIFICATION is False -> returns False gracefully
    result = send_zns_order_delivering(order_id=order.id)
    assert result is False


@pytest.mark.django_db
def test_notification_list_and_mark_read_api(api_client, test_data):
    customer = test_data["customer"]
    order = test_data["order"]

    notif = Notification.objects.create(
        customer=customer,
        order=order,
        title="Khuyến mãi cuối tuần",
        message="Giảm 20% toàn bộ thực đơn.",
    )

    # 1. GET /notifications
    res_list = api_client.get(
        "/api/v1/notifications",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )
    assert res_list.status_code == 200
    data = res_list.json()
    assert data["success"] is True
    assert len(data["data"]) == 1
    assert data["data"][0]["is_read"] is False

    # 2. POST /notifications/{id}/read
    res_read = api_client.post(
        f"/api/v1/notifications/{notif.id}/read",
        HTTP_X_CUSTOMER_ID=str(customer.id),
    )
    assert res_read.status_code == 200
    notif.refresh_from_db()
    assert notif.is_read is True
    assert notif.read_at is not None
