import pytest
from rest_framework.test import APIClient

from apps.customers.models import Customer, User


@pytest.fixture
def admin_client():
    admin = User.objects.create_user(
        username="admin_cust_test",
        password="password123",
        role=User.Role.ADMIN,
    )
    client = APIClient()
    client.force_authenticate(user=admin)
    return client


@pytest.mark.django_db
def test_admin_customer_list_and_search(admin_client):
    Customer.objects.create(
        zalo_user_id="zalo_111",
        name="Nguyễn Văn An",
        phone="0901234567",
    )
    Customer.objects.create(
        zalo_user_id="zalo_222",
        name="Trần Thị Bình",
        phone="0987654321",
    )

    # 1. List all customers
    res = admin_client.get("/api/v1/admin/customers")
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert len(data["data"]) == 2

    # Check structure
    first = data["data"][0]
    assert "id" in first
    assert "name" in first
    assert "phone" in first
    assert "total_orders" in first
    assert "total_spent" in first

    # 2. Search by name or phone
    res_search = admin_client.get("/api/v1/admin/customers?search=Nguyễn")
    assert res_search.status_code == 200
    search_data = res_search.json()["data"]
    assert len(search_data) == 1
    assert search_data[0]["name"] == "Nguyễn Văn An"

    res_phone = admin_client.get("/api/v1/admin/customers?search=0987654321")
    assert res_phone.status_code == 200
    phone_data = res_phone.json()["data"]
    assert len(phone_data) == 1
    assert phone_data[0]["name"] == "Trần Thị Bình"
