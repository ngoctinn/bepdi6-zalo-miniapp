from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from apps.customers.models import Customer, StaffInviteToken, User


@pytest.fixture
def admin_user(db):
    user = User.objects.create_user(
        username="admin_invite_tester",
        phone="0911000111",
        zalo_user_id="zalo_admin_tester",
        role=User.Role.ADMIN,
        is_staff=True,
        is_superuser=True,
    )
    Customer.objects.create(
        zalo_user_id="zalo_admin_tester",
        name="Admin Tester",
        phone="0911000111",
    )
    return user


@pytest.fixture
def staff_user(db):
    user = User.objects.create_user(
        username="staff_invite_tester",
        phone="0911000222",
        zalo_user_id="zalo_staff_tester",
        role=User.Role.STAFF,
        is_staff=True,
    )
    Customer.objects.create(
        zalo_user_id="zalo_staff_tester",
        name="Staff Tester",
        phone="0911000222",
    )
    return user


@pytest.fixture
def customer_user(db):
    user = User.objects.create_user(
        username="customer_invite_tester",
        phone="0911000333",
        zalo_user_id="zalo_cust_tester",
        role=User.Role.CUSTOMER,
    )
    Customer.objects.create(
        zalo_user_id="zalo_cust_tester",
        name="Customer Tester",
        phone="0911000333",
    )
    return user


@pytest.fixture
def admin_client(admin_user):
    client = APIClient()
    refresh = RefreshToken.for_user(admin_user)
    refresh["role"] = admin_user.role
    refresh["zalo_user_id"] = admin_user.zalo_user_id
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.fixture
def customer_client(customer_user):
    client = APIClient()
    refresh = RefreshToken.for_user(customer_user)
    refresh["role"] = customer_user.role
    refresh["zalo_user_id"] = customer_user.zalo_user_id
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {refresh.access_token}")
    return client


@pytest.mark.django_db
class TestStaffInviteRBAC:
    def test_admin_can_create_staff_invite_token(self, admin_client, admin_user):
        """Admin có quyền tạo link mời vai trò STAFF"""
        url = "/api/v1/admin/staff/invites/"
        response = admin_client.post(url, {"role": "STAFF"}, format="json")
        assert response.status_code == status.HTTP_201_CREATED
        data = response.json()
        assert data["success"] is True
        assert "token" in data["data"]
        assert data["data"]["role"] == "STAFF"

        # Verify DB
        token_obj = StaffInviteToken.objects.get(token=data["data"]["token"])
        assert token_obj.role == User.Role.STAFF
        assert token_obj.created_by == admin_user
        assert token_obj.is_used is False
        assert token_obj.expires_at > timezone.now()

    def test_non_admin_cannot_create_invite(self, customer_client):
        """Khách hàng thường không có quyền tạo invite link"""
        url = "/api/v1/admin/staff/invites/"
        response = customer_client.post(url, {"role": "STAFF"}, format="json")
        assert response.status_code in [
            status.HTTP_403_FORBIDDEN,
            status.HTTP_401_UNAUTHORIZED,
        ]

    def test_customer_can_accept_valid_invite_token(
        self, customer_client, customer_user, admin_user
    ):
        """Khách hàng sử dụng link mời hợp lệ được nâng cấp quyền STAFF/ADMIN"""
        invite = StaffInviteToken.objects.create(
            role=User.Role.STAFF,
            created_by=admin_user,
            expires_at=timezone.now() + timedelta(minutes=15),
        )

        url = "/api/v1/staff/accept-invite/"
        response = customer_client.post(url, {"token": invite.token}, format="json")
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        assert data["data"]["role"] == "STAFF"
        assert "access_token" in data["data"]

        # User and token DB checks
        customer_user.refresh_from_db()
        assert customer_user.role == User.Role.STAFF
        assert customer_user.is_staff is True

        invite.refresh_from_db()
        assert invite.is_used is True
        assert invite.used_by == customer_user

    def test_cannot_reuse_accepted_invite_token(
        self, customer_client, customer_user, admin_user
    ):
        """Token đã dùng không thể sử dụng lại lần thứ hai (Single-use)"""
        invite = StaffInviteToken.objects.create(
            role=User.Role.STAFF,
            created_by=admin_user,
            expires_at=timezone.now() + timedelta(minutes=15),
            is_used=True,
            used_by=admin_user,
        )

        url = "/api/v1/staff/accept-invite/"
        response = customer_client.post(url, {"token": invite.token}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        data = response.json()
        assert data["success"] is False
        assert (
            "hết hạn" in data["error"]["message"].lower()
            or "đã được sử dụng" in data["error"]["message"].lower()
        )

    def test_cannot_use_expired_invite_token(
        self, customer_client, customer_user, admin_user
    ):
        """Token quá hạn không thể sử dụng"""
        invite = StaffInviteToken.objects.create(
            role=User.Role.STAFF,
            created_by=admin_user,
            expires_at=timezone.now() - timedelta(minutes=1),
            is_used=False,
        )

        url = "/api/v1/staff/accept-invite/"
        response = customer_client.post(url, {"token": invite.token}, format="json")
        assert response.status_code == status.HTTP_400_BAD_REQUEST

    def test_admin_can_list_staff_members(self, admin_client, staff_user):
        """Admin có thể xem danh sách nhân sự hiện tại"""
        url = "/api/v1/admin/staff/"
        response = admin_client.get(url)
        assert response.status_code == status.HTTP_200_OK
        data = response.json()
        assert data["success"] is True
        staff_ids = [s["id"] for s in data["data"]]
        assert staff_user.id in staff_ids

    def test_admin_can_revoke_staff_role(self, admin_client, staff_user):
        """Admin có quyền tước quyền nhân viên về CUSTOMER"""
        url = f"/api/v1/admin/staff/{staff_user.id}/"
        response = admin_client.delete(url)
        assert response.status_code == status.HTTP_200_OK

        staff_user.refresh_from_db()
        assert staff_user.role == User.Role.CUSTOMER
        assert staff_user.is_staff is False

    def test_admin_cannot_revoke_themselves(self, admin_client, admin_user):
        """Admin không thể tự tước quyền của chính mình"""
        url = f"/api/v1/admin/staff/{admin_user.id}/"
        response = admin_client.delete(url)
        assert response.status_code == status.HTTP_400_BAD_REQUEST
