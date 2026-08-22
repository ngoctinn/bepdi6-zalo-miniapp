import { useQuery } from "@tanstack/react-query";
import { productService } from "./product.api";
import { Product, ProductListParams } from "../../types/product.types";

export const PRODUCTS_QUERY_KEY = ["products"] as const;

export function useProducts(params?: ProductListParams) {
  return useQuery<Product[]>({
    queryKey: [PRODUCTS_QUERY_KEY, params],
    queryFn: () => productService.getProducts(params),
    staleTime: 3 * 60 * 1000,
  });
}

export function useProduct(id: number | string | undefined) {
  return useQuery<Product>({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id!),
    enabled: Boolean(id),
    staleTime: 3 * 60 * 1000,
  });
}
