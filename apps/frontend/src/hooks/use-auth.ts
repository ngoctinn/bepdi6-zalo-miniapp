import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken, getPhoneNumber, getUserInfo } from "zmp-sdk/apis";
import { authService } from "../services/auth/auth.api";
import { Customer, ZaloAuthRequest } from "../types/customer.types";

const DEV_MOCK_ZALO_TOKEN = "dev_browser_mock_access_token";

export function useAuth() {
  const queryClient = useQueryClient();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
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

        // 1. Cố gắng lấy thông tin User (Tên, Avatar) qua Zalo SDK
        if (accessToken !== DEV_MOCK_ZALO_TOKEN) {
          try {
            const userInfoRes = await getUserInfo({
              autoRequestPermission: true,
            });
            if (userInfoRes && userInfoRes.userInfo) {
              payload.name = userInfoRes.userInfo.name;
              payload.avatar_url = userInfoRes.userInfo.avatar;
            }
          } catch {
            // Người dùng từ chối hoặc đang ở môi trường giả lập
          }

          // 2. Cố gắng lấy token số điện thoại qua Zalo SDK
          try {
            const phoneData = await getPhoneNumber({});
            if (
              phoneData &&
              typeof phoneData === "object" &&
              "token" in phoneData &&
              phoneData.token
            ) {
              payload.phone_token = phoneData.token as string;
            }
          } catch {
            // Người dùng từ chối hoặc đang ở môi trường giả lập
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
    authError,
    login: loginWithZaloSDK,
    logout,
    refetchCustomer,
  };
}
