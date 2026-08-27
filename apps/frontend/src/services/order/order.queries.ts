import { useQuery } from "@tanstack/react-query";
import { orderService } from "./order.api";
import {
  Order,
  OrderListResponse,
  PaymentResponse,
} from "../../types/order.types";
import { authService } from "../auth/auth.api";

export const ORDERS_QUERY_KEY = ["orders"] as const;

export function useOrders(params?: {
  status?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<OrderListResponse | Order[]>({
    queryKey: [ORDERS_QUERY_KEY, params],
    queryFn: () => orderService.getOrders(params),
    enabled: authService.isAuthenticated(),
    staleTime: 30 * 1000,
  });
}

export function useOrder(id: number | string | undefined) {
  return useQuery<Order>({
    queryKey: ["order", id],
    queryFn: () => orderService.getOrderById(id!),
    enabled: Boolean(id) && authService.isAuthenticated(),
    refetchInterval: (query) => {
      const order = query.state.data;
      if (
        order &&
        order.status !== "COMPLETED" &&
        order.status !== "CANCELLED"
      ) {
        return 4000; // Polling realtime 4s
      }
      return false;
    },
  });
}

export const useOrderById = useOrder;

export function useOrderPayment(id: number | string | undefined) {
  return useQuery<PaymentResponse>({
    queryKey: ["order", id, "payment"],
    queryFn: () => orderService.getOrderPayment(id!),
    enabled: Boolean(id) && authService.isAuthenticated(),
    refetchInterval: 4000,
  });
}

/**
 * ==========================================
 * STAFF / BẾP KDS QUERY HOOKS
 * ==========================================
 */

export const ADMIN_ORDERS_QUERY_KEY = ["admin", "orders"] as const;

export function useAdminOrders(params?: {
  status?: string;
  date?: string;
  search?: string;
}) {
  return useQuery<Order[]>({
    queryKey: [ADMIN_ORDERS_QUERY_KEY, params],
    queryFn: () => orderService.getAdminOrders(params),
    enabled: authService.isAuthenticated(),
    refetchInterval: 5000, // Polling realtime 5 giây cho Màn hình Bếp
  });
}
