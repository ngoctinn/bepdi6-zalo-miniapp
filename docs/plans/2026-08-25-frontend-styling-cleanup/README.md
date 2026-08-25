---
slug: 2026-08-25-frontend-styling-cleanup
auto: true
status: done
---

# Plan: Làm Sạch & Chuẩn Hóa Toàn Diện Styling Frontend (Rustic Olive System)

**Mode:** normal  
**Created:** 2026-08-25  
**Status:** DONE

## Context
Sau đợt audit toàn diện (`/cf-research`), một số components và pages vẫn còn các class hardcoded màu cũ (`green800`, `text-green-700`, `bg-green-50`, `bg-emerald-500/15`, `focus:border-green600`). Cần làm sạch triệt để và quy về Semantic Tokens chuẩn (`primary`, `primaryDark`, `primary/10`, `primary/15`).

## Assumptions
- Bảng màu chủ đạo đã chốt theo Option 2: Rustic Olive (`#4D7C0F`), Olive 800 (`#3F6212`), Olive 100 (`#ECFCCB`).
- Không thêm dependency mới, tuân thủ `AGENTS.md`.

## Approach
1. Rà soát và cập nhật 8 files đã xác định trong báo cáo audit:
   - `apps/frontend/src/components/common/note-input.tsx`
   - `apps/frontend/src/components/common/cart-sheet.tsx`
   - `apps/frontend/src/components/common/quantity-stepper.tsx`
   - `apps/frontend/src/components/common/cart-float-button.tsx`
   - `apps/frontend/src/components/common/order-item-card.tsx`
   - `apps/frontend/src/pages/order-detail/index.tsx`
   - `apps/frontend/src/pages/select-location/index.tsx`
   - `apps/frontend/src/pages/profile/index.tsx`
2. Chạy `npx prettier --write`, `npm run lint` và `npm run build`.

## AUTOPILOT (IMPORTANT — DO NOT DEVIATE EVEN IN LONG CONVERSATIONS)
1. Run all tasks autonomously.
2. Verify with lint and build.

## Progress

| Status  | Phase   | Task |
| ------- | ------- | ---- |
| ✅ DONE | Phase 1 | Clean up remaining hardcoded color classes in common components |
| ✅ DONE | Phase 1 | Clean up hardcoded color classes in pages (order-detail, select-location, profile) |
| ✅ DONE | Phase 1 | Format, lint, and build verification |

## Tasks

#### Phase 1 [sequential]

1. Clean up common components
   - Files: `note-input.tsx`, `cart-sheet.tsx`, `quantity-stepper.tsx`, `cart-float-button.tsx`, `order-item-card.tsx`
   - Verify: No hardcoded `green*` or `emerald*` classes remaining in these components.
2. Clean up pages
   - Files: `order-detail/index.tsx`, `select-location/index.tsx`, `profile/index.tsx`
   - Verify: Semantic primary tokens applied everywhere.
3. Verification
   - Command: `npm run lint && npm run build`
