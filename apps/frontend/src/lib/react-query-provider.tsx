import { QueryClientProvider } from "@tanstack/react-query";
import React, { useCallback } from "react";
import { APIError } from "./api-error";
import { queryClient } from "./query-client";
import { copy } from "@/constants/copy";
import { useToastStore } from "@/hooks/use-app-toast";

export function ReactQueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const showToast = useToastStore((state) => state.show);
  const notifyError = useCallback(
    (message: string, type: "warning" | "error") => {
      showToast(type, { title: message });
    },
    [showToast],
  );

  const handleQueryError = useCallback(
    (error: unknown, _query?: unknown) => {
      if (!navigator?.onLine) {
        notifyError(copy.common.networkError, "warning");
        return;
      }
      if (error instanceof APIError) {
        notifyError(error?.message ?? copy.common.error, "error");
      }
    },
    [notifyError],
  );

  const handleMutationError = useCallback(
    (error: unknown) => {
      if (!navigator?.onLine) {
        notifyError(copy.common.networkError, "warning");
        return;
      }
      if (error instanceof APIError) {
        notifyError(error?.message ?? copy.common.error, "error");
      }
    },
    [notifyError],
  );

  return (
    <QueryClientProvider
      client={queryClient(handleQueryError, handleMutationError)}
    >
      {children}
    </QueryClientProvider>
  );
}
