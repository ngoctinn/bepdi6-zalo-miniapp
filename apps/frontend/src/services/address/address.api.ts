import { api } from "../../lib/api-client";
import {
  Address,
  CreateAddressRequest,
  DecodeLocationRequest,
  DecodeLocationResponse,
  PlaceSuggestion,
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
   * Tìm kiếm gợi ý địa chỉ (Place Autocomplete)
   * GET /api/v1/customers/location/search
   */
  searchPlaces: async (
    query: string,
    latitude?: number,
    longitude?: number,
  ): Promise<PlaceSuggestion[]> => {
    return api.get<PlaceSuggestion[]>("customers/location/search", {
      params: { query, latitude, longitude },
    });
  },

  /**
   * Giải mã Zalo Location Token sang tọa độ và địa chỉ
   * POST /api/v1/customers/location/decode
   */
  decodeLocationToken: async (
    params: DecodeLocationRequest | string,
  ): Promise<DecodeLocationResponse> => {
    const payload = typeof params === "string" ? { token: params } : params;
    return api.post<DecodeLocationResponse>(
      "customers/location/decode",
      payload,
    );
  },

  /**
   * Dịch tọa độ sang địa chỉ đọc được (Reverse Geocoding)
   * GET /api/v1/customers/location/reverse-geocode
   */
  reverseGeocode: async (
    latitude: number,
    longitude: number,
  ): Promise<DecodeLocationResponse> => {
    return api.get<DecodeLocationResponse>(
      "customers/location/reverse-geocode",
      {
        params: { latitude, longitude },
      },
    );
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
