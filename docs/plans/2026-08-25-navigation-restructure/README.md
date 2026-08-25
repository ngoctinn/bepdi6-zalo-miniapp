# Plan: Tái cấu trúc Navigation (Menu - Giỏ hàng - Đơn hàng) & Loại bỏ Profile dư thừa

**Mode:** fast  
**Created:** 2026-08-25  
**Status:** IN PROGRESS  

## Overview
1. Thay thế Tab `Cá nhân` bằng Tab `Giỏ hàng` (có Badge số lượng món đỏ nổi bật) trên thanh Bottom Bar.
2. Gỡ bỏ trang `/profile` dư thừa.
3. Tích hợp CSKH Zalo OA (`openChat` / Hotline).

## Progress

| Status  | Phase | Task |
| ------- | ----- | ---- |
| ✅ DONE | Phase 1: Navigation & Cart Tab | Task 1: Update Footer Bottom Nav with Cart Tab and Badge |
| ✅ DONE | Phase 1: Navigation & Cart Tab | Task 2: Remove `/profile` route and update Router |
| ✅ DONE | Phase 1: Navigation & Cart Tab | Task 3: Add Zalo OA Chat action for CSKH |

## Next Steps
Verify with `npm run lint` & `npm run build`.
