import { copy } from "@/constants/copy";
import { Order } from "@/types/order.types";
import { makePhoneCall } from "@/utils/phone";
import { useEffect, useState } from "react";
import { Icon, Spinner } from "zmp-ui";

interface StaffOrderCardProps {
  order: Order;
  isProcessing: boolean;
  onUpdateStatus: (orderId: number, nextStatus: string) => Promise<void>;
  onOpenCancelModal: (order: Order) => void;
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

  const toggleItemCheck = (id: number | string) => {
    setCheckedItemIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="shadow-xs overflow-hidden rounded-2xl border border-stone-200/80 bg-white transition-all">
      {/* Header Card: Mã đơn, Trạng thái & SLA Aging Timer */}
      <div className="flex items-center justify-between border-b border-stone-100 bg-stone-50/90 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-black text-neutral900">
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

        <div className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600">
          <Icon
            icon={isDelivery ? "zi-location-solid" : "zi-home"}
            className="flex shrink-0 items-center justify-center text-sm leading-none text-primary"
          />
          <span className="leading-none">
            {isDelivery
              ? copy.staff.deliveryType.delivery
              : copy.staff.deliveryType.pickup}
          </span>
        </div>
      </div>

      {/* Body Card: Customer & Delivery Info */}
      <div className="border-b border-stone-100 px-3.5 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-neutral900">
              {order.recipient_name}
            </p>
            <p className="font-mono text-xs text-stone-500">{order.phone}</p>
          </div>

          {order.phone && (
            <button
              type="button"
              onClick={() => makePhoneCall(order.phone)}
              className="inline-flex h-8 shrink-0 items-center justify-center gap-1 rounded-full border border-primary/40 bg-olive50 px-3 text-xs font-bold text-olive900 transition-all active:scale-95"
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
          <div className="mt-2 flex items-start gap-1.5 text-xs text-stone-600">
            <Icon
              icon="zi-location"
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center leading-none text-stone-400"
            />
            <span className="leading-relaxed text-stone-700">
              {order.delivery_address}
            </span>
          </div>
        )}

        {/* Ghi Chú Đơn của Khách (Clean Amber Callout) */}
        {order.note && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-300 bg-amber-50/90 p-2.5 text-xs text-amber-950">
            <Icon
              icon="zi-chat"
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center leading-none text-amber-600"
            />
            <div className="leading-snug">
              <span className="font-extrabold uppercase tracking-wide text-amber-900">
                {copy.staff.customerNotePrefix}{" "}
              </span>
              <span className="font-bold">{order.note}</span>
            </div>
          </div>
        )}
      </div>

