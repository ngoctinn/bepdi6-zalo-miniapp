/**
 * Centralized Query Key Factory for TanStack React Query v5
 * Follows TkDodo's hierarchical key structure pattern
 */

export const queryKeys = {
  customer: {
    all: ["customer"] as const,
    me: () => [...queryKeys.customer.all, "me"] as const,
  },
  orders: {
    all: ["orders"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.orders.all, "list", params] as const,
    detail: (id: number | string | undefined) =>
      [...queryKeys.orders.all, "detail", String(id)] as const,
    payment: (id: number | string | undefined) =>
      [...queryKeys.orders.all, "payment", String(id)] as const,
  },
  adminOrders: {
    all: ["admin", "orders"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.adminOrders.all, "list", params] as const,
  },
  products: {
    all: ["products"] as const,
    list: (params?: Record<string, unknown>) =>
      [...queryKeys.products.all, "list", params] as const,
    detail: (id: number | string | undefined) =>
      [...queryKeys.products.all, "detail", String(id)] as const,
  },
  categories: {
    all: ["categories"] as const,
  },
  shop: {
    all: ["shop"] as const,
    info: () => [...queryKeys.shop.all, "info"] as const,
  },
  addresses: {
    all: ["addresses"] as const,
    search: (query: string, lat?: number, lng?: number) =>
      ["places-search", query, lat, lng] as const,
  },
  vouchers: {
    all: ["vouchers"] as const,
  },
} as const;
