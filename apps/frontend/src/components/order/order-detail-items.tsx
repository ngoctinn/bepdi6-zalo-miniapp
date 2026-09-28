import { useState } from "react";
import { Order } from "@/types/order.types";
import { ShopInfo } from "@/types/shop.types";
import { formatCurrency } from "@/utils/format";
import { makePhoneCall } from "@/utils/phone";
import {
  CheckIcon,
  CopyIcon,
  MapPinIcon,
  NavigationIcon,
  PhoneIcon,
  StoreIcon,
} from "@/components/common/vectors";
import { copy } from "@/constants/copy";
import { cn } from "@/utils/cn";
import { openWebview } from "zmp-sdk/apis";
import { useAppToast } from "@/hooks/use-app-toast";
import { DEFAULT_SHOP_ADDRESS } from "@/constants/shop";

interface OrderDetailItemsProps {
  order: Order;
  shopInfo?: ShopInfo;
}

export function OrderDetailItems({ order, shopInfo }: OrderDetailItemsProps) {
  const { showError } = useAppToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isPickup = order.delivery_type === "PICKUP";
  const shopAddress = shopInfo?.address_text || DEFAULT_SHOP_ADDRESS;
  const shopHotline = shopInfo?.hotline || "";
  const shopName = shopInfo?.shop_name || copy.brand.name || "Bếp Dì 6";

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    shopAddress,
  )}`;

  const handleOpenDirections = () => {
    try {
      openWebview({
        url: googleMapsUrl,
        config: {
          style: "bottomSheet",
          leftButton: "back",
        },
      });
    } catch (e) {
      console.warn("[Map] openWebview error, falling back to window.open:", e);
      window.open(googleMapsUrl, "_blank");
    }
  };

  const handleCopy = async (text: string, key: string, label: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (!successful) {
          throw new Error("Copy command failed");
        }
      }
      setCopiedKey(key);
      setTimeout(() => {
        setCopiedKey((prev) => (prev === key ? null : prev));
      }, 1500);
    } catch (err) {
      console.warn("[Clipboard] copy failed:", err);
      showError(
        copy.orderDetail.copyFailedFallback ||
          "Không thể tự động sao chép. Vui lòng sao chép thủ công.",
      );
    }
  };

  return (
    <>
      {/* Thông tin nhận hàng (Giao tận nơi vs Tự đến lấy) */}
      <div className="shadow-xs space-y-3 rounded-2xl border border-black/[0.06] bg-white p-4">
        <span className="block text-xs font-bold uppercase tracking-wider text-neutral900">
          {isPickup
            ? copy.checkout.pickupStoreSection
            : copy.checkout.deliveryAddressSection}
        </span>

        {isPickup ? (
          <div className="space-y-3">
            {/* Thẻ thông tin địa chỉ cửa hàng + nút chỉ đường */}
            <div className="border-primary/20 rounded-xl border bg-olive50/40 p-3">
              <div className="flex items-start gap-2.5">
                <div className="bg-primary/10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-primary">
                  <StoreIcon className="h-4 w-4 shrink-0" />
                </div>
                <div className="flex-1">
                  <div className="font-bold text-neutral900">{shopName}</div>
                  <div className="mt-1 text-xs leading-relaxed text-neutral700">
                    {shopAddress}
                  </div>
                </div>
              </div>

              {/* Action Buttons: Google Maps, Sao chép địa chỉ & Hotline */}
              <div className="mt-3 flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenDirections}
                  aria-label={copy.orderDetail.openGoogleMap || "Xem đường đi"}
                  className="shadow-xs flex min-h-[38px] flex-1 touch-manipulation items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] active:bg-primaryDark"
                >
                  <NavigationIcon className="h-3.5 w-3.5 shrink-0" />
                  <span>{copy.orderDetail.openGoogleMap}</span>
                </button>
                <button
                  type="button"
                  aria-label="Sao chép địa chỉ quán"
                  onClick={() =>
                    handleCopy(
                      shopAddress,
                      "shopAddress",
                      copy.orderDetail.shopAddressLabel,
                    )
                  }
                  className={cn(
                    "shadow-2xs flex min-h-[38px] touch-manipulation items-center justify-center gap-1 rounded-lg border px-3 py-2 text-xs font-semibold transition-all active:scale-[0.98]",
                    copiedKey === "shopAddress"
                      ? "border-emerald-500 bg-emerald-50 font-bold text-emerald-700"
                      : "border-black/10 bg-white text-neutral700 active:bg-stone-50",
                  )}
                  title={copy.orderDetail.copyAddress}
                >
                  {copiedKey === "shopAddress" ? (
                    <>
                      <CheckIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                      <span>Đã chép</span>
                    </>
                  ) : (
                    <>
                      <CopyIcon className="h-3.5 w-3.5 shrink-0" />
                      <span>{copy.orderDetail.copy}</span>
                    </>
                  )}
                </button>
                {shopHotline && (
                  <button
                    type="button"
                    aria-label={`Gọi hotline quán ${shopHotline}`}
                    onClick={() => makePhoneCall(shopHotline)}
                    className="shadow-2xs border-primary/30 flex min-h-[38px] touch-manipulation items-center justify-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-xs font-semibold text-primary transition-all active:scale-[0.98] active:bg-olive50"
                  >
                    <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
                    <span>{shopHotline}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Thông tin người đến lấy */}
            <div className="space-y-1 rounded-xl border border-black/[0.05] bg-stone-50/70 p-3 text-xs">
              <div className="text-xxsmall font-medium text-neutral500">
                {copy.orderDetail.recipient}:
              </div>
              <div className="font-semibold text-neutral900">
                {order.recipient_name} • {order.phone}
              </div>
              {order.scheduled_delivery_at && (
                <div className="mt-1.5 flex items-center gap-1.5 pt-0.5">
                  <span className="border-primary/20 rounded-md border bg-olive50/90 px-2 py-0.5 text-xxsmall font-semibold text-primaryDark">
                    {copy.orderDetail.scheduledPickupTime}{" "}
                    {new Date(order.scheduled_delivery_at).toLocaleTimeString(
                      "vi-VN",
                      {
                        hour: "2-digit",
                        minute: "2-digit",
                      },
                    )}
                  </span>
                </div>
              )}
              {order.note && (
                <div className="mt-1 text-xxsmall italic text-neutral500">
                  {copy.checkout.note}: "{order.note}"
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Giao tận nơi */
          <div className="space-y-2 text-xs text-neutral800">
            <div className="flex items-start gap-2">
              <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <div className="font-semibold text-neutral900">
                  {copy.orderDetail.recipient}: {order.recipient_name} •{" "}
                  {order.phone}
                </div>
                <div className="mt-1 leading-relaxed text-neutral600">
                  {order.delivery_address}
                </div>
              </div>
            </div>

            {order.scheduled_delivery_at && (
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="border-primary/20 rounded-md border bg-olive50/90 px-2 py-0.5 text-xxsmall font-semibold text-primaryDark">
                  {copy.orderDetail.scheduledDeliveryTime}{" "}
                  {new Date(order.scheduled_delivery_at).toLocaleTimeString(
                    "vi-VN",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            )}
            {order.note && (
              <div className="mt-1 text-xxsmall italic text-neutral500">
                {copy.checkout.note}: "{order.note}"
              </div>
            )}
          </div>
        )}
      </div>

      {/* Danh sách món ăn */}
      <div className="shadow-xs rounded-2xl border border-black/[0.06] bg-white p-4">
        <span className="mb-2.5 block text-xs font-bold text-neutral900">
          {copy.orderDetail.itemsSection} ({order.items?.length || 0})
        </span>
        <div className="space-y-3 divide-y divide-black/[0.05]">
          {(order.items || []).map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between pt-2 first:pt-0"
            >
              <div className="flex-1 pr-3">
                <div className="text-xs font-medium text-neutral900">
                  {item.product_name}{" "}
                  <span className="font-normal text-neutral500">
                    x{item.quantity}
                  </span>
                </div>
                {item.options && item.options.length > 0 && (
                  <div className="mt-0.5 text-xxsmall text-neutral500">
                    + {item.options.map((o) => o.option_name).join(", ")}
                  </div>
                )}
                {item.note && (
                  <div className="mt-0.5 text-xxsmall italic text-amber-700">
                    "{item.note}"
                  </div>
                )}
              </div>
              <span className="whitespace-nowrap text-xs font-bold text-neutral900">
                {formatCurrency(item.subtotal || 0)}đ
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chi tiết thanh toán */}
      <div className="shadow-xs space-y-2.5 rounded-2xl border border-black/[0.06] bg-white p-4 text-xs">
        <span className="block text-xs font-bold text-neutral900">
          {copy.orderDetail.totalSection}
        </span>
        <div className="flex justify-between text-neutral600">
          <span>{copy.checkout.subtotal}</span>
          <span className="font-medium text-neutral900">
            {formatCurrency(order.subtotal || 0)}đ
          </span>
        </div>
        <div className="flex justify-between text-neutral600">
          <span>
            {isPickup
              ? copy.checkout.deliveryMethod || "Hình thức"
              : `${copy.checkout.shippingFee} (${Number(order.distance_km ?? 0).toFixed(1)} km)`}
          </span>
          <span className="font-medium text-neutral900">
            {isPickup
              ? copy.checkout.selfPickupFree || "Tự đến lấy (0đ)"
              : `${formatCurrency(order.shipping_fee || 0)}đ`}
          </span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between font-medium text-primary">
            <span>{copy.checkout.discount}</span>
            <span>-{formatCurrency(order.discount)}đ</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-black/[0.05] pt-3 text-sm">
          <span className="font-bold text-neutral900">
            {copy.checkout.total}
          </span>
          <span className="font-mono text-base font-extrabold text-neutral900">
            {formatCurrency(order.total_amount || 0)}đ
          </span>
        </div>
      </div>
    </>
  );
}

export default OrderDetailItems;
