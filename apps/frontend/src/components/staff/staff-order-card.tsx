import { copy } from "@/constants/copy";
import { Order } from "@/types/order.types";
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

  return (
    <div className="shadow-xs overflow-hidden rounded-2xl border border-black/5 bg-white transition-all">
      {/* Header Card: Mã đơn, Trạng thái & Order Aging SLA Timer */}
      <div className="flex items-center justify-between border-b border-black/5 bg-stone-50/80 px-3.5 py-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm font-black text-neutral900">
            #{order.order_code}
          </span>
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xxxxsmall font-bold ${badge.className}`}
          >
            {badge.label}
          </span>

          {!isEnded && agingBadge && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xxxxsmall ${agingBadge.className}`}
            >
              <span>{agingBadge.icon}</span>
              <span>{agingBadge.text}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-stone-600">
          <Icon
            icon={isDelivery ? "zi-location" : "zi-home"}
            className="text-sm text-primary"
          />
          <span>
            {isDelivery
              ? copy.staff.deliveryType.delivery
              : copy.staff.deliveryType.pickup}
          </span>
        </div>
      </div>

      {/* Body Card: Customer & Delivery Info */}
      <div className="border-b border-black/5 px-3.5 py-2.5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-neutral900">
              {order.recipient_name}
            </p>
            <p className="font-mono text-xs text-stone-500">{order.phone}</p>
          </div>

          {order.phone && (
            <a
              href={`tel:${order.phone}`}
              className="flex h-7 items-center gap-1 rounded-full border border-primary bg-primary/10 px-2.5 text-xs font-bold text-primaryDark transition-all active:scale-95"
            >
              <Icon icon="zi-call" className="text-xs" />
              <span>{copy.staff.actions.call}</span>
            </a>
          )}
        </div>

        {isDelivery && order.delivery_address && (
          <div className="mt-1.5 flex items-start gap-1.5 text-xs text-stone-600">
            <div className="flex h-5 w-5 shrink-0 items-center justify-center text-primary">
              <Icon icon="zi-location-solid" className="text-sm" />
            </div>
            <span className="leading-5">{order.delivery_address}</span>
          </div>
        )}

        {/* High-Contrast Alert Box cho Ghi Chú Đơn của Khách */}
        {order.note && (
          <div className="shadow-xs mt-2.5 flex items-start gap-2 rounded-xl border-2 border-amber-500/80 bg-amber-50 p-2.5 text-xs font-bold text-amber-950">
            <span className="shrink-0 text-sm">🔔</span>
            <div>
              <span className="font-black uppercase tracking-wide text-amber-900">
                {copy.staff.customerNotePrefix}{" "}
              </span>
              <span className="font-bold">{order.note}</span>
            </div>
          </div>
        )}
      </div>

      {/* Items List (KDS Focus: Số lượng cực lớn, tên món nổi bật, alert box cho từng món) */}
      <div className="px-3.5 py-3">
        <div className="mb-2.5 flex items-center justify-between">
          <p className="text-xxxxsmall font-extrabold uppercase tracking-wider text-stone-400">
            {copy.staff.itemsSection} ({order.items?.length || 0})
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {order.items?.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex flex-col border-b border-dashed border-stone-100 pb-3 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  {/* Số lượng món cỡ lớn chuẩn KDS */}
                  <span className="shadow-xs flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral900 text-sm font-black text-white">
                    {item.quantity}
                  </span>
                  <div className="flex-1">
                    {/* Tên món nổi bật */}
                    <p className="text-base font-extrabold leading-snug text-neutral900">
                      {item.product_name}
                    </p>
                    {item.options && item.options.length > 0 && (
                      <p className="mt-0.5 text-xs font-semibold text-neutral600">
                        + {item.options.map((o) => o.option_name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <span className="shrink-0 text-xs font-semibold text-stone-500">
                  {Number(item.subtotal || 0).toLocaleString("vi-VN")}đ
                </span>
              </div>

              {/* High-Contrast Alert Box cho Ghi Chú Món Cần Chế Biến */}
              {item.note && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg border-2 border-amber-400 bg-amber-50 px-2.5 py-1.5 text-xs font-bold text-amber-950">
                  <span className="shrink-0">⚠️</span>
                  <span>{item.note}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Card: Payment & 1-Touch Touch Actions (Height >= 48px) */}
      <div className="border-t border-black/5 bg-stone-50/50 p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xxxxsmall text-stone-500">
              {isBankTransfer
                ? copy.staff.payment.vietqr
                : copy.staff.payment.cod}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-neutral900">
                {Number(order.total_amount || 0).toLocaleString("vi-VN")}đ
              </span>
              {isPaid ? (
                <span className="rounded bg-olive100 px-1.5 py-0.5 text-xxxxsmall font-bold text-olive900">
                  {copy.staff.payment.paid}
                </span>
              ) : (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xxxxsmall font-bold text-amber-800">
                  {copy.staff.payment.unpaid}
                </span>
              )}
            </div>
          </div>

          <span className="text-xxxxsmall font-medium text-stone-400">
            {order.created_at
              ? new Date(order.created_at).toLocaleTimeString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : ""}
          </span>
        </div>

        {/* 1-Touch Action Buttons (Height >= 48px) */}
        <div className="flex gap-2">
          {order.status === "PENDING_CONFIRMATION" && (
            <>
              <button
                disabled={isProcessing}
                onClick={() => onOpenCancelModal(order)}
                className="flex h-12 w-24 items-center justify-center gap-1 rounded-xl border border-red-100 bg-red-100/60 text-xs font-extrabold text-red-700 active:bg-red-100 disabled:opacity-50"
              >
                <Icon icon="zi-close-circle" className="text-base" />
                <span>{copy.staff.actions.cancel}</span>
              </button>

              <button
                disabled={isProcessing}
                onClick={() => onUpdateStatus(order.id, "PREPARING")}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-sm active:opacity-90 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner visible logo={false} />
                ) : (
                  <>
                    <Icon icon="zi-check-circle" className="text-lg" />
                    <span>{copy.staff.actions.confirmAndCook}</span>
                  </>
                )}
              </button>
            </>
          )}

          {(order.status === "CONFIRMED" || order.status === "PREPARING") && (
            <button
              disabled={isProcessing}
              onClick={() => onUpdateStatus(order.id, "READY")}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-extrabold text-white shadow-sm active:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon icon="zi-check-circle" className="text-lg" />
                  <span>{copy.staff.actions.cookedReady}</span>
                </>
              )}
            </button>
          )}

          {order.status === "READY" && (
            <button
              disabled={isProcessing}
              onClick={() => onUpdateStatus(order.id, "DELIVERING")}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-sm active:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon icon="zi-location" className="text-lg" />
                  <span>{copy.staff.actions.handoverShipper}</span>
                </>
              )}
            </button>
          )}

          {order.status === "DELIVERING" && (
            <button
              disabled={isProcessing}
              onClick={() => onUpdateStatus(order.id, "COMPLETED")}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-extrabold text-white shadow-sm active:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon icon="zi-check-circle" className="text-lg" />
                  <span>{copy.staff.actions.completeOrder}</span>
                </>
              )}
            </button>
          )}

          {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
            <div className="flex h-12 flex-1 items-center justify-center rounded-xl bg-stone-100 text-xs font-semibold text-stone-500">
              {copy.staff.actions.orderEnded}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
