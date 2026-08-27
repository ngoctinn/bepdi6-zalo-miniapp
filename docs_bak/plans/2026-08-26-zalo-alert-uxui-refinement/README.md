---
slug: 2026-08-26-zalo-alert-uxui-refinement
auto: false
status: done
---

# Plan: Cải Thiện UX/UI Hệ Thống Alert & Feedback (Zalo Mini App Guidelines)

**Mode:** normal
**Created:** 2026-08-26
**Status:** DONE

## Context
Dựa trên tài liệu **Zalo Mini App Design Guidelines**, cải thiện và chuẩn hoá hệ thống phản hồi người dùng (Toast 1.5s, Confirm Modal, Error Modal, Result Page) phù hợp với phong cách Rustic Olive & Warm Ginger của Bếp Dì 6.

## Assumptions
- Dùng `zmp-ui` làm nền tảng UI chính và tuân thủ các quy chuẩn thiết kế của Zalo Mini App.
- Thời gian hiển thị Toast chuẩn là 1.5s (1500ms).
- Thay thế triệt để `window.confirm()` bằng Modal native component.

## Approach
1. Tạo wrapper hook `useAppToast` chuẩn hoá thời lượng 1.5s, vị trí bottom và màu sắc semantic Zalo.
2. Xây dựng component `ConfirmModal` và `ErrorModal` (z-index 9999) chuẩn token `RL300`, `GL300`, `OL300`, `NL300`.
3. Tinh chỉnh SCSS override cho ZMP UI components (`Snackbar`, `Modal`).
4. Thay thế `window.confirm` và cập nhật các trang `order-detail`, `checkout`, `profile`, `order-success`.

## Not Building
- Không thay đổi logic thanh toán backend hoặc API mutation contracts.

## Progress

| Status  | Phase   | Task |
| ------- | ------- | ---- |
| ✅ DONE | Phase 1 | Tạo hook `useAppToast` & styling Snackbar ZMP UI |
| ✅ DONE | Phase 1 | Tạo component `ConfirmModal` & `ErrorModal` |
| ✅ DONE | Phase 1 | Cập nhật các trang `order-detail`, `checkout`, `profile`, `order-success` |
| ✅ DONE | Phase 1 | Kiểm tra linting & kiểm thử giao diện |

## Tasks

#### Phase 1 [sequential]

1. Tạo hook `useAppToast` & styling Snackbar
   - Files: `apps/frontend/src/hooks/use-app-toast.ts`, `apps/frontend/src/css/app.scss`
   - Verify: Gọi `useAppToast` hiển thị toast tắt sau 1.5s
2. Tạo component `ConfirmModal` & `ErrorModal`
   - Files: `apps/frontend/src/components/common/confirm-modal.tsx`, `apps/frontend/src/components/common/error-modal.tsx`
   - Verify: Render Modal với title fs800, nút bấm rõ ràng, z-index cao
3. Cập nhật tích hợp các màn hình
   - Files: `apps/frontend/src/pages/order-detail/index.tsx`, `apps/frontend/src/pages/checkout/index.tsx`, `apps/frontend/src/pages/profile/index.tsx`, `apps/frontend/src/pages/order-success/index.tsx`
   - Verify: Xóa bỏ `window.confirm`, các thông báo sử dụng toast mới
4. Kiểm tra Lint & Build
   - Files: `apps/frontend/*`
   - Verify: `npm run lint` & `npm run build` thành công không lỗi

## Risks
- Chiều cao safe-area dưới đáy màn hình trên các thiết bị iOS/Android cần được tính toán để toast không che nút CTA chính.
