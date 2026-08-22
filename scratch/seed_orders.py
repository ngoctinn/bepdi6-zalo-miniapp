import os
import sys
from decimal import Decimal

import django
from django.utils import timezone

sys.path.append(os.path.join(os.path.dirname(__file__), "..", "apps", "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.customers.models import Customer
from apps.menu.models import Option, OptionGroup, Product
from apps.orders.models import Order, OrderItem, OrderItemOption
from apps.payments.models import Payment


def seed():
    print("Bắt đầu tạo dữ liệu mẫu đơn hàng...")

    # 1. Tạo hoặc lấy Customer mẫu
    customer1, _ = Customer.objects.get_or_create(
        zalo_user_id="zalo_user_001",
        defaults={
            "name": "Nguyễn Văn Nam",
            "phone": "0901234567",
            "avatar_url": "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=60",
        },
    )

    customer2, _ = Customer.objects.get_or_create(
        zalo_user_id="zalo_user_002",
        defaults={
            "name": "Trần Thị Mai Anh",
            "phone": "0987654321",
            "avatar_url": "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=60",
        },
    )

    customer3, _ = Customer.objects.get_or_create(
        zalo_user_id="zalo_user_003",
        defaults={
            "name": "Lê Hoàng Phúc",
            "phone": "0918889999",
            "avatar_url": "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100&auto=format&fit=crop&q=60",
        },
    )

    products = list(Product.objects.all())
    if not products:
        print("Chưa có món ăn trong database, vui lòng seed menu trước.")
        return

    # Lấy các món
    p_com_tam = next((p for p in products if "Cơm" in p.name), products[0])
    p_bun_bo = next(
        (p for p in products if "Bún" in p.name), products[min(1, len(products) - 1)]
    )
    p_tra_tac = next(
        (p for p in products if "Trà" in p.name), products[min(2, len(products) - 1)]
    )

    # Tìm hoặc tạo Option Group & Options
    grp1, _ = OptionGroup.objects.get_or_create(
        product=p_com_tam,
        name="Món ăn kèm",
        defaults={"is_required": False, "min_select": 0, "max_select": 5},
    )
    opt_trung, _ = Option.objects.get_or_create(
        option_group=grp1, name="Trứng ốp la", defaults={"price": Decimal("5000")}
    )
    opt_cha, _ = Option.objects.get_or_create(
        option_group=grp1, name="Chả hấp", defaults={"price": Decimal("7000")}
    )
    opt_suon, _ = Option.objects.get_or_create(
        option_group=grp1, name="Sườn thêm", defaults={"price": Decimal("20000")}
    )

    grp2, _ = OptionGroup.objects.get_or_create(
        product=p_bun_bo,
        name="Thịt thêm",
        defaults={"is_required": False, "min_select": 0, "max_select": 3},
    )
    opt_bap_bo, _ = Option.objects.get_or_create(
        option_group=grp2, name="Thêm bắp bò", defaults={"price": Decimal("15000")}
    )
    opt_cha_cua, _ = Option.objects.get_or_create(
        option_group=grp2, name="Chả cua", defaults={"price": Decimal("10000")}
    )

    grp3, _ = OptionGroup.objects.get_or_create(
        product=p_tra_tac,
        name="Topping nước",
        defaults={"is_required": False, "min_select": 0, "max_select": 3},
    )
    opt_tran_chau, _ = Option.objects.get_or_create(
        option_group=grp3, name="Trân châu trắng", defaults={"price": Decimal("5000")}
    )
    opt_nha_dam, _ = Option.objects.get_or_create(
        option_group=grp3, name="Thạch nha đam", defaults={"price": Decimal("5000")}
    )

    import random
    import string

    def random_code():
        return "BD" + "".join(random.choices(string.digits, k=6))

    sample_orders = [
        {
            "order_code": random_code(),
            "customer": customer1,
            "recipient_name": "Nguyễn Văn Nam",
            "phone": "0901234567",
            "delivery_address": "123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM",
            "status": Order.Status.PENDING_CONFIRMATION,
            "payment_method": Order.PaymentMethod.BANK_TRANSFER,
            "payment_status": Payment.Status.UNPAID,
            "note": "Giao trước 12h trưa giúp em, không bấm chuông",
            "items": [
                {
                    "product": p_com_tam,
                    "qty": 2,
                    "note": "Nhiều mỡ hành, 1 phần không lấy ớt",
                    "options": [opt_trung, opt_cha],
                },
                {
                    "product": p_tra_tac,
                    "qty": 2,
                    "note": "Ít ngọt, nhiều đá",
                    "options": [opt_tran_chau],
                },
            ],
        },
        {
            "order_code": random_code(),
            "customer": customer2,
            "recipient_name": "Trần Thị Mai Anh",
            "phone": "0987654321",
            "delivery_address": "Tòa nhà Bitexco, 2 Hải Triều, Bến Nghé, Quận 1, TP.HCM",
            "status": Order.Status.PENDING_CONFIRMATION,
            "payment_method": Order.PaymentMethod.COD,
            "payment_status": Payment.Status.UNPAID,
            "note": "Gọi điện khi đến sảnh, gửi lễ tân",
            "items": [
                {
                    "product": p_bun_bo,
                    "qty": 1,
                    "note": "Nhiều ớt sa tế, nước béo",
                    "options": [opt_bap_bo],
                }
            ],
        },
        {
            "order_code": random_code(),
            "customer": customer3,
            "recipient_name": "Lê Hoàng Phúc",
            "phone": "0918889999",
            "delivery_address": "45 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM",
            "status": Order.Status.CONFIRMED,
            "payment_method": Order.PaymentMethod.BANK_TRANSFER,
            "payment_status": Payment.Status.PAID,
            "note": "Để ngoài cửa giúp mình",
            "items": [
                {
                    "product": p_com_tam,
                    "qty": 1,
                    "note": "Ăn tại văn phòng, cho 2 đôi đũa",
                    "options": [opt_suon],
                },
                {"product": p_tra_tac, "qty": 1, "note": "", "options": []},
            ],
        },
        {
            "order_code": random_code(),
            "customer": customer1,
            "recipient_name": "Nguyễn Văn Nam",
            "phone": "0901234567",
            "delivery_address": "123 Nguyễn Thị Minh Khai, Phường Bến Thành, Quận 1, TP.HCM",
            "status": Order.Status.PREPARING,
            "payment_method": Order.PaymentMethod.COD,
            "payment_status": Payment.Status.UNPAID,
            "note": "Làm nhanh giúp đang vội ạ",
            "items": [
                {
                    "product": p_bun_bo,
                    "qty": 2,
                    "note": "1 tô không hành",
                    "options": [opt_cha_cua],
                }
            ],
        },
        {
            "order_code": random_code(),
            "customer": customer2,
            "recipient_name": "Trần Thị Mai Anh",
            "phone": "0987654321",
            "delivery_address": "88 Hàm Nghi, Phường Bến Nghé, Quận 1, TP.HCM",
            "status": Order.Status.READY,
            "payment_method": Order.PaymentMethod.BANK_TRANSFER,
            "payment_status": Payment.Status.PAID,
            "note": "Đã thanh toán VietQR",
            "items": [
                {
                    "product": p_tra_tac,
                    "qty": 3,
                    "note": "Giao riêng từng ly",
                    "options": [opt_tran_chau, opt_nha_dam],
                }
            ],
        },
        {
            "order_code": random_code(),
            "customer": customer3,
            "recipient_name": "Lê Hoàng Phúc",
            "phone": "0918889999",
            "delivery_address": "45 Lê Duẩn, Bến Nghé, Quận 1, TP.HCM",
            "status": Order.Status.DELIVERING,
            "payment_method": Order.PaymentMethod.COD,
            "payment_status": Payment.Status.UNPAID,
            "note": "Shipper tới gọi trước 5 phút",
            "items": [
                {"product": p_com_tam, "qty": 3, "note": "", "options": [opt_trung]}
            ],
        },
    ]

    for data in sample_orders:
        subtotal = Decimal("0")
        shipping_fee = Decimal("15000")
        discount = Decimal("0")

        order = Order.objects.create(
            order_code=data["order_code"],
            idempotency_key=f"idemp_{data['order_code']}_{random.randint(1000, 9999)}",
            customer=data["customer"],
            status=data["status"],
            recipient_name=data["recipient_name"],
            phone=data["phone"],
            delivery_address=data["delivery_address"],
            delivery_latitude=Decimal("10.776889"),
            delivery_longitude=Decimal("106.700806"),
            distance_km=Decimal("2.5"),
            shipping_fee=shipping_fee,
            subtotal=Decimal("0"),
            discount=discount,
            total_amount=Decimal("0"),
            payment_method=data["payment_method"],
            note=data["note"],
        )

        for item_data in data["items"]:
            prod = item_data["product"]
            qty = item_data["qty"]
            unit_price = prod.price
            item_subtotal = unit_price * qty

            order_item = OrderItem.objects.create(
                order=order,
                product=prod,
                product_name=prod.name,
                unit_price=unit_price,
                quantity=qty,
                subtotal=item_subtotal,
                note=item_data["note"],
            )

            for opt in item_data["options"]:
                OrderItemOption.objects.create(
                    order_item=order_item,
                    option=opt,
                    option_name=opt.name,
                    price=opt.price,
                    quantity=1,
                )
                item_subtotal += opt.price * qty

            order_item.subtotal = item_subtotal
            order_item.save(update_fields=["subtotal"])
            subtotal += item_subtotal

        total_amount = subtotal + shipping_fee - discount
        order.subtotal = subtotal
        order.total_amount = total_amount
        order.save(update_fields=["subtotal", "total_amount"])

        Payment.objects.create(
            order=order,
            method=Payment.Method.BANK_TRANSFER
            if data["payment_method"] == Order.PaymentMethod.BANK_TRANSFER
            else Payment.Method.COD,
            status=data["payment_status"],
            amount=total_amount,
            actual_paid_amount=total_amount
            if data["payment_status"] == Payment.Status.PAID
            else Decimal("0"),
            paid_at=timezone.now()
            if data["payment_status"] == Payment.Status.PAID
            else None,
        )

        print(
            f"-> Đã tạo đơn #{order.order_code} | {order.get_status_display()} | {order.recipient_name} | {total_amount:,.0f}đ"
        )

    print("\n🎉 HOÀN TẤT TẠO DỮ LIỆU ĐƠN HÀNG MẪU THÀNH CÔNG!")


if __name__ == "__main__":
    seed()
