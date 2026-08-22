import pytest
from rest_framework.test import APIClient

from apps.customers.models import Customer


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
