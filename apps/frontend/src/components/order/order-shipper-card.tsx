import { Order } from "@/types/order.types";
import { formatCurrency } from "@/utils/format";
import { makePhoneCall } from "@/utils/phone";
import {
  CheckIcon,
  MotorbikeIcon,
  PhoneIcon,
  TruckIcon,
} from "@/components/common/vectors";
import { copy } from "@/constants/copy";
import { cn } from "@/utils/cn";

interface OrderShipperCardProps {
  order: Order;
  isPaid: boolean;
}

export function OrderShipperCard({ order, isPaid }: OrderShipperCardProps) {
  const isPickup = order.delivery_type === "PICKUP";
  const isCancelled = order.status === "CANCELLED";
  const isDelivering = order.status === "DELIVERING";

  if (isPickup || isCancelled || !isDelivering) {
    return null;
  }

  return (
    <div className="shadow-xs overflow-hidden rounded-2xl border border-primary/30 bg-white">
      <div className="flex items-center justify-between bg-primary/10 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 animate-ping rounded-full bg-emerald-500" />
          <span className="text-xs font-black text-primary">
            {copy.orderDetail.driverDeliveringTitle ||
              "TÀI XẾ ĐANG GIAO ĐẾN BẠN"}
          </span>
        </div>
        {order.distance_km && Number(order.distance_km) > 0 && (
          <span className="shadow-2xs rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-stone-600">
            {(copy.orderDetail.distancePrefix || "Khoảng cách: ~") +
              order.distance_km +
              " km"}
          </span>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl shadow-inner",
                order.delivery_provider === "AHAMOVE"
                  ? "bg-amber-500/10 text-amber-600"
                  : order.delivery_provider === "GRAB"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-primary/10 text-primary",
              )}
            >
              {order.delivery_provider === "AHAMOVE" ? (
                <TruckIcon className="h-6 w-6 shrink-0" />
              ) : (
                <MotorbikeIcon className="h-6 w-6 shrink-0" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] font-black uppercase text-stone-700">
                  {order.delivery_provider === "AHAMOVE"
                    ? "Ahamove"
                    : order.delivery_provider === "GRAB"
                      ? "GrabExpress"
                      : "Shipper Quán"}
                </span>
                {order.shipper_tracking_code && (
                  <span className="font-mono text-[11px] text-stone-500">
                    #{order.shipper_tracking_code}
                  </span>
                )}
              </div>
              <h4 className="mt-0.5 text-sm font-black text-neutral900">
                {order.shipper_name ||
                  copy.orderDetail.driverMovingDefault ||
                  "Tài xế đang di chuyển"}
              </h4>
              <p className="text-xxsmall text-stone-500">
                {copy.orderDetail.driverMovingHint ||
                  "Vui lòng để ý điện thoại để nhận món nhé!"}
              </p>
            </div>
          </div>

          {order.shipper_phone && (
            <button
              type="button"
              aria-label={`Gọi tài xế ${order.shipper_name || ""}`}
              onClick={() => makePhoneCall(order.shipper_phone!)}
              className="shadow-xs flex h-11 shrink-0 touch-manipulation items-center justify-center gap-1.5 rounded-xl bg-primary px-3.5 text-xs font-bold text-white transition-all active:scale-95"
            >
              <PhoneIcon className="h-4 w-4 shrink-0" />
              <span>{copy.orderDetail.callDriver || "Gọi tài xế"}</span>
            </button>
          )}
        </div>

        {/* Cảnh báo tiền mặt nếu COD */}
        {order.payment_method === "COD" && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-amber-300/80 bg-amber-50 px-3 py-2 text-xs">
            <span className="font-bold text-amber-900">
              {copy.orderDetail.cashPreparedLabel || "Tiền mặt cần chuẩn bị:"}
            </span>
            <span className="font-mono text-sm font-black text-amber-900">
              {formatCurrency(order.total_amount || 0)}đ
            </span>
          </div>
        )}

        {/* Thông báo đã thanh toán Online nếu Bank Transfer */}
        {order.payment_method === "BANK_TRANSFER" && isPaid && (
          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800">
            <CheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              {copy.orderDetail.paidOnlineNotice ||
                "Đã thanh toán Online 0đ - Không thanh toán thêm cho tài xế"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default OrderShipperCard;
