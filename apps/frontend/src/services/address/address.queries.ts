import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { addressService } from "./address.api";
import {
  Address,
  CreateAddressRequest,
  UpdateAddressRequest,
} from "../../types/customer.types";
import { authService } from "../auth/auth.api";

export const ADDRESSES_QUERY_KEY = ["addresses"] as const;

export function useAddresses() {
  return useQuery<Address[]>({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: addressService.getAddresses,
    enabled: authService.isAuthenticated(),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateAddressRequest) =>
      addressService.createAddress(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useUpdateAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: number;
      payload: UpdateAddressRequest;
    }) => addressService.updateAddress(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}

export function useDeleteAddress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => addressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
}
