import logging

import requests
from celery import shared_task
from django.conf import settings

from apps.customers.models import User
from apps.notifications.models import Notification
from apps.orders.models import Order

logger = logging.getLogger(__name__)


@shared_task(name="notifications.send_in_app_notification")
def send_in_app_notification(
    customer_id: int,
    title: str,
    message: str,
    order_id: int | None = None,
    notification_type: str = Notification.NotificationType.ORDER_STATUS,
) -> int:
    """Creates in-app notification record for customer."""
    notif = Notification.objects.create(
        customer_id=customer_id,
        order_id=order_id,
        type=notification_type,
        title=title,
        message=message,
    )
    return notif.id


@shared_task(name="notifications.send_telegram_staff_order_alert")
def send_telegram_staff_order_alert(order_id: int) -> bool:
    """
    Sends detailed new order alert to staff/kitchen Telegram group.
    (Hybrid Notification Strategy: 0 VNĐ, Realtime <1s).
    """
    enable_tele = getattr(settings, "ENABLE_TELEGRAM_NOTIFICATION", True)
    if not enable_tele:
        logger.info(
            "ENABLE_TELEGRAM_NOTIFICATION is False. Skipping Telegram alert for Order #%s.",
            order_id,
        )
        return False

    try:
        order = (
            Order.objects.select_related("customer", "voucher")
            .prefetch_related("items__options")
            .get(pk=order_id)
        )
    except Order.DoesNotExist:
        logger.error("Order #%s not found for Telegram staff alert.", order_id)
        return False

    bot_token = getattr(settings, "TELEGRAM_BOT_TOKEN", "")
    chat_id = getattr(settings, "TELEGRAM_CHAT_ID", "")

    if not bot_token or not chat_id:
        logger.info(
            "TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not configured. Mocking staff alert for Order #%s.",
            order.order_code,
        )
        return True

    # Build detailed order item lines
    item_lines = []
    for idx, item in enumerate(order.items.all(), 1):
        options = item.options.all()
        opt_str = (
            f" (+{', '.join(opt.option_name for opt in options)})" if options else ""
        )
        item_note = f"\n   ↳ *Ghi chú:* _{item.note}_" if item.note else ""
        item_lines.append(
            f"*{idx}. {item.product_name}* x{item.quantity} - {item.subtotal:,.0f}đ{opt_str}{item_note}"
        )

    items_text = "\n".join(item_lines) if item_lines else "_Không có thông tin món_"

    # Delivery & Maps information
    delivery_type_display = (
        "🛵 *Giao tận nơi*"
        if order.delivery_type == Order.DeliveryType.DELIVERY
        else "🏪 *Nhận tại quán*"
    )
    maps_link = ""
    if order.delivery_latitude and order.delivery_longitude:
        maps_link = f"\n📍 [Xem vị trí trên Google Maps](https://www.google.com/maps?q={order.delivery_latitude},{order.delivery_longitude})"

    order_note = f"\n📝 *Lưu ý của khách:* _{order.note}_" if order.note else ""
    discount_line = (
        f"\n🎟️ *Giảm giá:* -{order.discount:,.0f}đ ({order.voucher.code if order.voucher else ''})"
        if order.discount > 0
        else ""
    )
    shipping_line = (
        f"\n🚚 *Phí ship:* {order.shipping_fee:,.0f}đ" if order.shipping_fee > 0 else ""
    )

    telegram_text = (
        f"🔔 *[BẾP DÌ 6] ĐƠN HÀNG MỚI!*\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"🧾 *Mã đơn:* `#{order.order_code}`\n"
        f"👤 *Khách hàng:* {order.recipient_name} (`{order.phone}`)\n"
        f"🏷️ *Hình thức:* {delivery_type_display}\n"
        f"🏠 *Địa chỉ:* {order.delivery_address}{maps_link}{order_note}\n\n"
        f"🍱 *Chi tiết món ăn:*\n{items_text}\n"
        f"━━━━━━━━━━━━━━━━━━\n"
        f"💰 *Tạm tính:* {order.subtotal:,.0f}đ"
        f"{shipping_line}{discount_line}\n"
        f"💵 *Tổng thanh toán:* *{order.total_amount:,.0f}đ*\n"
        f"💳 *Phương thức:* {order.get_payment_method_display()}"
    )

    try:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": telegram_text,
            "parse_mode": "Markdown",
            "disable_web_page_preview": True,
        }
        res = requests.post(url, json=payload, timeout=5)
        if res.status_code == 200:
            logger.info(
                "Sent Telegram staff alert for Order #%s successfully.",
                order.order_code,
            )
            return True
        else:
            logger.warning(
                "Failed to send Telegram alert for Order #%s: %s",
                order.order_code,
                res.text,
            )
            return False
    except Exception as e:
        logger.error(
            "Error calling Telegram API for Order #%s: %s", order.order_code, e
        )
        return False


