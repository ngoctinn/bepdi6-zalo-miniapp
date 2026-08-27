---
title: "Voucher Validation & Lifecycle"
description: "Quy tắc kiểm tra voucher, giới hạn số lần dùng, tính chiết khấu và cơ chế hoàn trả khi hủy đơn"
tags: [features, vouchers, discount, validation]
created: 2026-08-25
updated: 2026-08-25
type: "fact"
importance: 3
source: scan
---

# Voucher Validation & Lifecycle

## Overview
Module Vouchers cung cấp cơ chế áp dụng khuyến mãi giảm giá theo số tiền cố định (`FIXED`) hoặc phần trăm (`PERCENTAGE`) kèm theo mức giảm tối đa (`maximum_discount`).

## Key Points
- **Validation Rules**:
  1. Trạng thái hoạt động (`ACTIVE`) và còn trong thời gian hiệu lực (`start_at` <= `now` <= `end_at`).
  2. Đơn hàng đạt giá trị tối thiểu (`minimum_order_value`).
  3. Kiểm tra giới hạn lượt dùng toàn hệ thống (`usage_limit`) và trên từng khách hàng (`usage_per_customer`).
- **Usage Lifecycle**:
  - Ghi nhận trạng thái `APPLIED` trong bảng `VoucherUsage` khi đơn hàng tạo thành công.
  - Tự động chuyển sang trạng thái `RELEASED` (hoàn trả lượt dùng) khi đơn hàng bị hủy hoặc khi nhân viên sửa đơn khiến giá trị không còn đạt điều kiện tối thiểu.

## Related
- `apps/backend/apps/vouchers/models.py`
- `apps/backend/apps/vouchers/services.py`
- `apps/backend/apps/vouchers/views.py`
