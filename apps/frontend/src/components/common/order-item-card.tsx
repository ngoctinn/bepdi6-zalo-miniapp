import { useNavigate } from "react-router-dom";
import { Order } from "@/types/order.types";
import { formatCurrency } from "@/utils/format";

interface OrderItemCardProps {
  order: Order;
}

export function OrderItemCard({ order }: OrderItemCardProps) {
  const navigate = useNavigate();
  const totalQuantity = (order.items || []).reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  const isCancelled = order.status === "CANCELLED";
  const isCompleted = order.status === "COMPLETED";

  return (
    <div
      onClick={() => navigate(`/order/${order.id}`)}
      className="shadow-2xs w-full cursor-pointer rounded-xl border border-neutral100 bg-white p-3.5 transition-transform active:scale-[0.99]"
    >
      <div className="mb-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-neutral900">
            #{order.order_code}
          </span>
          <span className="text-xxsmall text-neutral400">
            • {new Date(order.created_at).toLocaleDateString("vi-VN")}
          </span>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-xxsmall font-bold ${
            isCancelled
              ? "bg-red-100 text-red-700"
              : isCompleted
                ? "bg-green-100 text-green-700"
                : "bg-amber-100 text-amber-800"
          }`}
        >
          {order.status_display || order.status}
        </span>
      </div>

      <div className="bg-neutral50 mb-2.5 space-y-1 rounded-lg p-2 text-xs">
        {order.items?.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between text-neutral700"
          >
            <span className="truncate pr-2">
              {item.product_name}{" "}
              <span className="font-normal text-neutral400">
                x{item.quantity}
              </span>
            </span>
            <span className="shrink-0 font-semibold">
              {formatCurrency(item.subtotal)}đ
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-neutral100 pt-1 text-xs">
        <span className="text-neutral500">
          Tổng cộng ({totalQuantity} món):
        </span>
        <span className="text-sm font-extrabold text-[#0F172A]">
          {formatCurrency(order.total_amount)}đ
        </span>
      </div>
    </div>
  );
}
