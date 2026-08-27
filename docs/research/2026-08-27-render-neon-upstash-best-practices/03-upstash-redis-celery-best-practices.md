# Best Practices: Cấu Hình Upstash Redis (Cache & Celery Broker)

## 1. Kết Nối Bảo Mật TLS (`rediss://`)
- Upstash Redis bắt buộc kết nối bảo mật qua TLS trên cổng mặc định (thường là `6379`).
- Chuỗi kết nối **bắt buộc** dùng giao thức `rediss://` (2 chữ `s`).
- Thêm tham số `ssl_cert_reqs=required` cho Celery và Django Cache để đảm bảo xác thực chứng chỉ mã hóa an toàn:
  ```python
  CELERY_BROKER_URL = "rediss://default:PASS@HOST:6379/1?ssl_cert_reqs=required"
  ```

## 2. Tối Ưu Hóa Chi Phí & Command Quota trên Upstash
Upstash áp dụng tính phí/giới hạn dựa trên số lượng Redis commands (10,000 commands/ngày trên Free tier). Do đó cần tinh chỉnh cấu hình Celery & Cache:

1. **Vô Hiệu Hóa Result Backend (Nếu không cần thiết)**:
   - Nếu bạn chỉ cần chạy background task một chiều (bắn ZNS notification, push log, sync status) và không gọi `.get()` đợi kết quả từ task, hãy tắt `CELERY_RESULT_BACKEND = None` hoặc đặt thời gian hết hạn kết quả ngắn (`result_expires = 3600`).
   - Việc ghi và đọc state task ngốn rất nhiều commands.

2. **Giảm Tần Suất Heartbeat & Polling**:
   - Tăng khoảng thời gian heartbeat của broker Celery:
   ```python
   CELERY_BROKER_TRANSPORT_OPTIONS = {
       "heartbeat": 120,
       "visibility_timeout": 3600,
   }
   ```

3. **Cấu Hình Worker Prefetch**:
   - Đặt `CELERY_WORKER_PREFETCH_MULTIPLIER = 1` để worker chỉ nhận đúng số lượng task đang xử lý, tránh fetch dư thừa gây lãng phí commands.

4. **Tách Biệt Database Redis (DB Index)**:
   - Dùng `/0` cho Django Caching (`CACHES['default']`).
   - Dùng `/1` cho Celery Broker (`CELERY_BROKER_URL`).
   - Tránh việc flush cache làm xóa nhầm hàng đợi Celery tasks.
