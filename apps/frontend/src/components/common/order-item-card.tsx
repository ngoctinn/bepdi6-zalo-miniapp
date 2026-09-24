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

  const getActiveStatusMessage = () => {
    if (order.status === "PENDING_CONFIRMATION") {
      return (
        copy.order.statusMessages?.pending ||
        "Quán đã nhận đơn và đang kiểm tra..."
      );
    }
    if (order.status === "CONFIRMED" || order.status === "PREPARING") {
      return (
        copy.order.statusMessages?.preparing ||
        "Bếp Dì 6 đang chuẩn bị món thơm ngon cho bạn..."
      );
    }
    if (isPickup) {
      return (
        copy.order.statusMessages?.readyPickup ||
        "Món đã nấu xong, mời bạn đến quầy nhận nhé!"
      );
    }
    return (
      copy.order.statusMessages?.delivering ||
      "Shipper đang trên đường giao đồ ăn đến bạn..."
    );
  };

  const goToDetail = () => {
    navigate(`/order/${order.id}`);
  };

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-stone-200/90 bg-white p-3.5 shadow-sm transition-all">
      {/* 1. Header: Loại nhận hàng & Mã đơn (Trái) + Badge trạng thái (Phải) */}
      <div
        onClick={goToDetail}
        className="flex cursor-pointer items-center justify-between border-b border-stone-100 pb-2.5"
      >
        <div className="flex items-center gap-2">
          {isPickup ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-amber-300 bg-amber-50 px-2 py-0.5 text-xxsmall font-bold text-amber-800">
              <Icon
                icon="zi-home"
                className="text-xs leading-none text-amber-700"
              />
              <span className="leading-none">TỰ ĐẾN LẤY</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-xxsmall font-bold text-blue-700">
              <Icon
                icon="zi-location-solid"
                className="text-xs leading-none text-blue-600"
              />
              <span className="leading-none">GIAO TẬN NƠI</span>
            </span>
          )}
          <span className="font-mono text-xs font-bold text-neutral900">
            #{order.order_code}
          </span>
        </div>

        <Badge
          variant={getOrderStatusVariant(order.status)}
          size="small"
          shape="pill"
        >
          {getOrderStatusLabel(order.status, order.delivery_type)}
        </Badge>
      </div>

      {/* 2. Danh sách món tóm tắt tinh gọn (Không in giá lẻ từng dòng gây rối mắt) */}
      <div
        onClick={goToDetail}
        className="cursor-pointer space-y-1.5 py-2.5 text-xs text-neutral800"
      >
        {order.items?.slice(0, 3).map((item, idx) => (
          <div key={item.id || idx} className="flex items-start gap-1.5">
            <span className="min-w-[22px] font-mono text-xs font-black text-primary">
              {item.quantity}x
            </span>
            <div className="min-w-0 flex-1">
              <span className="font-semibold text-neutral900">
                {item.product_name}
              </span>
              {item.options && item.options.length > 0 && (
                <p className="mt-0.5 text-xxsmall text-stone-500">
                  ↳ {item.options.map((o) => o.option_name).join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}
        {(order.items?.length || 0) > 3 && (
          <p className="pl-6 text-xxsmall font-medium italic text-stone-500">
            {copy.order.andOtherItems
              ? copy.order.andOtherItems.replace(
                  "{count}",
                  String((order.items?.length || 0) - 3),
                )
              : `và ${(order.items?.length || 0) - 3} món khác...`}
          </p>
        )}
      </div>

      {/* 3. Thanh trạng thái thời gian thực (Dành riêng cho đơn đang xử lý) */}
      {isActive && (
        <div
          onClick={goToDetail}
          className="mb-2.5 flex cursor-pointer items-center justify-between rounded-xl border border-primary/20 bg-olive50/80 px-3 py-2 text-xs text-olive900 transition-colors hover:bg-olive100/80 active:scale-[0.99]"
        >
          <div className="flex min-w-0 items-center gap-2">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            <span className="truncate text-xs font-medium">
              {getActiveStatusMessage()}
            </span>
          </div>
          <Icon
            icon="zi-chevron-right"
            className="shrink-0 text-sm text-primary"
          />
        </div>
      )}

      {/* 4. Footer 2 hàng tách bạch: Chống tràn tuyệt đối & Chuẩn ngón tay */}
      <div className="border-t border-stone-100 pt-2.5 text-xs">
        {/* Hàng 4A: Thời gian đặt & Tổng tiền to rõ */}
        <div className="flex items-center justify-between pb-2.5">
          <span className="font-mono text-xxsmall text-stone-500">
            {order.created_at
              ? new Date(order.created_at).toLocaleString("vi-VN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  day: "2-digit",
                  month: "2-digit",
                })
              : ""}
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-xxsmall font-medium text-stone-500">
              {copy.order.totalItemsLabel
                ? copy.order.totalItemsLabel.replace(
                    "{count}",
                    String(totalQuantity),
                  )
                : `Tổng (${totalQuantity} món):`}
            </span>
            <span className="font-mono text-sm font-black text-neutral900">
              {formatCurrency(order.total_amount || 0)}
              {copy.common.currency}
            </span>
          </div>
        </div>

        {/* Hàng 4B: Nút hành động chuẩn touch target >= 36px */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goToDetail}
            className="inline-flex h-9 flex-1 items-center justify-center rounded-xl border border-stone-200 bg-stone-100 text-xs font-bold text-stone-700 transition-colors hover:bg-stone-200 active:scale-[0.98]"
          >
            {copy.order.detail || "Xem chi tiết"}
          </button>

          {canReorder && (
            <button
              type="button"
              onClick={handleReorder}
              className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-xs font-bold text-white shadow-sm transition-transform hover:bg-olive800 active:scale-[0.98]"
            >
              <Icon
                icon="zi-retry"
                className="inline-flex shrink-0 items-center justify-center text-sm leading-none"
              />
              <span className="leading-none">
                {copy.order.reorder || "Đặt lại"}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
