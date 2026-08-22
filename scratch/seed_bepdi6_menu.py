import os
import sys

import django

# Setup Django Environment
sys.path.append("/home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/backend")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from decimal import Decimal

from apps.menu.models import Category, Option, OptionGroup, Product
from apps.shipping.models import ShopConfig


def run():
    print("🚀 Đang cấu hình thông tin quán ShopConfig...")
    config = ShopConfig.get_solo()
    config.shop_name = "Bếp Dì 6 - Mắm Chưng Miền Tây"
    config.hotline = "0901234567"
    config.address_text = "112/3 Bùi Quang Là, Phường 12, Quận Gò Vấp, TP. Hồ Chí Minh"
    config.latitude = Decimal("10.835265")
    config.longitude = Decimal("106.643210")
    config.is_open = True
    config.open_time = "06:30:00"
    config.close_time = "21:30:00"
    config.min_order_amount = Decimal("30000")
    config.min_order_for_freeship = Decimal("200000")
    config.announcement_banner = "Freeship đơn từ 200k • Giao nhanh 30-45 phút"

    # Bảng phí ship bậc thang JSON
    config.shipping_tiers = [
        {"from_km": 0.0, "to_km": 2.0, "fee": 15000.0},
        {"from_km": 2.0, "to_km": 5.0, "fee": 22000.0},
        {"from_km": 5.0, "to_km": 10.0, "fee": 35000.0},
        {"from_km": 10.0, "to_km": 15.0, "fee": 50000.0},
    ]
    config.save()
    print("✅ Đã cập nhật ShopConfig & Shipping Tiers!")

    print("🍳 Đang cập nhật Danh mục & Món ăn...")

    # 1. Danh mục
    cat_combo, _ = Category.objects.get_or_create(
        name="Combo Tiết Kiệm",
        defaults={
            "description": "Combo món chính kèm nước uống tiết kiệm",
            "sort_order": 1,
            "status": "ACTIVE",
            "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80",
        },
    )

    cat_bun, _ = Category.objects.get_or_create(
        name="Bún & Món Trộn Miền Tây",
        defaults={
            "description": "Bún nước tương, bún mắm tép, bún thịt nướng đậm vị",
            "sort_order": 2,
            "status": "ACTIVE",
            "image_url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=400&auto=format&fit=crop&q=80",
        },
    )

    cat_mam, _ = Category.objects.get_or_create(
        name="Món Đóng Hộp & Mắm Chưng",
        defaults={
            "description": "Mắm chưng thịt, ba rọi xào mắm ruốc chuẩn vị gia truyền",
            "sort_order": 3,
            "status": "ACTIVE",
            "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&auto=format&fit=crop&q=80",
        },
    )

    cat_nuoc, _ = Category.objects.get_or_create(
        name="Trà Sữa Sữa Gấu & Nước Uống",
        defaults={
            "description": "Latte sữa gấu mát lạnh sảng khoái 700ml",
            "sort_order": 4,
            "status": "ACTIVE",
            "image_url": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&auto=format&fit=crop&q=80",
        },
    )

    cat_trangmieng, _ = Category.objects.get_or_create(
        name="Món Đặc Biệt & Tráng Miệng",
        defaults={
            "description": "Sầu riêng nướng và món tráng miệng hấp dẫn",
            "sort_order": 5,
            "status": "ACTIVE",
            "image_url": "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80",
        },
    )

    # 2. Danh sách món ăn chi tiết
    menu_items = [
        # Trà sữa sữa gấu
        {
            "category": cat_nuoc,
            "name": "Matcha latte sữa gấu",
            "price": Decimal("45000"),
            "description": "Matcha Nhật Bản thơm thanh hòa quyện cùng sữa gấu béo ngậy ngọt dịu mát lạnh.",
            "image_url": "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=600&auto=format&fit=crop&q=80",
            "option_groups": [
                {
                    "name": "Chọn mức đường",
                    "is_required": True,
                    "min_select": 1,
                    "max_select": 1,
                    "options": [
                        {"name": "100% đường (Bình thường)", "price": Decimal("0")},
                        {"name": "70% đường (Vừa)", "price": Decimal("0")},
                        {"name": "50% đường (Ít ngọt)", "price": Decimal("0")},
                        {"name": "0% đường", "price": Decimal("0")},
                    ],
                },
                {
                    "name": "Chọn mức đá",
                    "is_required": True,
                    "min_select": 1,
                    "max_select": 1,
                    "options": [
                        {"name": "100% đá (Bình thường)", "price": Decimal("0")},
                        {"name": "50% đá (Ít đá)", "price": Decimal("0")},
                        {"name": "Đá riêng", "price": Decimal("2000")},
                    ],
                },
                {
                    "name": "Topping thêm",
                    "is_required": False,
                    "min_select": 0,
                    "max_select": 3,
                    "options": [
                        {"name": "Trân châu đen dẻo", "price": Decimal("6000")},
                        {"name": "Trân châu trắng 3Q", "price": Decimal("7000")},
                        {"name": "Thạch củ năng", "price": Decimal("8000")},
                    ],
                },
            ],
        },
        {
            "category": cat_nuoc,
            "name": "Sâm dứa sữa gấu 700ml",
            "price": Decimal("45000"),
            "description": "Sâm dứa thơm lừng kết hợp sữa gấu đặc trưng miền Nam dung tích 700ml cực đã.",
            "image_url": "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop&q=80",
            "option_groups": [
                {
                    "name": "Chọn mức đường",
                    "is_required": True,
                    "min_select": 1,
                    "max_select": 1,
                    "options": [
                        {"name": "100% đường (Bình thường)", "price": Decimal("0")},
                        {"name": "70% đường (Vừa)", "price": Decimal("0")},
                        {"name": "50% đường (Ít ngọt)", "price": Decimal("0")},
                    ],
                },
                {
                    "name": "Topping thêm",
                    "is_required": False,
                    "min_select": 0,
                    "max_select": 2,
                    "options": [
                        {"name": "Trân châu trắng 3Q", "price": Decimal("7000")},
                        {"name": "Thạch dừa non", "price": Decimal("6000")},
                    ],
                },
            ],
        },
        {
            "category": cat_nuoc,
            "name": "Khoai môn latte sữa gấu 700ml",
            "price": Decimal("45000"),
            "description": "Khoai môn dẻo bùi béo ngậy thơm nức mũi cùng sữa gấu ly lớn 700ml.",
            "image_url": "https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=600&auto=format&fit=crop&q=80",
            "option_groups": [
                {
                    "name": "Chọn mức đường",
                    "is_required": True,
                    "min_select": 1,
                    "max_select": 1,
                    "options": [
                        {"name": "100% đường (Bình thường)", "price": Decimal("0")},
                        {"name": "70% đường (Vừa)", "price": Decimal("0")},
                        {"name": "50% đường (Ít ngọt)", "price": Decimal("0")},
                    ],
                }
            ],
        },
        # Bún & Món Trộn Miền Tây
        {
            "category": cat_bun,
            "name": "Bún nước tương đậu hủ + chả giò + thịt luộc",
            "price": Decimal("68000"),
            "description": "Tô bún đầy đặn topping: Đậu hủ chiên giòn, chả giò tôm thịt rế giòn tan, thịt ba rọi luộc tươi ngọt kèm rau sống dưa leo và nước tương tỏi ớt đặc biệt.",
            "image_url": "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=600&auto=format&fit=crop&q=80",
            "option_groups": [
                {
                    "name": "Món ăn thêm",
                    "is_required": False,
                    "min_select": 0,
                    "max_select": 3,
                    "options": [
                        {"name": "Thêm 1 cuốn chả giò giòn", "price": Decimal("12000")},
                        {"name": "Thêm 1 phần thịt luộc", "price": Decimal("18000")},
                        {"name": "Thêm đậu hủ chiên", "price": Decimal("10000")},
                        {"name": "Thêm bún", "price": Decimal("5000")},
                    ],
                },
                {
                    "name": "Khẩu vị ớt",
                    "is_required": False,
                    "min_select": 0,
                    "max_select": 1,
                    "options": [
                        {"name": "Nước tương cay vừa", "price": Decimal("0")},
                        {"name": "Nước tương cay nhiều", "price": Decimal("0")},
                        {
                            "name": "Nước tương không ớt (để riêng)",
                            "price": Decimal("0"),
                        },
                    ],
                },
            ],
        },
        {
            "category": cat_bun,
            "name": "Bún nước tương đậu hủ + chả giò",
            "price": Decimal("59000"),
            "description": "Bún tươi chan nước tương tỏi ớt thơm lừng, đậu hủ chiên vàng ươm, chả giò giòn rụm và rau thơm thanh mát.",
            "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
            "option_groups": [
                {
                    "name": "Thêm topping",
                    "is_required": False,
                    "min_select": 0,
                    "max_select": 2,
                    "options": [
                        {"name": "Thêm chả giò rế", "price": Decimal("12000")},
                        {"name": "Thêm đậu hủ chiên", "price": Decimal("10000")},
                    ],
                }
            ],
        },
        {
            "category": cat_bun,
            "name": "Bún thịt nướng đậm vị Dì 6",
            "price": Decimal("47000"),
            "description": "Thịt nướng than hoa ướp mật ong sả ớt đậm đà bí truyền Dì 6, mỡ hành béo ngậy, đậu phộng rang và nước mắm chua ngọt.",
            "image_url": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80",
            "option_groups": [
                {
                    "name": "Tùy chọn ăn kèm",
                    "is_required": False,
                    "min_select": 0,
                    "max_select": 3,
                    "options": [
                        {"name": "Thêm 1 xiên thịt nướng", "price": Decimal("18000")},
                        {"name": "Thêm chả giò", "price": Decimal("12000")},
                        {"name": "Thêm nem nướng", "price": Decimal("15000")},
                    ],
                }
            ],
        },
        {
            "category": cat_bun,
            "name": "Bún trộn mắm tép thịt luộc rau sống miền Tây",
            "price": Decimal("82000"),
            "description": "Món đặc sản trứ danh miền Tây: Mắm tép chua ngọt đỏ au giòn sần sật, thịt ba chỉ luộc thái mỏng, chuối chát, khế chua và rau rừng tươi non.",
            "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
            "option_groups": [
                {
                    "name": "Thêm khẩu phần",
                    "is_required": False,
                    "min_select": 0,
                    "max_select": 2,
                    "options": [
                        {"name": "Thêm 1 chén mắm tép", "price": Decimal("25000")},
                        {"name": "Thêm đĩa thịt luộc", "price": Decimal("25000")},
                    ],
                }
            ],
        },
        {
            "category": cat_bun,
            "name": "Bún trộn mắm tép rau sống miền Tây",
            "price": Decimal("62000"),
            "description": "Bún trộn cùng mắm tép đu đủ giòn cay chua ngọt và rau sống miền Tây thanh mát dễ ăn.",
            "image_url": "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop&q=80",
        },
        # Sầu riêng nướng
        {
            "category": cat_trangmieng,
            "name": "Sầu riêng nướng 2-3 múi",
            "price": Decimal("89000"),
            "description": "Sầu riêng Ri6 hạt lép nướng giấy bạc xém cạnh thơm lừng nức mũi, vị ngọt béo dẻo quánh khó cưỡng.",
            "image_url": "https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&auto=format&fit=crop&q=80",
        },
        # Combo ưu đãi
        {
            "category": cat_combo,
            "name": "Combo ưu đãi 1 cơm + 1 nước",
            "price": Decimal("75000"),
            "description": "Gồm 1 phần Cơm tấm sườn nướng / mắm chưng + 1 Ly Nước mát / Trà sữa tự chọn tiết kiệm 20%.",
            "image_url": "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=600&auto=format&fit=crop&q=80",
            "option_groups": [
                {
                    "name": "Chọn loại cơm",
                    "is_required": True,
                    "min_select": 1,
                    "max_select": 1,
                    "options": [
                        {"name": "Cơm sườn nướng mật ong", "price": Decimal("0")},
                        {
                            "name": "Cơm mắm chưng thịt trứng muối",
                            "price": Decimal("0"),
                        },
                        {"name": "Cơm ba rọi xào mắm ruốc", "price": Decimal("0")},
                    ],
                },
                {
                    "name": "Chọn nước uống",
                    "is_required": True,
                    "min_select": 1,
                    "max_select": 1,
                    "options": [
                        {"name": "Matcha latte sữa gấu", "price": Decimal("0")},
                        {"name": "Sâm dứa sữa gấu 700ml", "price": Decimal("0")},
                        {"name": "Trà chanh tắc hoa đậu biếc", "price": Decimal("0")},
                    ],
                },
            ],
        },
        {
            "category": cat_combo,
            "name": "Combo ưu đãi 1 bánh mì + 1 nước",
            "price": Decimal("44000"),
            "description": "Gồm 1 Ổ Bánh mì giòn rụm kẹp thịt nướng / xíu mại + 1 Ly nước uống sảng khoái.",
            "image_url": "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=600&auto=format&fit=crop&q=80",
            "option_groups": [
                {
                    "name": "Chọn loại bánh mì",
                    "is_required": True,
                    "min_select": 1,
                    "max_select": 1,
                    "options": [
                        {"name": "Bánh mì thịt nướng Dì 6", "price": Decimal("0")},
                        {"name": "Bánh mì xíu mại trứng muối", "price": Decimal("0")},
                    ],
                },
                {
                    "name": "Chọn nước uống",
                    "is_required": True,
                    "min_select": 1,
                    "max_select": 1,
                    "options": [
                        {"name": "Cà phê sữa đá pha phin", "price": Decimal("0")},
                        {"name": "Trà đào hạt chia", "price": Decimal("0")},
                        {"name": "Sâm dứa sữa gấu", "price": Decimal("5000")},
                    ],
                },
            ],
        },
        {
            "category": cat_combo,
            "name": "Combo ưu đãi 1 bún + 1 nước",
            "price": Decimal("59000"),
            "description": "Gồm 1 Tô Bún thịt nướng / Bún nước tương + 1 Ly nước uống mát lạnh.",
            "image_url": "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600&auto=format&fit=crop&q=80",
            "option_groups": [
                {
                    "name": "Chọn món bún",
                    "is_required": True,
                    "min_select": 1,
                    "max_select": 1,
                    "options": [
                        {"name": "Bún thịt nướng đậm vị", "price": Decimal("0")},
                        {
                            "name": "Bún nước tương chả giò đậu hủ",
                            "price": Decimal("0"),
                        },
                    ],
                },
                {
                    "name": "Chọn nước",
                    "is_required": True,
                    "min_select": 1,
                    "max_select": 1,
                    "options": [
                        {"name": "Trà chanh sả mật ong", "price": Decimal("0")},
                        {"name": "Matcha latte sữa gấu", "price": Decimal("10000")},
                    ],
                },
            ],
        },
        # Combo đóng hộp
        {
            "category": cat_mam,
            "name": "Combo 3 hộp mắm chưng thịt (không kèm rau cơm)",
            "price": Decimal("152000"),
            "description": "3 Hộp mắm chưng thịt hột vịt muối đậm đà miền Tây, bảo quản tủ mát tiện lợi hâm nóng ăn liền.",
            "image_url": "https://images.unsplash.com/photo-1547496502-affa22d38842?w=600&auto=format&fit=crop&q=80",
        },
        {
            "category": cat_mam,
            "name": "Combo 3 hộp ba rọi xào mắm ruốc (chưa kèm rau và cơm)",
            "price": Decimal("152000"),
            "description": "3 Hộp ba rọi rút sườn xào mắm ruốc sả ớt dậy mùi thơm nức mũi, cực kỳ hao cơm.",
            "image_url": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80",
        },
    ]

    for item_data in menu_items:
        prod, created = Product.objects.update_or_create(
            name=item_data["name"],
            defaults={
                "category": item_data["category"],
                "price": item_data["price"],
                "description": item_data.get("description", ""),
                "image_url": item_data.get("image_url", ""),
                "status": "AVAILABLE",
            },
        )

        if "option_groups" in item_data:
            prod.option_groups.all().delete()
            for g_idx, g_data in enumerate(item_data["option_groups"]):
                group = OptionGroup.objects.create(
                    product=prod,
                    name=g_data["name"],
                    is_required=g_data.get("is_required", False),
                    min_select=g_data.get("min_select", 0),
                    max_select=g_data.get("max_select", 1),
                    sort_order=g_idx,
                )
                for o_idx, opt_data in enumerate(g_data["options"]):
                    Option.objects.create(
                        option_group=group,
                        name=opt_data["name"],
                        price=opt_data["price"],
                        status="AVAILABLE",
                        sort_order=o_idx,
                    )

    print(f"🎉 Đã seed thành công toàn bộ {len(menu_items)} món ăn cho Bếp Dì 6!")


if __name__ == "__main__":
    run()
