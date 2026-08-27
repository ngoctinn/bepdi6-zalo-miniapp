---
title: "Frontend State Management & API Communication"
description: "Zustand cart/location stores, TanStack React Query, and typed API envelope client"
tags: [frontend, zustand, react-query, api-client, envelope]
created: 2026-08-25
updated: 2026-08-25
type: "preference"
importance: 3
source: scan
---

# Frontend State Management & API Communication

## Overview
Client state is split between local persistent stores (Zustand) for Cart and Location, and TanStack React Query (`@tanstack/react-query`) for server state. HTTP communication is handled by a custom `fetch`-based `apiClient`.

## Key Points
- **API Envelope & Error Handling**: `apiClient` unwraps standard backend `{ success: true, data: ... }` responses and extracts code/message into `ApiError` instances on failure.
- **Idempotency**: Supports `idempotencyKey` option which attaches the `Idempotency-Key` header (mandated for order creation and payment endpoints).
- **JWT Storage**: Access and refresh tokens stored in `localStorage` (`bepdi6_access_token` and `bepdi6_refresh_token`).
- **Cart Store**: Zustand store in `cart.store.tsx` with automatic `localStorage` synchronization. Computes option signatures to merge identical item customizations.
- **Business Logic Boundary**: Pricing calculation, voucher discount calculation, and shipping fee calculation are never done locally for final checkouts; instead, they call `orderService.previewCheckout()`.

## Related
- `apps/frontend/src/lib/api-client.ts`
- `apps/frontend/src/lib/api-error.ts`
- `apps/frontend/src/stores/cart.store.tsx`
- `apps/frontend/src/services/order/order.api.ts`
