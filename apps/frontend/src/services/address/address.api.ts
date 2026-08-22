import { api } from "../../lib/api-client";
import {
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "../../types/customer.types";

export const addressService = {
  /**
   * Lấy danh sách địa chỉ giao hàng của khách hàng
   * GET /api/v1/customers/me/addresses
   */
  getAddresses: async (): Promise<Address[]> => {
    return api.get<Address[]>("customers/me/addresses");
  },

  /**
   * Thêm địa chỉ giao hàng mới
   * POST /api/v1/customers/me/addresses
   */
  createAddress: async (payload: CreateAddressRequest): Promise<Address> => {
    return api.post<Address>("customers/me/addresses", payload);
  },

  /**
   * Cập nhật địa chỉ giao hàng
   * PUT /api/v1/customers/me/addresses/:id
   */
  updateAddress: async (
    id: number,
    payload: UpdateAddressRequest,
  ): Promise<Address> => {
    return api.put<Address>(`customers/me/addresses/${id}`, payload);
  },

  /**
   * Xóa địa chỉ giao hàng
   * DELETE /api/v1/customers/me/addresses/:id
   */
  deleteAddress: async (id: number): Promise<void> => {
    return api.delete<void>(`customers/me/addresses/${id}`);
  },
};