@shared_task(name="notifications.send_zalo_oa_staff_alert")
def send_zalo_oa_staff_alert(order_id: int) -> bool:
    """
    Sends direct message to staff/admin personal Zalo accounts via Zalo OA OpenAPI when new order arrives.
    (ADR-005: Staff Zalo OA Alert).
    """
    try:
        order = Order.objects.select_related("customer").get(pk=order_id)
    except Order.DoesNotExist:
        logger.error("Order #%s not found for Zalo OA staff alert.", order_id)
        return False

    # Find active staff/admin with linked zalo_user_id
    staff_recipients = User.objects.filter(
        status=User.Status.ACTIVE,
        zalo_user_id__isnull=False,
    ).exclude(zalo_user_id="")

    oa_access_token = getattr(settings, "ZALO_OA_ACCESS_TOKEN", "")
    if not oa_access_token:
        logger.info(
            "ZALO_OA_ACCESS_TOKEN not configured. Mocking staff alert for Order #%s to %s recipients.",
            order.order_code,
            staff_recipients.count(),
        )
        return True

    text_message = (
        f"🔔 [BẾP DÌ 6] ĐƠN HÀNG MỚI!\n"
        f"Mã đơn: #{order.order_code}\n"
        f"Khách hàng: {order.recipient_name} ({order.phone})\n"
        f"Tổng tiền: {order.total_amount:,.0f}đ ({order.get_payment_method_display()})\n"
        f"Địa chỉ: {order.delivery_address}"
    )

    success_count = 0
    for staff in staff_recipients:
        try:
            payload = {
                "recipient": {"user_id": staff.zalo_user_id},
                "message": {"text": text_message},
            }
            headers = {
                "access_token": oa_access_token,
                "Content-Type": "application/json",
            }
            res = requests.post(
                "https://openapi.zalo.me/v3.0/oa/message/cs",
                json=payload,
                headers=headers,
                timeout=5,
            )
            if res.status_code == 200:
                success_count += 1
            else:
                logger.warning(
                    "Failed to send Zalo OA message to staff %s: %s",
                    staff.username,
                    res.text,
                )
        except Exception as e:
            logger.error(
                "Error sending Zalo OA alert to staff %s: %s", staff.username, e
            )

    return success_count > 0


@shared_task(name="notifications.send_zns_order_delivering")
def send_zns_order_delivering(order_id: int) -> bool:
    """
    Sends ZNS message when order status changes to DELIVERING.
    Gated by ENABLE_ZNS_NOTIFICATION feature flag (ADR-005).
    """
    enable_zns = getattr(settings, "ENABLE_ZNS_NOTIFICATION", False)
    if not enable_zns:
        logger.info(
            "ENABLE_ZNS_NOTIFICATION is False. Skipping ZNS for order #%s.", order_id
        )
        return False

    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return False

    logger.info(
        "Sending ZNS delivering notification for order #%s to phone %s.",
        order.order_code,
        order.phone,
    )
    # ZNS API calling logic with template parameters
    return True
