from decimal import Decimal

from django.core.management.base import BaseCommand

from apps.customers.models import Address, Customer, User
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.vouchers.models import Voucher


class Command(BaseCommand):
    help = "Seed initial sample data for Bep Di 6 manual testing"

    def handle(self, *args, **options):
        self.stdout.write("Seeding sample data...")

        # 1. Admin User
        admin_user, created = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@bepdi6.vn",
                "role": User.Role.ADMIN,
                "is_staff": True,
                "is_superuser": True,
            },
        )
        if created:
            admin_user.set_password("admin123")
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS("Created admin user (admin / admin123)")
            )
        else:
            self.stdout.write("Admin user already exists.")

        # 2. Categories
        cat_rice, _ = Category.objects.get_or_create(
            name="Cơm Tấm Truyền Thống",
            defaults={
                "description": "Hạt tấm thơm lừng, thịt ướp đậm đà chuẩn vị Sài Gòn",
                "sort_order": 1,
            },
        )
        cat_drink, _ = Category.objects.get_or_create(
            name="Nước Giải Khát & Trà",
            defaults={"description": "Thanh mát, sảng khoái", "sort_order": 2},
        )

        # 3. Products
        p1, _ = Product.objects.get_or_create(
            category=cat_rice,
            name="Cơm Tấm Sườn Bì Chả Đặc Biệt",
            defaults={
                "description": "Sườn nướng than hoa, bì giòn dai, chả trứng hấp béo ngậy",
                "price": Decimal("65000.00"),
                "status": Product.Status.AVAILABLE,
                "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
            },
        )

        p2, _ = Product.objects.get_or_create(
            category=cat_rice,
            name="Cơm Tấm Sườn Nướng Mật Ong",
            defaults={
                "description": "Sườn cốt lết dày dặn nướng sốt mật ong thơm ngon",
                "price": Decimal("50000.00"),
                "status": Product.Status.AVAILABLE,
                "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
            },
        )

        p3, _ = Product.objects.get_or_create(
            category=cat_drink,
            name="Trà Tắc Xí Muội Đường Phèn",
            defaults={
                "description": "Chua ngọt thanh mát giải nhiệt",
                "price": Decimal("20000.00"),
                "status": Product.Status.AVAILABLE,
                "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
            },
        )

        # 4. Option Groups & Options for p1
        group_egg, _ = OptionGroup.objects.get_or_create(
            product=p1,
            name="Món Thêm",
            defaults={
                "is_required": False,
                "min_select": 0,
                "max_select": 3,
                "sort_order": 1,
            },
        )
        Option.objects.get_or_create(
            option_group=group_egg,
            name="Trứng Ốp La Lòng Đào",
            defaults={"price": Decimal("8000.00"), "status": Option.Status.AVAILABLE},
        )
        Option.objects.get_or_create(
            option_group=group_egg,
            name="Canh Khổ Qua Nhồi Thịt",
            defaults={"price": Decimal("15000.00"), "status": Option.Status.AVAILABLE},
        )

        # 5. Vouchers
        Voucher.objects.get_or_create(
            code="BEPDI6CHAOBAN",
            defaults={
                "name": "Giảm 20k cho đơn từ 80k",
                "discount_type": Voucher.DiscountType.FIXED,
                "discount_value": Decimal("20000.00"),
                "minimum_order_value": Decimal("80000.00"),
                "usage_limit": 1000,
                "usage_per_customer": 1,
                "start_at": "2026-01-01T00:00:00Z",
                "end_at": "2026-12-31T23:59:59Z",
                "status": Voucher.Status.ACTIVE,
            },
        )

        # 6. Sample Customer & Address
        cust, _ = Customer.objects.get_or_create(
            zalo_user_id="mock_zalo_cust_001",
            defaults={
                "name": "Khách Hàng Mẫu",
                "phone": "0987654321",
                "avatar_url": "https://avatar.iran.liara.run/public/boy",
            },
        )
        addr, _ = Address.objects.get_or_create(
            customer=cust,
            label="Nhà riêng",
            defaults={
                "recipient_name": "Khách Hàng Mẫu",
                "phone": "0987654321",
                "address_text": "123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP.HCM",
                "latitude": Decimal("10.77450000"),
                "longitude": Decimal("106.70210000"),
                "is_default": True,
            },
        )

        # 7. Mock Sample Orders for Testing
        from apps.orders.services import OrderService

        # Đơn 1: Đơn mới chờ xác nhận (PENDING_CONFIRMATION) - Chuyển khoản VietQR
        opt_egg = Option.objects.filter(option_group=group_egg).first()
        try:
            OrderService.create_order(
                customer=cust,
                idempotency_key="idemp_seed_order_001",
                address=addr,
                items_data=[
                    {
                        "product_id": p1.id,
                        "quantity": 2,
                        "option_ids": [opt_egg.id] if opt_egg else [],
                        "note": "Ít mỡ hành, giao trước sảnh A",
                    },
                    {
                        "product_id": p3.id,
                        "quantity": 2,
                        "option_ids": [],
                        "note": "Ít đá",
                    },
                ],
                delivery_type="ASAP",
                payment_method="BANK_TRANSFER",
                voucher_code="BEPDI6CHAOBAN",
                note="Gọi điện trước khi đến 5 phút nhé quán!",
            )
            self.stdout.write(
                self.style.SUCCESS(
                    "Created sample order #1 (VietQR / PENDING_CONFIRMATION)"
                )
            )
        except Exception as e:
            self.stdout.write(f"Sample order 1 note: {e}")

        # Đơn 2: Đơn COD đang giao hàng (DELIVERING)
        try:
            order2 = OrderService.create_order(
                customer=cust,
                idempotency_key="idemp_seed_order_002",
                address=addr,
                items_data=[
                    {
                        "product_id": p2.id,
                        "quantity": 1,
                        "option_ids": [],
                        "note": "Nhiều nước mắm chua ngọt",
                    },
                ],
                delivery_type="ASAP",
                payment_method="COD",
                note="Giao gấp giùm mình",
            )
            OrderService.update_order_status(order=order2, new_status="CONFIRMED")
            OrderService.update_order_status(order=order2, new_status="PREPARING")
            OrderService.update_order_status(order=order2, new_status="READY")
            OrderService.update_order_status(order=order2, new_status="DELIVERING")
            self.stdout.write(
                self.style.SUCCESS("Created sample order #2 (COD / DELIVERING)")
            )
        except Exception as e:
            self.stdout.write(f"Sample order 2 note: {e}")

        self.stdout.write(
            self.style.SUCCESS(
                "Successfully seeded sample menu, vouchers, customer, address, and sample orders!"
            )
        )
