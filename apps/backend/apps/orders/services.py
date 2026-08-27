import uuid
from decimal import Decimal

from django.conf import settings
from django.db import IntegrityError, transaction
from django.utils import timezone

from apps.customers.models import Address, Customer, User
from apps.menu.models import Option, Product
from apps.notifications.tasks import (
    send_in_app_notification,
    send_telegram_staff_order_alert,
    send_zalo_oa_staff_alert,
    send_zns_order_delivering,
)
from apps.orders.models import AuditLog, Order, OrderItem, OrderItemOption
from apps.payments.models import Payment
from apps.shipping.models import ShopConfig
from apps.shipping.services import (
    ShippingService,
)
from apps.vouchers.models import Voucher
from apps.vouchers.services import (
    VoucherService,
    VoucherValidationError,
)


class OrderProcessingError(Exception):
    """Base exception for order processing errors."""

    def __init__(self, code: str, message: str):
        self.code = code
        self.message = message
        super().__init__(message)


class DuplicateOrderError(OrderProcessingError):
    """Raised when request violates idempotency constraint."""

    def __init__(self, message: str = "Đơn hàng đã được tạo trước đó."):
        super().__init__("DUPLICATE_ORDER", message)


class InvalidStateTransitionError(OrderProcessingError):
    """Raised when an invalid status transition is requested."""

    def __init__(self, message: str = "Chuyển trạng thái đơn hàng không hợp lệ."):
        super().__init__("INVALID_STATE_TRANSITION", message)


