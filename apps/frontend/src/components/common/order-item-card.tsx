import { useNavigate } from "react-router-dom";
import { Order } from "@/types/order.types";
import { formatCurrency } from "@/utils/format";
import { Badge } from "@/components/common/badge";
import { Icon } from "zmp-ui";
import { useCartStore } from "@/stores/cart.store";
import { useAppToast } from "@/hooks/use-app-toast";
import { copy } from "@/constants/copy";
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
  const { addToCart } = useCartStore();
  const { showSuccess } = useAppToast();

  const totalQuantity = (order.items || []).reduce(
    (sum, item) => sum + (item.quantity || 0),
    0,
  );

  const isPickup = order.delivery_type === "PICKUP";
  const isCompleted = order.status === "COMPLETED";
  const isCancelled = order.status === "CANCELLED";
  const isActive = !isCompleted && !isCancelled;
  const canReorder = isCompleted || isCancelled;

  // Xử lý Đặt lại món 1-chạm vào giỏ hàng
  const handleReorder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.items || order.items.length === 0) return;

    let addedCount = 0;
    order.items.forEach((item) => {
      const productId = item.product_id ?? item.product;
      if (!productId) return;

      addedCount++;
      addToCart({
        product_id: productId,
        product_name: item.product_name,
        unit_price: Number(item.unit_price || 0),
        quantity: item.quantity || 1,
        note: item.note,
        options: item.options?.map((o) => ({
          option_id: (o.option_id ?? o.option) as number,
          option_name: o.option_name,
          price: Number(o.price || 0),
          quantity: o.quantity || 1,
        })),
      });
    });

    if (addedCount > 0) {
      showSuccess(copy.order.reorderSuccess || "Đã thêm các món vào giỏ hàng!");
      navigate("/checkout");
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Xem chi tiết đơn hàng #${order.order_code || order.id}`}
      onClick={() => navigate(`/order/${order.id}`)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/order/${order.id}`);
        }
      }}
      className="w-full cursor-pointer rounded-2xl bg-white p-4 text-left shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary active:scale-[0.995]"
    >
      {/* 1. Header: Loại nhận hàng & Mã đơn + Badge trạng thái */}
      <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-700">
            <Icon
              icon={isPickup ? "zi-home" : "zi-location-solid"}
              className="flex shrink-0 items-center justify-center text-xs leading-none text-primary"
            />
            <span className="leading-none">
              {getDeliveryTypeLabel(order.delivery_type)}
            </span>
          </span>
          <span className="text-stone-300">•</span>
          <span className="font-mono text-xs font-bold text-neutral900">
            #{order.order_code}
          </span>
        </div>

        <Badge
          variant={getOrderStatusVariant(order.status)}
          size="small"
          className="text-xxsmall font-bold"
        >
          {getOrderStatusLabel(order.status, order.delivery_type)}
        </Badge>
      </div>

      {/* 2. Danh sách món tóm tắt (Flat Clean Layout — Không hộp xám) */}
      <div className="py-2.5 text-xs">
        <div className="space-y-1">
          {order.items?.slice(0, 3).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between text-neutral800"
            >
              <span className="truncate pr-2">
                <strong className="font-bold text-neutral900">
                  {item.quantity}x
                </strong>{" "}
                <span>{item.product_name}</span>
                {item.options && item.options.length > 0 && (
                  <span className="ml-1 text-xxsmall text-stone-500">
                    ({item.options.map((o) => o.option_name).join(", ")})
                  </span>
                )}
              </span>
              <span className="shrink-0 font-mono text-stone-600">
                {formatCurrency(item.subtotal || 0)}đ
              </span>
            </div>
          ))}
          {(order.items?.length || 0) > 3 && (
            <p className="text-xxsmall italic text-stone-400">
              {copy.order.andOtherItems
                ? copy.order.andOtherItems.replace(
                    "{count}",
                    String((order.items?.length || 0) - 3),
                  )
                : `và ${(order.items?.length || 0) - 3} món khác...`}
            </p>
          )}
        </div>
      </div>

      {/* 3. Footer: Ngày giờ + Tổng tiền & Nút Đặt lại / Xem chi tiết */}
      <div className="flex items-center justify-between border-t border-stone-100 pt-2.5 text-xs">
        <span className="font-mono text-xxsmall text-stone-400">
          {new Date(order.created_at).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
          })}
        </span>

        <div className="flex items-center gap-2">
          <div className="flex items-baseline gap-1">
            <span className="text-xxsmall text-stone-500">
              {copy.order.totalItemsLabel
                ? copy.order.totalItemsLabel.replace(
                    "{count}",
                    String(totalQuantity),
                  )
                : `Tổng (${totalQuantity} món):`}
            </span>
            <span className="font-mono text-sm font-bold text-neutral900">
              {formatCurrency(order.total_amount || 0)}đ
            </span>
          </div>

          {canReorder && (
            <button
              type="button"
              onClick={handleReorder}
              className="ml-1 inline-flex h-7 items-center justify-center gap-1 rounded-full bg-primary/10 px-2.5 text-xxsmall font-bold text-primary transition-transform active:scale-95"
              title={copy.order.reorder}
            >
              <Icon
                icon="zi-retry"
                className="flex shrink-0 items-center justify-center text-xs leading-none"
              />
              <span className="leading-none">{copy.order.reorder}</span>
            </button>
          )}

          {isActive && (
            <span className="ml-1 flex items-center text-stone-400">
              <Icon icon="zi-chevron-right" className="text-xs" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
