import { api } from "../../lib/api-client";
import {
  ValidateVoucherRequest,
  ValidateVoucherResponse,
} from "../../types/shop.types";

export const voucherService = {
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
