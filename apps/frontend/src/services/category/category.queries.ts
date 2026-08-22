import { useQuery } from "@tanstack/react-query";
import { categoryService } from "./category.api";
import { Category } from "../../types/category.types";

export const CATEGORIES_QUERY_KEY = ["categories"] as const;

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: CATEGORIES_QUERY_KEY,
    queryFn: categoryService.getCategories,
    staleTime: 5 * 60 * 1000,
  });
}
