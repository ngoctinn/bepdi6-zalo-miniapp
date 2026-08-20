# ADR 005: Gửi thông báo đơn hàng qua ZNS và Zalo OA

**Status:** Accepted
**Date:** 2026-08-20

## Context

Zalo Mini App không hỗ trợ native push notification. Cần chọn cơ chế thông báo trạng thái đơn hàng cho khách.

## Decision Drivers

- Zalo Mini App không có push notification.
- Khách cần biết ngay khi đơn đổi trạng thái.
- Thông báo phải đến được khách cả khi không mở app.

## Considered Options

| Option | Ưu điểm | Nhược điểm |
| :--- | :--- | :--- |
| Chỉ thông báo in-app | Đơn giản, không phụ thuộc bên ngoài | Khách không biết nếu không mở app |
| **ZNS + OA + In-app** | ZNS gửi qua SĐT (không cần follow OA), OA gửi qua chat, in-app khi mở app | ZNS tính phí theo tin nhắn, cần OA doanh nghiệp xác thực |
| SMS truyền thống | Đến được mọi SĐT | Chi phí cao, trải nghiệm kém |

## Decision

Kết hợp 3 kênh:

1. **In-app notification** — Danh sách thông báo trong Mini App, cập nhật khi khách mở app.
2. **Zalo Notification Service (ZNS)** — Gửi tin nhắn tự động qua SĐT khi đổi trạng thái đơn. Không yêu cầu khách follow OA.
3. **Zalo OA message** — Gửi tin qua OA cho khách đã follow, chi phí thấp hơn ZNS.

Gửi thông báo qua Celery background task để không block API response.

## Consequences

- **Tốt:** Khách nhận thông báo kịp thời qua nhiều kênh, trải nghiệm tốt.
- **Chấp nhận:** ZNS tính phí theo lượng tin, cần đăng ký và xác thực OA doanh nghiệp. Cần quản lý template ZNS được Zalo duyệt trước.
