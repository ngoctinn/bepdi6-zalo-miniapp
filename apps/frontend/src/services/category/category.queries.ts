import { useQuery } from "@tanstack/react-query";
import { categoryService } from "./category.api";
import { Category } from "../../types/category.types";
import { queryKeys } from "../query-keys";

export const CATEGORIES_QUERY_KEY = queryKeys.categories.all;

export function useCategories() {
  return useQuery<Category[]>({
    queryKey: queryKeys.categories.all,
    queryFn: categoryService.getCategories,
    staleTime: 5 * 60 * 1000,
  });
}
