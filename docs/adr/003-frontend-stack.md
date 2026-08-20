# ADR 003: Chọn React + Vite + ZMP SDK cho Frontend

**Status:** Accepted
**Date:** 2026-08-20

## Context

Frontend chạy trong môi trường Zalo Mini App, cần tuân thủ quy chuẩn của nền tảng Zalo. Cần chọn framework và build tool phù hợp với hệ sinh thái ZMP.

## Decision Drivers

- Phải tương thích với ZMP SDK và ZMP UI.
- Zalo Mini App CLI hỗ trợ tốt.
- Hiệu năng build nhanh, bundle size nhỏ (giới hạn 10MB).
- Team quen thuộc React.

## Considered Options

| Option | Ưu điểm | Nhược điểm |
| :--- | :--- | :--- |
| **React + Vite** | ZMP SDK hỗ trợ chính thức, Vite build nhanh, template sẵn | Phải tuân thủ quy chuẩn ZMP |
| React + Webpack | Linh hoạt cấu hình | Build chậm hơn Vite, template ZMP mới đều dùng Vite |
| Vue | Nhẹ, dễ học | ZMP SDK không hỗ trợ chính thức, không có template |

## Decision

Chọn **React 18 + Vite + ZMP SDK + ZMP UI**. Đây là stack được Zalo khuyến nghị chính thức, có template sẵn và tương thích tốt nhất với hệ sinh thái Mini App.

Các thư viện bổ sung:
- **Routing:** React Router v6
- **Data fetching:** TanStack Query + Axios
- **State:** Zustand

## Consequences

- **Tốt:** Template ZMP sẵn, build nhanh, bundle nhỏ, UI đồng nhất với Zalo.
- **Chấp nhận:** Phải dùng ZMP CLI để deploy, một số API chỉ hoạt động trong môi trường Zalo thật.
