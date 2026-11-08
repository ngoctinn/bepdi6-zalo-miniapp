import { api } from "../../lib/api-client";
import {
  BrowseVoucherItem,
  ValidateVoucherRequest,
  ValidateVoucherResponse,
} from "../../types/shop.types";

export const voucherService = {
  /**
   * Duyệt danh sách mã giảm giá khả dụng theo giỏ hàng thời gian thực
   * POST /api/v1/vouchers/browse
   */
  browseVouchers: async (subtotal: number): Promise<BrowseVoucherItem[]> => {
    return api.post<BrowseVoucherItem[]>("vouchers/browse", { subtotal });
  },

  /**
   * Xác thực và tính giá trị giảm của mã voucher
   * POST /api/v1/vouchers/validate
   */
  validateVoucher: async (
    payload: ValidateVoucherRequest,
  ): Promise<ValidateVoucherResponse> => {
    return api.post<ValidateVoucherResponse>("vouchers/validate", payload);
  },
};
