# ADR 001: Chọn Django REST Framework cho Backend

**Status:** Accepted
**Date:** 2026-08-20

## Context

Hệ thống cần một backend REST API xử lý các nghiệp vụ: đặt hàng, tính phí ship, voucher, thanh toán và quản trị. Yêu cầu phát triển nhanh (MVP), có sẵn ORM và migration mạnh, có trang admin tích hợp sẵn.

## Decision Drivers

- Tốc độ phát triển MVP nhanh nhất có thể.
- ORM và hệ thống migration tốt để xử lý quan hệ dữ liệu phức tạp.
- Có sẵn admin panel cho nhân viên thao tác mà không cần xây UI riêng ngay.
- Hệ sinh thái Python hỗ trợ tốt cho việc tích hợp AI trong tương lai.

## Considered Options

| Option | Ưu điểm | Nhược điểm |
| :--- | :--- | :--- |
| **Django + DRF** | ORM mạnh, admin sẵn, ecosystem lớn, migration tốt | Cần tối ưu query N+1, không phải lựa chọn hiệu năng cao nhất |
| FastAPI | Async native, tốc độ cao, tài liệu API tự sinh | Không có ORM và admin tích hợp, phải tự xây nhiều thứ |
| NestJS | TypeScript, kiến trúc module rõ ràng | Team không mạnh TypeScript, không có admin sẵn |

## Decision

Chọn **Django + Django REST Framework**. Django đáp ứng đầy đủ các yêu cầu về tốc độ phát triển, ORM, migration, và admin panel. DRF cung cấp serializer, viewset và permission class giúp xây API chuẩn RESTful nhanh.

## Consequences

- **Tốt:** Phát triển nhanh, xử lý transaction an toàn, admin panel sẵn, dễ tích hợp Celery cho background job.
- **Chấp nhận:** Cần chú ý tối ưu query ORM và đặt cache Redis cho các endpoint đọc nhiều như menu.
