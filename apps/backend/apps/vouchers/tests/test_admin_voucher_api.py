import pytest
from rest_framework.test import APIClient

from apps.customers.models import User
from apps.vouchers.models import Voucher


@pytest.fixture
def admin_client():
    staff_user = User.objects.create_user(
        username="staff_voucher_admin",
        password="password123",
        role=User.Role.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=staff_user)
    return client


@pytest.mark.django_db
def test_admin_voucher_crud(admin_client):
    # 1. POST /admin/vouchers
    payload = {
        "code": "HE2026",
        "name": "Chào Hè 2026",
        "discount_type": "PERCENTAGE",
        "discount_value": "10.00",
        "minimum_order_value": "50000.00",
        "maximum_discount": "30000.00",
        "usage_limit": 100,
        "usage_per_customer": 1,
        "start_at": "2026-06-01T00:00:00Z",
        "end_at": "2026-08-31T23:59:59Z",
        "status": "ACTIVE",
    }
    res_create = admin_client.post("/api/v1/admin/vouchers", payload, format="json")
    assert res_create.status_code == 201
    voucher_id = res_create.json()["data"]["id"]

    # 2. GET /admin/vouchers
    res_list = admin_client.get("/api/v1/admin/vouchers")
    assert res_list.status_code == 200
    assert len(res_list.json()["data"]) >= 1

    # 3. PATCH /admin/vouchers/{id}
    res_patch = admin_client.patch(
        f"/api/v1/admin/vouchers/{voucher_id}",
        {"status": "INACTIVE"},
        format="json",
    )
    assert res_patch.status_code == 200
    voucher = Voucher.objects.get(pk=voucher_id)
    assert voucher.status == Voucher.Status.INACTIVE

    # 4. DELETE /admin/vouchers/{id}
    res_del = admin_client.delete(f"/api/v1/admin/vouchers/{voucher_id}")
    assert res_del.status_code == 200
    assert not Voucher.objects.filter(pk=voucher_id).exists()