class OrderService:
    """Core domain service for handling order calculation, placement, and lifecycle transitions."""

    VALID_TRANSITIONS: dict[str, list[str]] = {
        Order.Status.PENDING_CONFIRMATION: [
            Order.Status.CONFIRMED,
            Order.Status.CANCELLED,
        ],
        Order.Status.CONFIRMED: [
            Order.Status.PREPARING,
            Order.Status.CANCELLED,
        ],
        Order.Status.PREPARING: [
            Order.Status.READY,
            Order.Status.CANCELLED,
        ],
        Order.Status.READY: [
            Order.Status.DELIVERING,
            Order.Status.COMPLETED,  # Cho phép hoàn thành trực tiếp đối với đơn PICKUP
        ],
        Order.Status.DELIVERING: [
            Order.Status.COMPLETED,
        ],
        Order.Status.COMPLETED: [],
        Order.Status.CANCELLED: [],
    }

    @classmethod
    def generate_order_code(cls) -> str:
        """Generates FO + YYMMDD + 6 hex chars order code (e.g. FO260821A1B2C3)."""
        date_str = timezone.now().strftime("%y%m%d")
        random_suffix = uuid.uuid4().hex[:6].upper()
        return f"FO{date_str}{random_suffix}"

    @classmethod
    def generate_vietqr_url(cls, amount: Decimal, order_code: str) -> str:
        """Generates VietQR quick pay image link using dynamic shop config."""
        config = ShopConfig.get_solo()
        bank_id = config.vietqr_bank_id or getattr(settings, "VIETQR_BANK_ID", "MB")
        account_no = config.vietqr_account_no or getattr(
            settings, "VIETQR_ACCOUNT_NO", ""
        )
        account_name = config.vietqr_account_name or getattr(
            settings, "VIETQR_ACCOUNT_NAME", "BEP DI 6"
        )
        amount_int = int(amount)
        return (
            f"https://img.vietqr.io/image/{bank_id}-{account_no}-compact2.png"
            f"?amount={amount_int}&addInfo={order_code}&accountName={account_name}"
        )

    @classmethod
    def validate_and_calculate_cart(
        cls,
        customer: Customer,
        items_data: list[dict],
        address: Address | None = None,
        voucher_code: str | None = None,
        delivery_type: str = Order.DeliveryType.DELIVERY,
    ) -> dict:
        """
        Validates cart items, options, calculates subtotal, distance, shipping fee, discount, total.
        Enforces BR-SHOP-002 (Shop Open), BR-SHOP-003 (Min Order Amount), BR-DELI-003 (Freeship & Tiers).
        For PICKUP delivery_type, shipping fee and distance are 0.
        Returns calculated breakdown dict.
        """
        if not items_data:
            raise OrderProcessingError("INVALID_CART", "Giỏ hàng không được để trống.")

        # 0. Check Shop Open status & operational hours (BR-SHOP-002)
        shop_config = ShopConfig.get_solo()
        if not shop_config.is_open:
            raise OrderProcessingError(
                "SHOP_CLOSED",
                "Quán hiện đang tạm ngưng nhận đơn hàng trực tuyến. Vui lòng quay lại sau!",
            )

        now_time = timezone.localtime().time()
        if shop_config.open_time and shop_config.close_time:
            if not (shop_config.open_time <= now_time <= shop_config.close_time):
                raise OrderProcessingError(
                    "SHOP_CLOSED",
                    f"Quán chỉ nhận đơn trong khung giờ {shop_config.open_time.strftime('%H:%M')} - {shop_config.close_time.strftime('%H:%M')}.",
                )

        # 2. Validate products & options and compute subtotal
        subtotal = Decimal("0.00")
        validated_items = []

        # Batch fetch all products with preloaded option groups & options to eliminate N+1 queries
        product_ids = [
            item.get("product_id") for item in items_data if item.get("product_id")
        ]
        products_map = {
            p.id: p
            for p in Product.objects.filter(id__in=product_ids)
            .select_related("category")
            .prefetch_related("option_groups__options")
        }

        for item in items_data:
            product_id = item.get("product_id")
            quantity = int(item.get("quantity", 1))
            note = str(item.get("note", "")).strip()
            option_ids = item.get("option_ids", [])

            if quantity <= 0:
                raise OrderProcessingError(
                    "INVALID_QUANTITY", "Số lượng món phải lớn hơn 0."
                )

            product = products_map.get(product_id)
            if not product:
                raise OrderProcessingError(
                    "PRODUCT_NOT_FOUND", f"Món #{product_id} không tồn tại."
                )

            if product.status == Product.Status.OUT_OF_STOCK:
                raise OrderProcessingError(
                    "PRODUCT_OUT_OF_STOCK", f"Món '{product.name}' đã hết hàng."
                )
            if product.status == Product.Status.INACTIVE:
                raise OrderProcessingError(
                    "PRODUCT_NOT_FOUND", f"Món '{product.name}' hiện ngưng phục vụ."
                )

            # Map options in-memory from preloaded option groups
            available_options_map = {}
            option_group_list = list(product.option_groups.all())
            for group in option_group_list:
                for opt in group.options.all():
                    available_options_map[opt.id] = (opt, group.id)

            # Validate options and option group rules (BR-PROD-004)
            item_price = product.price
            validated_options = []
            if option_ids:
                # Check for duplicate option IDs in the same item
                if len(set(option_ids)) != len(option_ids):
                    raise OrderProcessingError(
                        "INVALID_OPTION",
                        f"Không được chọn trùng lặp tùy chọn trong món '{product.name}'.",
                    )

                for opt_id in option_ids:
                    opt_entry = available_options_map.get(opt_id)
                    if not opt_entry:
                        raise OrderProcessingError(
                            "INVALID_OPTION",
                            f"Một số tùy chọn của món '{product.name}' không hợp lệ.",
                        )
                    opt, _ = opt_entry
                    if opt.status == Option.Status.INACTIVE:
                        raise OrderProcessingError(
                            "INVALID_OPTION",
                            f"Tùy chọn '{opt.name}' hiện không khả dụng.",
                        )
                    item_price += opt.price
                    validated_options.append(opt)

            # Enforce OptionGroup min_select / max_select / is_required rules (BR-PROD-004)
            for group in option_group_list:
                selected_in_group = [
                    opt
                    for opt in validated_options
                    if available_options_map.get(opt.id, (None, None))[1] == group.id
                ]
                count = len(selected_in_group)
                if group.is_required and count < group.min_select:
                    raise OrderProcessingError(
                        "INVALID_OPTION",
                        f"Món '{product.name}' yêu cầu chọn tối thiểu {group.min_select} tùy chọn trong nhóm '{group.name}'.",
                    )
                if group.max_select > 0 and count > group.max_select:
                    raise OrderProcessingError(
                        "INVALID_OPTION",
                        f"Món '{product.name}' chỉ cho phép chọn tối đa {group.max_select} tùy chọn trong nhóm '{group.name}'.",
                    )

            item_subtotal = item_price * quantity
            subtotal += item_subtotal

            validated_items.append(
                {
                    "product": product,
                    "product_name": product.name,
                    "unit_price": product.price,
                    "quantity": quantity,
                    "note": note,
                    "subtotal": item_subtotal,
                    "options": validated_options,
                }
            )

        # Enforce Minimum Order Amount for Delivery (BR-SHOP-003)
        if (
            delivery_type != Order.DeliveryType.PICKUP
            and shop_config.min_order_amount > Decimal("0.00")
            and subtotal < shop_config.min_order_amount
        ):
            raise OrderProcessingError(
                "ORDER_AMOUNT_BELOW_MINIMUM",
                f"Đơn hàng giao tận nơi phải đạt tối thiểu {shop_config.min_order_amount:,.0f}đ.",
            )

        # 2. Shipping calculation
        if delivery_type == Order.DeliveryType.PICKUP:
            shipping_fee = Decimal("0.00")
            distance_km = Decimal("0.00")
            is_deliverable = True
        else:
            if not address:
                raise OrderProcessingError(
                    "MISSING_ADDRESS", "Vui lòng cung cấp địa chỉ nhận hàng."
                )
            shipping_info = ShippingService.calculate_shipping(
                destination_lat=address.latitude,
                destination_lon=address.longitude,
                order_subtotal=subtotal,
            )
            if not shipping_info["is_deliverable"]:
                raise OrderProcessingError(
                    "OUT_OF_DELIVERY_RADIUS",
                    "Địa chỉ giao hàng nằm ngoài bán kính phục vụ của cửa hàng.",
                )
            shipping_fee = shipping_info["shipping_fee"]
            distance_km = shipping_info["distance_km"]
            is_deliverable = True

        # 3. Voucher calculation
        discount = Decimal("0.00")
        voucher_obj: Voucher | None = None
        if voucher_code:
            try:
                voucher_obj, discount = VoucherService.validate_voucher(
                    code=voucher_code,
                    order_amount=subtotal,
                    customer=customer,
                )
            except VoucherValidationError as e:
                raise OrderProcessingError(e.code, e.message) from None

        total_amount = subtotal + shipping_fee - discount
        if total_amount < Decimal("0.00"):
            total_amount = Decimal("0.00")

        return {
            "subtotal": subtotal,
            "distance_km": distance_km,
            "shipping_fee": shipping_fee,
            "discount": discount,
            "total_amount": total_amount,
            "is_deliverable": is_deliverable,
            "voucher": voucher_obj,
            "validated_items": validated_items,
        }

    @classmethod
    @transaction.atomic
    def create_order(
        cls,
        customer: Customer,
        idempotency_key: str,
        items_data: list[dict],
        address: Address | None = None,
        recipient_name: str = "",
        phone: str = "",
        delivery_type: str = Order.DeliveryType.DELIVERY,
        payment_method: str = Order.PaymentMethod.COD,
        voucher_code: str | None = None,
        note: str = "",
        scheduled_delivery_at=None,
    ) -> Order:
        """
        Creates order transactionally with idempotency guard.
        Enforces BR-ORD-001, BR-ORD-002, BR-ORD-003, BR-PROD-005.
        Supports both DELIVERY and PICKUP orders.
        """
        if not idempotency_key:
            raise OrderProcessingError(
                "MISSING_IDEMPOTENCY_KEY", "Idempotency-Key header is required."
            )

        # Check existing order with same idempotency key for this customer
        existing_order = Order.objects.filter(
            customer=customer, idempotency_key=idempotency_key
        ).first()
        if existing_order:
            return existing_order

        # Calculate and validate cart
        calculation = cls.validate_and_calculate_cart(
            customer=customer,
            items_data=items_data,
            address=address,
            voucher_code=voucher_code,
            delivery_type=delivery_type,
        )

        shop_config = ShopConfig.get_solo()

        # Validate scheduled_delivery_at if provided
        if scheduled_delivery_at is not None:
            now_dt = timezone.localtime()
            sched_local = (
                timezone.localtime(scheduled_delivery_at)
                if timezone.is_aware(scheduled_delivery_at)
                else scheduled_delivery_at
            )

            # Ensure scheduled time is not in past and allows minimum prep time
            min_prep_dt = now_dt + timezone.timedelta(
                minutes=max(5, shop_config.prep_time_minutes // 2)
            )
            if sched_local < min_prep_dt:
                raise OrderProcessingError(
                    "INVALID_SCHEDULED_TIME",
                    f"Thời gian hẹn nhận món phải sau ít nhất {max(5, shop_config.prep_time_minutes // 2)} phút từ thời điểm hiện tại.",
                )

            # Ensure scheduled time is within shop operating hours if set
            if shop_config.open_time and shop_config.close_time:
                sched_time = sched_local.time()
                if not (shop_config.open_time <= sched_time <= shop_config.close_time):
                    raise OrderProcessingError(
                        "INVALID_SCHEDULED_TIME",
                        f"Thời gian hẹn phải nằm trong khung giờ mở cửa của quán ({shop_config.open_time.strftime('%H:%M')} - {shop_config.close_time.strftime('%H:%M')}).",
                    )
        if delivery_type == Order.DeliveryType.PICKUP:
            rec_name = (
                recipient_name
                or (address.recipient_name if address else "")
                or customer.name
                or "Khách hàng"
            )
            rec_phone = (
                phone
                or (address.phone if address else "")
                or customer.phone
                or "0900000000"
            )
            delivery_address = f"[Nhận tại quán] {shop_config.address_text}"
            delivery_lat = shop_config.latitude
            delivery_lon = shop_config.longitude
        else:
            if not address:
                raise OrderProcessingError(
                    "MISSING_ADDRESS",
                    "Địa chỉ nhận hàng là bắt buộc cho đơn giao tận nơi.",
                )
            rec_name = recipient_name or address.recipient_name
            rec_phone = phone or address.phone
            delivery_address = address.address_text
            delivery_lat = address.latitude
            delivery_lon = address.longitude

        order_code = cls.generate_order_code()

        try:
            order = Order.objects.create(
                order_code=order_code,
                idempotency_key=idempotency_key,
                customer=customer,
                status=Order.Status.PENDING_CONFIRMATION,
                delivery_type=delivery_type,
                recipient_name=rec_name,
                phone=rec_phone,
                delivery_address=delivery_address,
                delivery_latitude=delivery_lat,
                delivery_longitude=delivery_lon,
                distance_km=calculation["distance_km"],
                shipping_fee=calculation["shipping_fee"],
                subtotal=calculation["subtotal"],
                discount=calculation["discount"],
                total_amount=calculation["total_amount"],
                voucher=calculation["voucher"],
                payment_method=payment_method,
                note=note,
                scheduled_delivery_at=scheduled_delivery_at,
            )
        except IntegrityError:
            # Fallback if concurrent request created same idempotency key
            existing = Order.objects.filter(
                customer=customer, idempotency_key=idempotency_key
            ).first()
            if existing:
                return existing
            raise DuplicateOrderError() from None

        # Bulk create snapshot order items & options
        order_items_to_create = [
            OrderItem(
                order=order,
                product=item["product"],
                product_name=item["product_name"],
                unit_price=item["unit_price"],
                quantity=item["quantity"],
                note=item["note"],
                subtotal=item["subtotal"],
            )
            for item in calculation["validated_items"]
        ]
        created_order_items = OrderItem.objects.bulk_create(order_items_to_create)

        order_item_options_to_create = []
        for order_item, item in zip(
            created_order_items, calculation["validated_items"], strict=False
        ):
            for opt in item["options"]:
                order_item_options_to_create.append(
                    OrderItemOption(
                        order_item=order_item,
                        option=opt,
                        option_name=opt.name,
                        price=opt.price,
                        quantity=1,
                    )
                )

        if order_item_options_to_create:
            OrderItemOption.objects.bulk_create(order_item_options_to_create)

        # Create Payment record (1-1)
        qr_url = ""
        if payment_method == Order.PaymentMethod.BANK_TRANSFER:
            qr_url = cls.generate_vietqr_url(
                amount=order.total_amount, order_code=order.order_code
            )

        Payment.objects.create(
            order=order,
            method=payment_method,
            status=Payment.Status.UNPAID,
            amount=order.total_amount,
            qr_code_url=qr_url,
        )

        # Apply voucher usage if any
        if calculation["voucher"]:
            VoucherService.apply_voucher_to_order(
                voucher=calculation["voucher"],
                customer=customer,
                order=order,
                discount_amount=calculation["discount"],
            )

        # Trigger async notifications after database transaction commits (BR-NOTI-001)
        transaction.on_commit(lambda: send_telegram_staff_order_alert.delay(order.id))
        transaction.on_commit(lambda: send_zalo_oa_staff_alert.delay(order.id))
        transaction.on_commit(
            lambda: send_in_app_notification.delay(
                customer_id=customer.id,
                title="Đơn hàng đã được đặt",
                message=f"Đơn hàng #{order.order_code} đã được gửi đến Bếp Dì 6. Quán sẽ sớm liên hệ xác nhận!",
                order_id=order.id,
            )
        )

        return order

    @classmethod
    @transaction.atomic
    def update_order_status(
        cls,
        order: Order,
        new_status: str,
        user: User | None = None,
        reason: str = "",
    ) -> Order:
        """
        Updates order status following state machine rules (BR-STAT-001, BR-STAT-002).
        Records audit logs and releases voucher if cancelled.
        """
        current_status = order.status
        allowed_next = cls.VALID_TRANSITIONS.get(current_status, [])

        if new_status not in allowed_next:
            raise InvalidStateTransitionError(
                f"Không thể chuyển đơn từ trạng thái '{current_status}' sang '{new_status}'."
            )

        old_data = {"status": current_status}
        order.status = new_status

        now = timezone.now()
        if new_status == Order.Status.CONFIRMED:
            order.confirmed_at = now
        elif new_status == Order.Status.COMPLETED:
            order.completed_at = now
            # BR-PAY-003: COD order is marked as PAID upon successful delivery completion
            if order.payment_method == Order.PaymentMethod.COD:
                try:
                    payment = getattr(order, "payment", None)
                    if payment and payment.status != Payment.Status.PAID:
                        payment.status = Payment.Status.PAID
                        payment.paid_at = now
                        payment.actual_paid_amount = order.total_amount
                        payment.save(
                            update_fields=["status", "paid_at", "actual_paid_amount"]
                        )
                except Payment.DoesNotExist:
                    pass
        elif new_status == Order.Status.CANCELLED:
            order.cancelled_at = now
            order.cancellation_reason = reason
            # Release voucher if cancelled (BR-VOU-005)
            VoucherService.release_voucher(order=order)

        order.save()

        # Audit log
        AuditLog.objects.create(
            user=user,
            action="UPDATE_ORDER_STATUS",
            entity_type="ORDER",
            entity_id=order.id,
            old_data=old_data,
            new_data={"status": new_status, "reason": reason},
        )

        # Trigger async notifications on commit (BR-NOTI-001, BR-NOTI-002)
        if new_status == Order.Status.CONFIRMED:
            transaction.on_commit(
                lambda: send_in_app_notification.delay(
                    customer_id=order.customer_id,
                    title="Đơn hàng đã được xác nhận",
                    message=f"Đơn hàng #{order.order_code} đã được xác nhận và đang bắt đầu chế biến!",
                    order_id=order.id,
                )
            )
        elif new_status == Order.Status.DELIVERING:
            transaction.on_commit(lambda: send_zns_order_delivering.delay(order.id))
            transaction.on_commit(
                lambda: send_in_app_notification.delay(
                    customer_id=order.customer_id,
                    title="Đơn hàng đang được giao",
                    message=f"Đơn hàng #{order.order_code} đang trên đường giao đến bạn!",
                    order_id=order.id,
                )
            )
        elif new_status == Order.Status.COMPLETED:
            transaction.on_commit(
                lambda: send_in_app_notification.delay(
                    customer_id=order.customer_id,
                    title="Đơn hàng hoàn tất",
                    message=f"Đơn hàng #{order.order_code} đã hoàn thành. Cảm ơn bạn đã ủng hộ Bếp Dì 6!",
                    order_id=order.id,
                )
            )
        elif new_status == Order.Status.CANCELLED:
            transaction.on_commit(
                lambda: send_in_app_notification.delay(
                    customer_id=order.customer_id,
                    title="Đơn hàng đã bị hủy",
                    message=f"Đơn hàng #{order.order_code} đã bị hủy. Lý do: {reason or 'Không có'}",
                    order_id=order.id,
                )
            )

        return order

    @classmethod
    @transaction.atomic
    def confirm_order(
        cls,
        order: Order,
        user: User | None = None,
        edited_items: list[dict] | None = None,
        note: str | None = None,
        scheduled_delivery_at=None,
    ) -> Order:
        """
        Staff confirms order via phone call.
        Enforces BR-ORD-004:
        - If payment_method is BANK_TRANSFER (VietQR), editing items is prohibited.
        - If COD and edited_items is provided, recalculate items, subtotal, voucher eligibility, and totals.
        - Enforces BR-VOU-005: If edited order value no longer qualifies for voucher, release voucher.
        """
        if order.status != Order.Status.PENDING_CONFIRMATION:
            raise InvalidStateTransitionError(
                f"Chỉ có thể xác nhận đơn hàng đang ở trạng thái '{Order.Status.PENDING_CONFIRMATION}'."
            )

        if edited_items is not None and len(edited_items) > 0:
            if order.payment_method == Order.PaymentMethod.BANK_TRANSFER:
                raise OrderProcessingError(
                    "CANNOT_MODIFY_VIETQR_ORDER",
                    "Không được phép sửa đơn thanh toán qua VietQR. Phải hủy đơn để khách đặt lại (BR-ORD-004).",
                )

            # Re-validate and compute items
            subtotal = Decimal("0.00")
            validated_items = []

            # Batch fetch all products with preloaded option groups & options to eliminate N+1 queries
            product_ids = [
                item.get("product_id")
                for item in edited_items
                if item.get("product_id")
            ]
            products_map = {
                p.id: p
                for p in Product.objects.filter(id__in=product_ids)
                .select_related("category")
                .prefetch_related("option_groups__options")
            }

            for item in edited_items:
                product_id = item.get("product_id")
                quantity = int(item.get("quantity", 1))
                item_note = str(item.get("note", "")).strip()
                option_ids = item.get("option_ids", [])

                if quantity <= 0:
                    raise OrderProcessingError(
                        "INVALID_QUANTITY", "Số lượng món phải lớn hơn 0."
                    )

                product = products_map.get(product_id)
                if not product:
                    raise OrderProcessingError(
                        "PRODUCT_NOT_FOUND", f"Món #{product_id} không tồn tại."
                    )

                if product.status == Product.Status.OUT_OF_STOCK:
                    raise OrderProcessingError(
                        "PRODUCT_OUT_OF_STOCK", f"Món '{product.name}' đã hết hàng."
                    )
                if product.status == Product.Status.INACTIVE:
                    raise OrderProcessingError(
                        "PRODUCT_NOT_FOUND", f"Món '{product.name}' hiện ngưng phục vụ."
                    )

                # Map options in-memory from preloaded option groups
                available_options_map = {}
                option_group_list = list(product.option_groups.all())
                for group in option_group_list:
                    for opt in group.options.all():
                        available_options_map[opt.id] = (opt, group.id)

                item_price = product.price
                validated_options = []
                if option_ids:
                    if len(set(option_ids)) != len(option_ids):
                        raise OrderProcessingError(
                            "INVALID_OPTION",
                            f"Không được chọn trùng lặp tùy chọn trong món '{product.name}'.",
                        )

                    for opt_id in option_ids:
                        opt_entry = available_options_map.get(opt_id)
                        if not opt_entry:
                            raise OrderProcessingError(
                                "INVALID_OPTION",
                                f"Một số tùy chọn của món '{product.name}' không hợp lệ.",
                            )
                        opt, _ = opt_entry
                        if opt.status == Option.Status.INACTIVE:
                            raise OrderProcessingError(
                                "INVALID_OPTION",
                                f"Tùy chọn '{opt.name}' hiện không khả dụng.",
                            )
                        item_price += opt.price
                        validated_options.append(opt)

                # Validate option groups min/max
                for group in option_group_list:
                    selected_in_group = [
                        opt
                        for opt in validated_options
                        if available_options_map.get(opt.id, (None, None))[1]
                        == group.id
                    ]
                    count = len(selected_in_group)
                    if group.is_required and count < group.min_select:
                        raise OrderProcessingError(
                            "INVALID_OPTION",
                            f"Món '{product.name}' yêu cầu chọn tối thiểu {group.min_select} tùy chọn trong nhóm '{group.name}'.",
                        )
                    if group.max_select > 0 and count > group.max_select:
                        raise OrderProcessingError(
                            "INVALID_OPTION",
                            f"Món '{product.name}' chỉ cho phép chọn tối đa {group.max_select} tùy chọn trong nhóm '{group.name}'.",
                        )

                item_subtotal = item_price * quantity
                subtotal += item_subtotal
                validated_items.append(
                    {
                        "product": product,
                        "product_name": product.name,
                        "unit_price": product.price,
                        "quantity": quantity,
                        "note": item_note,
                        "subtotal": item_subtotal,
                        "options": validated_options,
                    }
                )

            # Voucher check (BR-VOU-005)
            discount = Decimal("0.00")
            voucher = order.voucher
            if voucher:
                if subtotal < voucher.minimum_order_value:
                    # Release voucher if minimum order value is not met
                    VoucherService.release_voucher(order=order)
                    voucher = None
                    discount = Decimal("0.00")
                else:
                    if voucher.discount_type == Voucher.DiscountType.FIXED:
                        discount = voucher.discount_value
                    elif voucher.discount_type == Voucher.DiscountType.PERCENTAGE:
                        discount = subtotal * (voucher.discount_value / Decimal("100"))
                        if (
                            voucher.maximum_discount
                            and discount > voucher.maximum_discount
                        ):
                            discount = voucher.maximum_discount
                    if discount > subtotal:
                        discount = subtotal

            total_amount = subtotal + order.shipping_fee - discount
            if total_amount < Decimal("0.00"):
                total_amount = Decimal("0.00")

            old_items_data = [
                {
                    "name": it.product_name,
                    "quantity": it.quantity,
                    "subtotal": float(it.subtotal),
                }
                for it in order.items.all()
            ]

            # Replace items in database using bulk_create
            order.items.all().delete()
            order_items_to_create = [
                OrderItem(
                    order=order,
                    product=v_item["product"],
                    product_name=v_item["product_name"],
                    unit_price=v_item["unit_price"],
                    quantity=v_item["quantity"],
                    note=v_item["note"],
                    subtotal=v_item["subtotal"],
                )
                for v_item in validated_items
            ]
            created_order_items = OrderItem.objects.bulk_create(order_items_to_create)

            order_item_options_to_create = []
            for order_item, v_item in zip(
                created_order_items, validated_items, strict=False
            ):
                for opt in v_item["options"]:
                    order_item_options_to_create.append(
                        OrderItemOption(
                            order_item=order_item,
                            option=opt,
                            option_name=opt.name,
                            price=opt.price,
                            quantity=1,
                        )
                    )

            if order_item_options_to_create:
                OrderItemOption.objects.bulk_create(order_item_options_to_create)

            order.subtotal = subtotal
            order.discount = discount
            order.total_amount = total_amount
            order.voucher = voucher

            # Update Payment amount
            try:
                payment = order.payment
                payment.amount = total_amount
                payment.save(update_fields=["amount"])
            except Payment.DoesNotExist:
                pass

            AuditLog.objects.create(
                user=user,
                action="EDIT_COD_ORDER_ITEMS",
                entity_type="ORDER",
                entity_id=order.id,
                old_data={"items": old_items_data, "subtotal": float(order.subtotal)},
                new_data={
                    "items": [
                        {
                            "name": it["product_name"],
                            "quantity": it["quantity"],
                            "subtotal": float(it["subtotal"]),
                        }
                        for it in validated_items
                    ],
                    "subtotal": float(subtotal),
                    "total_amount": float(total_amount),
                },
            )

        if note is not None and note.strip():
            order.note = note.strip()
        if scheduled_delivery_at is not None:
            order.scheduled_delivery_at = scheduled_delivery_at

        # Transition status to CONFIRMED
        return cls.update_order_status(
            order=order,
            new_status=Order.Status.CONFIRMED,
            user=user,
        )

    @classmethod
    @transaction.atomic
    def cancel_order_by_customer(
        cls,
        order: Order,
        customer: Customer,
        reason: str = "Khách hàng tự hủy đơn",
    ) -> Order:
        """
        Customer cancels own order while in PENDING_CONFIRMATION state (BR-ORD-005, BR-SEC-001).
        """
        if order.customer_id != customer.id:
            raise OrderProcessingError(
                "FORBIDDEN", "Bạn không có quyền hủy đơn hàng của người khác."
            )

        if order.status != Order.Status.PENDING_CONFIRMATION:
            raise InvalidStateTransitionError(
                "Đơn hàng đã được quán tiếp nhận/xác nhận, không thể tự hủy trên ứng dụng (BR-ORD-005)."
            )

        return cls.update_order_status(
            order=order,
            new_status=Order.Status.CANCELLED,
            user=None,
            reason=reason,
        )
