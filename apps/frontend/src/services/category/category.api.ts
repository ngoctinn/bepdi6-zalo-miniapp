import { api } from "../../lib/api-client";
import { Category } from "../../types/category.types";

export const categoryService = {
  /**
   * Lấy danh sách danh mục món đang hoạt động
   * GET /api/v1/categories
   */
  getCategories: async (): Promise<Category[]> => {
    return api.get<Category[]>("categories");
  },
};
