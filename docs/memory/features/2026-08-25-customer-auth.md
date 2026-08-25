---
title: "Authentication & Zalo OAuth Integration"
description: "Quy trình trao đổi mã Zalo Access Token / Phone Token lấy thông tin khách hàng và cấp JWT"
tags: [features, auth, zalo-oauth, jwt, customers]
created: 2026-08-25
updated: 2026-08-25
type: "fact"
importance: 3
source: scan
---

# Authentication & Zalo OAuth Integration

## Overview
Module Customers & Auth tích hợp Zalo Mini App SDK để xác thực người dùng, giải mã số điện thoại và cấp phát JWT token phục vụ việc định danh API requests.

## Key Points
- **Token Exchange**: Đổi Zalo Access Token và Phone Token sang Zalo User ID, Tên, Số điện thoại và Avatar URL qua Zalo Graph API (`https://graph.zalo.me/v2.0/me` và `/info`).
- **Dev/Mock Fallback**: Hỗ trợ môi trường test/local khi không có `ZALO_APP_SECRET` hoặc token bắt đầu bằng `mock_`/`test_`.
- **Customer Linking**: Tự động liên kết hoặc tạo bản ghi `Customer` tương ứng với `User` nội bộ Django có vai trò `CUSTOMER`.
- **JWT Custom Claims**: JWT access/refresh token chứa `customer_id` và `zalo_user_id` để tiện kiểm tra quyền truy cập.

## Related
- `apps/backend/apps/customers/models.py`
- `apps/backend/apps/customers/services.py`
- `apps/backend/apps/customers/views.py`
