import { Order } from "@/types/order.types";
import { Icon, Spinner } from "zmp-ui";

interface StaffOrderCardProps {
  order: Order;
  isProcessing: boolean;
  onUpdateStatus: (orderId: number, nextStatus: string) => Promise<void>;
  onOpenCancelModal: (order: Order) => void;
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
          label: "Chờ xác nhận",
          className: "bg-amber-100 text-amber-900 border-amber-300",
        };
      case "CONFIRMED":
        return {
          label: "Đã xác nhận",
          className: "bg-blue-100 text-blue-900 border-blue-300",
        };
      case "PREPARING":
        return {
          label: "Bếp đang làm",
          className: "bg-sky-100 text-sky-900 border-sky-300",
        };
      case "READY":
        return {
          label: "Sẵn sàng giao",
          className: "bg-teal-100 text-teal-900 border-teal-300",
        };
      case "DELIVERING":
        return {
          label: "Đang giao",
          className: "bg-indigo-100 text-indigo-900 border-indigo-300",
        };
      case "COMPLETED":
        return {
          label: "Hoàn tất",
          className: "bg-emerald-100 text-emerald-900 border-emerald-300",
        };
      case "CANCELLED":
        return {
          label: "Đã hủy",
          className: "bg-rose-100 text-rose-900 border-rose-300",
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

  return (
    <div className="shadow-xs overflow-hidden rounded-2xl border border-black/5 bg-white transition-all">
      {/* Header Card */}
      <div className="flex items-center justify-between border-b border-black/5 bg-stone-50/80 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-extrabold text-neutral-900">
            #{order.order_code}
          </span>
          <span
            className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xxxxsmall font-bold ${badge.className}`}
          >
            {badge.label}
          </span>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-stone-600">
          <Icon
            icon={isDelivery ? "zi-location" : "zi-home"}
            className="text-sm text-primary"
          />
          <span>{isDelivery ? "Giao tận nơi" : "Tại quán"}</span>
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
              <span>Gọi</span>
            </a>
          )}
        </div>

        {isDelivery && order.delivery_address && (
          <div className="mt-2 flex items-start gap-1.5 rounded-xl bg-stone-50 p-2.5 text-xs text-stone-700">
            <Icon
              icon="zi-location-solid"
              className="mt-0.5 shrink-0 text-sm text-primary"
            />
            <span className="leading-snug">{order.delivery_address}</span>
          </div>
        )}

        {order.note && (
          <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 p-2 text-xs font-semibold text-amber-900">
            <span className="font-bold">Lưu ý giao: </span>
            {order.note}
          </div>
        )}
      </div>

      {/* Items List (Kitchen focus) */}
      <div className="px-3.5 py-2.5">
        <p className="mb-2 text-xxxxsmall font-extrabold uppercase tracking-wider text-stone-400">
          Chi tiết món cần nấu ({order.items?.length || 0} món)
        </p>

        <div className="flex flex-col gap-2.5">
          {order.items?.map((item, idx) => (
            <div
              key={item.id || idx}
              className="flex flex-col border-b border-dashed border-stone-100 pb-2 last:border-0 last:pb-0"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-stone-800 text-xxxsmall font-black text-white">
                    {item.quantity}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-neutral900">
                      {item.product_name}
                    </p>
                    {item.options && item.options.length > 0 && (
                      <p className="text-xs font-medium text-stone-600">
                        + {item.options.map((o) => o.option_name).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
                <span className="text-xs font-bold text-stone-700">
                  {Number(item.subtotal || 0).toLocaleString("vi-VN")}đ
                </span>
              </div>

              {item.note && (
                <div className="mt-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-medium text-amber-900">
                  <span className="font-bold">Ghi chú món: </span>
                  {item.note}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer Card: Payment & Touch Actions */}
      <div className="border-t border-black/5 bg-stone-50/50 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xxxxsmall text-stone-500">
              {isBankTransfer
                ? "Chuyển khoản VietQR"
                : "Tiền mặt khi nhận (COD)"}
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-black text-neutral900">
                {Number(order.total_amount || 0).toLocaleString("vi-VN")}đ
              </span>
              {isPaid ? (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xxxxsmall font-bold text-emerald-800">
                  ĐÃ TT
                </span>
              ) : (
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xxxxsmall font-bold text-amber-800">
                  CHƯA TT
                </span>
              )}
            </div>
          </div>

          <span className="text-xxxxsmall text-stone-400">
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
                className="flex h-12 w-24 items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 active:bg-rose-100 disabled:opacity-50"
              >
                <Icon icon="zi-close-circle" className="text-base" />
                <span>Hủy</span>
              </button>

              <button
                disabled={isProcessing}
                onClick={() => onUpdateStatus(order.id, "PREPARING")}
                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white shadow-sm active:opacity-90 disabled:opacity-50"
              >
                {isProcessing ? (
                  <Spinner visible logo={false} />
                ) : (
                  <>
                    <Icon icon="zi-check-circle" className="text-lg" />
                    <span>Xác Nhận & Nấu Món</span>
                  </>
                )}
              </button>
            </>
          )}

          {(order.status === "CONFIRMED" || order.status === "PREPARING") && (
            <button
              disabled={isProcessing}
              onClick={() => onUpdateStatus(order.id, "READY")}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-600 text-sm font-bold text-white shadow-sm active:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon icon="zi-check-circle" className="text-lg" />
                  <span>Đã Nấu Xong (Sẵn Sàng Giao)</span>
                </>
              )}
            </button>
          )}

          {order.status === "READY" && (
            <button
              disabled={isProcessing}
              onClick={() => onUpdateStatus(order.id, "DELIVERING")}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-sky-600 text-sm font-bold text-white shadow-sm active:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon icon="zi-location" className="text-lg" />
                  <span>Bàn Giao Shipper</span>
                </>
              )}
            </button>
          )}

          {order.status === "DELIVERING" && (
            <button
              disabled={isProcessing}
              onClick={() => onUpdateStatus(order.id, "COMPLETED")}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white shadow-sm active:opacity-90 disabled:opacity-50"
            >
              {isProcessing ? (
                <Spinner visible logo={false} />
              ) : (
                <>
                  <Icon icon="zi-check-circle" className="text-lg" />
                  <span>Hoàn Tất Đơn Hàng</span>
                </>
              )}
            </button>
          )}

          {(order.status === "COMPLETED" || order.status === "CANCELLED") && (
            <div className="flex h-10 flex-1 items-center justify-center rounded-xl bg-stone-100 text-xs font-semibold text-stone-500">
              Đơn hàng đã kết thúc
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
