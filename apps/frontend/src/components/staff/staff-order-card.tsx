import { copy } from "@/constants/copy";
import { Order } from "@/types/order.types";
import { makePhoneCall } from "@/utils/phone";
import { printOrderReceipt } from "@/utils/print-order";
import { useEffect, useState, useRef } from "react";
import { Icon, Spinner } from "zmp-ui";

interface StaffOrderCardProps {
  order: Order;
  isProcessing: boolean;
  onUpdateStatus: (orderId: number, nextStatus: string) => Promise<void>;
  onOpenCancelModal: (order: Order) => void;
  onOpenDispatchModal?: (order: Order) => void;
}

function useOrderAging(createdAt?: string, isCompletedOrCancelled?: boolean) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (isCompletedOrCancelled || !createdAt) return;
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 15000);
    return () => clearInterval(interval);
  }, [createdAt, isCompletedOrCancelled]);

  if (!createdAt) return null;
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return null;

  const diffMinutes = Math.max(0, Math.floor((now - createdTime) / 60000));
  return diffMinutes;
}

export function StaffOrderCard({
  order,
  isProcessing,
  onUpdateStatus,
  onOpenCancelModal,
  onOpenDispatchModal,
}: StaffOrderCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return {
          label: copy.staff.status.pending,
          className: "bg-amber-100 text-amber-900 border-amber-300",
        };
      case "CONFIRMED":
        return {
          label: copy.staff.status.confirmed,
          className: "bg-olive100 text-olive900 border-olive600/30",
        };
      case "PREPARING":
        return {
          label: copy.staff.status.preparing,
          className: "bg-amber-100 text-amber-900 border-amber-300",
        };
      case "READY":
        return {
          label: copy.staff.status.ready,
          className: "bg-olive50 text-olive900 border-olive600/30",
        };
      case "DELIVERING":
        return {
          label: copy.staff.status.delivering,
          className: "bg-stone-100 text-stone-800 border-stone-300",
        };
      case "COMPLETED":
        return {
          label: copy.staff.status.completed,
          className: "bg-olive100 text-olive900 border-olive600/30",
        };
      case "CANCELLED":
        return {
          label: copy.staff.status.cancelled,
          className: "bg-red-100 text-red-700 border-red-200",
        };
      default:
        return {
          label: status,
          className: "bg-stone-100 text-stone-800 border-stone-300",
        };
    }
  };

  const badge = getStatusBadge(order.status);
  const isDelivery = order.delivery_type === "DELIVERY";
  const isPaid = order.payment?.status === "PAID";
  const isBankTransfer = order.payment_method === "BANK_TRANSFER";
  const isEnded = order.status === "COMPLETED" || order.status === "CANCELLED";

  const agingMinutes = useOrderAging(order.created_at, isEnded);

  const getAgingBadge = (minutes: number | null) => {
    if (minutes === null) return null;
    if (minutes < 1) {
      return {
        text: copy.staff.aging.justNow,
        className:
          "bg-olive100 text-olive900 border border-olive600/30 font-bold",
        icon: "⏱️",
      };
    }
    if (minutes < 10) {
      return {
        text: `${minutes} ${copy.staff.aging.minutesAgo}`,
        className:
          "bg-olive100 text-olive900 border border-olive600/30 font-bold",
        icon: "⏱️",
      };
    }
    if (minutes <= 20) {
      return {
        text: `${minutes} ${copy.staff.aging.minutesAgo}`,
        className:
          "bg-amber-100 text-amber-950 border border-amber-400 font-black",
        icon: "⚠️",
      };
    }
    return {
      text: `${copy.staff.aging.overdue} ${minutes} ${copy.staff.aging.minutesAgo}`,
      className:
        "bg-red-100 text-red-800 border-2 border-red-500 font-black animate-pulse",
      icon: "🚨",
    };
  };

  const agingBadge = getAgingBadge(agingMinutes);
  const [checkedItemIds, setCheckedItemIds] = useState<
    Record<number | string, boolean>
  >({});
  const [isExpanded, setIsExpanded] = useState(true);

  // Debounce click phòng chống double-tap
  const lastActionTimeRef = useRef<number>(0);

  const handleDebouncedAction = (action: () => void) => {
    const now = Date.now();
    if (now - lastActionTimeRef.current < 500 || isProcessing) {
      return;
    }
    lastActionTimeRef.current = now;
    action();
  };

  const toggleItemCheck = (id: number | string) => {
    setCheckedItemIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div
      className={`overflow-hidden rounded-2xl border shadow-sm transition-all ${
        order.status === "PENDING_CONFIRMATION"
          ? "border-amber-300 ring-2 ring-amber-100"
          : agingMinutes && agingMinutes > 20 && !isEnded
            ? "border-red-400 ring-2 ring-red-100"
            : "border-stone-200/80 bg-white"
      }`}
    >
      {/* 1. FINANCIAL SAFETY SHIELD (Tấm Chắn Tài Chính Chống Nhầm Lẫn Thu Tiền) */}
      <div
        className={`flex items-center justify-between px-3.5 py-2 text-xs font-black tracking-wide ${
          isPaid ? "bg-emerald-600 text-white" : "bg-amber-500 text-neutral900"
        }`}
      >
        <div className="flex items-center gap-1.5">
          <Icon
            icon={isPaid ? "zi-check-circle-solid" : "zi-warning-solid"}
            className="text-base leading-none"
          />
          <span className="uppercase leading-none">
            {isPaid
              ? "ĐÃ THANH TOÁN ONLINE 0Đ"
              : `THU TIỀN MẶT COD: ${Number(order.total_amount || 0).toLocaleString("vi-VN")}đ`}
          </span>
        </div>
        <span className="text-2xs rounded bg-black/15 px-1.5 py-0.5 font-extrabold uppercase">
          {isPaid ? "CẤM THU THÊM" : "TÀI XẾ CẦN THU"}
        </span>
      </div>

      {/* 2. Header Card: Mã đơn, Trạng thái & SLA Aging Timer */}
      <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/90 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-base font-black text-neutral900">
            #{order.order_code}
          </span>
          <span
            className={`inline-flex items-center rounded-lg border px-2 py-0.5 text-xs font-bold leading-none ${badge.className}`}
          >
            {badge.label}
          </span>

          {!isEnded && agingBadge && (
            <span
              className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-bold leading-none ${agingBadge.className}`}
            >
              <Icon
                icon={
                  agingMinutes != null && agingMinutes > 20
                    ? "zi-warning-solid"
                    : "zi-clock-1"
                }
                className="flex shrink-0 items-center justify-center text-xs leading-none"
              />
              <span className="leading-none">{agingBadge.text}</span>
            </span>
          )}
        </div>

        {/* Action Nhanh: In Bill & Loại Đơn */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => printOrderReceipt(order, "DELIVERY_BAG")}
            title="In phiếu dán túi"
            className="shadow-2xs flex h-8 w-8 items-center justify-center rounded-lg border border-stone-200 bg-white text-stone-700 active:scale-95"
          >
            <Icon icon="zi-download" className="text-sm" />
          </button>
          <div className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2 py-1 text-xs font-semibold text-stone-600">
            <Icon
              icon={isDelivery ? "zi-location-solid" : "zi-home"}
              className="flex shrink-0 items-center justify-center text-xs leading-none text-primary"
            />
            <span className="text-2xs font-bold leading-none">
              {isDelivery ? "Giao hàng" : "Tại quán"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Body Card: Thông tin Khách hàng & Địa chỉ giao */}
      <div className="border-b border-stone-100 bg-white px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-extrabold text-neutral900">
              {order.recipient_name}
            </p>
            <p className="font-mono text-xs font-semibold text-stone-500">
              {order.phone}
            </p>
          </div>

          {order.phone && (
            <button
              type="button"
              onClick={() => makePhoneCall(order.phone)}
              className="shadow-2xs inline-flex h-9 shrink-0 items-center justify-center gap-1 rounded-full border border-primary/40 bg-olive50 px-3.5 text-xs font-bold text-olive900 transition-all active:scale-95"
            >
              <Icon
                icon="zi-call"
                className="flex shrink-0 items-center justify-center text-xs leading-none"
              />
              <span className="leading-none">{copy.staff.actions.call}</span>
            </button>
          )}
        </div>

        {isDelivery && order.delivery_address && (
          <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-stone-50 p-2 text-xs text-stone-600">
            <Icon
              icon="zi-location"
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center leading-none text-primary"
            />
            <span className="font-medium leading-relaxed text-stone-800">
              {order.delivery_address}
            </span>
          </div>
        )}

        {/* Ghi Chú Đơn của Khách (Cảnh báo Amber nổi bật) */}
        {order.note && (
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50/90 p-2 text-xs text-amber-950">
            <Icon
              icon="zi-chat"
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center leading-none text-amber-600"
            />
            <div className="leading-snug">
              <span className="font-black uppercase tracking-wide text-amber-900">
                {copy.staff.customerNotePrefix}{" "}
              </span>
              <span className="font-bold">{order.note}</span>
            </div>
          </div>
        )}

        {/* Thông tin Shipper đã điều phối */}
        {order.shipper_name && (
          <div className="mt-2 flex items-center justify-between rounded-xl border border-primary/20 bg-primary/5 p-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-sm font-black text-white">
                {order.delivery_provider === "AHAMOVE"
                  ? "⚡"
                  : order.delivery_provider === "GRAB"
                    ? "🟢"
                    : "🛵"}
              </span>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-3xs font-extrabold uppercase text-primary">
                    {order.delivery_provider === "AHAMOVE"
                      ? "Ahamove"
                      : order.delivery_provider === "GRAB"
                        ? "GrabExpress"
                        : "Shipper Quán"}
                  </span>
                  {order.shipper_tracking_code && (
                    <span className="text-3xs py-0.2 rounded border border-stone-200 bg-white px-1 font-mono font-bold text-stone-600">
                      {order.shipper_tracking_code}
                    </span>
                  )}
                </div>
                <p className="font-extrabold text-neutral900">
                  {order.shipper_name}
                  {order.shipper_phone && ` (${order.shipper_phone})`}
                </p>
              </div>
            </div>

            {order.shipper_phone && (
              <button
                type="button"
                onClick={() => makePhoneCall(order.shipper_phone!)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/30 bg-white text-primary active:scale-95"
                title="Gọi shipper"
              >
                <Icon icon="zi-call" className="text-xs" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 4. Items List (KDS: Bấm gạch món đã nấu, collapsible cho gọn) */}
      <div className="bg-stone-50/30 px-3.5 py-2.5">
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="mb-2 flex cursor-pointer select-none items-center justify-between py-0.5"
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-extrabold uppercase tracking-wider text-stone-700">
              Món cần làm ({order.items?.length || 0})
            </span>
            <Icon
              icon={isExpanded ? "zi-chevron-up" : "zi-chevron-down"}
              className="text-xs text-stone-500"
            />
          </div>
          <span className="text-xxxxsmall italic text-stone-400">
            {isExpanded ? "Thu gọn danh sách" : "Bấm để xem chi tiết món"}
          </span>
        </div>

        {isExpanded && (
          <div className="flex flex-col gap-2">
            {order.items?.map((item, idx) => {
              const itemId = item.id || idx;
              const isDone = !!checkedItemIds[itemId];
              return (
                <div
                  key={itemId}
                  onClick={() => toggleItemCheck(itemId)}
                  className={`flex cursor-pointer flex-col rounded-xl border p-2.5 transition-all active:scale-[0.99] ${
                    isDone
                      ? "border-olive200 bg-olive50/50 opacity-60"
                      : "shadow-2xs border-stone-200/90 bg-white hover:bg-stone-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5">
                      {/* Checkbox / Quantity Box to rõ chuẩn công thái học */}
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black transition-colors ${
                          isDone
                            ? "bg-emerald-600 text-white"
                            : "bg-neutral900 text-white"
                        }`}
                      >
                        {isDone ? (
                          <Icon icon="zi-check" className="text-base" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-extrabold leading-snug transition-all ${
                            isDone
                              ? "text-stone-400 line-through"
                              : "text-neutral900"
                          }`}
                        >
                          {item.product_name}
                        </p>
                        {item.options && item.options.length > 0 && (
                          <p className="mt-0.5 text-xs font-semibold text-stone-500">
                            +{" "}
                            {item.options.map((o) => o.option_name).join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="shrink-0 font-mono text-xs font-bold text-stone-600">
                      {Number(item.subtotal || 0).toLocaleString("vi-VN")}đ
                    </span>
                  </div>

                  {/* Ghi chú riêng cho từng món */}
                  {item.note && (
                    <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-xs font-bold text-red-900">
                      <Icon
                        icon="zi-warning-circle-solid"
                        className="flex shrink-0 items-center justify-center leading-none text-red-600"
                      />
                      <span className="leading-none">{item.note}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 5. Footer & Primary Actions (Thumb Zone: Nút bấm cao 56px, Debounce 500ms) */}
      <div className="border-t border-stone-100 bg-stone-50/90 p-3">
        <div className="mb-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-stone-600">
              {isBankTransfer
                ? copy.staff.payment.vietqr
                : copy.staff.payment.cod}
            </span>
            <span className="font-mono font-medium text-stone-400">
              {order.created_at
                ? new Date(order.created_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : ""}
            </span>
          </div>

          <span className="text-base font-black text-neutral900">
            {Number(order.total_amount || 0).toLocaleString("vi-VN")}đ
          </span>
        </div>

        {/* Primary Action Buttons (Target >= 52px, Chống Double Tap) */}
        <div className="flex items-center gap-2">
          {order.status === "PENDING_CONFIRMATION" && (
            <>
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  handleDebouncedAction(() => onOpenCancelModal(order))
                }
                className="h-13 inline-flex w-20 shrink-0 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700 active:bg-red-100 disabled:opacity-50"
              >
                <Icon
                  icon="zi-close-circle"
                  className="flex shrink-0 items-center justify-center text-sm leading-none"
                />
                <span className="leading-none">
                  {copy.staff.actions.cancel}
                </span>
              </button>

              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  handleDebouncedAction(() =>
                    onUpdateStatus(order.id, "PREPARING"),
                  )
                }
                className="h-13 inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-md active:opacity-90 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner visible logo={false} />
                ) : (
                  <>
                    <Icon
                      icon="zi-check-circle"
                      className="flex shrink-0 items-center justify-center text-lg leading-none"
                    />
                    <span className="leading-none tracking-wide">
                      {copy.staff.actions.confirmAndCook}
                    </span>
                  </>
                )}
              </button>
            </>
          )}

          {(order.status === "CONFIRMED" || order.status === "PREPARING") && (
            <button
              type="button"
              disabled={isProcessing}
              onClick={() =>
                handleDebouncedAction(() => onUpdateStatus(order.id, "READY"))
              }
              className="h-13 inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-extrabold text-white shadow-md active:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon
                    icon="zi-check-circle"
                    className="flex shrink-0 items-center justify-center text-lg leading-none"
                  />
                  <span className="leading-none tracking-wide">
                    {copy.staff.actions.cookedReady}
                  </span>
                </>
              )}
            </button>
          )}

          {order.status === "READY" && (
            <>
              {order.delivery_type === "DELIVERY" && onOpenDispatchModal ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() =>
                    handleDebouncedAction(() => onOpenDispatchModal(order))
                  }
                  className="h-13 inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-md active:opacity-90 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Spinner visible logo={false} />
                  ) : (
                    <>
                      <Icon
                        icon="zi-send"
                        className="flex shrink-0 items-center justify-center text-lg leading-none"
                      />
                      <span className="leading-none tracking-wide">
                        {order.shipper_name
                          ? "Đổi Shipper / Giao Hàng"
                          : "Điều Phối Shipper"}
                      </span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() =>
                    handleDebouncedAction(() =>
                      onUpdateStatus(
                        order.id,
                        order.delivery_type === "PICKUP"
                          ? "COMPLETED"
                          : "DELIVERING",
                      ),
                    )
                  }
                  className="h-13 inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-md active:opacity-90 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Spinner visible logo={false} />
                  ) : (
                    <>
                      <Icon
                        icon={
                          order.delivery_type === "PICKUP"
                            ? "zi-check-circle"
                            : "zi-location"
                        }
                        className="flex shrink-0 items-center justify-center text-lg leading-none"
                      />
                      <span className="leading-none tracking-wide">
                        {order.delivery_type === "PICKUP"
                          ? copy.staff.actions.pickupHandover ||
                            "Khách Đã Nhận Món"
                          : copy.staff.actions.handoverShipper}
                      </span>
                    </>
                  )}
                </button>
              )}
            </>
          )}

          {order.status === "DELIVERING" && (
            <div className="flex flex-1 gap-2">
              {order.delivery_type === "DELIVERY" && onOpenDispatchModal && (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() =>
                    handleDebouncedAction(() => onOpenDispatchModal(order))
                  }
                  title="Cập nhật shipper"
                  className="h-13 inline-flex w-14 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 active:bg-stone-100 disabled:opacity-50"
                >
                  <Icon icon="zi-edit" className="text-base" />
                </button>
              )}

              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  handleDebouncedAction(() =>
                    onUpdateStatus(order.id, "COMPLETED"),
                  )
                }
                className="h-13 inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-extrabold text-white shadow-md active:opacity-90 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner visible logo={false} />
                ) : (
                  <>
                    <Icon
                      icon="zi-check-circle"
                      className="flex shrink-0 items-center justify-center text-lg leading-none"
                    />
                    <span className="leading-none tracking-wide">
                      {copy.staff.actions.completeOrder}
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
            <div className="inline-flex h-12 flex-1 items-center justify-center rounded-xl bg-stone-100 text-xs font-semibold leading-none text-stone-500">
              {copy.staff.actions.orderEnded}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
