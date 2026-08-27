import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, getPhoneNumber, getUserInfo } from "zmp-sdk/apis";
import { authService } from "../services/auth/auth.api";
import { Customer, ZaloAuthRequest } from "../types/customer.types";

const DEV_MOCK_ZALO_TOKEN = "dev_browser_mock_access_token";

export function useAuth() {
  const queryClient = useQueryClient();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isRequestingPhone, setIsRequestingPhone] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const isLoggingInRef = useRef(false);

  const {
    data: customer,
    isLoading: isFetchingCustomer,
    refetch: refetchCustomer,
  } = useQuery<Customer>({
    queryKey: ["customer", "me"],
    queryFn: authService.getMe,
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: authService.loginWithZalo,
    onSuccess: (data) => {
      queryClient.setQueryData(["customer", "me"], data.customer);
      setAuthError(null);
    },
    onError: (err) => {
      setAuthError(
        err instanceof Error ? err.message : "Đăng nhập Zalo thất bại",
      );
    },
  });

  const { mutateAsync: mutateLoginAsync } = loginMutation;

  /**
   * 1. Silent Login Flow:
   * Chỉ lấy access token và thông tin cơ bản không làm phiền người dùng lúc mở app
   */
  const loginWithZaloSDK = useCallback(async () => {
    if (authService.isAuthenticated() || isLoggingInRef.current) {
      return;
    }
    isLoggingInRef.current = true;
    setIsLoggingIn(true);
    try {
      let accessToken = "";
      try {
        accessToken = await getAccessToken({});
      } catch {
        // Fallback for local browser debugging outside Zalo App
        accessToken = DEV_MOCK_ZALO_TOKEN;
      }

      if (accessToken) {
        const payload: ZaloAuthRequest = { access_token: accessToken };

        // Lấy thông tin user cơ bản nếu có quyền
        if (accessToken !== DEV_MOCK_ZALO_TOKEN) {
          try {
            const userInfoRes = await getUserInfo({});
            if (userInfoRes && userInfoRes.userInfo) {
              payload.name = userInfoRes.userInfo.name;
              payload.avatar_url = userInfoRes.userInfo.avatar;
            }
          } catch {
            // Không chặn login nếu chưa có quyền xem tên/avatar
          }
        }

        await mutateLoginAsync(payload);
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Không thể lấy Zalo Token",
      );
    } finally {
      isLoggingInRef.current = false;
      setIsLoggingIn(false);
    }
  }, [mutateLoginAsync]);

  /**
   * 2. On-Demand Request Phone Flow:
   * Chỉ gọi khi người dùng thực hiện hành động cần SĐT (Checkout, Profile, Đặt hàng)
   */
  const requestPhoneNumber = useCallback(async (): Promise<string | null> => {
    setIsRequestingPhone(true);
    try {
      let phoneToken = "";
      let userAccessToken = "";

      try {
        userAccessToken = await getAccessToken({});
      } catch {
        // ignore in dev browser
      }

      try {
        const phoneData = await getPhoneNumber({});
        if (
          phoneData &&
          typeof phoneData === "object" &&
          "token" in phoneData &&
          phoneData.token
        ) {
          phoneToken = phoneData.token as string;
        } else {
          phoneToken = "dev_mock_phone_token";
        }
      } catch {
        phoneToken = "dev_mock_phone_token";
      }

      if (phoneToken) {
        const updatedCustomer = await authService.updatePhoneNumber(
          phoneToken,
          userAccessToken || undefined,
        );
        queryClient.setQueryData(["customer", "me"], updatedCustomer);
        return updatedCustomer.phone || null;
      }
      return null;
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Không thể lấy số điện thoại",
      );
      return null;
    } finally {
      setIsRequestingPhone(false);
    }
  }, [queryClient]);

  useEffect(() => {
    if (!authService.isAuthenticated() && !isLoggingInRef.current) {
      loginWithZaloSDK();
    }
  }, [loginWithZaloSDK]);

  const logout = useCallback(() => {
    authService.logout();
    queryClient.removeQueries({ queryKey: ["customer", "me"] });
  }, [queryClient]);

  return {
    customer,
    isAuthenticated: authService.isAuthenticated(),
    isLoading: isLoggingIn || isFetchingCustomer,
    isRequestingPhone,
    authError,
    login: loginWithZaloSDK,
    requestPhoneNumber,
    logout,
    refetchCustomer,
  };
}
