import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "./admin.api";
import { queryKeys } from "@/services/query-keys";
import {
  CreateCategoryRequest,
  CreateProductRequest,
  CreateVoucherRequest,
  UpdateCategoryRequest,
  UpdateProductRequest,
  UpdateShopConfigRequest,
  UpdateVoucherRequest,
} from "@/types/admin.types";

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) =>
      adminService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminCategories.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryRequest }) =>
      adminService.updateCategory(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminCategories.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminCategories.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminCategories.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.categories.all });
    },
  });
};

export const useCreateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) =>
      adminService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductRequest }) =>
      adminService.updateProduct(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminProducts.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};

export const useToggleProductStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.toggleProductStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminProducts.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
    },
  });
};

export const useCreateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVoucherRequest) =>
      adminService.createVoucher(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminVouchers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.all });
    },
  });
};

export const useUpdateVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateVoucherRequest }) =>
      adminService.updateVoucher(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminVouchers.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminVouchers.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.all });
    },
  });
};

export const useDeleteVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminService.deleteVoucher(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminVouchers.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.vouchers.all });
    },
  });
};

export const useUpdateShopConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateShopConfigRequest) =>
      adminService.updateShopConfig(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.adminShopConfig.all,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.shop.all });
    },
  });
};
