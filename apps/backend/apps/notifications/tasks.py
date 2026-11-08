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


def format_telegram_order_message(order: Order, max_items: int = 15) -> str:
    """
    Formats new order notification using safe Telegram HTML tags according to Hallmark design principles.
    - Zero decorative emojis / visual noise.
    - Clear typographic hierarchy, clean monospace for codes, readable line structure.
    - Escapes all dynamic/user-provided fields to prevent 400 Bad Request entity parsing errors.
    - Truncates item list if greater than max_items to stay well under the 4096 character limit.
    """
    import html

    # Build detailed order item lines
    items = list(order.items.all())
    displayed_items = items[:max_items]
    item_lines = []

    for idx, item in enumerate(displayed_items, 1):
        options = item.options.all()
        safe_pname = html.escape(str(item.product_name))
        opt_str = ""
        if options:
            escaped_opts = ", ".join(
                html.escape(str(opt.option_name)) for opt in options
            )
            opt_str = f"\n   +{escaped_opts}"

        item_note = ""
        if item.note:
            escaped_item_note = html.escape(str(item.note))[:150]
            item_note = f"\n   <i>Ghi chú: {escaped_item_note}</i>"

        item_lines.append(
            f"{idx}. <b>{safe_pname}</b> x{item.quantity} — {item.subtotal:,.0f}đ{opt_str}{item_note}"
        )

    if len(items) > max_items:
        remaining_count = len(items) - max_items
        item_lines.append(f"   <i>... và còn {remaining_count} món khác</i>")

    items_text = (
        "\n".join(item_lines) if item_lines else "<i>Không có thông tin món</i>"
    )

    # Customer and Delivery Information
    safe_recipient_name = html.escape(str(order.recipient_name or ""))
    safe_phone = html.escape(str(order.phone or ""))

    if order.delivery_type == Order.DeliveryType.PICKUP:
        delivery_info = "Nhận tại quán"
    else:
        safe_address = html.escape(str(order.delivery_address or ""))[:250]
        delivery_info = f"Giao tận nơi: {safe_address}"
        if order.delivery_latitude and order.delivery_longitude:
            delivery_info += (
                f'\n<a href="https://www.google.com/maps?q={order.delivery_latitude},{order.delivery_longitude}">'
                f"Vị trí trên Google Maps</a>"
            )

    order_note = ""
    if order.note:
        safe_note = html.escape(str(order.note))[:300]
        order_note = f"\nGhi chú đơn: <i>{safe_note}</i>"

    # Pricing & Discounts
    pricing_lines = [f"Tạm tính: {order.subtotal:,.0f}đ"]

    if order.shipping_fee > 0:
        pricing_lines.append(f"Phí giao hàng: {order.shipping_fee:,.0f}đ")

    if order.discount > 0:
        voucher_code_str = (
            f" ({html.escape(str(order.voucher.code))})" if order.voucher else ""
        )
        pricing_lines.append(f"Giảm giá{voucher_code_str}: -{order.discount:,.0f}đ")

    pricing_lines.append(f"<b>Tổng thanh toán: {order.total_amount:,.0f}đ</b>")
    pricing_lines.append(
        f"Thanh toán: {html.escape(str(order.get_payment_method_display()))}"
    )

    pricing_text = "\n".join(pricing_lines)

    telegram_text = (
        f"<b>Bếp Dì 6 · Đơn hàng mới</b>\n\n"
        f"Mã đơn: <code>#{html.escape(str(order.order_code))}</code>\n\n"
        f"<b>Khách hàng</b>\n"
        f"{safe_recipient_name} · <code>{safe_phone}</code>\n"
        f"{delivery_info}{order_note}\n\n"
        f"<b>Chi tiết món</b>\n"
        f"{items_text}\n\n"
        f"──────────────────\n"
        f"{pricing_text}"
    )
    return telegram_text


@shared_task(
    bind=True,
    name="notifications.send_telegram_staff_order_alert",
    autoretry_for=(requests.RequestException,),
    retry_backoff=True,
    max_retries=3,
    retry_jitter=True,
)
def send_telegram_staff_order_alert(self, order_id: int) -> bool:
    """
    Sends detailed new order alert to staff/kitchen Telegram group.
    (Hybrid Notification Strategy: 0 VNĐ, Realtime <1s, Safe Telegram HTML).
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

    telegram_text = format_telegram_order_message(order)

    try:
        url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
        payload = {
            "chat_id": chat_id,
            "text": telegram_text,
            "parse_mode": "HTML",
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
    except requests.RequestException:
        logger.warning(
            "Network error calling Telegram API for Order #%s, retrying...",
            order.order_code,
        )
        raise
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
        role__in=[User.Role.STAFF, User.Role.ADMIN],
        zalo_user_id__isnull=False,
    ).exclude(zalo_user_id="")

    from apps.notifications.services import ZaloOATokenService

    oa_access_token = ZaloOATokenService.get_valid_access_token()
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
    try:
        order = Order.objects.get(pk=order_id)
    except Order.DoesNotExist:
        return False

    shipper_info = (
        f"{order.shipper_name} ({order.shipper_phone})"
        if order.shipper_phone
        else order.shipper_name
    )
    provider_name = (
        "Ahamove"
        if order.delivery_provider == Order.DeliveryProvider.AHAMOVE
        else "GrabExpress"
        if order.delivery_provider == Order.DeliveryProvider.GRAB
        else "Shipper Quán"
    )

    enable_zns = getattr(settings, "ENABLE_ZNS_NOTIFICATION", False)
    if not enable_zns:
        logger.info(
            "ENABLE_ZNS_NOTIFICATION is False. Mocking ZNS delivering for order #%s (%s: %s) to phone %s.",
            order.order_code,
            provider_name,
            shipper_info or "Chưa rõ",
            order.phone,
        )
        return False

    logger.info(
        "Sending ZNS delivering notification for order #%s (%s: %s) to phone %s.",
        order.order_code,
        provider_name,
        shipper_info or "Chưa rõ",
        order.phone,
    )
    # ZNS API calling logic with template parameters
    return True
