---
title: "Order Lifecycle & State Machine"
description: "Vòng đời đơn hàng, kiểm tra chống trùng Idempotency, snapshot dữ liệu và chuyển trạng thái"
tags: [features, orders, state-machine, transaction, idempotency]
created: 2026-08-25
updated: 2026-08-25
type: "fact"
importance: 3
source: scan
---

# Order Lifecycle & State Machine

## Overview
Module Orders chịu trách nhiệm quản lý toàn bộ vòng đời của đơn hàng từ khi khách đặt, tính tiền, áp mã giảm giá, kiểm tra trùng lặp cho đến khi hoàn thành hoặc hủy bỏ.

## Key Points
- **Idempotency**: Bắt buộc có header `Idempotency-Key` khi tạo đơn để tránh việc click spam đặt nhiều đơn giống nhau.
- **Snapshot Pattern**: Lưu cứng tên món, đơn giá món, tên tùy chọn, giá tùy chọn và địa chỉ giao hàng tại thời điểm đặt vào `OrderItem` và `OrderItemOption`.
- **Atomic Transactions**: Tất cả thao tác tạo đơn, chuyển trạng thái và sửa đơn COD đều bọc trong `transaction.atomic`.
- **Phân loại nhận hàng**: Hỗ trợ `DELIVERY` (giao tận nơi, tính phí ship và kiểm tra bán kính) và `PICKUP` (tự lấy tại quán, phí ship = 0đ, khoảng cách = 0km).

## State Machine
- `PENDING_CONFIRMATION` (Chờ xác nhận): Khách vừa đặt hàng. Cho phép chuyển sang `CONFIRMED` hoặc `CANCELLED`. Khách có thể tự hủy ở bước này.
- `CONFIRMED` (Đã xác nhận): Nhân viên gọi xác nhận (có thể sửa món đối với đơn COD). Cho phép chuyển sang `PREPARING` hoặc `CANCELLED`.
- `PREPARING` (Đang chuẩn bị): Bếp chế biến. Cho phép chuyển sang `READY` hoặc `CANCELLED`.
- `READY` (Sẵn sàng giao): Món đã xong. Cho phép chuyển sang `DELIVERING` (cho đơn giao tận nơi) hoặc `COMPLETED` (cho đơn nhận tại quán).
- `DELIVERING` (Đang giao hàng): Shipper đang giao. Kích hoạt thông báo ZNS nếu bật cờ. Cho phép chuyển sang `COMPLETED`.
- `COMPLETED` (Hoàn thành - Terminal state): Đơn đã giao và thanh toán thành công. Không thể chuyển trạng thái khác.
- `CANCELLED` (Đã hủy - Terminal state): Hủy đơn và tự động hoàn trả (release) voucher nếu có.

## Related
- `apps/backend/apps/orders/models.py`
- `apps/backend/apps/orders/services.py`
- `apps/backend/apps/orders/views.py`
- `docs/business-rules.md`
