# ADR 005: Tối ưu kênh thông báo đơn hàng (ZNS, Zalo OA, In-app & Staff Zalo OA Alert)

**Status:** Accepted
**Date:** 2026-08-21

## Context

Zalo Mini App không hỗ trợ native push notification trực tiếp tới thiết bị khi đóng app. Đồng thời, việc gửi ZNS cho mọi bước chuyển trạng thái gây lãng phí chi phí lớn (200-300đ/tin) và rủi ro chậm Go-Live do quy trình duyệt template ZNS. Ngoài ra, nhân viên có thể bỏ lỡ chuông báo đơn mới trên Web Admin khi rời quầy hoặc tab bị OS đưa vào chế độ ngủ. Doanh nghiệp đã có sẵn Zalo OA Doanh nghiệp xác thực.

## Decision Drivers

- Tiết kiệm tối đa chi phí gửi tin nhắn ZNS.
- Tránh phụ thuộc duyệt template ZNS làm chậm ngày Go-Live MVP.
- Đảm bảo nhân viên nhận được thông báo đơn mới tức thì trên app Zalo cá nhân ngay cả khi không ngồi trước máy tính.
- Hệ sinh thái thuần Zalo, không phụ thuộc app thứ ba (Telegram).

## Decision

1. **Kênh thông báo cho Khách hàng**:
   - **In-app notification (Miễn phí)**: Cập nhật mọi trạng thái đơn khi khách mở Mini App.
   - **Zalo OA message (Miễn phí/Chi phí thấp)**: Gửi tin nhắn qua OA cho khách hàng đã quan tâm OA.
   - **Zalo Notification Service (ZNS)**: Chỉ gửi DUY NHẤT 1 tin ZNS ở trạng thái quan trọng nhất: `DELIVERING` (Đang giao hàng).
   - **Feature Flag**: Sử dụng cờ `ENABLE_ZNS_NOTIFICATION = False` trong giai đoạn đầu. MVP vận hành xác nhận qua điện thoại và In-app; bật ZNS sau khi template được duyệt.

2. **Kênh thông báo cho Nhân viên / Cửa hàng**:
   - **Web Admin**: Cung cấp nút "Bắt đầu ca làm việc" để kích hoạt User Gesture mở khóa `AudioContext`, đảm bảo phát chuông báo đơn mới.
   - **Zalo OA Staff Alert**: Nhân viên/Chủ quán follow Zalo OA của quán và liên kết `zalo_user_id` trong tài khoản quản trị. Mỗi khi có đơn mới (`PENDING_CONFIRMATION`), Celery task gọi Zalo OA OpenAPI gửi tin nhắn báo đơn trực tiếp vào tài khoản Zalo của nhân viên đang trong ca trực.

## Consequences

- **Tốt**: Trải nghiệm thuần Zalo 100%, không cần cài đặt thêm app ngoài; nhân viên nhận thông báo push rung điện thoại tức thì; giảm 80% chi phí ZNS; Web Admin không bị chặn âm thanh.
- **Chấp nhận**: Tốn chi phí tin nhắn Zalo OA (~55đ/tin ngoài 48h) cho tài khoản nhân viên, nhưng đã có sẵn OA Doanh nghiệp nên chi phí này rất nhỏ và hoàn toàn chấp nhận được.


