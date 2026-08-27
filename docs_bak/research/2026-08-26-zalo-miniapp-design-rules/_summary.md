# Research: Quy tắc Thiết kế Giao diện Zalo Mini App

**Date:** 2026-08-26
**Research ID:** `2026-08-26-zalo-miniapp-design-rules`
**Scope:** Tổng hợp toàn bộ quy tắc thiết kế giao diện (UI Design Rules) cho Zalo Mini App — bao gồm nguyên tắc cốt lõi, điều hướng, tiêu chuẩn thị giác, ZaUI components, và cấu hình app.

## Overview

Zalo Mini App tuân theo hệ thống thiết kế **ZDS (Zalo Design System)**, được hiện thực hóa qua thư viện **ZaUI (`zmp-ui`)**. Hệ thống xoay quanh 4 nguyên tắc: thân thiện-nhanh, rõ ràng-mạch lạc, nhất quán-ổn định, tiện lợi-thanh lịch. Giao diện cấu hình qua `app-config.json` và tùy chỉnh theme qua CSS variables (`--zmp-theme-color*`). Spacing dựa trên bội số 4px, corner radius chuẩn hóa 5 mức (4-8-12-16-9999px), và typography sử dụng font hệ thống (SF Pro / Roboto).

## Key Findings

1. **Spacing = bội số 4px**, Corner Radius = 5 tokens chuẩn (4, 8, 12, 16, 9999px). Touch target tối thiểu 7-9mm (~44-56px).
2. **Bottom Navigation tối đa 4 tab**. Menu cố định góc trên phải không thể di chuyển — tuyệt đối không đặt UI elements ở vùng đó.
3. **CSS variables dùng prefix `--zmp-`** cho theme, `--zaui-safe-area-*` cho safe area. ZaUI `1.6.0+` tự xử lý safe area cho Header, BottomNavigation, Sheet.
4. **Bảng màu semantic**: text-primary `#141415`, text-secondary `#767A7F`, brand-primary `#006AF5`, background `#E9EBED` / `#F4F5F6` / `#FFFFFF`.
5. **Xét duyệt**: Không yêu cầu quyền ngay khi mở app (lý do bị từ chối phổ biến nhất). App phải hoàn thiện, dữ liệu thực tế.

## Parts

| # | Document | Description |
|:---|:---|:---|
| 1 | [Nguyên tắc thiết kế cốt lõi](01-design-principles.md) | 4 nguyên tắc nền tảng + yêu cầu xét duyệt |
| 2 | [Điều hướng và bố cục](02-navigation-and-layout.md) | Header, Menu cố định, Back button, Bottom Navigation, cấu trúc trang |
| 3 | [Tiêu chuẩn thị giác](03-visual-standards.md) | Typography, Colors, Spacing, Corner Radius, Touch targets, Icons |
| 4 | [ZaUI Components](04-zaui-components.md) | Danh sách đầy đủ components, phân loại, cách sử dụng, override style |
| 5 | [Cấu hình App, Safe Area, Performance](05-app-config-and-safe-area.md) | app-config.json, CSS variables, safe area handling, tối ưu hiệu suất |

## Quick Reference — Design Tokens

### Colors

| Token | Hex | Dùng cho |
|:---|:---|:---|
| `text-primary` | `#141415` | Nội dung chính |
| `text-secondary` | `#767A7F` | Nội dung phụ, ghi chú |
| `text-disable` | `#B9BDC1` | Text vô hiệu |
| `brand-primary` | `#006AF5` | Liên kết, primary actions |
| `page-bg-default` | `#E9EBED` | Nền trang |
| `page-bg-gray` | `#F4F5F6` | Nền xám nhẹ |
| `page-bg-white` | `#FFFFFF` | Nền trắng |
| `divider-01` | `#E9EBED` | Đường ngăn cách |
| `divider-02` | `#D6D9DC` | Đường ngăn cách đậm |

### Spacing (bội 4px)

| Token | Value |
|:---|:---|
| U | 4px |
| U2 | 8px |
| U3 | 12px |
| U4 | 16px |
| U5 | 20px |

### Corner Radius

| Token | Value | Use |
|:---|:---|:---|
| corner_04 | 4px | Tags, badges |
| corner_08 | 8px | Small cards, buttons |
| corner_12 | 12px | Large cards |
| corner_16 | 16px | Modals, sheets |
| corner_100 | 9999px | Pill buttons, avatars |

### Typography (System font, pt)

| Size | Use |
|:---|:---|
| 20pt | Heading xLarge |
| 18pt | Heading Large |
| 16pt | Heading Normal / Body Large |
| 15pt | Body Normal |
| 14pt | Body Small / Label |
| 12pt | Caption |
| 10pt | Micro |

## Open Questions

- Exact hex codes cho functional colors GL300 (green), OL300 (orange), RL300 (red) chưa được xác nhận từ tài liệu công khai.
- Zalo có thể thay đổi spacing tokens hoặc color tokens giữa các phiên bản SDK — cần theo dõi changelog.
- Figma Design System link (từ tài liệu ZaUI Components) có thể yêu cầu quyền truy cập.

## Recommended Next Steps

- Chạy `/cf-plan` để lên kế hoạch áp dụng các quy tắc này vào dự án bepdi6.
- Audit codebase hiện tại so với design tokens (corner radius, spacing, colors).
- Pin phiên bản `zmp-ui` cụ thể thay vì dùng `"latest"` trong `package.json`.
