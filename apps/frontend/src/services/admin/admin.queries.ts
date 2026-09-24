import { useQuery } from "@tanstack/react-query";
import { adminService } from "./admin.api";
import { queryKeys } from "@/services/query-keys";

export const useAdminCategories = () => {
  return useQuery({
    queryKey: queryKeys.adminCategories.all,
    queryFn: () => adminService.getCategories(),
    staleTime: 30 * 1000,
  });
};

export const useAdminCategory = (id: number | undefined) => {
  return useQuery({
    queryKey: queryKeys.adminCategories.detail(id),
    queryFn: () => adminService.getCategoryById(id!),
    enabled: typeof id === "number" && !isNaN(id),
    staleTime: 30 * 1000,
  });
};

export const useAdminProducts = (params?: {
  category_id?: number;
  search?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.adminProducts.list(params),
    queryFn: () => adminService.getProducts(params),
    staleTime: 30 * 1000,
  });
};

export const useAdminProduct = (id: number | undefined) => {
  return useQuery({
    queryKey: queryKeys.adminProducts.detail(id),
    queryFn: () => adminService.getProductById(id!),
    enabled: typeof id === "number" && !isNaN(id),
    staleTime: 30 * 1000,
  });
};

export const useAdminVouchers = (status?: string) => {
  return useQuery({
    queryKey: queryKeys.adminVouchers.list(status ? { status } : undefined),
    queryFn: () => adminService.getVouchers(status ? { status } : undefined),
    staleTime: 30 * 1000,
  });
};

export const useAdminVoucher = (id: number | undefined) => {
  return useQuery({
    queryKey: queryKeys.adminVouchers.detail(id),
    queryFn: () => adminService.getVoucherById(id!),
    enabled: typeof id === "number" && !isNaN(id),
    staleTime: 30 * 1000,
  });
};

export const useAdminShopConfig = () => {
  return useQuery({
    queryKey: queryKeys.adminShopConfig.all,
    queryFn: () => adminService.getShopConfig(),
    staleTime: 60 * 1000,
  });
};
