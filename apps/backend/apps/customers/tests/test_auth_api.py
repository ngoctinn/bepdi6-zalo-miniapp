import pytest
from rest_framework.test import APIClient

from apps.customers.models import Customer, User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
def test_zalo_auth_api(api_client):
    payload = {
        "zalo_token": "mock_user_123",
        "phone_token": "phone_token_sample",
        "name": "Nguyễn Văn Test",
        "avatar_url": "https://avatar.com/user.png",
    }

    response = api_client.post("/api/v1/auth/zalo", payload, format="json")
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True

    result = data["data"]
    assert "access_token" in result
    assert "refresh_token" in result
    assert result["customer"]["name"] == "Nguyễn Văn Test"
    assert result["customer"]["phone"] == "0987654321"

    # Verify customer created in DB
    customer = Customer.objects.get(zalo_user_id="zalo_user_123")
    assert customer.name == "Nguyễn Văn Test"
    assert customer.phone == "0987654321"

    # Verify associated user has Role.CUSTOMER (BR-SEC-002)
    from apps.customers.models import User

    user = User.objects.get(username="zalo_zalo_user_123")
    assert user.role == User.Role.CUSTOMER

    # Verify customer is FORBIDDEN on admin endpoints
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {result['access_token']}")
    admin_res = api_client.get("/api/v1/admin/orders")
    assert admin_res.status_code == 403


@pytest.mark.django_db
def test_zalo_location_decode_requires_authentication(api_client):
    response = api_client.post(
        "/api/v1/customers/location/decode",
        {"token": "dev_mock_location_token"},
        format="json",
    )
    assert response.status_code == 401


@pytest.mark.django_db
def test_zalo_location_decode_api(api_client):
    user = User.objects.create_user(
        username="location_decode_customer",
        zalo_user_id="location_decode_customer",
        role=User.Role.CUSTOMER,
    )
    api_client.force_authenticate(user=user)
    payload = {
        "token": "dev_mock_location_token",
    }
    response = api_client.post(
        "/api/v1/customers/location/decode", payload, format="json"
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "latitude" in data["data"]
    assert "longitude" in data["data"]
    assert "address_text" in data["data"]
    assert data["data"]["latitude"] == 10.762622
    assert data["data"]["longitude"] == 106.660172


@pytest.mark.django_db
def test_zalo_auth_links_existing_admin_by_zalo_user_id(api_client):
    # Pre-created Admin with zalo_user_id
    User.objects.create_user(
        username="admin_manager",
        zalo_user_id="zalo_admin_zalo_999",
        role=User.Role.ADMIN,
        is_staff=True,
    )

    payload = {
        "zalo_token": "mock_admin_zalo_999",
        "name": "Quản Trị Viên",
    }

    response = api_client.post("/api/v1/auth/zalo", payload, format="json")
    assert response.status_code == 200
    data = response.json()["data"]

    # Customer record role should be ADMIN
    assert data["customer"]["role"] == "ADMIN"

    # API admin orders should be accessible
    api_client.credentials(HTTP_AUTHORIZATION=f"Bearer {data['access_token']}")
    admin_res = api_client.get("/api/v1/admin/orders")
    assert admin_res.status_code == 200


@pytest.mark.django_db
def test_zalo_auth_links_existing_admin_by_phone(api_client):
    # Pre-created Admin with phone only
    admin_user = User.objects.create_user(
        username="kitchen_staff",
        phone="0912345678",
        role=User.Role.STAFF,
        is_staff=True,
    )

    payload = {
        "zalo_token": "mock_kitchen_user",
        "phone_token": "valid_token",
        "name": "Đầu Bếp Trưởng",
    }

    from unittest.mock import patch

    with patch(
        "apps.customers.services.AuthService.exchange_zalo_tokens"
    ) as mock_exchange:
        mock_exchange.return_value = {
            "zalo_user_id": "zalo_kitchen_101",
            "name": "Đầu Bếp Trưởng",
            "phone": "0912345678",
            "avatar_url": "",
        }
        response = api_client.post("/api/v1/auth/zalo", payload, format="json")

    assert response.status_code == 200
    data = response.json()["data"]
    assert data["customer"]["role"] == "STAFF"

    admin_user.refresh_from_db()
    assert admin_user.zalo_user_id == "zalo_kitchen_101"
