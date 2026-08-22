import { api } from "../../lib/api-client";
import {
  CheckoutPreviewRequest,
  CheckoutPreviewResponse,
  CreateOrderRequest,
  Order,
  OrderListResponse,
  PaymentResponse,
} from "../../types/order.types";

export const orderService = {
  /**
   * Tính toán trước giỏ hàng: Tạm tính, Phí ship theo km, Giảm giá voucher, Tổng cộng
   * POST /api/v1/checkout/preview
   */
  previewCheckout: async (
    payload: CheckoutPreviewRequest,
  ): Promise<CheckoutPreviewResponse> => {
    return api.post<CheckoutPreviewResponse>("checkout/preview", payload);
  },

  /**
   * Tạo đơn hàng chính thức
   * POST /api/v1/orders (kèm Idempotency-Key header)
   */
  createOrder: async (
    payload: CreateOrderRequest,
    idempotencyKey: string,
  ): Promise<Order> => {
    return api.post<Order>("orders", payload, {
      idempotencyKey,
    });
  },

  /**
   * Lấy danh sách lịch sử đơn hàng của khách
   * GET /api/v1/orders
   */
  getOrders: async (params?: {
    status?: string;
    page?: number;
    page_size?: number;
  }): Promise<OrderListResponse | Order[]> => {
    return api.get<OrderListResponse | Order[]>("orders", { params });
  },

  /**
   * Lấy chi tiết đơn hàng
   * GET /api/v1/orders/:id
   */
  getOrderById: async (id: number | string): Promise<Order> => {
    return api.get<Order>(`orders/${id}`);
  },

  /**
   * Lấy thông tin thanh toán & mã VietQR của đơn
   * GET /api/v1/orders/:id/payment
   */
  getOrderPayment: async (id: number | string): Promise<PaymentResponse> => {
    return api.get<PaymentResponse>(`orders/${id}/payment`);
  },

  /**
   * Khách tự hủy đơn khi ở trạng thái Chờ xác nhận
   * POST /api/v1/orders/:id/cancel
   */
  cancelOrder: async (id: number | string, reason?: string): Promise<Order> => {
    return api.post<Order>(`orders/${id}/cancel`, {
      reason: reason || "Khách hàng yêu cầu hủy",
    });
  },
};
