import { useQuery } from "@tanstack/react-query";
import { authService } from "./auth.api";
import { Customer } from "../../types/customer.types";

export const USER_ME_QUERY_KEY = ["user", "me"] as const;

export function useUserMe() {
  return useQuery<Customer>({
    queryKey: USER_ME_QUERY_KEY,
    queryFn: authService.getMe,
    enabled: authService.isAuthenticated(),
    staleTime: 5 * 60 * 1000,
  });
}
