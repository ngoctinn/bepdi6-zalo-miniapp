import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "@/services/order/order.queries";
import { useCancelOrder } from "@/services/order/order.mutations";
import { Button, Spinner, Text } from "zmp-ui";
import { formatCurrency } from "@/utils/format";
import { BackIcon, CheckIcon } from "@/components/common/vectors";
import { OrderStatus } from "@/types/order.types";
import { useAppToast } from "@/hooks/use-app-toast";
import { ConfirmModal } from "@/components/common/confirm-modal";
import { Badge } from "@/components/common/badge";
import { copy } from "@/constants/copy";

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
  return index > -1 ? index : 0;
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { showSuccess, showError } = useAppToast();

  const { data: order, isLoading, error } = useOrder(orderId);
  const cancelOrderMutation = useCancelOrder();
  const [isCancelling, setIsCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showSuccess(`Đã sao chép ${label}`);
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
        <div className="text-4xl">❌</div>
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
  const qrUrl =
    order.payment?.qr_code_url ||
    `https://img.vietqr.io/image/TCB-2907200329-compact2.png?amount=${Math.round(
      order.total_amount,
    )}&addInfo=${encodeURIComponent(order.order_code)}&accountName=${encodeURIComponent(
      copy.orderDetail.accountHolderName,
    )}`;

  return (
    <div className="flex flex-col gap-3 p-3.5 pb-24">
      {/* Order Info */}
      <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-transparent p-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-neutral900">
              {copy.order.orderCodePrefix || "Đơn hàng #"}
              {order.order_code}
            </h1>
            <Badge variant={isPickup ? "warning" : "primary"} size="small">
              {isPickup ? copy.checkout.pickup : copy.checkout.delivery}
            </Badge>
          </div>
          <span className="text-xxsmall text-neutral500">
            {new Date(order.created_at).toLocaleString("vi-VN")}
          </span>
        </div>
        <Badge
          variant={
            isCancelled
              ? "error"
              : order.status === "COMPLETED"
                ? "success"
                : "warning"
          }
          size="medium"
        >
          {order.status_display || order.status}
        </Badge>
      </div>

      {/* Timeline Trạng Thái Đơn Hàng */}
      <div className="rounded-2xl border border-black/5 bg-transparent p-4">
        <span className="mb-3 block text-xs font-bold text-neutral800">
          {copy.orderDetail.timelineSection}
        </span>

        {isCancelled ? (
          <div className="rounded-xl border border-red-200/50 bg-red-50 p-3 text-xs text-red-700">
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
            <div className="absolute left-4 right-4 top-4 -z-0 h-0.5 bg-black/10" />
            <div
              className="absolute left-4 top-4 -z-0 h-0.5 bg-primary transition-all duration-500"
              style={{
                width: `${(currentStep / Math.max(1, steps.length - 1)) * 90}%`,
              }}
            />

            {steps.map((step, idx) => {
              const isPassed = idx <= currentStep;
              const isCurrent = idx === currentStep;

              return (
                <div
                  key={step.key}
                  className="z-10 flex w-12 flex-col items-center text-center"
                >
                  <div
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs transition-all ${
                      isPassed
                        ? "shadow-xs bg-primary text-white"
                        : "bg-black/10 text-neutral400"
                    } ${isCurrent ? "scale-110 ring-4 ring-primary/20" : ""}`}
                  >
                    {isPassed && idx < currentStep ? (
                      <CheckIcon className="h-3 w-3" />
                    ) : (
                      <span className="text-xxxxsmall">{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-1.5 text-xxxxsmall leading-tight ${
                      isCurrent
                        ? "font-bold text-primary"
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
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold text-neutral900">
              {copy.orderDetail.vietqrTitle}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-xxsmall font-bold ${
                isPaid
                  ? "border border-primary/30 bg-primary/15 text-primaryDark"
                  : "animate-pulse bg-amber-100 text-amber-800"
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

              <div className="w-full space-y-2 rounded-xl border border-black/5 bg-black/[0.02] p-3 text-left text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">
                    {copy.orderDetail.bankLabel}
                  </span>
                  <span className="font-bold text-neutral900">
                    {copy.orderDetail.bankName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">
                    {copy.orderDetail.accountNumberLabel}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-primary">
                      2907200329
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          "2907200329",
                          copy.orderDetail.accountNumberLabel,
                        )
                      }
                      className="rounded border border-primary/30 px-1.5 py-0.5 text-xxsmall text-primary active:bg-primary/10"
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
                    {copy.orderDetail.accountHolderName}
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
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-neutral900">
                      {order.order_code}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(
                          order.order_code,
                          copy.orderDetail.transferContentLabel,
                        )
                      }
                      className="rounded border border-primary/30 px-1.5 py-0.5 text-xxsmall text-primary active:bg-primary/10"
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
      <div className="rounded-2xl border border-black/5 bg-transparent p-3.5">
        <span className="mb-2 block text-xs font-bold text-neutral800">
          {isPickup
            ? copy.checkout.pickupStoreSection
            : copy.checkout.deliveryAddressSection}
        </span>
        <div className="space-y-1 text-xs text-neutral800">
          <div className="font-semibold">
            {copy.orderDetail.recipient}: {order.recipient_name} • {order.phone}
          </div>
          <div>
            {isPickup ? (
              <span className="text-neutral600">
                {copy.orderDetail.directPickupHint}
              </span>
            ) : (
              <span className="leading-relaxed text-neutral600">
                {order.delivery_address}
              </span>
            )}
          </div>
          {order.scheduled_delivery_at && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <span className="rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 text-xxsmall font-semibold text-primaryDark">
                ⏰{" "}
                {isPickup
                  ? copy.orderDetail.scheduledPickupTime
                  : copy.orderDetail.scheduledDeliveryTime}{" "}
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

      {/* Danh sách món ăn */}
      <div className="rounded-2xl border border-black/5 bg-transparent p-3.5">
        <span className="mb-2.5 block text-xs font-bold text-neutral800">
          {copy.orderDetail.itemsSection} ({order.items.length})
        </span>
        <div className="space-y-3 divide-y divide-black/5">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between pt-2 first:pt-0"
            >
              <div className="flex-1 pr-3">
                <div className="text-xs font-normal text-black">
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
              <span className="whitespace-nowrap text-xs font-normal text-black">
                {formatCurrency(item.subtotal)}đ
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Chi tiết thanh toán */}
      <div className="space-y-2 rounded-2xl border border-black/5 bg-transparent p-3.5 text-xs">
        <span className="mb-1 block text-xs font-bold text-neutral800">
          {copy.orderDetail.totalSection}
        </span>
        <div className="flex justify-between text-neutral600">
          <span>{copy.checkout.subtotal}</span>
          <span className="font-normal text-black">
            {formatCurrency(order.subtotal)}đ
          </span>
        </div>
        <div className="flex justify-between text-neutral600">
          <span>
            {isPickup
              ? "Hình thức"
              : `${copy.checkout.shippingFee} (${order.distance_km?.toFixed(1)} km)`}
          </span>
          <span className="font-normal text-black">
            {isPickup
              ? "Tự đến lấy (0đ)"
              : `${formatCurrency(order.shipping_fee)}đ`}
          </span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between font-normal text-primary">
            <span>{copy.checkout.discount}</span>
            <span>-{formatCurrency(order.discount)}đ</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-black/5 pt-2 text-sm font-normal text-black">
          <span>{copy.checkout.total}</span>
          <span className="text-base font-bold text-neutral-900">
            {formatCurrency(order.total_amount)}đ
          </span>
        </div>
      </div>

      {/* Footer Action: Hủy đơn nếu còn Chờ xác nhận */}
      {order.status === "PENDING_CONFIRMATION" && (
        <div className="safe-bottom fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-background/95 px-3 pt-3 shadow-lg backdrop-blur-md">
          <Button
            size="small"
            type="neutral"
            onClick={() => setShowCancelModal(true)}
            loading={isCancelling}
            className="w-full rounded-xl border border-red-300/50 bg-red-50 py-2.5 text-xs font-semibold text-red-600 transition-all active:scale-[0.99]"
          >
            {copy.orderDetail.cancelButton}
          </Button>
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
