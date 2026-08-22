from decimal import Decimal
from django.core.management.base import BaseCommand

from apps.customers.models import Address, Customer, User
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.vouchers.models import Voucher


class Command(BaseCommand):
    help = "Seed initial database according to official Bep Di 6 menu"

    def handle(self, *args, **options):
        self.stdout.write("Resetting & Seeding full Bep Di 6 menu...")

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
            self.stdout.write(self.style.SUCCESS("Created admin user (admin / admin123)"))

        # 2. Ẩn các sản phẩm mẫu cũ thay vì xóa để tránh vi phạm ProtectedError với OrderItem
        Product.objects.all().update(status=Product.Status.INACTIVE)

        # 3. Định nghĩa danh mục & món ăn theo đúng yêu cầu
        menu_structure = [
            {
                "category": "Mắm chưng",
                "description": "Các món mắm chưng thịt trứng, mắm ruốc, mắm cá lóc phile đậm đà chuẩn vị miền Tây",
                "sort_order": 1,
                "products": [
                    {
                        "name": "Cơm mắm chưng thịt trứng phần 1 người ăn ( đã kèm rau và cơm)",
                        "description": "1 phần mắm + 1 chén cơm + 1 phần rau",
                        "price": Decimal("62000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Cơm thịt xào mắm ruốc phần 1 người ăn ( đã kèm rau và cơm)",
                        "description": "1 phần mắm + 1 chén cơm + 1 phần rau",
                        "price": Decimal("62000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Cơm mắm cá lóc phile chưng tóp mỡ phần 1 người ăn đã kèm rau cơm",
                        "description": "1 phần mắm + 1 chén cơm + 1 phần rau",
                        "price": Decimal("79000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                ],
            },
            {
                "category": "Bún",
                "description": "Bún thịt nướng, bún trộn mắm tép thịt luộc rau sống miền Tây",
                "sort_order": 2,
                "products": [
                    {
                        "name": "Bún thịt nướng đậm vị Dì 6",
                        "description": "Thịt nướng than hoa thơm lừng ướp đậm vị công thức độc quyền Dì 6",
                        "price": Decimal("47000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Bún trộn mắm tép thịt luộc rau sống miền Tây",
                        "description": "Mắm tép đỏ au đậm đà, thịt ba chỉ luộc mềm ngọt cùng đĩa rau sống xanh tươi chuẩn vị Tây Nam Bộ",
                        "price": Decimal("82000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Bún trộn mắm tép rau sống miền Tây",
                        "description": "Bún tươi trộn mắm tép đồng thơm ngon hòa quyện rau sống dân dã thanh mát",
                        "price": Decimal("62000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                ],
            },
            {
                "category": "Bánh canh",
                "description": "Bánh canh vịt nước cốt dừa, bánh canh bột gạo, bánh canh tôm miền Tây Dì 6",
                "sort_order": 3,
                "products": [
                    {
                        "name": "Bánh canh vịt nước cốt dừa miền Tây Dì 6",
                        "description": "Thịt vịt mềm ngọt, nước dùng cốt dừa béo ngậy thơm lừng",
                        "price": Decimal("66950.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Bánh canh vịt bột gạo Miền Tây Dì 6",
                        "description": "Sợi bánh canh bột gạo dai mềm nấu thịt vịt đậm đà",
                        "price": Decimal("66950.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Bánh canh tôm nước cốt dừa miền Tây Dì 6",
                        "description": "Tôm tươi ngọt thịt nấu nước cốt dừa béo thơm hấp dẫn",
                        "price": Decimal("66950.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                ],
            },
            {
                "category": "Bún nước tương",
                "description": "Bún nước tương đậu hủ, chả giò, thịt luộc thanh đạm thơm ngon",
                "sort_order": 4,
                "products": [
                    {
                        "name": "Bún nước tương đậu hủ + chả giò + thịt luộc",
                        "description": "Đầy đủ topping đậu hủ chiên, chả giò giòn rụm và thịt luộc tươi ngon",
                        "price": Decimal("68000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Bún nước tương đậu hủ + chả giò",
                        "description": "Bún tươi ăn kèm đậu hủ giòn và chả giò thơm lừng",
                        "price": Decimal("59000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                ],
            },
            {
                "category": "Đặc sản",
                "description": "Bánh mì thịt nướng, cơm sườn, mắm tép đu đủ, tai heo ngâm chua, cơm tép rang",
                "sort_order": 5,
                "products": [
                    {
                        "name": "Bánh mì thịt nướng Dì 6",
                        "description": "Bánh mì giòn rụm kẹp thịt nướng than hoa đậm đà",
                        "price": Decimal("29000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Cơm sườn nướng đậm vị",
                        "description": "Sườn cốt lết dày dặn nướng sốt đậm đà kèm mỡ hành",
                        "price": Decimal("72000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Mắm tép đu đủ",
                        "description": "Mắm tép trộn đu đủ giòn sần sật chua ngọt cay nhẹ",
                        "price": Decimal("59000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Tai heo ngâm chua 200g",
                        "description": "Tai heo giòn sần sật ngâm chua ngọt chuẩn vị nhà làm",
                        "price": Decimal("65000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Cơm tép rang nước cốt dừa Dì 6 - phần 1 người ăn",
                        "description": "Tép đồng tươi rang nước cốt dừa béo mặn ngọt đậm đà ăn kèm cơm nóng",
                        "price": Decimal("65000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                ],
            },
            {
                "category": "Combo",
                "description": "Combo ưu đãi tiết kiệm cơm, bún, bánh mì kèm nước",
                "sort_order": 6,
                "products": [
                    {
                        "name": "Combo 3 hộp ba rọi xào mắm ruốc ( chưa kèm rau và cơm)",
                        "description": "Chưa kèm rau và cơm",
                        "price": Decimal("152000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Combo ưu đãi 1 cơm + 1 nước",
                        "description": "1 phần cơm tự chọn + 1 ly nước giải khát thanh mát",
                        "price": Decimal("75000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Combo ưu đãi 1 bánh mì + 1 nước",
                        "description": "1 ổ bánh mì thịt nướng giòn rụm + 1 ly nước",
                        "price": Decimal("44000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Combo ưu đãi 1 bún + 1 nước",
                        "description": "1 tô bún thịt nướng + 1 ly nước mát",
                        "price": Decimal("59000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                ],
            },
            {
                "category": "Chay",
                "description": "Món chay thanh tịnh, dinh dưỡng",
                "sort_order": 7,
                "products": [
                    {
                        "name": "Bún nước tương đậu hủ sườn non chay",
                        "description": "Bún tươi, đậu hủ chiên giòn, sườn non chay giòn rụm chan nước tương tỏi ớt thanh đạm",
                        "price": Decimal("59000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                ],
            },
            {
                "category": "Sầu riêng",
                "description": "Sầu riêng nướng thơm lừng béo ngậy",
                "sort_order": 8,
                "products": [
                    {
                        "name": "Sầu riêng nướng 2-3 múi",
                        "description": "Múi sầu riêng nướng cháy cạnh thơm lừng, béo ngậy dẻo ngọt",
                        "price": Decimal("89000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                ],
            },
            {
                "category": "Đồ uống",
                "description": "Trà chanh, trà tắc, latte sữa gấu, đá me truyền thống",
                "sort_order": 9,
                "products": [
                    {
                        "name": "Trà chanh thái xanh 700ml",
                        "description": "Thơm trà thái xanh mát lạnh, chua ngọt sảng khoái",
                        "price": Decimal("23000.00"),
                        "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Trà bí đao hạt chia",
                        "description": "Thanh mát giải nhiệt, hạt chia bổ dưỡng",
                        "price": Decimal("29000.00"),
                        "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Trà tắc 700ml",
                        "description": "Vị tắc thơm lừng, chua thanh ngọt dịu",
                        "price": Decimal("23000.00"),
                        "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Cacao latte sữa gấu 700ml",
                        "description": "Cacao đậm đà hòa quyện sữa gấu béo ngậy thơm ngon",
                        "price": Decimal("45000.00"),
                        "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Đá me truyền thống 700ml",
                        "description": "Me dốt ngào đường, đậu phộng rang giòn, chua ngọt bùi béo",
                        "price": Decimal("39000.00"),
                        "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Matcha latte sữa gấu",
                        "description": "Matcha thơm dịu kết hợp sữa gấu béo thanh",
                        "price": Decimal("45000.00"),
                        "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Sâm dứa sữa gấu 700ml",
                        "description": "Hương sâm dứa thơm lừng ngọt ngào béo thơm",
                        "price": Decimal("45000.00"),
                        "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Khoai môn latte sữa gấu 700ml",
                        "description": "Khoai môn bùi thơm kết hợp sữa gấu đặc sánh",
                        "price": Decimal("45000.00"),
                        "image_url": "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=500&q=80",
                    },
                ],
            },
            {
                "category": "Thêm",
                "description": "Cơm thêm, rau thêm, canh thêm",
                "sort_order": 10,
                "products": [
                    {
                        "name": "Cơm thêm",
                        "description": "Chén cơm trắng dẻo thơm",
                        "price": Decimal("9000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Rau thêm",
                        "description": "Dĩa rau sống tươi mát miền Tây",
                        "price": Decimal("12000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                    {
                        "name": "Canh thêm",
                        "description": "Tô canh nóng thanh ngọt",
                        "price": Decimal("12000.00"),
                        "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
                    },
                ],
            },
        ]

        # 4. Thực hiện Insert vào Database
        total_cats = 0
        total_prods = 0
        for group in menu_structure:
            cat, _ = Category.objects.get_or_create(
                name=group["category"],
                defaults={
                    "description": group["description"],
                    "sort_order": group["sort_order"],
                },
            )
            total_cats += 1

            for p_data in group["products"]:
                p, _ = Product.objects.update_or_create(
                    name=p_data["name"],
                    defaults={
                        "category": cat,
                        "description": p_data["description"],
                        "price": p_data["price"],
                        "status": Product.Status.AVAILABLE,
                        "image_url": p_data["image_url"],
                    },
                )
                total_prods += 1

                # Gắn option group cho một số món
                if "Bún" in cat.name:
                    og, _ = OptionGroup.objects.get_or_create(
                        product=p,
                        name="Chọn thêm topping",
                        defaults={"is_required": False, "min_select": 0, "max_select": 3, "sort_order": 1},
                    )
                    Option.objects.get_or_create(option_group=og, name="Thêm Chả Giò", defaults={"price": Decimal("12000.00")})
                    Option.objects.get_or_create(option_group=og, name="Thêm Thịt Nướng", defaults={"price": Decimal("18000.00")})
                    Option.objects.get_or_create(option_group=og, name="Thêm Bún", defaults={"price": Decimal("5000.00")})

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {total_cats} Categories and {total_prods} Products!"
            )
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
        Address.objects.get_or_create(
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

        self.stdout.write(self.style.SUCCESS("Seeding completed successfully!"))
