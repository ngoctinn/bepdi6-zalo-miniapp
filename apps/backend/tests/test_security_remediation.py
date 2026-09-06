from decimal import Decimal
from unittest.mock import patch

import pytest
from django.urls import reverse
from rest_framework.test import APIClient

from apps.customers.models import Customer, User
from apps.customers.services import AuthService
from apps.notifications.tasks import send_zalo_oa_staff_alert
from apps.orders.models import Order


@pytest.fixture
def api_client():
    return APIClient()


@pytest.mark.django_db
class TestSecurityRemediation:
    def test_zalo_oa_alert_excludes_customers(self, settings):
        """F1: Ensure send_zalo_oa_staff_alert only queries STAFF and ADMIN, never CUSTOMER."""
        settings.ZALO_OA_ACCESS_TOKEN = ""  # mock mode

        # Normal customer with zalo_user_id
        User.objects.create(
            username="cust_user_oa",
            zalo_user_id="zalo_cust_oa_1",
            role=User.Role.CUSTOMER,
            status=User.Status.ACTIVE,
        )
        customer = Customer.objects.create(
            zalo_user_id="zalo_cust_oa_1",
            name="Khách Hàng Bí Mật",
            phone="0901234567",
        )

        # Staff with zalo_user_id
        User.objects.create(
            username="staff_user_oa",
            zalo_user_id="zalo_staff_oa_1",
            role=User.Role.STAFF,
            status=User.Status.ACTIVE,
        )

        # Admin with zalo_user_id
        User.objects.create(
            username="admin_user_oa",
            zalo_user_id="zalo_admin_oa_1",
            role=User.Role.ADMIN,
            status=User.Status.ACTIVE,
        )

        order = Order.objects.create(
            order_code="FO_TEST_OA",
            idempotency_key="key_oa_1",
            customer=customer,
            recipient_name="Khách Hàng Bí Mật",
            phone="0901234567",
            delivery_address="123 Nguyễn Thị Minh Khai, Q1",
            delivery_latitude=Decimal("10.77"),
            delivery_longitude=Decimal("106.70"),
            subtotal=Decimal("150000"),
            total_amount=Decimal("150000"),
        )

        with patch("apps.notifications.tasks.logger.info") as mock_logger:
            res = send_zalo_oa_staff_alert(order.id)
            assert res is True
            mock_logger.assert_called_once()
            args, _ = mock_logger.call_args
            recipient_count = args[2]
            assert recipient_count == 2  # Only staff and admin, not customer

    def test_bola_unauthenticated_requests_blocked(self, api_client):
        """F2: Unauthenticated requests cannot read or modify orders/notifications."""
        url_orders = reverse("order-list-create")
        res = api_client.get(url_orders)
        assert res.status_code == 401

        res_post = api_client.post(url_orders, {}, format="json")
        assert res_post.status_code == 401

        url_notif = reverse("notification-list")
        res_notif = api_client.get(url_notif)
        assert res_notif.status_code == 401

    def test_bola_cross_customer_isolation(self, api_client):
        """F2: Customer B cannot view or cancel Customer A's order."""
        cust_a = Customer.objects.create(
            zalo_user_id="user_a", name="User A", phone="0901111111"
        )
        User.objects.create(
            username="zalo_user_a", zalo_user_id="user_a", role=User.Role.CUSTOMER
        )

        Customer.objects.create(
            zalo_user_id="user_b", name="User B", phone="0902222222"
        )
        user_b = User.objects.create(
            username="zalo_user_b", zalo_user_id="user_b", role=User.Role.CUSTOMER
        )

        order_a = Order.objects.create(
            order_code="FO_ORDER_A",
            idempotency_key="key_a",
            customer=cust_a,
            recipient_name="User A",
            phone="0901111111",
            delivery_address="Address A",
            delivery_latitude=Decimal("10.77"),
            delivery_longitude=Decimal("106.70"),
            subtotal=Decimal("50000"),
            total_amount=Decimal("50000"),
        )

        # Authenticate as User B
        api_client.force_authenticate(user=user_b)

        # User B attempts to read order A
        url_detail = reverse("order-detail", kwargs={"pk": order_a.id})
        res = api_client.get(url_detail)
        assert res.status_code == 404

        # User B attempts to cancel order A
        url_cancel = reverse("customer-order-cancel", kwargs={"pk": order_a.id})
        res_cancel = api_client.post(url_cancel, {"reason": "Hủy trộm"}, format="json")
        assert res_cancel.status_code == 404

    def test_privilege_escalation_prevented(self):
        """F3: Authenticating with mock tokens or specific IDs never grants STAFF or ADMIN."""
        customer, _, _ = AuthService.authenticate_or_register_zalo_customer(
            zalo_token="mock_token_priv_test",
            name="Normal User",
        )
        user = User.objects.get(username=f"zalo_{customer.zalo_user_id}")
        assert user.role == User.Role.CUSTOMER
        assert user.is_staff is False

        # Attempt with previously hardcoded ID
        with patch.object(
            AuthService,
            "exchange_zalo_tokens",
            return_value={
                "zalo_user_id": "5746042945227030407",
                "name": "Backdoor Attempt",
                "phone": "0912345678",
                "avatar_url": "",
            },
        ):
            cust2, _, _ = AuthService.authenticate_or_register_zalo_customer(
                zalo_token="fake_backdoor_token",
                name="Backdoor Attempt",
            )
            user2 = User.objects.get(username=f"zalo_{cust2.zalo_user_id}")
            assert user2.role == User.Role.CUSTOMER
            assert user2.is_staff is False
