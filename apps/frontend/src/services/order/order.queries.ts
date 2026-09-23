import { useQuery } from "@tanstack/react-query";
import { orderService } from "./order.api";
import {
  Order,
  OrderListResponse,
  PaymentResponse,
} from "../../types/order.types";
import { authService } from "../auth/auth.api";
import { queryKeys } from "../query-keys";

export const ORDERS_QUERY_KEY = queryKeys.orders.all;

export function useOrders(params?: {
  status?: string;
  page?: number;
  page_size?: number;
}) {
  return useQuery<OrderListResponse | Order[]>({
    queryKey: queryKeys.orders.list(params),
    queryFn: () => orderService.getOrders(params),
    enabled: authService.isAuthenticated(),
    staleTime: 30 * 1000,
  });
}

export function useOrder(
  id: number | string | undefined,
  options?: { initialData?: Order },
) {
  return useQuery<Order>({
    queryKey: queryKeys.orders.detail(id),
    queryFn: () => orderService.getOrderById(id!),
    enabled: Boolean(id) && authService.isAuthenticated(),
    initialData: options?.initialData,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 4000),
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
    queryKey: queryKeys.orders.payment(id),
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

export const ADMIN_ORDERS_QUERY_KEY = queryKeys.adminOrders.all;

export function useAdminOrders(
  params?: {
    status?: string;
    date?: string;
    search?: string;
  },
  options?: {
    enabled?: boolean;
  },
) {
  const isAuth = authService.isAuthenticated();
  const isEnabled =
    (options?.enabled !== undefined ? options.enabled : true) && isAuth;
  return useQuery<Order[]>({
    queryKey: queryKeys.adminOrders.list(params),
    queryFn: () => orderService.getAdminOrders(params),
    enabled: isEnabled,
    refetchInterval: isEnabled ? 5000 : false, // Polling realtime 5 giây cho Màn hình Bếp khi enabled
  });
}
