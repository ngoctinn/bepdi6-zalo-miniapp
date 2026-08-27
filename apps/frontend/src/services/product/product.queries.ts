import { useQuery, useQueryClient } from "@tanstack/react-query";
import { productService } from "./product.api";
import { Product, ProductListParams } from "../../types/product.types";
import { useCallback } from "react";

export const PRODUCTS_QUERY_KEY = ["products"] as const;

export function useProducts(params?: ProductListParams) {
  return useQuery<Product[]>({
    queryKey: [PRODUCTS_QUERY_KEY, params],
    queryFn: () => productService.getProducts(params),
    staleTime: 3 * 60 * 1000,
  });
}

export function useProduct(id: number | string | undefined) {
  const queryClient = useQueryClient();

  return useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id!),
    enabled: Boolean(id),
    staleTime: 3 * 60 * 1000,
    placeholderData: () => {
      if (!id) return undefined;
      const numId = Number(id);
      // Look up cached product in any products list query
      const cachedLists = queryClient.getQueriesData<Product[]>({
        queryKey: [PRODUCTS_QUERY_KEY],
      });
      for (const [, list] of cachedLists) {
        if (Array.isArray(list)) {
          const match = list.find((p) => p.id === numId);
          if (match) return match;
        }
      }
      return undefined;
    },
  });
}

export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  return useCallback(
    (id: number | string | undefined) => {
      if (!id) return;
      queryClient.prefetchQuery({
        queryKey: ["product", String(id)],
        queryFn: () => productService.getProductById(id),
        staleTime: 3 * 60 * 1000,
      });
    },
    [queryClient],
  );
}
