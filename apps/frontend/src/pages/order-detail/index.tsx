import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "@/services/order/order.queries";
import { useShopInfo } from "@/services/shop/shop.queries";
import { useCancelOrder } from "@/services/order/order.mutations";
import { Button, Spinner, Text } from "zmp-ui";
import { openWebview, saveImageToGallery } from "zmp-sdk/apis";
import { formatCurrency } from "@/utils/format";
import { makePhoneCall } from "@/utils/phone";
import {
  CheckIcon,
  CopyIcon,
  DownloadIcon,
  NavigationIcon,
  PhoneIcon,
  StoreIcon,
  MapPinIcon,
  TruckIcon,
} from "@/components/common/vectors";
import { OrderStatus } from "@/types/order.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { Badge } from "@/components/common/badge";
import { copy } from "@/constants/copy";
import {
  DEFAULT_BANK_CONFIG,
  DEFAULT_SHOP_ADDRESS,
  DEFAULT_SHOP_COORDINATES,
  getVietQrUrl,
} from "@/constants/shop";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
  getDeliveryTypeLabel,
} from "@/utils/order-display";

const DELIVERY_STATUS_STEPS: Array<{
  key: OrderStatus;
  label: string;
}> = [
  { key: "PENDING_CONFIRMATION", label: copy.order.status.pending },
  { key: "CONFIRMED", label: copy.order.status.confirmed },
  { key: "PREPARING", label: copy.order.status.preparing },
  { key: "READY", label: copy.order.status.ready },
  { key: "DELIVERING", label: copy.order.status.delivering || "Đang giao" },
  { key: "COMPLETED", label: copy.order.status.completed },
];

const PICKUP_STATUS_STEPS: Array<{
  key: OrderStatus;
  label: string;
}> = [
  { key: "PENDING_CONFIRMATION", label: copy.order.status.pending },
  { key: "CONFIRMED", label: copy.order.status.confirmed },
  { key: "PREPARING", label: copy.order.status.preparing },
  { key: "READY", label: copy.order.status.readyForPickup || "Mời đến lấy" },
  { key: "COMPLETED", label: copy.order.status.pickedUp || "Đã nhận món" },
];

