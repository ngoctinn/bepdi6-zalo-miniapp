import { api } from "../../lib/api-client";
import { ShopInfo } from "../../types/shop.types";

export const shopService = {
  /**
   * Lấy thông tin cửa hàng, trạng thái đóng/mở cửa, hotline, bảng phí ship
   * GET /api/v1/shop/info
   */
  getShopInfo: async (): Promise<ShopInfo> => {
    return api.get<ShopInfo>("shop/info");
  },
};