      {/* Items List (KDS Focus: Đánh dấu món đã nấu, số lượng to rõ) */}
      <div className="px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wider text-stone-400">
            {copy.staff.itemsSection} ({order.items?.length || 0})
          </p>
          <span className="text-xxxxsmall italic text-stone-400">
            Chạm vào món để đánh dấu đã nấu
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          {order.items?.map((item, idx) => {
            const itemId = item.id || idx;
            const isDone = !!checkedItemIds[itemId];
            return (
              <div
                key={itemId}
                onClick={() => toggleItemCheck(itemId)}
                className={`flex cursor-pointer flex-col rounded-xl border p-2.5 transition-all active:scale-[0.99] ${
                  isDone
                    ? "border-olive200 bg-olive50/40 opacity-70"
                    : "border-stone-100 bg-stone-50/40 hover:bg-stone-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-start gap-2.5">
                    {/* Checkbox / Quantity Box */}
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-black transition-colors ${
                        isDone
                          ? "bg-primary text-white"
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
                        <p className="mt-0.5 text-xs font-medium text-stone-500">
                          + {item.options.map((o) => o.option_name).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 font-mono text-xs font-semibold text-stone-500">
                    {Number(item.subtotal || 0).toLocaleString("vi-VN")}đ
                  </span>
                </div>

                {/* Ghi Chú Món Cần Chế Biến */}
                {item.note && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-950">
                    <Icon
                      icon="zi-warning-circle-solid"
                      className="flex shrink-0 items-center justify-center leading-none text-amber-600"
                    />
                    <span className="leading-none">{item.note}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Card: Payment & Touch Actions */}
      <div className="border-t border-stone-100 bg-stone-50/70 p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xxxxsmall uppercase tracking-wider text-stone-500">
              {isBankTransfer
                ? copy.staff.payment.vietqr
                : copy.staff.payment.cod}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-base font-black text-neutral900">
                {Number(order.total_amount || 0).toLocaleString("vi-VN")}đ
              </span>
              {isPaid ? (
                <span className="inline-flex items-center rounded-md bg-olive100 px-1.5 py-0.5 text-xxxxsmall font-bold leading-none text-olive900">
                  {copy.staff.payment.paid}
                </span>
              ) : (
                <span className="inline-flex items-center rounded-md bg-amber-100 px-1.5 py-0.5 text-xxxxsmall font-bold leading-none text-amber-800">
                  {copy.staff.payment.unpaid}
                </span>
              )}
            </div>
          </div>

          <span className="font-mono text-xs font-medium text-stone-400">
            {order.created_at
              ? new Date(order.created_at).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
        </div>

        {/* Action Buttons (Touch Target >= 48px, Safe Spacing) */}
        <div className="flex items-center gap-2.5">
          {order.status === "PENDING_CONFIRMATION" && (
            <>
              <button
                disabled={isProcessing}
                onClick={() => onOpenCancelModal(order)}
                className="inline-flex h-12 w-20 shrink-0 items-center justify-center gap-1 rounded-xl border border-red-200 bg-red-50 text-xs font-bold text-red-700 active:bg-red-100 disabled:opacity-50"
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
                disabled={isProcessing}
                onClick={() => onUpdateStatus(order.id, "PREPARING")}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-sm active:opacity-90 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner visible logo={false} />
                ) : (
                  <>
                    <Icon
                      icon="zi-check-circle"
                      className="flex shrink-0 items-center justify-center text-base leading-none"
                    />
                    <span className="leading-none">
                      {copy.staff.actions.confirmAndCook}
                    </span>
                  </>
                )}
              </button>
            </>
          )}

          {(order.status === "CONFIRMED" || order.status === "PREPARING") && (
            <button
              disabled={isProcessing}
              onClick={() => onUpdateStatus(order.id, "READY")}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-extrabold text-white shadow-sm active:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon
                    icon="zi-check-circle"
                    className="flex shrink-0 items-center justify-center text-base leading-none"
                  />
                  <span className="leading-none">
                    {copy.staff.actions.cookedReady}
                  </span>
                </>
              )}
            </button>
          )}

          {order.status === "READY" && (
            <button
              disabled={isProcessing}
              onClick={() =>
                onUpdateStatus(
                  order.id,
                  order.delivery_type === "PICKUP" ? "COMPLETED" : "DELIVERING",
                )
              }
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-sm active:opacity-90 disabled:opacity-50"
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
                    className="flex shrink-0 items-center justify-center text-base leading-none"
                  />
                  <span className="leading-none">
                    {order.delivery_type === "PICKUP"
                      ? copy.staff.actions.pickupHandover || "Khách Đã Nhận Món"
                      : copy.staff.actions.handoverShipper}
                  </span>
                </>
              )}
            </button>
          )}

          {order.status === "DELIVERING" && (
            <button
              disabled={isProcessing}
              onClick={() => onUpdateStatus(order.id, "COMPLETED")}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-sm active:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon
                    icon="zi-check-circle"
                    className="flex shrink-0 items-center justify-center text-base leading-none"
                  />
                  <span className="leading-none">
                    {copy.staff.actions.completeOrder}
                  </span>
                </>
              )}
            </button>
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