const getStepIndex = (status: OrderStatus, isPickup: boolean): number => {
  const steps = isPickup ? PICKUP_STATUS_STEPS : DELIVERY_STATUS_STEPS;
  const index = steps.findIndex((s) => s.key === status);
  if (index > -1) return index;
  if (isPickup && status === "DELIVERING") return 3; // Mời đến lấy (READY)
  return 0;
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useAppToast();

  const { data: order, isLoading, error } = useOrder(orderId);
  const { data: shopInfo } = useShopInfo();
  const cancelOrderMutation = useCancelOrder();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isSavingQr, setIsSavingQr] = useState(false);

  const handleCopy = async (text: string, label: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
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
      showSuccess(`Đã sao chép ${label}`);
    } catch (err) {
      console.warn("[Clipboard] copy failed:", err);
      showError("Không thể tự động sao chép. Vui lòng sao chép thủ công.");
    }
  };

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

  const handleSaveQr = async () => {
    if (!qrUrl || isSavingQr) return;
    setIsSavingQr(true);
    try {
      await saveImageToGallery({
        imageUrl: qrUrl,
      });
      showSuccess(copy.orderDetail.savedQrSuccess);
    } catch (err) {
      console.warn("[VietQR] saveImageToGallery error:", err);
      showError(copy.orderDetail.savedQrFailed);
    } finally {
      setIsSavingQr(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!orderId) return;

    setIsCancelling(true);
    try {
      await cancelOrderMutation.mutateAsync({
        id: orderId,
        reason: copy.orderDetail.cancelReasonUser,
      });
      showSuccess(copy.orderDetail.cancelSuccess);
      setShowCancelModal(false);
    } catch (err) {
      showError(
        err instanceof Error ? err.message : copy.orderDetail.cancelFailed,
      );
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background">
        <Spinner />
        <Text size="xSmall" className="mt-2 text-neutral500">
          {copy.orderDetail.loading}
        </Text>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
          <svg
            className="h-6 w-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <Text size="small" className="font-medium text-neutral700">
          {copy.orderDetail.notFound}
        </Text>
        <Button
          size="small"
          onClick={() => navigate("/order")}
          className="bg-primary text-white"
        >
          {copy.orderDetail.viewOrdersList}
        </Button>
      </div>
    );
  }

  const isPickup = order.delivery_type === "PICKUP";
  const steps = isPickup ? PICKUP_STATUS_STEPS : DELIVERY_STATUS_STEPS;
  const isCancelled = order.status === "CANCELLED";
  const currentStep = getStepIndex(order.status, isPickup);
  const isBankTransfer = order.payment_method === "BANK_TRANSFER";
  const isPaid = order.payment?.status === "PAID";

  const bankAccountNo =
    shopInfo?.vietqr_account_no || DEFAULT_BANK_CONFIG.accountNumber;
  const bankAccountHolder =
    shopInfo?.vietqr_account_name || copy.orderDetail.accountHolderName;
  const bankCode = shopInfo?.vietqr_bank_id || DEFAULT_BANK_CONFIG.bankCode;
  const bankDisplayName = shopInfo?.vietqr_bank_id || copy.orderDetail.bankName;

  const qrUrl =
    order.payment?.qr_code_url ||
    getVietQrUrl({
      amount: order.total_amount,
      orderCode: order.order_code,
      bankCode: bankCode,
      accountNumber: bankAccountNo,
      accountHolderName: bankAccountHolder,
    });

  const shopLat = shopInfo?.latitude ?? DEFAULT_SHOP_COORDINATES.latitude;
  const shopLng = shopInfo?.longitude ?? DEFAULT_SHOP_COORDINATES.longitude;
  const shopAddress = shopInfo?.address_text || DEFAULT_SHOP_ADDRESS;
  const shopHotline = shopInfo?.hotline || "0987654321";
  const shopName = shopInfo?.shop_name || copy.brand.name || "Bếp Dì 6";

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    shopAddress,
  )}`;

  return (
    <div className="flex flex-col gap-3 p-3.5 pb-28">
      {/* Order Info */}
      <div className="shadow-xs flex items-center justify-between rounded-2xl border border-black/[0.06] bg-white p-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-neutral900">
              {copy.order.orderCodePrefix || "Đơn hàng #"}
              {order.order_code}
            </h1>
            <Badge
              variant="neutral"
              size="small"
              className="gap-1 border-stone-200 bg-stone-100 text-stone-700"
            >
              {isPickup ? (
                <StoreIcon className="h-3 w-3 text-stone-600" />
              ) : (
                <TruckIcon className="h-3 w-3 text-stone-600" />
              )}
              <span>{getDeliveryTypeLabel(order.delivery_type)}</span>
            </Badge>
          </div>
          <span className="mt-0.5 block text-xxsmall text-neutral500">
            {new Date(order.created_at).toLocaleString("vi-VN")}
          </span>
        </div>
        <Badge
          variant={getOrderStatusVariant(order.status)}
          size="medium"
          className="font-bold"
        >
          {getOrderStatusLabel(order.status, order.delivery_type)}
        </Badge>
      </div>

      {/* Timeline Trạng Thái Đơn Hàng */}
      <div className="shadow-xs rounded-2xl border border-black/[0.06] bg-white p-4">
        <span className="mb-3 block text-xs font-bold text-neutral900">
          {copy.orderDetail.timelineSection}
        </span>

        {isCancelled ? (
          <div className="rounded-xl border border-red-200/70 bg-red-50 p-3 text-xs text-red-700">
            {copy.orderDetail.cancelledNotice}
            {order.cancellation_reason && (
              <span className="mt-0.5 block text-neutral600">
                {copy.orderDetail.cancelReasonPrefix}{" "}
                {order.cancellation_reason}
              </span>
            )}
          </div>
        ) : (
          <div className="relative flex items-start justify-between pt-2">
            {/* Progress Line */}
            <div className="absolute left-6 right-6 top-5 -z-0 h-0.5 bg-stone-200" />
            <div
              className="absolute left-6 top-5 -z-0 h-0.5 bg-primary transition-all duration-500"
              style={{
                width: `${(currentStep / Math.max(1, steps.length - 1)) * 88}%`,
              }}
            />

            {steps.map((step, idx) => {
              const isPassed = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div
                  key={step.key}
                  className="z-10 flex w-14 flex-col items-center text-center"
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-all ${
                      isPassed
                        ? "shadow-xs bg-primary text-white"
                        : "border border-black/[0.08] bg-stone-100 text-neutral400"
                    } ${isCurrent ? "scale-110 ring-4 ring-primary/20" : ""}`}
                  >
                    {isPassed && idx < currentStep ? (
                      <CheckIcon className="h-3 w-3 text-white" />
                    ) : (
                      <span className="text-xxxxsmall font-bold">
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xxxxsmall leading-tight ${
                      isCurrent
                        ? "font-bold text-olive900"
                        : isPassed
                          ? "font-medium text-neutral800"
                          : "text-neutral400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Khối Thanh Toán VietQR Tức Thì (Nếu chọn BANK_TRANSFER) */}
      {isBankTransfer && !isCancelled && (
        <div className="shadow-xs space-y-3 rounded-2xl border border-primary/25 bg-olive50/60 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral900">
              {copy.orderDetail.vietqrTitle}
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-xxsmall font-bold ${
                isPaid
                  ? "border border-primary/30 bg-olive100 text-olive900"
                  : "animate-pulse border border-amber-300/50 bg-amber-100 text-amber-800"
              }`}
            >
              {isPaid
                ? copy.orderDetail.paidStatus
                : copy.orderDetail.pendingPayStatus}
            </span>
          </div>

          {!isPaid ? (
            <div className="mt-3 flex flex-col items-center space-y-3 text-center">
              <div className="inline-block rounded-2xl border border-black/10 bg-white p-2.5 shadow-sm">
                <img
                  src={qrUrl}
                  alt="VietQR Bep Di 6"
                  className="h-52 w-52 object-contain"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveQr}
                disabled={isSavingQr}
                className="shadow-2xs inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/30 bg-white px-3.5 py-2 text-xs font-bold text-primary transition-all active:scale-95 active:bg-olive50"
              >
                {isSavingQr ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                ) : (
                  <DownloadIcon className="h-4 w-4" />
                )}
                <span>{copy.orderDetail.saveQrToGallery}</span>
              </button>

              <div className="w-full space-y-2.5 rounded-xl border border-black/5 bg-black/[0.02] p-3.5 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">
                    {copy.orderDetail.bankLabel}
                  </span>
                  <span className="font-bold text-neutral900">
                    {bankDisplayName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">
                    {copy.orderDetail.accountNumberLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary">
                      {bankAccountNo}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          bankAccountNo,
                          copy.orderDetail.accountNumberLabel,
                        )
                      }
                      className="shadow-2xs inline-flex min-h-[28px] items-center justify-center rounded-md border border-primary/30 bg-white px-2.5 py-1 text-xxsmall font-semibold text-primary transition-all active:scale-95 active:bg-primary/10"
                    >
                      {copy.orderDetail.copy}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">
                    {copy.orderDetail.accountHolderLabel}
                  </span>
                  <span className="font-bold text-neutral900">
                    {bankAccountHolder}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">
                    {copy.orderDetail.amountLabel}
                  </span>
                  <span className="text-sm font-bold text-neutral900">
                    {formatCurrency(order.total_amount)}đ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">
                    {copy.orderDetail.transferContentLabel}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-neutral900">
                      {order.order_code}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(
                          order.order_code,
                          copy.orderDetail.transferContentLabel,
                        )
                      }
                      className="shadow-2xs inline-flex min-h-[28px] items-center justify-center rounded-md border border-primary/30 bg-white px-2.5 py-1 text-xxsmall font-semibold text-primary transition-all active:scale-95 active:bg-primary/10"
                    >
                      {copy.orderDetail.copy}
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xxsmall italic text-neutral500">
                {copy.orderDetail.autoUpdateNote}
              </p>
            </div>
          ) : (
            <div className="mt-2 rounded-lg border border-primary/30 bg-primary/10 p-2.5 text-xs text-primaryDark">
              {copy.orderDetail.paidSuccessMessage}
            </div>
          )}
        </div>
      )}

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
            <div className="rounded-xl border border-primary/20 bg-olive50/40 p-3">
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <StoreIcon className="h-4 w-4" />
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
                  className="shadow-xs flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white transition-all active:scale-[0.98] active:bg-primaryDark"
                >
                  <NavigationIcon className="h-3.5 w-3.5" />
                  <span>{copy.orderDetail.openGoogleMap}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleCopy(shopAddress, copy.orderDetail.shopAddressLabel)
                  }
                  className="shadow-2xs flex items-center justify-center gap-1 rounded-lg border border-black/10 bg-white px-2.5 py-2 text-xs font-semibold text-neutral700 transition-all active:scale-[0.98] active:bg-stone-50"
                  title={copy.orderDetail.copyAddress}
                >
                  <CopyIcon className="h-3.5 w-3.5" />
                  <span>{copy.orderDetail.copy}</span>
                </button>
                <button
                  type="button"
                  onClick={() => makePhoneCall(shopHotline)}
                  className="shadow-2xs flex items-center justify-center gap-1.5 rounded-lg border border-primary/30 bg-white px-3 py-2 text-xs font-semibold text-primary transition-all active:scale-[0.98] active:bg-olive50"
                >
                  <PhoneIcon className="h-3.5 w-3.5" />
                  <span>{shopHotline}</span>
                </button>
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
                  <span className="rounded-md border border-primary/20 bg-olive50/90 px-2 py-0.5 text-xxsmall font-semibold text-primaryDark">
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
                <span className="rounded-md border border-primary/20 bg-olive50/90 px-2 py-0.5 text-xxsmall font-semibold text-primaryDark">
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
          {copy.orderDetail.itemsSection} ({order.items.length})
        </span>
        <div className="space-y-3 divide-y divide-black/[0.05]">
          {order.items.map((item) => (
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
                {formatCurrency(item.subtotal)}đ
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
            {formatCurrency(order.subtotal)}đ
          </span>
        </div>
        <div className="flex justify-between text-neutral600">
          <span>
            {isPickup
              ? "Hình thức"
              : `${copy.checkout.shippingFee} (${order.distance_km?.toFixed(1)} km)`}
          </span>
          <span className="font-medium text-neutral900">
            {isPickup
              ? "Tự đến lấy (0đ)"
              : `${formatCurrency(order.shipping_fee)}đ`}
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
          <span className="text-base font-extrabold text-neutral900">
            {formatCurrency(order.total_amount)}đ
          </span>
        </div>
      </div>

      {/* Footer Action: Hủy đơn nếu còn Chờ xác nhận (Chuẩn Touch-Target Zalo 48px) */}
      {order.status === "PENDING_CONFIRMATION" && (
        <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-background/95 px-4 pb-3 pt-3 shadow-lg backdrop-blur-md">
          <button
            type="button"
            onClick={() => setShowCancelModal(true)}
            disabled={isCancelling}
            className="shadow-2xs flex h-12 w-full items-center justify-center rounded-xl border border-red-200 bg-red-50/90 text-sm font-semibold text-red-600 transition-all active:scale-[0.98] active:bg-red-100 disabled:opacity-50"
          >
            {isCancelling ? (
              <div className="flex items-center gap-2">
                <Spinner />
                <span>Đang xử lý...</span>
              </div>
            ) : (
              <span>{copy.orderDetail.cancelButton}</span>
            )}
          </button>
        </div>
      )}

      {/* Confirm Modal Hủy đơn theo chuẩn Zalo Guidelines */}
      <ConfirmModal
        visible={showCancelModal}
        title={copy.orderDetail.cancelModalTitle}
        description={copy.orderDetail.cancelModalDesc}
        type="danger"
        confirmText={copy.orderDetail.cancelConfirmText}
        cancelText={copy.orderDetail.cancelKeepText}
        loading={isCancelling}
        onConfirm={handleConfirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
