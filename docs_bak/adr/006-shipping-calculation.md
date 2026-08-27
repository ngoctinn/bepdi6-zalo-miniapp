# ADR 006: Tính phí ship bằng công thức đường chim bay (Haversine) có hệ số bù

**Status:** Accepted
**Date:** 2026-08-21

## Context

Phí ship cần được tính toán dựa trên khoảng cách giữa khách hàng và cửa hàng. Việc gọi API bên thứ 3 (Routing API) đồng bộ trong lúc checkout tạo ra bottleneck lớn, rủi ro làm sập luồng đặt hàng nếu API lỗi hoặc timeout.

## Decision Drivers

- Tránh phụ thuộc vào dịch vụ bên ngoài trong luồng Checkout.
- Tốc độ tính toán phải cực nhanh (nội bộ server).
- Vẫn phải đảm bảo khoảng cách tính ra sát với thực tế, không bị lỗ phí ship.

## Considered Options

| Option | Ưu điểm | Nhược điểm |
| :--- | :--- | :--- |
| Routing API phía Backend | Khoảng cách đường đi thực tế, chính xác | Phụ thuộc API bên ngoài, dễ lỗi timeout, tốn chi phí |
| **Haversine + Hệ số bù (1.3x)** | Tốc độ tính toán tức thì, không phụ thuộc bên ngoài, không tốn phí | Không chính xác 100% nhưng đủ an toàn |

## Decision

Chọn **Haversine formula kết hợp hệ số nhân 1.3** để tính toán khoảng cách nội bộ hoàn toàn trên Backend.

Công thức: `Khoảng cách tính phí = Khoảng cách đường chim bay (Haversine) * 1.3`

Bảng biểu phí mẫu áp dụng trên khoảng cách tính phí này:

| Khoảng cách (sau bù trừ) | Phí ship |
| :--- | :--- |
| 0 – 2 km | 10.000đ |
| 2 – 5 km | 15.000đ |
| 5 – 7 km | 20.000đ |
| Trên 7 km | Không giao |

## Consequences

- **Tốt:** Checkout cực nhanh, không bao giờ bị block bởi dịch vụ bản đồ bên ngoài, tiết kiệm hoàn toàn chi phí gọi API bản đồ.
- **Chấp nhận:** Sẽ có sai số so với đường thực tế ở các khu vực đường hẻm zíc zắc hoặc qua sông, tuy nhiên hệ số 1.3 đã bù đắp phần lớn rủi ro này.
