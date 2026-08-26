---
slug: 2026-08-26-zalo-design-compliance
auto: false
status: done
---

# Plan: Sửa lỗi tuân thủ Zalo Mini App Design Guidelines

**Mode:** normal
**Created:** 2026-08-26
**Status:** DONE

## Overview

Sửa toàn bộ vấn đề Critical (C1-C4) và Important (W1-W7) phát hiện từ deep review so sánh frontend code với nghiên cứu quy tắc thiết kế Zalo Mini App.

## Not Building

- S2 (Code splitting / React.lazy) — cải thiện hiệu suất riêng, không ảnh hưởng xét duyệt
- S3 (Tách vectors.tsx 120KB) — cần refactor lớn, tách đợt khác
- S4 (ZaUI `<Page>` wrapper) — cần thay đổi cấu trúc layout lớn
- S5 (Tách text khỏi tokens.js) — tokens.js đang hoạt động tốt

## User Review Required

> [!IMPORTANT]
> **C1 — Bỏ Google Font:** Xác nhận bạn đồng ý chuyển hoàn toàn sang font hệ thống. Giao diện sẽ hiển thị hơi khác trên mỗi thiết bị (SF Pro trên iOS, Roboto trên Android) — đây là hành vi chuẩn Zalo.

> [!IMPORTANT]
> **W1 — Migrate Footer:** Custom bottom nav sẽ được thay bằng ZaUI `<BottomNavigation>`. Có thể cần điều chỉnh lại styling vì ZaUI component có style mặc định riêng. Xác nhận OK?

## Assumptions

- `zmp-ui: "latest"` cung cấp `<BottomNavigation>` component — basis: ZaUI docs, component tồn tại từ v1.0
- `--zaui-safe-area-inset-bottom` CSS variable được ZMP runtime cung cấp — basis: nghiên cứu 05-app-config + `app-config.json` có `hideIOSSafeAreaBottom: true`
- `app-config.json` giữ nguyên `actionBarHidden: true` — basis: app đang dùng custom header

## Progress

| Status  | Phase              | File                                           | Tasks   |
| ------- | ------------------ | ---------------------------------------------- | ------- |
| ✅ DONE | Phase 1: Critical  | [phase-1-critical.md](./phase-1-critical.md)   | 3 tasks |
| ✅ DONE | Phase 2: Important | [phase-2-important.md](./phase-2-important.md) | 5 tasks |

## Risks

- **ZaUI `<BottomNavigation>` styling:** Component mặc định có thể không khớp 100% với design Rustic Olive hiện tại → mitigation: override CSS variables `--zaui-light-bottom-navigation-*` (đã có trong `app.scss`)
- **Safe Area variable chưa inject:** Nếu chạy trên browser thường (không phải Zalo), `--zaui-safe-area-inset-bottom` = undefined → mitigation: fallback value `max(Npx, var(--zaui-safe-area-inset-bottom, Npx))`
- **Font thay đổi:** Bỏ Be Vietnam Pro có thể làm layout shift nhẹ do font metrics khác nhau → mitigation: kiểm tra trên Zalo app thật sau khi sửa

## Next Steps

After implementation: `/cf-review` → `/cf-commit`
