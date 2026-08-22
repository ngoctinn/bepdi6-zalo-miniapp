import { api } from "../../lib/api-client";
import { Product, ProductListParams } from "../../types/product.types";

export const productService = {
  /**
   * Lấy danh sách món ăn theo category / search query
   * GET /api/v1/products
   */
  getProducts: async (params?: ProductListParams): Promise<Product[]> => {
    return api.get<Product[]>("products", {
      params: {
        category: params?.category,
        search: params?.search,
        status: params?.status,
        page: params?.page,
        page_size: params?.page_size,
      },
    });
  },

  /**
   * Lấy chi tiết 1 món ăn kèm các nhóm tùy chọn (OptionGroups & Options)
   * GET /api/v1/products/:id
   */
  getProductById: async (id: number | string): Promise<Product> => {
    return api.get<Product>(`products/${id}`);
  },
};
