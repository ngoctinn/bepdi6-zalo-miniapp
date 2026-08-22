import { useQuery } from "@tanstack/react-query";
import { shopService } from "./shop.api";
import { ShopInfo } from "../../types/shop.types";

export const SHOP_QUERY_KEY = ["shop", "info"] as const;

export function useShopInfo() {
  return useQuery<ShopInfo>({
    queryKey: SHOP_QUERY_KEY,
    queryFn: shopService.getShopInfo,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });
}
