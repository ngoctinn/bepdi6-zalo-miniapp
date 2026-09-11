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
   * Giải mã và cập nhật số điện thoại từ Zalo phone token
   * POST /api/v1/customers/me/phone
   */
  updatePhoneNumber: async (
    phoneToken: string,
    accessToken?: string,
  ): Promise<Customer> => {
    return api.post<Customer>("customers/me/phone", {
      phone_token: phoneToken,
      access_token: accessToken || undefined,
    });
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
    const token = getStoredToken();
    if (!token) return false;
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const decodedJson = atob(payloadBase64);
        const payload = JSON.parse(decodedJson);
        if (payload.exp && typeof payload.exp === "number") {
          if (Date.now() >= payload.exp * 1000) {
            clearStoredTokens();
            return false;
          }
        }
      }
    } catch {
      // Fallback nếu token không phải chuẩn JWT
    }
    return true;
  },
};
