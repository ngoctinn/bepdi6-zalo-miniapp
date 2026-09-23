from decimal import Decimal

import pytest
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Address, Customer, User


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def authenticated_customer():
    user = User.objects.create_user(
        username="zalo_test_123456",
        zalo_user_id="test_123456",
        phone="0912345678",
        role=User.Role.CUSTOMER,
    )
    customer = Customer.objects.create(
        zalo_user_id="test_123456",
        name="Test Customer",
        phone="0912345678",
        avatar_url="https://example.com/avatar.jpg",
    )
    refresh = RefreshToken.for_user(user)
    refresh["customer_id"] = customer.id
    refresh["zalo_user_id"] = customer.zalo_user_id
    refresh["role"] = user.role
    return {
        "user": user,
        "customer": customer,
        "token": str(refresh.access_token),
    }


@pytest.mark.django_db
class TestZaloAuth:
    def test_zalo_login_success(self, api_client):
        response = api_client.post(
            "/api/v1/auth/zalo",
            {
                "zalo_token": "mock_999888",
                "name": "Nguyễn Văn A",
                "avatar_url": "https://example.com/a.jpg",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        data = response.data
        assert data["success"] is True
        assert "access_token" in data["data"]
        assert "refresh_token" in data["data"]
        assert data["data"]["customer"]["zalo_user_id"] == "999888"
        assert data["data"]["customer"]["name"] == "Nguyễn Văn A"

        # Verify DB records created
        assert Customer.objects.filter(zalo_user_id="999888").exists()
        assert User.objects.filter(zalo_user_id="999888").exists()

    def test_zalo_login_with_phone_token(self, api_client):
        response = api_client.post(
            "/api/v1/auth/zalo",
            {
                "zalo_token": "mock_777666",
                "phone_token": "mock_phone_123",
                "name": "Trần Thị B",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["customer"]["phone"] == "0987654321"


@pytest.mark.django_db
class TestCustomerMe:
    def test_get_customer_me_authenticated(self, api_client, authenticated_customer):
        api_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {authenticated_customer['token']}"
        )
        response = api_client.get("/api/v1/customers/me")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        assert response.data["data"]["id"] == authenticated_customer["customer"].id
        assert response.data["data"]["name"] == "Test Customer"

    def test_get_customer_me_unauthenticated(self, api_client):
        response = api_client.get("/api/v1/customers/me")
        assert response.status_code in [
            status.HTTP_401_UNAUTHORIZED,
            status.HTTP_403_FORBIDDEN,
        ]

    def test_patch_customer_me(self, api_client, authenticated_customer):
        api_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {authenticated_customer['token']}"
        )
        response = api_client.patch(
            "/api/v1/customers/me",
            {
                "name": "Updated Name",
                "avatar_url": "https://example.com/new_avatar.jpg",
            },
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["data"]["name"] == "Updated Name"
        authenticated_customer["customer"].refresh_from_db()
        assert authenticated_customer["customer"].name == "Updated Name"


@pytest.mark.django_db
class TestAddressEndpoints:
    def test_create_first_address_auto_default(
        self, api_client, authenticated_customer
    ):
        api_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {authenticated_customer['token']}"
        )
        payload = {
            "recipient_name": "Nguyễn Văn A",
            "phone": "0912345678",
            "address_text": "123 Lê Lợi, Quận 1, TP.HCM",
            "latitude": "10.77690000",
            "longitude": "106.70090000",
            "label": "Nhà riêng",
            "is_default": False,
        }
        response = api_client.post(
            "/api/v1/customers/me/addresses", payload, format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["success"] is True
        # First address should be automatically set to is_default=True
        assert response.data["data"]["is_default"] is True

    def test_create_second_default_address_unsets_previous_default(
        self, api_client, authenticated_customer
    ):
        customer = authenticated_customer["customer"]
        addr1 = Address.objects.create(
            customer=customer,
            recipient_name="Người 1",
            phone="0911111111",
            address_text="Địa chỉ 1",
            latitude=Decimal("10.7769"),
            longitude=Decimal("106.7009"),
            is_default=True,
        )

        api_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {authenticated_customer['token']}"
        )
        payload = {
            "recipient_name": "Người 2",
            "phone": "0922222222",
            "address_text": "Địa chỉ 2",
            "latitude": "10.78000000",
            "longitude": "106.71000000",
            "is_default": True,
        }
        response = api_client.post(
            "/api/v1/customers/me/addresses", payload, format="json"
        )
        assert response.status_code == status.HTTP_201_CREATED
        assert response.data["data"]["is_default"] is True

        addr1.refresh_from_db()
        assert addr1.is_default is False

    def test_list_addresses(self, api_client, authenticated_customer):
        customer = authenticated_customer["customer"]
        Address.objects.create(
            customer=customer,
            recipient_name="Nhà",
            phone="0911111111",
            address_text="123 Đinh Tiên Hoàng",
            latitude=Decimal("10.7769"),
            longitude=Decimal("106.7009"),
            is_default=True,
        )
        api_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {authenticated_customer['token']}"
        )
        response = api_client.get("/api/v1/customers/me/addresses")
        assert response.status_code == status.HTTP_200_OK
        assert response.data["success"] is True
        assert len(response.data["data"]) == 1

    def test_delete_default_address_promotes_next(
        self, api_client, authenticated_customer
    ):
        customer = authenticated_customer["customer"]
        addr1 = Address.objects.create(
            customer=customer,
            recipient_name="Default Addr",
            phone="0911111111",
            address_text="Address 1",
            latitude=Decimal("10.7769"),
            longitude=Decimal("106.7009"),
            is_default=True,
        )
        addr2 = Address.objects.create(
            customer=customer,
            recipient_name="Secondary Addr",
            phone="0922222222",
            address_text="Address 2",
            latitude=Decimal("10.7800"),
            longitude=Decimal("106.7100"),
            is_default=False,
        )
        api_client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {authenticated_customer['token']}"
        )
        response = api_client.delete(f"/api/v1/customers/me/addresses/{addr1.id}")
        assert response.status_code == status.HTTP_200_OK
        addr2.refresh_from_db()
        assert addr2.is_default is True
