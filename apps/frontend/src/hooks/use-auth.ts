import { useEffect, useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAccessToken } from "zmp-sdk/apis";
import { authService } from "../services/auth/auth.api";
import { Customer } from "../types/customer.types";

const DEV_MOCK_ZALO_TOKEN = "dev_browser_mock_access_token";

export function useAuth() {
  const queryClient = useQueryClient();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

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

  const loginWithZaloSDK = useCallback(async () => {
    if (authService.isAuthenticated() && customer) {
      return;
    }
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
        await loginMutation.mutateAsync({ access_token: accessToken });
      }
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : "Không thể lấy Zalo Token",
      );
    } finally {
      setIsLoggingIn(false);
    }
  }, [customer, loginMutation]);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
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
