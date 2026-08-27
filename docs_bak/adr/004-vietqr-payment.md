# ADR 004: Xác nhận thanh toán chuyển khoản thủ công qua VietQR

**Status:** Accepted
**Date:** 2026-08-20

## Context

Hệ thống hỗ trợ thanh toán chuyển khoản ngân hàng. Cần quyết định cách tạo mã QR cho khách quét và cách xác nhận tiền đã nhận.

## Decision Drivers

- MVP cần triển khai nhanh, chi phí thấp.
- Không phụ thuộc vào cổng thanh toán trung gian tốn phí.
- Khách hàng quen quét QR chuyển khoản qua app ngân hàng.

## Considered Options

| Option | Ưu điểm | Nhược điểm |
| :--- | :--- | :--- |
| ZaloPay Checkout SDK | Tích hợp sẵn trong ZMP, tự động xác nhận | Tốn phí giao dịch, cần đăng ký doanh nghiệp |
| **VietQR + Xác nhận thủ công** | Miễn phí, triển khai nhanh, không phụ thuộc bên thứ ba | Nhân viên phải đối soát thủ công |
| VietQR + Casso/SePay | Tự động xác nhận qua webhook biến động số dư | Phụ thuộc dịch vụ bên thứ ba, tốn phí hàng tháng |

## Decision

MVP dùng **VietQR Quick Link** để tạo mã QR động chứa số tài khoản, số tiền và mã đơn hàng. Nhân viên kiểm tra biến động số dư và xác nhận thanh toán thủ công trên trang quản trị.

Cấu trúc URL VietQR:
```
https://img.vietqr.io/image/{BANK_ID}-{ACCOUNT_NO}-compact2.png?amount={AMOUNT}&addInfo={ORDER_CODE}
```

Sau MVP, có thể nâng cấp lên tự động xác nhận bằng Casso/SePay webhook hoặc tích hợp ZaloPay.

## Consequences

- **Tốt:** Triển khai nhanh, miễn phí, khách quét QR nhanh chóng.
- **Chấp nhận:** Nhân viên cần đối soát thủ công, có độ trễ xác nhận. Phù hợp với quy mô nhỏ của MVP.
