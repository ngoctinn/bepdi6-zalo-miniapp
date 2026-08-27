/**
 * ZMP SDK Mock Utility for Local Development & Testing
 *
 * Cho phép chạy frontend mượt mà trên browser thường (localhost)
 * mà không bị lỗi crash khi thiếu native Zalo bridge.
 */

export interface MockLocationResult {
  latitude: number;
  longitude: number;
  provider?: string;
  timestamp?: number;
}

export interface MockPhoneNumberResult {
  token: string;
  number?: string;
}

export interface MockUserInfoResult {
  userInfo: {
    id: string;
    name: string;
    avatar: string;
  };
}

export const mockZmpSdk = {
  /**
   * Giả lập lấy số điện thoại
   */
  getPhoneNumber: async (): Promise<MockPhoneNumberResult> => {
    return {
      token: "mock_phone_token_local_dev",
      number: "0987654321",
    };
  },

  /**
   * Giả lập lấy vị trí GPS (Mặc định: TP. Hồ Chí Minh)
   */
  getLocation: async (): Promise<MockLocationResult> => {
    return {
      latitude: 10.762622,
      longitude: 106.660172,
      provider: "mock",
      timestamp: Date.now(),
    };
  },

  /**
   * Giả lập kiểm tra quyền
   */
  getSetting: async (): Promise<{ authSetting: Record<string, boolean> }> => {
    return {
      authSetting: {
        "scope.userLocation": true,
        "scope.userPhonenumber": true,
        "scope.userInfo": true,
      },
    };
  },

  /**
   * Giả lập xin cấp quyền
   */
  authorize: async (params: {
    scopes: string[];
  }): Promise<Record<string, boolean>> => {
    const result: Record<string, boolean> = {};
    params.scopes.forEach((scope) => {
      result[scope] = true;
    });
    return result;
  },

  /**
   * Giả lập lấy thông tin người dùng
   */
  getUserInfo: async (): Promise<MockUserInfoResult> => {
    return {
      userInfo: {
        id: "mock_zalo_user_dev",
        name: "Khách Hàng Zalo (Dev Mock)",
        avatar: "https://avatar.iran.liara.run/public",
      },
    };
  },
};
