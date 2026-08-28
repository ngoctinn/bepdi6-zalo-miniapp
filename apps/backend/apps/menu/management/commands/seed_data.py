from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.customers.models import Address, Customer, User
from apps.menu.models import Category, Option, OptionGroup, Product
from apps.menu.views import invalidate_menu_cache
from apps.orders.models import Order, OrderItem
from apps.vouchers.models import Voucher


class Command(BaseCommand):
    help = "Seed initial database according to official Bep Di 6 menu from ShopeeFood"

    @transaction.atomic
    def handle(self, *args, **options):
        self.stdout.write("Resetting & Seeding full Bep Di 6 menu from ShopeeFood...")

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

        # 2. Xóa sạch dữ liệu menu & order test cũ để tái tạo dữ liệu hoàn hảo, không bị đè FK
        OrderItem.objects.all().delete()
        Order.objects.all().delete()
        Option.objects.all().delete()
        OptionGroup.objects.all().delete()
        Product.objects.all().delete()
        Category.objects.all().delete()

        # 3. Định nghĩa danh mục & món ăn chuẩn xác từ ShopeeFood
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
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7ra0g-m9zehzrmoi26e4@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Thêm",
                                "is_required": False,
                                "min_select": 0,
                                "max_select": 5,
                                "options": [
                                    {
                                        "name": "Cơm thêm",
                                        "price": Decimal("9000.00"),
                                    },
                                    {
                                        "name": "Rau thêm",
                                        "price": Decimal("12000.00"),
                                    },
                                    {
                                        "name": "Mắm chưng thịt thêm 1 phần",
                                        "price": Decimal("49000.00"),
                                    },
                                    {
                                        "name": "Mắm cá lóc phile thêm 1 phần",
                                        "price": Decimal("68000.00"),
                                    },
                                    {
                                        "name": "Thịt xào mắm ruốc thêm 1 phần",
                                        "price": Decimal("48000.00"),
                                    },
                                    {
                                        "name": "Mắm tép thêm",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Ba khía trộn thêm",
                                        "price": Decimal("62000.00"),
                                    },
                                    {
                                        "name": "Tai heo ngâm chua 200g",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Canh thêm (theo ngày)",
                                        "price": Decimal("12000.00"),
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "name": "Cơm thịt xào mắm ruốc phần 1 người ăn ( đã kèm rau và cơm)",
                        "description": "1 phần mắm + 1 chén cơm + 1 phần rau",
                        "price": Decimal("62000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7ra0g-m9zetfj641lme1@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Thêm",
                                "is_required": False,
                                "min_select": 0,
                                "max_select": 5,
                                "options": [
                                    {
                                        "name": "Cơm thêm",
                                        "price": Decimal("9000.00"),
                                    },
                                    {
                                        "name": "Rau thêm",
                                        "price": Decimal("12000.00"),
                                    },
                                    {
                                        "name": "Mắm chưng thịt thêm 1 phần",
                                        "price": Decimal("49000.00"),
                                    },
                                    {
                                        "name": "Mắm cá lóc phile thêm 1 phần",
                                        "price": Decimal("68000.00"),
                                    },
                                    {
                                        "name": "Thịt xào mắm ruốc thêm 1 phần",
                                        "price": Decimal("48000.00"),
                                    },
                                    {
                                        "name": "Mắm tép thêm",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Ba khía trộn thêm",
                                        "price": Decimal("62000.00"),
                                    },
                                    {
                                        "name": "Tai heo ngâm chua 200g",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Canh thêm (theo ngày)",
                                        "price": Decimal("12000.00"),
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "name": "Cơm mắm cá lóc phile chưng tóp mỡ phần 1 người ăn đã kèm rau cơm",
                        "description": "1 phần mắm + 1 chén cơm + 1 phần rau",
                        "price": Decimal("79000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7ra0g-m9zeq6h1ewwqab@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Thêm",
                                "is_required": False,
                                "min_select": 0,
                                "max_select": 5,
                                "options": [
                                    {
                                        "name": "Cơm thêm",
                                        "price": Decimal("9000.00"),
                                    },
                                    {
                                        "name": "Rau thêm",
                                        "price": Decimal("12000.00"),
                                    },
                                    {
                                        "name": "Mắm chưng thịt thêm 1 phần",
                                        "price": Decimal("49000.00"),
                                    },
                                    {
                                        "name": "Mắm cá lóc phile thêm 1 phần",
                                        "price": Decimal("68000.00"),
                                    },
                                    {
                                        "name": "Thịt xào mắm ruốc thêm 1 phần",
                                        "price": Decimal("48000.00"),
                                    },
                                    {
                                        "name": "Mắm tép thêm",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Ba khía trộn thêm",
                                        "price": Decimal("62000.00"),
                                    },
                                    {
                                        "name": "Tai heo ngâm chua 200g",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Canh thêm (theo ngày)",
                                        "price": Decimal("12000.00"),
                                    },
                                ],
                            },
                        ],
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
                        "description": "",
                        "price": Decimal("47000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-mekx4lmuyqdd4e@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Bún trộn mắm tép thịt luộc rau sống miền Tây",
                        "description": "",
                        "price": Decimal("82000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7ras8-md5hvhj5w57gda@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Bún trộn mắm tép rau sống miền Tây",
                        "description": "",
                        "price": Decimal("62000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7ras8-md5htjg6g7n1ff@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
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
                        "description": "",
                        "price": Decimal("72000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-81ztc-mrerf5i4qj9i98@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Dụng cụ",
                                "is_required": True,
                                "min_select": 1,
                                "max_select": 1,
                                "options": [
                                    {
                                        "name": "Không lấy dụng cụ ăn uống",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Lấy dụng cụ ăn uống",
                                        "price": Decimal("3000.00"),
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "name": "Bánh canh tôm nước cốt dừa miền Tây Dì 6",
                        "description": "",
                        "price": Decimal("72000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-81ztc-mrerlj74q2o2ab@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Dụng cụ",
                                "is_required": True,
                                "min_select": 1,
                                "max_select": 1,
                                "options": [
                                    {
                                        "name": "Không lấy dụng cụ ăn uống",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Lấy dụng cụ ăn uống",
                                        "price": Decimal("3000.00"),
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "name": "Bánh canh vịt bột gạo Miền Tây Dì 6",
                        "description": "",
                        "price": Decimal("72000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-81ztc-mrergyh939j8e8@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Dụng cụ",
                                "is_required": True,
                                "min_select": 1,
                                "max_select": 1,
                                "options": [
                                    {
                                        "name": "Không lấy dụng cụ ăn uống",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Lấy dụng cụ ăn uống",
                                        "price": Decimal("3000.00"),
                                    },
                                ],
                            },
                        ],
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
                        "description": "",
                        "price": Decimal("68000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-81ztc-mrerck6j1cee9c@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Bún nước tương đậu hủ + chả giò",
                        "description": "",
                        "price": Decimal("59000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-81ztc-mrerawbpc9hd13@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                ],
            },
            {
                "category": "Đặc sản",
                "description": "Bánh mì thịt nướng, cơm sườn, mắm ba khía, tai heo chua ngọt đặc sản miền Tây",
                "sort_order": 5,
                "products": [
                    {
                        "name": "Bánh mì thịt nướng Dì 6",
                        "description": "",
                        "price": Decimal("29000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-mekx5lzkka2q75@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Mắm ba khía trộn sẵn ăn liền",
                        "description": "",
                        "price": Decimal("62000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-me2d31xl6sqp1e@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Cơm sườn nướng đậm vị",
                        "description": "",
                        "price": Decimal("72000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-mj847zpdnqpz58@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Mắm tép đu đủ",
                        "description": "",
                        "price": Decimal("59000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-me2d49xl04jo97@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Tai heo ngâm chua 200g",
                        "description": "",
                        "price": Decimal("65000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-mj849bw0svsxc9@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Cơm tép rang nước cốt dừa Dì 6 - phần 1 người ăn",
                        "description": "",
                        "price": Decimal("65000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-81ztc-mrs8xtvzpf5ye8@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Thêm",
                                "is_required": False,
                                "min_select": 0,
                                "max_select": 5,
                                "options": [
                                    {
                                        "name": "Cơm thêm",
                                        "price": Decimal("9000.00"),
                                    },
                                    {
                                        "name": "Rau thêm",
                                        "price": Decimal("12000.00"),
                                    },
                                    {
                                        "name": "Mắm chưng thịt thêm 1 phần",
                                        "price": Decimal("49000.00"),
                                    },
                                    {
                                        "name": "Mắm cá lóc phile thêm 1 phần",
                                        "price": Decimal("68000.00"),
                                    },
                                    {
                                        "name": "Thịt xào mắm ruốc thêm 1 phần",
                                        "price": Decimal("48000.00"),
                                    },
                                    {
                                        "name": "Mắm tép thêm",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Ba khía trộn thêm",
                                        "price": Decimal("62000.00"),
                                    },
                                    {
                                        "name": "Tai heo ngâm chua 200g",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Canh thêm (theo ngày)",
                                        "price": Decimal("12000.00"),
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                "category": "Combo",
                "description": "Combo ưu đãi tiết kiệm cơm, bún, bánh mì kèm nước và combo mắm tiện lợi",
                "sort_order": 6,
                "products": [
                    {
                        "name": "Combo ưu đãi 1 cơm + 1 nước",
                        "description": "",
                        "price": Decimal("75000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-mfcgwe4tvehb6d@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Thêm",
                                "is_required": False,
                                "min_select": 0,
                                "max_select": 5,
                                "options": [
                                    {
                                        "name": "Cơm thêm",
                                        "price": Decimal("9000.00"),
                                    },
                                    {
                                        "name": "Rau thêm",
                                        "price": Decimal("12000.00"),
                                    },
                                    {
                                        "name": "Mắm chưng thịt thêm 1 phần",
                                        "price": Decimal("49000.00"),
                                    },
                                    {
                                        "name": "Mắm cá lóc phile thêm 1 phần",
                                        "price": Decimal("68000.00"),
                                    },
                                    {
                                        "name": "Thịt xào mắm ruốc thêm 1 phần",
                                        "price": Decimal("48000.00"),
                                    },
                                    {
                                        "name": "Mắm tép thêm",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Ba khía trộn thêm",
                                        "price": Decimal("62000.00"),
                                    },
                                    {
                                        "name": "Tai heo ngâm chua 200g",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Canh thêm (theo ngày)",
                                        "price": Decimal("12000.00"),
                                    },
                                ],
                            },
                            {
                                "name": "Nước",
                                "is_required": True,
                                "min_select": 1,
                                "max_select": 1,
                                "options": [
                                    {
                                        "name": "Trà chanh thái xanh",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Trà tắc",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Matcha latte sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                    {
                                        "name": "Cacao latte sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                    {
                                        "name": "Khoai môn latte sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                    {
                                        "name": "Sâm dứa sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                ],
                            },
                            {
                                "name": "Cơm",
                                "is_required": True,
                                "min_select": 1,
                                "max_select": 1,
                                "options": [
                                    {
                                        "name": "Cơm mắm chưng thịt trứng",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Cơm ba rọi xào mắm ruốc",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Cơm  mắm cá lóc fillet tóp mỡ",
                                        "price": Decimal("29000.00"),
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "name": "Combo ưu đãi 1 bánh mì + 1 nước",
                        "description": "",
                        "price": Decimal("44000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-mfch3xr0w74a61@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Bánh mì",
                                "is_required": True,
                                "min_select": 1,
                                "max_select": 1,
                                "options": [
                                    {
                                        "name": "Bánh mì thịt nướng đậm vị",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Bánh mì thịt viên nướng đậm vị",
                                        "price": Decimal("0.00"),
                                    },
                                ],
                            },
                            {
                                "name": "Nước",
                                "is_required": True,
                                "min_select": 1,
                                "max_select": 1,
                                "options": [
                                    {
                                        "name": "Trà chanh thái xanh",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Trà tắc",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Matcha latte sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                    {
                                        "name": "Cacao latte sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                    {
                                        "name": "Khoai môn latte sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                    {
                                        "name": "Sâm dứa sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "name": "Combo ưu đãi 1 bún + 1 nước",
                        "description": "",
                        "price": Decimal("59000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-mfch2ro4jllb19@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Bún",
                                "is_required": True,
                                "min_select": 1,
                                "max_select": 1,
                                "options": [
                                    {
                                        "name": "Bún thịt nướng đậm vị",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Bún trộn mắm tép",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Bún trộn mắm tép thịt luộc",
                                        "price": Decimal("35000.00"),
                                    },
                                ],
                            },
                            {
                                "name": "Nước",
                                "is_required": True,
                                "min_select": 1,
                                "max_select": 1,
                                "options": [
                                    {
                                        "name": "Trà chanh thái xanh",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Trà tắc",
                                        "price": Decimal("0.00"),
                                    },
                                    {
                                        "name": "Matcha latte sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                    {
                                        "name": "Cacao latte sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                    {
                                        "name": "Khoai môn latte sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                    {
                                        "name": "Sâm dứa sữa gấu",
                                        "price": Decimal("29000.00"),
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "name": "Combo 3 hộp mắm chưng thịt ( không kèm rau cơm)",
                        "description": "",
                        "price": Decimal("152000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7ra0g-m9zewjxzm0ii79@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Thêm",
                                "is_required": False,
                                "min_select": 0,
                                "max_select": 5,
                                "options": [
                                    {
                                        "name": "Cơm thêm",
                                        "price": Decimal("9000.00"),
                                    },
                                    {
                                        "name": "Rau thêm",
                                        "price": Decimal("12000.00"),
                                    },
                                    {
                                        "name": "Mắm chưng thịt thêm 1 phần",
                                        "price": Decimal("49000.00"),
                                    },
                                    {
                                        "name": "Mắm cá lóc phile thêm 1 phần",
                                        "price": Decimal("68000.00"),
                                    },
                                    {
                                        "name": "Thịt xào mắm ruốc thêm 1 phần",
                                        "price": Decimal("48000.00"),
                                    },
                                    {
                                        "name": "Mắm tép thêm",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Ba khía trộn thêm",
                                        "price": Decimal("62000.00"),
                                    },
                                    {
                                        "name": "Tai heo ngâm chua 200g",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Canh thêm (theo ngày)",
                                        "price": Decimal("12000.00"),
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        "name": "Combo 3 hộp ba rọi xào mắm ruốc ( chưa kèm rau và cơm)",
                        "description": "Chưa kèm rau và cơm",
                        "price": Decimal("152000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7ra0g-m9zeyo9px1ju37@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [
                            {
                                "name": "Thêm",
                                "is_required": False,
                                "min_select": 0,
                                "max_select": 5,
                                "options": [
                                    {
                                        "name": "Cơm thêm",
                                        "price": Decimal("9000.00"),
                                    },
                                    {
                                        "name": "Rau thêm",
                                        "price": Decimal("12000.00"),
                                    },
                                    {
                                        "name": "Mắm chưng thịt thêm 1 phần",
                                        "price": Decimal("49000.00"),
                                    },
                                    {
                                        "name": "Mắm cá lóc phile thêm 1 phần",
                                        "price": Decimal("68000.00"),
                                    },
                                    {
                                        "name": "Thịt xào mắm ruốc thêm 1 phần",
                                        "price": Decimal("48000.00"),
                                    },
                                    {
                                        "name": "Mắm tép thêm",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Ba khía trộn thêm",
                                        "price": Decimal("62000.00"),
                                    },
                                    {
                                        "name": "Tai heo ngâm chua 200g",
                                        "price": Decimal("59000.00"),
                                    },
                                    {
                                        "name": "Canh thêm (theo ngày)",
                                        "price": Decimal("12000.00"),
                                    },
                                ],
                            },
                        ],
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
                        "description": "",
                        "price": Decimal("59000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-81ztc-mrfiq5qzrgna83@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
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
                        "description": "",
                        "price": Decimal("89000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-81ztc-mow2tgvhjy17ad@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                ],
            },
            {
                "category": "Đồ uống",
                "description": "Trà chanh, trà tắc, latte sữa gấu, đá me truyền thống giải nhiệt",
                "sort_order": 9,
                "products": [
                    {
                        "name": "Trà chanh thái xanh 700ml",
                        "description": "",
                        "price": Decimal("23000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-me2akppz3dvqe3@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Trà bí đao hạt chia",
                        "description": "",
                        "price": Decimal("29000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7ras8-mdo8005clf73b8@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Trà tắc 700ml",
                        "description": "",
                        "price": Decimal("23000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-me2alneie2vb3f@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Đá me truyền thống 700ml",
                        "description": "",
                        "price": Decimal("39000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-mj5ew11hc35y3a@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Cacao latte sữa gấu 700ml",
                        "description": "",
                        "price": Decimal("45000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-me2ajb9ast1g7c@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Matcha latte sữa gấu",
                        "description": "",
                        "price": Decimal("45000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7ras8-mdtms5dbagtte9@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Sâm dứa sữa gấu 700ml",
                        "description": "",
                        "price": Decimal("45000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-mepb6ah23tvpa4@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Khoai môn latte sữa gấu 700ml",
                        "description": "",
                        "price": Decimal("45000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-820l4-mepb51nic4jo41@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
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
                        "description": "",
                        "price": Decimal("9000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-81ztc-mmjscva8q5tt64@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Rau thêm",
                        "description": "",
                        "price": Decimal("12000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7r98o-lqn24i7chcfw9c@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                    {
                        "name": "Canh thêm",
                        "description": "",
                        "price": Decimal("12000.00"),
                        "image_url": "https://mms.img.susercontent.com/vn-11134517-7r98o-lqn24i7chcfw9c@resize_ss750x750!@crop_w750_h750_cT",
                        "option_groups": [],
                    },
                ],
            },
        ]

        # 4. Thực hiện Insert vào Database
        total_cats = 0
        total_prods = 0
        total_options = 0

        for group in menu_structure:
            cat = Category.objects.create(
                name=group["category"],
                description=group["description"],
                sort_order=group["sort_order"],
                status=Category.Status.ACTIVE,
            )
            total_cats += 1

            for p_data in group["products"]:
                p = Product.objects.create(
                    category=cat,
                    name=p_data["name"],
                    description=p_data["description"],
                    price=p_data["price"],
                    status=Product.Status.AVAILABLE,
                    image_url=p_data["image_url"],
                )
                total_prods += 1

                # Tạo Option Groups và Options
                for og_data in p_data.get("option_groups", []):
                    og = OptionGroup.objects.create(
                        product=p,
                        name=og_data["name"],
                        is_required=og_data["is_required"],
                        min_select=og_data["min_select"],
                        max_select=og_data["max_select"],
                    )
                    for opt_data in og_data.get("options", []):
                        Option.objects.create(
                            option_group=og,
                            name=opt_data["name"],
                            price=opt_data["price"],
                            status=Option.Status.AVAILABLE,
                        )
                        total_options += 1

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

        # 7. Sample Orders for Testing All Statuses and Types
        prods = list(Product.objects.filter(status=Product.Status.AVAILABLE)[:3])
        if len(prods) >= 3:
            # Order 1: Đang chuẩn bị (Giao tận nơi)
            o1 = Order.objects.create(
                order_code="BD6-260825-001",
                idempotency_key="seed_idem_001",
                customer=cust,
                status=Order.Status.PREPARING,
                delivery_type=Order.DeliveryType.DELIVERY,
                recipient_name="Nguyễn Văn A",
                phone="0909123456",
                delivery_address="45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
                delivery_latitude=Decimal("10.775000"),
                delivery_longitude=Decimal("106.700000"),
                distance_km=Decimal("1.2"),
                subtotal=prods[0].price,
                shipping_fee=Decimal("10000.00"),
                discount=Decimal("0.00"),
                total_amount=prods[0].price + Decimal("10000.00"),
                payment_method=Order.PaymentMethod.COD,
                note="Giao giờ trưa giúp mình nhé",
            )
            OrderItem.objects.create(
                order=o1,
                product=prods[0],
                product_name=prods[0].name,
                unit_price=prods[0].price,
                quantity=1,
                subtotal=prods[0].price,
            )

            # Order 2: Đang giao hàng (Hẹn giờ)
            o2 = Order.objects.create(
                order_code="BD6-260825-002",
                idempotency_key="seed_idem_002",
                customer=cust,
                status=Order.Status.DELIVERING,
                delivery_type=Order.DeliveryType.DELIVERY,
                recipient_name="Trần Thị B",
                phone="0912345678",
                delivery_address="88 Hàm Nghi, Phường Bến Nghé, Quận 1, TP.HCM",
                delivery_latitude=Decimal("10.771000"),
                delivery_longitude=Decimal("106.703000"),
                distance_km=Decimal("1.8"),
                subtotal=prods[1].price * 2,
                shipping_fee=Decimal("10000.00"),
                discount=Decimal("20000.00"),
                total_amount=(prods[1].price * 2) - Decimal("10000.00"),
                payment_method=Order.PaymentMethod.BANK_TRANSFER,
                note="Ít cay, nhiều rau sống",
            )
            OrderItem.objects.create(
                order=o2,
                product=prods[1],
                product_name=prods[1].name,
                unit_price=prods[1].price,
                quantity=2,
                subtotal=prods[1].price * 2,
            )

            # Order 3: Đã hoàn tất (Tự đến lấy)
            o3 = Order.objects.create(
                order_code="BD6-260825-003",
                idempotency_key="seed_idem_003",
                customer=cust,
                status=Order.Status.COMPLETED,
                delivery_type=Order.DeliveryType.PICKUP,
                recipient_name="Lê Văn C",
                phone="0988776655",
                delivery_address="[Nhận tại quán] 123 Đường Số 1, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
                delivery_latitude=Decimal("10.776900"),
                delivery_longitude=Decimal("106.700900"),
                subtotal=prods[0].price + prods[2].price,
                shipping_fee=Decimal("0.00"),
                discount=Decimal("0.00"),
                total_amount=prods[0].price + prods[2].price,
                payment_method=Order.PaymentMethod.COD,
                note="Ghé lấy lúc 12h",
            )
            OrderItem.objects.create(
                order=o3,
                product=prods[0],
                product_name=prods[0].name,
                unit_price=prods[0].price,
                quantity=1,
                subtotal=prods[0].price,
            )
            OrderItem.objects.create(
                order=o3,
                product=prods[2],
                product_name=prods[2].name,
                unit_price=prods[2].price,
                quantity=1,
                subtotal=prods[2].price,
            )

            # Order 4: Đã hủy
            o4 = Order.objects.create(
                order_code="BD6-260825-004",
                idempotency_key="seed_idem_004",
                customer=cust,
                status=Order.Status.CANCELLED,
                delivery_type=Order.DeliveryType.DELIVERY,
                recipient_name="Nguyễn Văn A",
                phone="0909123456",
                delivery_address="45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
                delivery_latitude=Decimal("10.775000"),
                delivery_longitude=Decimal("106.700000"),
                subtotal=prods[0].price,
                shipping_fee=Decimal("10000.00"),
                discount=Decimal("0.00"),
                total_amount=prods[0].price + Decimal("10000.00"),
                payment_method=Order.PaymentMethod.COD,
                cancellation_reason="Khách hàng bận đột xuất muốn đổi thời gian",
            )
            OrderItem.objects.create(
                order=o4,
                product=prods[0],
                product_name=prods[0].name,
                unit_price=prods[0].price,
                quantity=1,
                subtotal=prods[0].price,
            )

        # 8. Xóa Cache để cập nhật ngay lập tức cho API
        invalidate_menu_cache()

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully seeded {total_cats} Categories, {total_prods} Products, and {total_options} Options!"
            )
        )
