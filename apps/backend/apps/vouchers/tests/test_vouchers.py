from decimal import Decimal

import pytest
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from apps.customers.models import Customer
from apps.orders.models import Order
from apps.vouchers.models import Voucher
from apps.vouchers.services import VoucherService, VoucherValidationError


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def customer():
    return Customer.objects.create(
        zalo_user_id="zalo_voucher_tester",
        name="Voucher Tester",
        phone="0901234567",
    )


@pytest.fixture
def fixed_voucher():
    return Voucher.objects.create(
        code="GIAM20K",
        name="Giảm 20K cho đơn từ 100K",
        discount_type=Voucher.DiscountType.FIXED,
        discount_value=Decimal("20000.00"),
        minimum_order_value=Decimal("100000.00"),
        usage_limit=10,
        usage_per_customer=1,
        start_at=timezone.now() - timezone.timedelta(days=1),
        end_at=timezone.now() + timezone.timedelta(days=1),
        status=Voucher.Status.ACTIVE,
    )


@pytest.fixture
def percent_voucher():
    return Voucher.objects.create(
        code="GIAM20PERCENT",
        name="Giảm 20% tối đa 30K cho đơn từ 50K",
        discount_type=Voucher.DiscountType.PERCENTAGE,
        discount_value=Decimal("20.00"),
        minimum_order_value=Decimal("50000.00"),
        maximum_discount=Decimal("30000.00"),
        usage_limit=10,
        usage_per_customer=2,
        start_at=timezone.now() - timezone.timedelta(days=1),
        end_at=timezone.now() + timezone.timedelta(days=1),
        status=Voucher.Status.ACTIVE,
    )


@pytest.mark.django_db
class TestVoucherCalculations:
    def test_fixed_discount_valid(self, fixed_voucher, customer):
        voucher, discount = VoucherService.validate_voucher(
            code="GIAM20K",
            order_amount=Decimal("150000.00"),
            customer=customer,
        )
        assert voucher.code == "GIAM20K"
        assert discount == Decimal("20000.00")

    def test_percentage_discount_under_cap(self, percent_voucher, customer):
        voucher, discount = VoucherService.validate_voucher(
            code="GIAM20PERCENT",
            order_amount=Decimal("100000.00"),
            customer=customer,
        )
        assert discount == Decimal("20000.00")

    def test_percentage_discount_exceeding_cap(self, percent_voucher, customer):
        # 20% of 200,000 is 40,000 -> capped at 30,000
        voucher, discount = VoucherService.validate_voucher(
            code="GIAM20PERCENT",
            order_amount=Decimal("200000.00"),
            customer=customer,
        )
        assert discount == Decimal("30000.00")

    def test_minimum_order_value_not_met(self, fixed_voucher, customer):
        with pytest.raises(VoucherValidationError) as exc:
            VoucherService.validate_voucher(
                code="GIAM20K",
                order_amount=Decimal("80000.00"),
                customer=customer,
            )
        assert exc.value.code == "VOUCHER_INVALID"

    def test_expired_voucher(self, fixed_voucher, customer):
        fixed_voucher.end_at = timezone.now() - timezone.timedelta(hours=1)
        fixed_voucher.save()
        with pytest.raises(VoucherValidationError) as exc:
            VoucherService.validate_voucher(
                code="GIAM20K",
                order_amount=Decimal("150000.00"),
                customer=customer,
            )
        assert exc.value.code == "VOUCHER_EXPIRED"

    def test_usage_limit_exhausted(self, fixed_voucher, customer):
        fixed_voucher.usage_limit = 1
        fixed_voucher.save()

        # Create dummy order and applied usage
        order = Order.objects.create(
            order_code="FO260923000001",
            idempotency_key="idemp-1",
            customer=customer,
            subtotal=Decimal("100000.00"),
            total_amount=Decimal("80000.00"),
            delivery_latitude=Decimal("10.7769"),
            delivery_longitude=Decimal("106.7009"),
        )
        VoucherService.apply_voucher_to_order(
            voucher=fixed_voucher,
            customer=customer,
            order=order,
            discount_amount=Decimal("20000.00"),
        )

        with pytest.raises(VoucherValidationError) as exc:
            VoucherService.validate_voucher(
                code="GIAM20K",
                order_amount=Decimal("150000.00"),
                customer=customer,
            )
        assert exc.value.code == "VOUCHER_USAGE_LIMIT"


@pytest.mark.django_db
class TestVoucherApiValidate:
    def test_api_validate_endpoint_valid(self, api_client, fixed_voucher):
        response = api_client.post(
            "/api/v1/vouchers/validate",
            {"code": "GIAM20K", "order_amount": 150000},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["valid"] is True
        assert Decimal(str(response.data["discount"])) == Decimal("20000.00")

    def test_api_validate_endpoint_invalid_code(self, api_client):
        response = api_client.post(
            "/api/v1/vouchers/validate",
            {"code": "NONEXISTENT", "order_amount": 150000},
            format="json",
        )
        assert response.status_code == status.HTTP_200_OK
        assert response.data["valid"] is False
        assert response.data["reason"] == "VOUCHER_INVALID"
