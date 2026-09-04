import { useEffect, useState, useCallback, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "../services/auth/auth.api";
import { Customer, ZaloAuthRequest } from "../types/customer.types";
import {
  ensureZaloPermission,
  getZaloLoginCredentials,
  getZaloPhoneCredentials,
  isZaloRuntime,
} from "../utils/zalo-permissions";
import { DEV_MOCK_ZALO_TOKEN } from "../utils/dev-mock";

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
   * 1. Login Flow:
   * Xin quyền thông tin người dùng trước khi lấy access token để xác thực
   */
  const loginWithZaloSDK = useCallback(async () => {
    if (authService.isAuthenticated() || isLoggingInRef.current) {
      return;
    }
    isLoggingInRef.current = true;
    setIsLoggingIn(true);
    try {
      let accessToken = "";
      let name = "";
      let avatar = "";

      if (isZaloRuntime()) {
        const credentials = await getZaloLoginCredentials();
        accessToken = credentials.accessToken;
        name = credentials.name;
        avatar = credentials.avatar;
      } else {
        accessToken = DEV_MOCK_ZALO_TOKEN;
      }

      if (accessToken) {
        const payload: ZaloAuthRequest = {
          access_token: accessToken,
          name: name,
          avatar_url: avatar,
        };
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
      const { token: phoneToken, accessToken: userAccessToken } =
        isZaloRuntime()
          ? await getZaloPhoneCredentials()
          : {
              token: "dev_mock_phone_token",
              accessToken: DEV_MOCK_ZALO_TOKEN,
            };

      if (phoneToken) {
        const updatedCustomer = await authService.updatePhoneNumber(
          phoneToken,
          userAccessToken,
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
