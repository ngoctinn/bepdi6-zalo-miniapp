# ADR 002: Chọn PostgreSQL làm Database chính

**Status:** Accepted
**Date:** 2026-08-20

## Context

Dữ liệu hệ thống có quan hệ chặt chẽ: Customer → Address, Order → OrderItem → OrderItemOption, Payment, VoucherUsage. Đơn hàng và thanh toán đòi hỏi tính toàn vẹn ACID, hỗ trợ snapshot dữ liệu và chống race condition khi áp voucher.

## Decision Drivers

- Toàn vẹn dữ liệu tài chính và đơn hàng (ACID).
- Hỗ trợ quan hệ phức tạp với foreign key, constraint.
- Tương thích tốt với Django ORM.
- Hỗ trợ JSONB cho audit log.

## Considered Options

| Option | Ưu điểm | Nhược điểm |
| :--- | :--- | :--- |
| **PostgreSQL** | ACID, quan hệ mạnh, JSONB, tương thích Django ORM | Cần đánh index cẩn thận, thiết lập backup |
| MySQL | Phổ biến, dễ setup | Hỗ trợ transaction và constraint yếu hơn PostgreSQL |
| MongoDB | Flexible schema, nhanh cho đọc | Không phù hợp cho dữ liệu quan hệ chặt, khó đảm bảo toàn vẹn |

## Decision

Chọn **PostgreSQL** làm source of truth duy nhất. Redis chỉ đóng vai trò cache và Celery broker, không lưu dữ liệu lâu dài.

## Consequences

- **Tốt:** Dữ liệu nhất quán, transaction phức tạp an toàn, tương thích hoàn hảo với Django ORM.
- **Chấp nhận:** Cần đánh index hợp lý trên các trường query thường xuyên và thiết lập backup khi lên production.
