# ADR 006: Tính phí ship bằng Mapping/Routing API phía Backend

**Status:** Accepted
**Date:** 2026-08-20

## Context

Phí ship phải được tính dựa trên khoảng cách thực tế từ shop đến khách. Cần quyết định cách tính khoảng cách và ai là người quyết định phí ship.

## Decision Drivers

- Phí ship phải chính xác theo đường đi thực tế, không phải đường chim bay.
- Không được để frontend tự tính và gửi lên.
- Cần hỗ trợ giới hạn bán kính giao hàng tối đa.

## Considered Options

| Option | Ưu điểm | Nhược điểm |
| :--- | :--- | :--- |
| Tính đường chim bay (Haversine) | Đơn giản, không cần API bên ngoài | Không chính xác, đường đi thực tế có thể gấp đôi |
| **Routing API phía Backend** | Khoảng cách đường đi thực tế, chính xác | Phụ thuộc API bên ngoài, tốn chi phí theo request |
| Routing API phía Frontend | Giảm tải backend | Không an toàn, khách có thể sửa kết quả |

## Decision

Backend gọi Mapping/Routing API để tính khoảng cách đường đi thực tế giữa tọa độ shop và tọa độ khách. Sau đó áp dụng bảng biểu phí do shop cấu hình để ra phí ship.

Frontend chỉ gửi tọa độ địa chỉ, không gửi khoảng cách hay phí ship.

Bảng biểu phí mẫu:

| Khoảng cách | Phí ship |
| :--- | :--- |
| 0 – 2 km | 10.000đ |
| 2 – 5 km | 15.000đ |
| 5 – 7 km | 20.000đ |
| Trên 7 km | Không giao |

## Consequences

- **Tốt:** Phí ship chính xác, chống gian lận, hỗ trợ giới hạn bán kính giao hàng.
- **Chấp nhận:** Phụ thuộc API bên ngoài, cần xử lý fallback khi API lỗi. Có thể cache kết quả cho cùng tọa độ trong thời gian ngắn để giảm chi phí.
