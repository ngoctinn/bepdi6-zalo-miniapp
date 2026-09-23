import { useQuery } from "@tanstack/react-query";
import { shopService } from "./shop.api";
import { ShopInfo } from "../../types/shop.types";
import { queryKeys } from "../query-keys";

export const SHOP_QUERY_KEY = queryKeys.shop.info();

export function useShopInfo() {
  return useQuery<ShopInfo>({
    queryKey: queryKeys.shop.info(),
    queryFn: shopService.getShopInfo,
    staleTime: 2 * 60 * 1000, // 2 minutes cache
  });
}
