import { api } from "@/lib/api-client";
import {
  AdminCategory,
  AdminProduct,
  AdminShopConfig,
  AdminVoucher,
  CreateCategoryRequest,
  CreateProductRequest,
  CreateVoucherRequest,
  UpdateCategoryRequest,
  UpdateProductRequest,
  UpdateShopConfigRequest,
  UpdateVoucherRequest,
} from "@/types/admin.types";
import { orderService } from "@/services/order/order.api";

export const adminService = {
  // --- Category APIs ---
  getCategories: async (): Promise<AdminCategory[]> => {
    return api.get<AdminCategory[]>("/admin/categories");
  },

  getCategoryById: async (id: number): Promise<AdminCategory> => {
    return api.get<AdminCategory>(`/admin/categories/${id}`);
  },

  createCategory: async (
    data: CreateCategoryRequest,
  ): Promise<AdminCategory> => {
    return api.post<AdminCategory>("/admin/categories", data);
  },

  updateCategory: async (
    id: number,
    data: UpdateCategoryRequest,
  ): Promise<AdminCategory> => {
    return api.patch<AdminCategory>(`/admin/categories/${id}`, data);
  },

  deleteCategory: async (id: number): Promise<void> => {
    return api.delete<void>(`/admin/categories/${id}`);
  },

  // --- Product APIs ---
  getProducts: async (params?: {
    category_id?: number;
    search?: string;
  }): Promise<AdminProduct[]> => {
    const searchParams = new URLSearchParams();
    if (params?.category_id) {
      searchParams.append("category_id", String(params.category_id));
    }
    if (params?.search) {
      searchParams.append("search", params.search);
    }
    const query = searchParams.toString();
    return api.get<AdminProduct[]>(
      `/admin/products${query ? `?${query}` : ""}`,
    );
  },

  getProductById: async (id: number): Promise<AdminProduct> => {
    return api.get<AdminProduct>(`/admin/products/${id}`);
  },

  createProduct: async (data: CreateProductRequest): Promise<AdminProduct> => {
    return api.post<AdminProduct>("/admin/products", data);
  },

  updateProduct: async (
    id: number,
    data: UpdateProductRequest,
  ): Promise<AdminProduct> => {
    return api.patch<AdminProduct>(`/admin/products/${id}`, data);
  },

  toggleProductStatus: async (
    id: number,
  ): Promise<{ id: number; status: string }> => {
    return api.post<{ id: number; status: string }>(
      `/admin/products/${id}/toggle-status`,
    );
  },

  // --- Shop Config APIs ---
  getShopConfig: async (): Promise<AdminShopConfig> => {
    return api.get<AdminShopConfig>("/admin/shop/config");
  },

  updateShopConfig: async (
    data: UpdateShopConfigRequest,
  ): Promise<AdminShopConfig> => {
    return api.patch<AdminShopConfig>("/admin/shop/config", data);
  },

  // --- Voucher APIs ---
  getVouchers: async (params?: {
    status?: string;
  }): Promise<AdminVoucher[]> => {
    const searchParams = new URLSearchParams();
    if (params?.status) {
      searchParams.append("status", params.status);
    }
    const query = searchParams.toString();
    return api.get<AdminVoucher[]>(
      `/admin/vouchers${query ? `?${query}` : ""}`,
    );
  },

  getVoucherById: async (id: number): Promise<AdminVoucher> => {
    return api.get<AdminVoucher>(`/admin/vouchers/${id}`);
  },

  createVoucher: async (data: CreateVoucherRequest): Promise<AdminVoucher> => {
    return api.post<AdminVoucher>("/admin/vouchers", data);
  },

  updateVoucher: async (
    id: number,
    data: UpdateVoucherRequest,
  ): Promise<AdminVoucher> => {
    return api.patch<AdminVoucher>(`/admin/vouchers/${id}`, data);
  },

  deleteVoucher: async (id: number): Promise<void> => {
    return api.delete<void>(`/admin/vouchers/${id}`);
  },

  // --- Re-export Order Operations ---
  getOrders: orderService.getAdminOrders,
  updateOrderStatus: orderService.updateAdminOrderStatus,
  cancelOrder: orderService.cancelAdminOrder,
  dispatchOrder: orderService.dispatchAdminOrder,
};
