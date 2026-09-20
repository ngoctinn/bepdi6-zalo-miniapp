import { useNavigate } from "react-router-dom";
import { Order } from "@/types/order.types";
import { formatCurrency } from "@/utils/format";
import { Badge } from "@/components/common/badge";
import { Icon } from "zmp-ui";
import { useCartStore } from "@/stores/cart.store";
import { useAppToast } from "@/hooks/use-app-toast";
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
    (sum, item) => sum + item.quantity,
    0,
  );

  const isPickup = order.delivery_type === "PICKUP";
  const isCompleted = order.status === "COMPLETED";
  const isCancelled = order.status === "CANCELLED";
  const isActive = !isCompleted && !isCancelled;

  // Tính nấc tiến độ cho đơn hàng đang xử lý (Active Order Stepper)
  const getStepIndex = () => {
    switch (order.status) {
      case "PENDING_CONFIRMATION":
        return 0; // Đã đặt
      case "CONFIRMED":
      case "PREPARING":
        return 1; // Đang nấu
      case "READY":
      case "DELIVERING":
        return 2; // Đang giao / Chờ lấy
      case "COMPLETED":
        return 3;
      default:
        return 0;
    }
  };

  const currentStepIndex = getStepIndex();

  const steps = isPickup
    ? [{ label: "Đã đặt" }, { label: "Đang nấu" }, { label: "Chờ lấy món" }]
    : [{ label: "Đã đặt" }, { label: "Đang nấu" }, { label: "Đang giao" }];

  // Tính % đường line màu xanh tiến độ
  const progressPercent =
    currentStepIndex === 0 ? "0%" : currentStepIndex === 1 ? "50%" : "100%";

  // Xử lý Đặt lại món 1-chạm vào giỏ hàng
  const handleReorder = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!order.items || order.items.length === 0) return;

    order.items.forEach((item) => {
      addToCart({
        product_id: item.product_id,
        product_name: item.product_name,
        unit_price: Number(item.unit_price || 0),
        quantity: item.quantity,
        note: item.note,
        options: item.options?.map((o) => ({
          option_id: o.option_id,
          option_name: o.option_name,
          price: Number(o.price || 0),
          quantity: o.quantity || 1,
        })),
      });
    });

    showSuccess("Đã thêm các món vào giỏ hàng!");
    navigate("/checkout");
  };

  return (
    <div
      onClick={() => navigate(`/order/${order.id}`)}
      className="w-full cursor-pointer rounded-2xl bg-white p-4 shadow-sm transition-all active:scale-[0.995]"
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
                {formatCurrency(item.subtotal)}đ
              </span>
            </div>
          ))}
          {(order.items?.length || 0) > 3 && (
            <p className="text-xxsmall italic text-stone-400">
              và {(order.items?.length || 0) - 3} món khác...
            </p>
          )}
        </div>
      </div>

      {/* 3. Thanh Tiến Độ Có Màu Thực Thụ (Chỉ hiển thị cho đơn Đang xử lý) */}
      {isActive && (
        <div className="my-1 border-t border-stone-100 py-3">
          <div className="relative flex items-center justify-between px-6">
            {/* Background Track Line (Xám nhạt) */}
            <div className="absolute left-8 right-8 top-2.5 h-0.5 rounded-full bg-stone-200" />

            {/* Colored Progress Line (Tô màu Xanh rêu thương hiệu) */}
            <div
              className="absolute left-8 top-2.5 h-0.5 rounded-full bg-primary transition-all duration-500"
              style={{
                width:
                  currentStepIndex === 0
                    ? "0%"
                    : currentStepIndex === 1
                      ? "50%"
                      : "calc(100% - 64px)",
              }}
            />

            {/* Các điểm nấc tiến độ */}
            {steps.map((step, idx) => {
              const isPassed = idx <= currentStepIndex;
              const isCurrent = idx === currentStepIndex;

              return (
                <div
                  key={step.label}
                  className="relative z-10 flex flex-col items-center"
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full transition-all ${
                      isPassed
                        ? "shadow-xs bg-primary text-white"
                        : "bg-stone-200 text-stone-400"
                    } ${isCurrent ? "scale-110 ring-4 ring-primary/20" : ""}`}
                  >
                    {isPassed ? (
                      <span className="h-1.5 w-1.5 rounded-full bg-white" />
                    ) : (
                      <span className="h-1 w-1 rounded-full bg-stone-400" />
                    )}
                  </div>
                  <span
                    className={`mt-1.5 whitespace-nowrap text-xxxxsmall leading-none ${
                      isCurrent
                        ? "font-bold text-primary"
                        : isPassed
                          ? "font-medium text-neutral800"
                          : "text-stone-400"
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Dòng thông điệp trấn an thời gian thực */}
          <div className="mt-3 flex items-center gap-1.5 rounded-lg bg-olive50/60 px-2.5 py-1.5 text-xxsmall text-olive900">
            <span className="inline-block h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-primary" />
            <span className="font-medium leading-snug">
              {order.status === "PENDING_CONFIRMATION"
                ? "Quán đã nhận đơn và đang kiểm tra..."
                : order.status === "CONFIRMED" || order.status === "PREPARING"
                  ? "Bếp Dì 6 đang chuẩn bị món thơm ngon cho bạn..."
                  : isPickup
                    ? "Món đã nấu xong, mời bạn đến quầy nhận nhé!"
                    : "Shipper đang trên đường giao đồ ăn đến bạn..."}
            </span>
          </div>
        </div>
      )}

      {/* 4. Footer: Ngày giờ + Tổng tiền & Nút Đặt lại / Theo dõi */}
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
              Tổng ({totalQuantity} món):
            </span>
            <span className="font-mono text-sm font-bold text-neutral900">
              {formatCurrency(order.total_amount)}đ
            </span>
          </div>

          {isCompleted && (
            <button
              type="button"
              onClick={handleReorder}
              className="ml-1 inline-flex h-7 items-center justify-center gap-1 rounded-full bg-primary/10 px-2.5 text-xxsmall font-bold text-primary transition-transform active:scale-95"
              title="Đặt lại các món trong đơn này"
            >
              <Icon
                icon="zi-retry"
                className="flex shrink-0 items-center justify-center text-xs leading-none"
              />
              <span className="leading-none">Đặt lại</span>
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
