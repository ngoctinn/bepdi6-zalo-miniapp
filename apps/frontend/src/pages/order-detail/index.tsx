import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useOrder } from "@/services/order/order.queries";
import { useCancelOrder } from "@/services/order/order.mutations";
import { Button, Spinner, Text, useSnackbar } from "zmp-ui";
import { formatCurrency } from "@/utils/format";
import { BackIcon, CheckIcon } from "@/components/common/vectors";
import { OrderStatus } from "@/types/order.types";

const DELIVERY_STATUS_STEPS: Array<{
  key: OrderStatus;
  label: string;
}> = [
  { key: "PENDING_CONFIRMATION", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "PREPARING", label: "Đang làm" },
  { key: "READY", label: "Sẵn sàng" },
  { key: "DELIVERING", label: "Đang giao" },
  { key: "COMPLETED", label: "Hoàn tất" },
];

const PICKUP_STATUS_STEPS: Array<{
  key: OrderStatus;
  label: string;
}> = [
  { key: "PENDING_CONFIRMATION", label: "Chờ xác nhận" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "PREPARING", label: "Đang làm" },
  { key: "READY", label: "Mời đến lấy" },
  { key: "COMPLETED", label: "Đã nhận món" },
];

const getStepIndex = (status: OrderStatus, isPickup: boolean): number => {
  const steps = isPickup ? PICKUP_STATUS_STEPS : DELIVERY_STATUS_STEPS;
  const index = steps.findIndex((s) => s.key === status);
  return index > -1 ? index : 0;
};

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();

  const { data: order, isLoading, error } = useOrder(orderId);
  const cancelOrderMutation = useCancelOrder();
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    openSnackbar({ text: `Đã sao chép ${label}`, type: "success" });
  };

  const handleCancelOrder = async () => {
    if (!orderId) return;
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    setIsCancelling(true);
    try {
      await cancelOrderMutation.mutateAsync({
        id: orderId,
        reason: "Khách hàng tự hủy trên ứng dụng",
      });
      openSnackbar({ text: "Đã hủy đơn hàng thành công", type: "success" });
    } catch (err) {
      openSnackbar({
        text: err instanceof Error ? err.message : "Không thể hủy đơn hàng",
        type: "error",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-background">
        <Spinner />
        <Text size="xSmall" className="mt-2 text-neutral500">
          Đang tải thông tin đơn hàng...
        </Text>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-center">
        <div className="text-4xl">❌</div>
        <Text size="small" className="font-medium text-neutral700">
          Không tìm thấy thông tin đơn hàng
        </Text>
        <Button
          size="small"
          onClick={() => navigate("/order")}
          className="bg-primary text-white"
        >
          Xem danh sách đơn
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
      "NGUYEN THI TUYET THU",
    )}`;

  return (
    <div className="flex flex-col gap-3 p-3.5 pb-24">
      {/* Order Info */}
      <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-transparent p-3.5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-neutral900">
              Đơn hàng #{order.order_code}
            </h1>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                isPickup
                  ? "border border-amber-300/50 bg-amber-500/10 text-amber-800"
                  : "border border-primary/30 bg-primary/10 text-primary"
              }`}
            >
              {isPickup ? "Tự đến lấy" : "Giao tận nơi"}
            </span>
          </div>
          <span className="text-xxsmall text-neutral500">
            {new Date(order.created_at).toLocaleString("vi-VN")}
          </span>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xxsmall font-bold ${
            isCancelled
              ? "border border-red-200/50 bg-red-500/10 text-red-600"
              : order.status === "COMPLETED"
                ? "border border-primary/30 bg-primary/15 text-primary"
                : "border border-amber-300/50 bg-amber-500/15 text-amber-800"
          }`}
        >
          {order.status_display || order.status}
        </span>
      </div>

      {/* Timeline Trạng Thái Đơn Hàng */}
      <div className="rounded-2xl border border-black/5 bg-transparent p-4">
        <span className="mb-3 block text-xs font-bold text-neutral800">
          TIẾN TRÌNH ĐƠN HÀNG
        </span>

        {isCancelled ? (
          <div className="rounded-xl border border-red-200/50 bg-red-50 p-3 text-xs text-red-700">
            Đơn hàng đã bị hủy.
            {order.cancellation_reason && (
              <span className="mt-0.5 block text-neutral600">
                Lý do: {order.cancellation_reason}
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
                      <span className="text-[10px]">{idx + 1}</span>
                    )}
                  </div>
                  <span
                    className={`mt-1.5 text-[10px] leading-tight ${
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
              QUÉT MÃ VIETQR ĐỂ THANH TOÁN
            </span>
            <span
              className={`rounded px-2 py-0.5 text-xxsmall font-bold ${
                isPaid
                  ? "border border-primary/30 bg-primary/15 text-primaryDark"
                  : "animate-pulse bg-amber-100 text-amber-800"
              }`}
            >
              {isPaid ? "Đã thanh toán" : "Chờ thanh toán"}
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
                  <span className="text-neutral500">Ngân hàng:</span>
                  <span className="font-bold text-neutral900">
                    Techcombank (TCB)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">Số tài khoản:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-primary">
                      2907200329
                    </span>
                    <button
                      onClick={() => handleCopy("2907200329", "Số tài khoản")}
                      className="rounded border border-primary/30 px-1.5 py-0.5 text-xxsmall text-primary active:bg-primary/10"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">Chủ tài khoản:</span>
                  <span className="font-bold text-neutral900">
                    NGUYEN THI TUYET THU
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">Số tiền:</span>
                  <span className="text-sm font-bold text-neutral-900">
                    {formatCurrency(order.total_amount)}đ
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral500">Nội dung CK:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-neutral900">
                      {order.order_code}
                    </span>
                    <button
                      onClick={() =>
                        handleCopy(order.order_code, "Nội dung chuyển khoản")
                      }
                      className="rounded border border-primary/30 px-1.5 py-0.5 text-xxsmall text-primary active:bg-primary/10"
                    >
                      Sao chép
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-xxsmall italic text-neutral500">
                * Hệ thống sẽ tự động cập nhật trạng thái ngay sau khi nhận được
                tiền.
              </p>
            </div>
          ) : (
            <div className="mt-2 rounded-lg border border-primary/30 bg-primary/10 p-2.5 text-xs text-primaryDark">
              Đơn hàng đã được xác nhận thanh toán thành công. Bếp Dì 6 đang
              chuẩn bị món cho bạn!
            </div>
          )}
        </div>
      )}

      {/* Thông tin nhận hàng (Giao tận nơi vs Tự đến lấy) */}
      <div className="rounded-2xl border border-black/5 bg-transparent p-3.5">
        <span className="mb-2 block text-xs font-bold text-neutral800">
          {isPickup ? "ĐỊA ĐIỂM ĐẾN LẤY MÓN" : "ĐỊA CHỈ GIAO HÀNG"}
        </span>
        <div className="space-y-1 text-xs text-neutral800">
          <div className="font-semibold">
            Người nhận: {order.recipient_name} • {order.phone}
          </div>
          <div>
            {isPickup ? (
              <span className="text-neutral600">
                Nhận trực tiếp tại Bếp Dì 6 (TP. Hồ Chí Minh)
              </span>
            ) : (
              <span className="leading-relaxed text-neutral600">
                {order.delivery_address}
              </span>
            )}
          </div>
          {order.note && (
            <div className="mt-1 text-xxsmall italic text-neutral500">
              Ghi chú: "{order.note}"
            </div>
          )}
        </div>
      </div>

      {/* Danh sách món ăn */}
      <div className="rounded-2xl border border-black/5 bg-transparent p-3.5">
        <span className="mb-2.5 block text-xs font-bold text-neutral800">
          CHI TIẾT MÓN ĂN ({order.items.length})
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
          TỔNG CỘNG HÓA ĐƠN
        </span>
        <div className="flex justify-between text-neutral600">
          <span>Tạm tính</span>
          <span className="font-normal text-black">
            {formatCurrency(order.subtotal)}đ
          </span>
        </div>
        <div className="flex justify-between text-neutral600">
          <span>
            {isPickup
              ? "Hình thức"
              : `Phí giao hàng (${order.distance_km?.toFixed(1)} km)`}
          </span>
          <span className="font-normal text-black">
            {isPickup
              ? "Tự đến lấy (0đ)"
              : `${formatCurrency(order.shipping_fee)}đ`}
          </span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between font-normal text-primary">
            <span>Giảm giá</span>
            <span>-{formatCurrency(order.discount)}đ</span>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-black/5 pt-2 text-sm font-normal text-black">
          <span>Tổng thanh toán</span>
          <span className="text-base font-bold text-neutral-900">
            {formatCurrency(order.total_amount)}đ
          </span>
        </div>
      </div>

      {/* Footer Action: Hủy đơn nếu còn Chờ xác nhận */}
      {order.status === "PENDING_CONFIRMATION" && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-black/5 bg-background/95 p-3 shadow-lg backdrop-blur-md">
          <Button
            size="small"
            type="neutral"
            onClick={handleCancelOrder}
            loading={isCancelling}
            className="w-full rounded-xl border border-red-300/50 bg-red-50 py-2.5 text-xs font-semibold text-red-600"
          >
            Hủy đơn hàng này
          </Button>
        </div>
      )}
    </div>
  );
}
