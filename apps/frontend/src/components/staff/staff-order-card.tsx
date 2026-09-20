import { copy } from "@/constants/copy";
import { Order } from "@/types/order.types";
import { useEffect, useState, useRef } from "react";
import { Icon, Spinner } from "zmp-ui";

interface StaffOrderCardProps {
  order: Order;
  isProcessing: boolean;
  onUpdateStatus: (orderId: number, nextStatus: string) => Promise<void>;
  onOpenCancelModal: (order: Order) => void;
  onOpenDispatchModal?: (order: Order) => void;
  onOpenDetail?: (order: Order) => void;
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
  onOpenDetail,
}: StaffOrderCardProps) {
  const isDelivery = order.delivery_type === "DELIVERY";
  const isPaid = order.payment?.status === "PAID";
  const isEnded = order.status === "COMPLETED" || order.status === "CANCELLED";

  const agingMinutes = useOrderAging(order.created_at, isEnded);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING_CONFIRMATION":
        return {
          label: copy.staff.status.pending,
          className: "bg-amber-50 text-amber-800",
        };
      case "CONFIRMED":
        return {
          label: copy.staff.status.confirmed,
          className: "bg-olive50 text-olive800",
        };
      case "PREPARING":
        return {
          label: copy.staff.status.preparing,
          className: "bg-amber-100 text-amber-900 font-semibold",
        };
      case "READY":
        return {
          label: copy.staff.status.ready,
          className: "bg-olive100 text-olive900 font-semibold",
        };
      case "DELIVERING":
        return {
          label: copy.staff.status.delivering,
          className: "bg-stone-100 text-stone-700",
        };
      case "COMPLETED":
        return {
          label: copy.staff.status.completed,
          className: "bg-stone-100 text-stone-600",
        };
      case "CANCELLED":
        return {
          label: copy.staff.status.cancelled,
          className: "bg-red-50 text-red-600",
        };
      default:
        return {
          label: status,
          className: "bg-stone-100 text-stone-700",
        };
    }
  };

  const badge = getStatusBadge(order.status);

  // Aging Timer đồng bộ nhẹ nhàng, sạch sẽ
  const renderAgingBadge = () => {
    if (agingMinutes === null || isEnded) return null;

    if (agingMinutes < 1) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xxsmall font-medium text-stone-600">
          <Icon
            icon="zi-clock-1"
            className="flex shrink-0 items-center justify-center text-xs leading-none text-stone-400"
          />
          <span className="leading-none">{copy.staff.aging.justNow}</span>
        </span>
      );
    }

    if (agingMinutes < 10) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-xxsmall font-medium text-stone-600">
          <Icon
            icon="zi-clock-1"
            className="flex shrink-0 items-center justify-center text-xs leading-none text-stone-400"
          />
          <span className="leading-none">
            {agingMinutes} {copy.staff.aging.minutesAgo}
          </span>
        </span>
      );
    }

    if (agingMinutes <= 20) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xxsmall font-semibold text-amber-800">
          <Icon
            icon="zi-clock-1"
            className="flex shrink-0 items-center justify-center text-xs leading-none text-amber-600"
          />
          <span className="leading-none">
            {agingMinutes} {copy.staff.aging.minutesAgo}
          </span>
        </span>
      );
    }

    return (
      <span className="inline-flex animate-pulse items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xxsmall font-bold text-red-700">
        <Icon
          icon="zi-warning-solid"
          className="flex shrink-0 items-center justify-center text-xs leading-none text-red-600"
        />
        <span className="leading-none">
          {agingMinutes} {copy.staff.aging.minutesAgo}
        </span>
      </span>
    );
  };

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

  return (
    <div
      onClick={() => onOpenDetail?.(order)}
      className="relative cursor-pointer overflow-hidden rounded-2xl bg-white p-3.5 shadow-sm transition-transform active:scale-[0.995]"
    >
      {/* 1. Header gọn gàng: Mã đơn + Loại đơn (Trái) & Thời gian + Trạng thái (Phải) */}
      <div className="flex items-center justify-between gap-2 pb-2">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-bold text-neutral900">
            #{order.order_code}
          </span>
          <span className="text-stone-300">•</span>
          <span className="inline-flex items-center gap-1 text-xs text-stone-600">
            <Icon
              icon={isDelivery ? "zi-location-solid" : "zi-home"}
              className="flex shrink-0 items-center justify-center text-xs leading-none text-primary"
            />
            <span className="leading-none">
              {isDelivery
                ? copy.staff.deliveryType.delivery
                : copy.staff.deliveryType.pickup}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {renderAgingBadge()}
          <span
            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xxsmall font-semibold leading-none ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>
      </div>

      {/* 2. Thông tin khách & Ghi chú đơn */}
      <div className="pb-2.5">
        <div className="flex items-center justify-between text-xs text-stone-600">
          <span className="truncate">
            {copy.staff.customerHeader}{" "}
            <strong className="font-semibold text-neutral900">
              {order.recipient_name}
            </strong>
            {order.phone ? ` • ${order.phone}` : ""}
          </span>
        </div>

        {order.note && (
          <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-stone-50 p-2 text-xs text-stone-700">
            <Icon
              icon="zi-chat"
              className="flex shrink-0 items-center justify-center text-xs leading-none text-stone-400"
            />
            <div className="leading-snug">
              <span className="font-bold text-stone-900">
                {copy.staff.orderNoteHeader}
              </span>
              <span>{order.note}</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Danh sách món (Flat Clean List — Không đóng hộp, không ô đen) */}
      <div className="space-y-2 border-t border-stone-100/80 py-2.5">
        {order.items?.map((item, idx) => {
          const itemId = item.id || idx;
          return (
            <div key={itemId} className="text-xs">
              <div className="flex items-start gap-2">
                <span className="font-mono text-sm font-black text-primary">
                  {item.quantity}x
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold leading-snug text-neutral900">
                    {item.product_name}
                  </p>
                  {item.options && item.options.length > 0 && (
                    <p className="mt-0.5 text-xs text-stone-500">
                      ↳ {item.options.map((o) => o.option_name).join(", ")}
                    </p>
                  )}
                  {item.note && (
                    <div className="mt-1 inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-xxsmall font-semibold text-amber-900">
                      <Icon
                        icon="zi-warning-circle-solid"
                        className="flex shrink-0 items-center justify-center text-xs leading-none text-amber-600"
                      />
                      <span className="leading-none">
                        {copy.staff.itemWarningPrefix}
                        {item.note}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Thanh toán & Tổng tiền */}
      <div className="flex items-center justify-between border-t border-stone-100/80 py-2 text-xs">
        <div>
          {isPaid ? (
            <span className="inline-flex items-center gap-1 text-xxsmall font-semibold text-primary">
              <Icon
                icon="zi-check-circle-solid"
                className="flex shrink-0 items-center justify-center text-xs leading-none"
              />
              <span className="leading-none">
                {copy.staff.payment.paidOnlineBadge}
              </span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xxsmall font-semibold text-amber-800">
              <Icon
                icon="zi-warning-solid"
                className="flex shrink-0 items-center justify-center text-xs leading-none text-amber-600"
              />
              <span className="leading-none">
                {copy.staff.payment.cashOnDeliveryBadge}
              </span>
            </span>
          )}
        </div>

        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-xxsmall text-stone-400">
            {order.created_at
              ? new Date(order.created_at).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
          <span className="font-mono text-sm font-bold text-neutral900">
            {Number(order.total_amount || 0).toLocaleString("vi-VN")}
            {copy.common.currency}
          </span>
        </div>
      </div>

      {/* 5. Nút bấm hành động 1-chạm */}
      <div
        className="flex items-center gap-2 pt-1"
        onClick={(e) => e.stopPropagation()}
      >
        {order.status === "PENDING_CONFIRMATION" && (
          <>
            <button
              type="button"
              disabled={isProcessing}
              onClick={() =>
                handleDebouncedAction(() => onOpenCancelModal(order))
              }
              className="inline-flex h-11 w-12 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-stone-600 transition-colors active:bg-stone-200 disabled:opacity-50"
              title={copy.staff.actions.cancel}
              aria-label={copy.staff.actions.cancel}
            >
              <Icon
                icon="zi-close-circle"
                className="flex shrink-0 items-center justify-center text-base leading-none"
              />
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() =>
                handleDebouncedAction(() =>
                  onUpdateStatus(order.id, "PREPARING"),
                )
              }
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition-transform hover:bg-olive800 active:scale-[0.98] disabled:opacity-50"
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
            type="button"
            disabled={isProcessing}
            onClick={() =>
              handleDebouncedAction(() => onUpdateStatus(order.id, "READY"))
            }
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-amber-600 text-xs font-bold text-white shadow-sm transition-transform hover:bg-amber-700 active:scale-[0.98] disabled:opacity-50"
          >
            {isProcessing ? (
              <Spinner visible logo={false} />
            ) : (
              <>
                <Icon
                  icon="zi-check-circle-solid"
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
          <>
            {order.delivery_type === "DELIVERY" && onOpenDispatchModal ? (
              <button
                type="button"
                disabled={isProcessing}
                onClick={() =>
                  handleDebouncedAction(() => onOpenDispatchModal(order))
                }
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-olive700 text-xs font-bold text-white shadow-sm transition-transform hover:bg-olive800 active:scale-[0.98] disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner visible logo={false} />
                ) : (
                  <>
                    <Icon
                      icon="zi-send"
                      className="flex shrink-0 items-center justify-center text-base leading-none"
                    />
                    <span className="leading-none">
                      {order.shipper_name
                        ? copy.staff.dispatch.changeShipper
                        : copy.staff.dispatch.assignShipper}
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
                className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-olive700 text-xs font-bold text-white shadow-sm transition-transform hover:bg-olive800 active:scale-[0.98] disabled:opacity-50"
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
                        ? copy.staff.actions.pickupHandover
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
                title={copy.staff.updateShipperBtn}
                aria-label={copy.staff.updateShipperBtn}
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-stone-600 transition-colors active:bg-stone-200 disabled:opacity-50"
              >
                <Icon
                  icon="zi-edit"
                  className="flex shrink-0 items-center justify-center text-base leading-none"
                />
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
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-neutral900 text-xs font-bold text-white shadow-sm transition-transform hover:bg-black active:scale-[0.98] disabled:opacity-50"
            >
              {isProcessing ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon
                    icon="zi-check-circle-solid"
                    className="text-olive400 flex shrink-0 items-center justify-center text-base leading-none"
                  />
                  <span className="leading-none">
                    {copy.staff.actions.completeOrder}
                  </span>
                </>
              )}
            </button>
          </div>
        )}

        {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
          <div className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-xxsmall font-medium text-stone-500">
            {copy.staff.actions.orderEnded}
          </div>
        )}
      </div>
    </div>
  );
}
