---
title: "Frontend Order & Checkout Flow"
description: "Order lifecycle, preview checkout, VietQR payment, and idempotency in frontend"
tags: [frontend, order, checkout, payment, vietqr]
created: 2026-08-25
updated: 2026-08-25
type: "fact"
importance: 3
source: scan
---

# Frontend Order & Checkout Flow

## Overview
The ordering journey takes the user from menu selection through cart management, server-side preview calculation, idempotent order submission, and VietQR payment display.

## Key Points
- **Preview Checkout**: `POST /api/v1/checkout/preview` validates delivery distance, branch radius, active items, and voucher eligibility.
- **Order Placement**: `POST /api/v1/orders` submitted with `Idempotency-Key` and cart items snapshot. Submit button is disabled immediately upon first click to prevent duplicate submissions.
- **Payment**: `GET /api/v1/orders/:id/payment` provides VietQR payment payload and bank transfer account details.
- **Order State Navigation**: Flow transitions from `CheckoutPage` → `OrderSuccessPage` → `OrderDetailPage`.

## Related
- `apps/frontend/src/pages/checkout/`
- `apps/frontend/src/pages/order-detail/`
- `apps/frontend/src/services/order/order.api.ts`
- `apps/frontend/src/types/order.types.ts`
