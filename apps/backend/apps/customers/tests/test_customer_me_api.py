import pytest
from rest_framework.test import APIClient

from apps.customers.models import Address, Customer, User


@pytest.fixture
def auth_client():
    client = APIClient()
    user = User.objects.create_user(
        username="zalo_cust_me_test",
        password="password123",
        zalo_user_id="cust_me_test_id",
    )
    customer = Customer.objects.create(
        zalo_user_id="cust_me_test_id",
        name="Lê Hoàng",
        phone="0901234567",
    )
    client.force_authenticate(user=user)
    return {"client": client, "customer": customer, "user": user}


@pytest.mark.django_db
def test_customer_me_get_and_patch(auth_client):
    client = auth_client["client"]

    # 1. GET /customers/me
    res_get = client.get("/api/v1/customers/me")
    assert res_get.status_code == 200
    data = res_get.json()["data"]
    assert data["name"] == "Lê Hoàng"
    assert data["phone"] == "0901234567"

    # 2. PATCH /customers/me
    res_patch = client.patch(
        "/api/v1/customers/me",
        {"name": "Lê Hoàng Updated", "phone": "0988776655"},
        format="json",
    )
    assert res_patch.status_code == 200
    updated = res_patch.json()["data"]
    assert updated["name"] == "Lê Hoàng Updated"
    assert updated["phone"] == "0988776655"


@pytest.mark.django_db
def test_customer_address_crud(auth_client):
    client = auth_client["client"]

    # 1. POST /customers/me/addresses (Create first address -> is_default=True)
    payload_1 = {
        "label": "Nhà riêng",
        "recipient_name": "Lê Hoàng",
        "phone": "0901234567",
        "address_text": "123 Lê Lợi, Q.1",
        "latitude": "10.77210000",
        "longitude": "106.69830000",
        "is_default": False,
    }
    res_add1 = client.post("/api/v1/customers/me/addresses", payload_1, format="json")
    assert res_add1.status_code == 201
    addr1_id = res_add1.json()["data"]["id"]
    assert res_add1.json()["data"]["is_default"] is True

    # 2. POST second address with is_default=True -> switches addr1 to False
    payload_2 = {
        "label": "Công ty",
        "recipient_name": "Lê Hoàng",
        "phone": "0901234567",
        "address_text": "456 Nguyễn Huệ, Q.1",
        "latitude": "10.77450000",
        "longitude": "106.70210000",
        "is_default": True,
    }
    res_add2 = client.post("/api/v1/customers/me/addresses", payload_2, format="json")
    assert res_add2.status_code == 201
    addr2_id = res_add2.json()["data"]["id"]
    assert res_add2.json()["data"]["is_default"] is True

    # Check addr1 is now is_default=False
    addr1 = Address.objects.get(pk=addr1_id)
    assert addr1.is_default is False

    # 3. GET /customers/me/addresses
    res_list = client.get("/api/v1/customers/me/addresses")
    assert res_list.status_code == 200
    assert len(res_list.json()["data"]) == 2

    # 4. PATCH /customers/me/addresses/{id}
    res_patch = client.patch(
        f"/api/v1/customers/me/addresses/{addr1_id}",
        {"label": "Nhà Mẹ", "is_default": True},
        format="json",
    )
    assert res_patch.status_code == 200
    addr2 = Address.objects.get(pk=addr2_id)
    assert addr2.is_default is False

    # 5. DELETE /customers/me/addresses/{id}
    res_del = client.delete(f"/api/v1/customers/me/addresses/{addr1_id}")
    assert res_del.status_code == 200
    assert not Address.objects.filter(pk=addr1_id).exists()
