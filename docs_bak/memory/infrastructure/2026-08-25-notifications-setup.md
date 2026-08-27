---
title: "Notification System & Zalo OA / ZNS"
description: "Hệ thống thông báo trong app và thông báo qua Zalo OA Staff Alert / ZNS khách hàng qua Celery"
tags: [infrastructure, notifications, zalo-oa, zns, celery]
created: 2026-08-25
updated: 2026-08-25
type: "procedure"
importance: 3
source: scan
---

# Notification System & Zalo OA / ZNS

## Overview
Hệ thống xử lý thông báo sự kiện đơn hàng cho cả khách hàng và nhân viên quán một cách bất đồng bộ thông qua Celery tasks.

## Key Points
- **In-App Notification**: Tạo bản ghi `Notification` lưu vào database khi đơn được tạo hoặc cập nhật trạng thái.
- **Zalo OA Staff Alert**: Khi có đơn hàng mới (`send_zalo_oa_staff_alert`), gửi tin nhắn CSKH từ Zalo OA đến danh sách nhân viên/quản lý có cấu hình `zalo_user_id`. Hỗ trợ chế độ mock khi chưa có token OA.
- **ZNS Notification**: Khi đơn chuyển sang trạng thái `DELIVERING` (`send_zns_order_delivering`), gửi thông báo ZNS đến số điện thoại người nhận nếu cờ `ENABLE_ZNS_NOTIFICATION` được bật.
- **Transaction Safety**: Luôn sử dụng `transaction.on_commit(...)` để đảm bảo tác vụ Celery chỉ được dispatch khi dữ liệu đơn hàng đã commit thành công vào PostgreSQL.

## Related
- `apps/backend/apps/notifications/tasks.py`
- `apps/backend/apps/notifications/models.py`
- `docs/adr/005-realtime-notifications.md`
