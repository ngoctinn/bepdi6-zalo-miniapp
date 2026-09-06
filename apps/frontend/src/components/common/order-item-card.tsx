import { useNavigate } from "react-router-dom";
import { Order } from "@/types/order.types";
import { formatCurrency } from "@/utils/format";
import { Badge } from "@/components/common/badge";
import { StoreIcon, TruckIcon } from "@/components/common/vectors";
import {
  getOrderStatusLabel,
  getOrderStatusVariant,
  getDeliveryTypeLabel,
} from "@/utils/order-display";

interface OrderItemCardProps {
  order: Order;
}

export function OrderItemCard({ order }: OrderItemCardProps) {
  const navigate = useNavigate();
  const totalQuantity = (order.items || []).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const isPickup = order.delivery_type === "PICKUP";

  return (
    <div
      onClick={() => navigate(`/order/${order.id}`)}
      className="w-full cursor-pointer rounded-2xl border border-black/5 bg-transparent p-3.5 transition-all active:scale-[0.99] active:bg-black/[0.02]"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
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
          <span className="text-xs font-bold text-neutral900">
            #{order.order_code}
          </span>
        </div>
        <Badge
          variant={getOrderStatusVariant(order.status)}
          size="small"
          className="font-bold"
        >
          {getOrderStatusLabel(order.status, order.delivery_type)}
        </Badge>
      </div>

      <div className="mb-2.5 space-y-1.5 rounded-xl border border-black/5 bg-black/[0.02] p-2.5 text-xs">
        {order.items?.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-neutral800"
          >
            <span className="truncate pr-2 font-normal">
              {item.product_name}{" "}
              <span className="font-normal text-neutral400">
                x{item.quantity}
              </span>
            </span>
            <span className="shrink-0 font-normal text-black">
              {formatCurrency(item.subtotal)}đ
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-black/5 pt-2 text-xs">
        <span className="text-xxsmall text-neutral400">
          {new Date(order.created_at).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          })}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xxsmall text-neutral500">
            Tổng ({totalQuantity} món):
          </span>
          <span className="text-sm font-bold text-neutral-900">
            {formatCurrency(order.total_amount)}đ
          </span>
        </div>
      </div>
    </div>
  );
}
