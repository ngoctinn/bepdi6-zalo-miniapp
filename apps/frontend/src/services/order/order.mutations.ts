import { useMutation, useQueryClient } from "@tanstack/react-query";
import { orderService } from "./order.api";
import {
  CheckoutPreviewRequest,
  CreateOrderRequest,
} from "../../types/order.types";
import { ORDERS_QUERY_KEY } from "./order.queries";

export function usePreviewCheckout() {
  return useMutation({
    mutationFn: (payload: CheckoutPreviewRequest) =>
      orderService.previewCheckout(payload),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: {
      payload: CreateOrderRequest;
      idempotencyKey: string;
    }) => orderService.createOrder(payload, idempotencyKey),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: number | string; reason?: string }) =>
      orderService.cancelOrder(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["order", variables.id] });
      queryClient.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    },
  });
}
