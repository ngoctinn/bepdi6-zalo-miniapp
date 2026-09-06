import { DeliveryType, OrderStatus } from "@/types/order.types";
import { BadgeVariant } from "@/components/common/badge";

/**
 * Trả về văn bản trạng thái đơn hàng tiếng Việt chuẩn xác theo ngữ cảnh nhận hàng
 */
export const getOrderStatusLabel = (
  status?: OrderStatus | string,
  deliveryType?: DeliveryType,
): string => {
  const isPickup = deliveryType === "PICKUP";

  switch (status) {
    case "PENDING_CONFIRMATION":
      return "Chờ xác nhận";
    case "CONFIRMED":
      return "Đã xác nhận";
    case "PREPARING":
      return "Đang chuẩn bị";
    case "READY":
      return isPickup ? "Mời đến lấy món" : "Chờ giao hàng";
    case "DELIVERING":
      return "Đang giao hàng";
    case "COMPLETED":
      return isPickup ? "Đã nhận món" : "Hoàn thành";
    case "CANCELLED":
      return "Đã hủy";
    default:
      return status || "Đang xử lý";
  }
};

/**
 * Trả về BadgeVariant ngữ nghĩa phù hợp cho trạng thái tiến độ đơn hàng
 */
export const getOrderStatusVariant = (
  status?: OrderStatus | string,
): BadgeVariant => {
  switch (status) {
    case "PENDING_CONFIRMATION":
    case "PREPARING":
      return "warning";
    case "CONFIRMED":
    case "READY":
    case "DELIVERING":
      return "primary";
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "error";
    default:
      return "neutral";
  }
};

/**
 * Trả về tên hiển thị chuẩn tiếng Việt cho hình thức nhận hàng
 */
export const getDeliveryTypeLabel = (deliveryType?: DeliveryType): string => {
  return deliveryType === "PICKUP" ? "Tự đến lấy" : "Giao tận nơi";
};
