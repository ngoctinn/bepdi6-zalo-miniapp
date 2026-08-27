import {
  api,
  setStoredTokens,
  clearStoredTokens,
  getStoredToken,
} from "../../lib/api-client";
import {
  AuthTokens,
  Customer,
  ZaloAuthRequest,
} from "../../types/customer.types";

export const authService = {
  /**
   * Đăng nhập / Đăng ký qua Zalo Access Token
   * POST /api/v1/auth/zalo
   */
  loginWithZalo: async (payload: ZaloAuthRequest): Promise<AuthTokens> => {
    const tokens = await api.post<AuthTokens>("auth/zalo", payload);
    const accessToken = tokens.access_token || tokens.access;
    const refreshToken = tokens.refresh_token || tokens.refresh;
    if (accessToken) {
      setStoredTokens(accessToken, refreshToken);
    }
    return tokens;
  },

  /**
   * Lấy thông tin profile hiện tại của khách hàng
   * GET /api/v1/customers/me
   */
  getMe: async (): Promise<Customer> => {
    return api.get<Customer>("customers/me");
  },

  /**
   * Cập nhật thông tin profile của khách hàng
   * PATCH /api/v1/customers/me
   */
  updateMe: async (payload: Partial<Customer>): Promise<Customer> => {
    return api.patch<Customer>("customers/me", payload);
  },

  /**
   * Đăng xuất & xóa token
   */
  logout: (): void => {
    clearStoredTokens();
  },

  /**
   * Kiểm tra đã đăng nhập chưa
   */
  isAuthenticated: (): boolean => {
    return Boolean(getStoredToken());
  },
};
