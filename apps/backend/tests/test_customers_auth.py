from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.customers.models import Customer, User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_customer(db):
    customer = Customer.objects.create(
        zalo_user_id="zalo_test_user_123",
        name="Nguyễn Văn Test",
        phone="0901234567",
    )
    user = User.objects.create(
        username="zalo_zalo_test_user_123",
        zalo_user_id=customer.zalo_user_id,
        role=User.Role.CUSTOMER,
    )
    return customer, user


@pytest.mark.django_db
class TestCustomerAuthAndLocation:
    def test_zalo_auth_login_dev_mock(self, api_client):
        url = reverse("auth-zalo")
        payload = {
            "zalo_token": "mock_test_token_999",
            "name": "Khách Test Mới",
        }
        response = api_client.post(url, payload, format="json")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert data["data"]["customer"]["name"] == "Khách Test Mới"

    def test_zalo_location_decode_dev_mock(self, api_client):
        url = reverse("customer-location-decode")
        payload = {"token": "dev_mock_token_123"}
        response = api_client.post(url, payload, format="json")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "latitude" in data["data"]
        assert "longitude" in data["data"]
        assert data["data"]["latitude"] == 10.762622

    @patch("apps.customers.services.requests.get")
    def test_zalo_location_decode_failure_returns_400(
        self, mock_get, api_client, settings
    ):
        settings.ZALO_APP_ID = "real_app_id"
        settings.ZALO_APP_SECRET = "real_app_secret"

        # Mock Zalo API returning error
        mock_get.return_value.json.return_value = {
            "error": -108,
            "message": "Token is invalid or expired",
        }

        url = reverse("customer-location-decode")
        payload = {"token": "real_expired_token"}
        response = api_client.post(url, payload, format="json")
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert data["error"]["code"] == "LOCATION_DECODE_FAILED"

    def test_customer_phone_update_success(self, api_client, auth_customer):
        customer, user = auth_customer
        api_client.force_authenticate(user=user)

        url = reverse("customer-phone-update")
        payload = {"phone_token": "mock_phone_token_888"}
        response = api_client.post(url, payload, format="json")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["data"]["phone"] == "0987654321"

        customer.refresh_from_db()
        assert customer.phone == "0987654321"
