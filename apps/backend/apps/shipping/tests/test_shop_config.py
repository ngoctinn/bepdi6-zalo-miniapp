from decimal import Decimal

import pytest
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APIClient

from apps.customers.models import Address, Customer
from apps.menu.models import Category, Product
from apps.orders.services import OrderProcessingError, OrderService
from apps.shipping.models import ShopConfig
from apps.shipping.services import ShippingService

User = get_user_model()


@pytest.mark.django_db
class TestShopConfig:
    @pytest.fixture(autouse=True)
    def setup_data(self):
        self.client = APIClient()
        self.config = ShopConfig.get_solo()
        self.config.is_open = True
        self.config.min_order_amount = Decimal("30000.00")
        self.config.min_order_for_freeship = Decimal("150000.00")
        self.config.save()

        # Users
        self.admin_user = User.objects.create_user(
            username="admin_user",
            role=User.Role.ADMIN,
            password="adminpassword",
        )
        self.staff_user = User.objects.create_user(
            username="staff_user",
            role=User.Role.STAFF,
            password="staffpassword",
        )

        # Customer & Address (close to shop: ~1.5km)
        self.customer = Customer.objects.create(
            zalo_user_id="customer_zalo_123",
            name="Khách Hàng A",
            phone="0987654321",
        )
        self.address = Address.objects.create(
            customer=self.customer,
            label="Nhà",
            recipient_name="Khách Hàng A",
            phone="0987654321",
            address_text="Gần quán",
            latitude=Decimal("10.7800"),
            longitude=Decimal("106.7050"),
        )

        # Products
        self.category = Category.objects.create(name="Cơm")
        self.product_cheap = Product.objects.create(
            category=self.category,
            name="Trà Đá",
            price=Decimal("10000.00"),
            status=Product.Status.AVAILABLE,
        )
        self.product_main = Product.objects.create(
            category=self.category,
            name="Cơm Sườn",
            price=Decimal("50000.00"),
            status=Product.Status.AVAILABLE,
        )

    def test_public_shop_info_api(self):
        """Khách hàng có thể xem thông tin quán công khai."""
        res = self.client.get("/api/v1/shop/info")
        assert res.status_code == status.HTTP_200_OK
        data = res.json()
        assert data["success"] is True
        assert data["data"]["shop_name"] == "Bếp Dì 6"
        assert data["data"]["is_open"] is True
        assert data["data"]["prep_time_minutes"] == 20
        assert float(data["data"]["min_order_amount"]) == 30000.0
        assert float(data["data"]["min_order_for_freeship"]) == 150000.0

    def test_admin_config_permissions(self):
        """Staff chỉ có quyền xem, Admin mới có quyền cập nhật cấu hình."""
        # 1. Anonymous -> 401
        res = self.client.get("/api/v1/admin/shop/config")
        assert res.status_code == status.HTTP_401_UNAUTHORIZED

        # 2. Staff GET -> 200 OK
        self.client.force_authenticate(user=self.staff_user)
        res = self.client.get("/api/v1/admin/shop/config")
        assert res.status_code == status.HTTP_200_OK

        # 3. Staff PATCH -> 403 Forbidden
        res = self.client.patch("/api/v1/admin/shop/config", {"shop_name": "Tên Mới"})
        assert res.status_code == status.HTTP_403_FORBIDDEN

        # 4. Admin PATCH -> 200 OK
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.patch(
            "/api/v1/admin/shop/config",
            {
                "shop_name": "Bếp Dì 6 - Chi Nhánh 1",
                "vietqr_bank_id": "VCB",
                "vietqr_account_no": "999888777",
                "vietqr_account_name": "NGUYEN VAN ADMIN",
                "shipping_tiers": [
                    {"from_km": 0.0, "to_km": 3.0, "fee": 12000.0},
                    {"from_km": 3.0, "to_km": 7.0, "fee": 22000.0},
                ],
            },
            format="json",
        )
        assert res.status_code == status.HTTP_200_OK
        updated_data = res.json()["data"]
        assert updated_data["shop_name"] == "Bếp Dì 6 - Chi Nhánh 1"
        assert updated_data["vietqr_bank_id"] == "VCB"
        assert len(updated_data["shipping_tiers"]) == 2

    def test_shop_closed_blocks_ordering(self):
        """Khi is_open = False, hệ thống từ chối đặt đơn."""
        self.config.is_open = False
        self.config.save()

        with pytest.raises(OrderProcessingError) as exc_info:
            OrderService.validate_and_calculate_cart(
                customer=self.customer,
                items_data=[{"product_id": self.product_main.id, "quantity": 1}],
                address=self.address,
            )
        assert exc_info.value.code == "SHOP_CLOSED"

    def test_min_order_amount_enforcement(self):
        """Đơn hàng dưới mức tối thiểu (30.000đ) bị từ chối."""
        self.config.is_open = True
        self.config.min_order_amount = Decimal("30000.00")
        self.config.save()

        # Trà đá 10.000đ < 30.000đ
        with pytest.raises(OrderProcessingError) as exc_info:
            OrderService.validate_and_calculate_cart(
                customer=self.customer,
                items_data=[{"product_id": self.product_cheap.id, "quantity": 1}],
                address=self.address,
            )
        assert exc_info.value.code == "ORDER_AMOUNT_BELOW_MINIMUM"

    def test_dynamic_shipping_and_freeship_calculation(self):
        """Kiểm tra tính phí ship theo bậc thang và miễn phí ship khi đạt ngưỡng."""
        self.config.is_open = True
        self.config.min_order_amount = Decimal("0.00")
        self.config.min_order_for_freeship = Decimal("100000.00")
        self.config.shipping_tiers = [
            {"from_km": 0.0, "to_km": 2.0, "fee": 10000.0},
            {"from_km": 2.0, "to_km": 5.0, "fee": 18000.0},
        ]
        self.config.save()

        # 1. Đơn 50.000đ (< 100.000đ freeship) cách quán ~0.7km -> Phí ship là 10.000đ
        calc_1 = ShippingService.calculate_shipping(
            destination_lat=self.address.latitude,
            destination_lon=self.address.longitude,
            order_subtotal=Decimal("50000.00"),
        )
        assert calc_1["is_deliverable"] is True
        assert calc_1["shipping_fee"] == Decimal("10000.00")

        # 2. Đơn 150.000đ (>= 100.000đ freeship) -> Phí ship là 0đ
        calc_2 = ShippingService.calculate_shipping(
            destination_lat=self.address.latitude,
            destination_lon=self.address.longitude,
            order_subtotal=Decimal("150000.00"),
        )
        assert calc_2["is_deliverable"] is True
        assert calc_2["shipping_fee"] == Decimal("0.00")

    def test_shipping_result_distinguishes_freeship_from_out_of_radius(self):
        """A zero fee is valid only when the result explains why it is free."""
        self.config.min_order_for_freeship = Decimal("100000.00")
        self.config.max_delivery_radius_km = Decimal("5.00")
        self.config.shipping_tiers = [
            {"from_km": 0.0, "to_km": 5.0, "fee": 10000.0},
        ]
        self.config.save()

        freeship = ShippingService.calculate_shipping(
            destination_lat=self.config.latitude,
            destination_lon=self.config.longitude,
            order_subtotal=Decimal("100000.00"),
        )
        out_of_radius = ShippingService.calculate_shipping(
            destination_lat=Decimal("11.00000000"),
            destination_lon=self.config.longitude,
            order_subtotal=Decimal("100000.00"),
        )

        assert freeship["shipping_fee"] == Decimal("0.00")
        assert freeship["shipping_status"] == "FREESHIP"
        assert freeship["fee_reason"] == "ORDER_SUBTOTAL_THRESHOLD"
        assert freeship["can_checkout"] is True

        assert out_of_radius["shipping_fee"] == Decimal("0.00")
        assert out_of_radius["shipping_status"] == "OUT_OF_RADIUS"
        assert out_of_radius["fee_reason"] == "OUT_OF_DELIVERY_RADIUS"
        assert out_of_radius["can_checkout"] is False

    def test_admin_tiers_are_sorted_and_sync_the_delivery_radius(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.patch(
            "/api/v1/admin/shop/config",
            {
                "shipping_tiers": [
                    {"from_km": 10, "to_km": 15, "fee": 50000},
                    {"from_km": 0, "to_km": 2, "fee": 15000},
                    {"from_km": 5, "to_km": 10, "fee": 35000},
                    {"from_km": 2, "to_km": 5, "fee": 22000},
                ],
                "max_delivery_radius_km": "7.00",
            },
            format="json",
        )

        assert res.status_code == status.HTTP_200_OK
        data = res.json()["data"]
        assert [tier["from_km"] for tier in data["shipping_tiers"]] == [0, 2, 5, 10]
        assert data["max_delivery_radius_km"] == "15.00"

    @pytest.mark.parametrize(
        "tiers",
        [
            [{"from_km": 1, "to_km": 2, "fee": 10000}],
            [
                {"from_km": 0, "to_km": 2, "fee": 10000},
                {"from_km": 3, "to_km": 5, "fee": 15000},
            ],
            [
                {"from_km": 0, "to_km": 3, "fee": 10000},
                {"from_km": 2, "to_km": 5, "fee": 15000},
            ],
            [{"from_km": 0, "to_km": 2, "fee": -1}],
        ],
    )
    def test_admin_rejects_non_contiguous_or_negative_shipping_tiers(self, tiers):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.patch(
            "/api/v1/admin/shop/config", {"shipping_tiers": tiers}, format="json"
        )

        assert res.status_code == status.HTTP_400_BAD_REQUEST
        assert "shipping_tiers" in res.json()["error"]["details"]

    def test_partial_patch_preserves_existing_tiers_and_synced_radius(self):
        self.config.shipping_tiers = [
            {"from_km": 0, "to_km": 5, "fee": 10000},
            {"from_km": 5, "to_km": 15, "fee": 20000},
        ]
        self.config.save()
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.patch(
            "/api/v1/admin/shop/config",
            {"shop_name": "Bếp Dì 6 mới", "max_delivery_radius_km": "99.00"},
            format="json",
        )

        assert res.status_code == status.HTTP_200_OK
        assert res.json()["data"]["max_delivery_radius_km"] == "15.00"
