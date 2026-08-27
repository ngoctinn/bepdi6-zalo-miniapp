# Plan: Tinh chỉnh & Làm sạch UI trang Checkout

**Mode:** fast  
**Created:** 2026-08-25  
**Status:** IN PROGRESS  

## Overview
Làm sạch và đồng bộ lại visual cho trang Checkout:
1. Thiết kế lại `DeliveryTimePicker` phẳng, không viền lồng nhau, bỏ badge thừa.
2. Thiết kế lại thẻ chọn/thêm địa chỉ giao hàng đồng bộ, trực quan.
3. Chuẩn hóa nút `+ Thêm món` thành text action link thanh lịch.

## Progress

| Status  | Phase | Task |
| ------- | ----- | ---- |
| ✅ DONE | Phase 1: Checkout UI Polish | Task 1: Redesign `DeliveryTimePicker` clean & flat style |
| ✅ DONE | Phase 1: Checkout UI Polish | Task 2: Polish Address & Order Items header in `checkout/index.tsx` |

## Tasks

#### Phase 1: Checkout UI Polish [sequential]

1. **Redesign `DeliveryTimePicker` clean & flat style**
   - File: `apps/frontend/src/components/common/delivery-time-picker.tsx`
   - Action: Clean UI, remove redundant badge in header, flat radio option items, elegant slot chips.

2. **Polish Address & Order Items header in `checkout/index.tsx`**
   - File: `apps/frontend/src/pages/checkout/index.tsx`
   - Action: Clean address card (both empty and filled states), simplify "+ Thêm món" button.

## Next Steps
Verify with `npm run lint` & `npm run build`.
