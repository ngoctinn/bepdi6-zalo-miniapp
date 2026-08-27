# Database Design

## 1. Sơ đồ quan hệ

```
Customer ──1:N── Address
Customer ──1:N── Order ──1:N── OrderItem ──1:N── OrderItemOption
                 Order ──1:1── Payment
                 Order ──1:N── Notification

Category ──1:N── Product ──1:N── OptionGroup ──1:N── Option

Voucher ──1:N── VoucherUsage
```

---

## 2. Customers

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| zalo_user_id | VARCHAR(100) | UNIQUE, định danh Zalo |
| name | VARCHAR(255) | |
| phone | VARCHAR(20) | |
| avatar_url | TEXT | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## 3. Addresses

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| customer_id | BIGINT | FK → customers |
| label | VARCHAR(100) | "Nhà", "Công ty" |
| recipient_name | VARCHAR(255) | |
| phone | VARCHAR(20) | |
| address_text | TEXT | |
| latitude | DECIMAL(10,8) | |
| longitude | DECIMAL(11,8) | |
| is_default | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## 4. Categories

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| name | VARCHAR(255) | |
| description | TEXT | |
| image_url | TEXT | |
| sort_order | INT | |
| status | VARCHAR(50) | ACTIVE, INACTIVE |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## 5. Products

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| category_id | BIGINT | FK → categories |
| name | VARCHAR(255) | |
| description | TEXT | |
| image_url | TEXT | |
| price | DECIMAL(12,2) | |
| status | VARCHAR(50) | AVAILABLE, OUT_OF_STOCK, INACTIVE |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## 6. Option Groups

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| product_id | BIGINT | FK → products |
| name | VARCHAR(255) | "Chọn nước", "Thêm topping" |
| is_required | BOOLEAN | |
| min_select | INT | |
| max_select | INT | |
| sort_order | INT | |

## 7. Options

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| option_group_id | BIGINT | FK → option_groups |
| name | VARCHAR(255) | |
| price | DECIMAL(12,2) | Giá cộng thêm |
| status | VARCHAR(50) | AVAILABLE, INACTIVE |
| sort_order | INT | |

---

## 8. Orders

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| order_code | VARCHAR(32) | UNIQUE |
| idempotency_key | VARCHAR(100) | Định danh chống trùng đơn |
| customer_id | BIGINT | FK → customers |
| status | VARCHAR(50) | Xem bảng trạng thái bên dưới |
| delivery_type | VARCHAR(20) | ASAP, SCHEDULED |
| recipient_name | VARCHAR(255) | Snapshot |
| phone | VARCHAR(20) | Snapshot |
| delivery_address | TEXT | Snapshot |
| delivery_latitude | DECIMAL(10,8) | Snapshot |
| delivery_longitude | DECIMAL(11,8) | Snapshot |
| distance_km | DECIMAL(6,2) | |
| shipping_fee | DECIMAL(12,2) | |
| subtotal | DECIMAL(12,2) | |
| discount | DECIMAL(12,2) | |
| total_amount | DECIMAL(12,2) | |
| voucher_id | BIGINT | Nullable |
| payment_method | VARCHAR(30) | COD, BANK_TRANSFER |
| note | TEXT | |
| scheduled_delivery_at | TIMESTAMPTZ | Nullable, chỉ khi SCHEDULED |
| confirmed_at | TIMESTAMPTZ | |
| completed_at | TIMESTAMPTZ | |
| cancelled_at | TIMESTAMPTZ | |
| cancellation_reason | VARCHAR(255) | |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**Trạng thái đơn hàng:** PENDING_CONFIRMATION, CONFIRMED, PREPARING, READY, DELIVERING, COMPLETED, CANCELLED.

**Lưu ý:** Các trường recipient_name, phone, delivery_address, delivery_latitude, delivery_longitude là snapshot cố định tại thời điểm đặt đơn. Không phụ thuộc vào bảng addresses.

## 9. Order Items

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| order_id | BIGINT | FK → orders |
| product_id | BIGINT | FK → products |
| product_name | VARCHAR(255) | Snapshot tên món |
| unit_price | DECIMAL(12,2) | Snapshot giá tại thời điểm đặt |
| quantity | INT | |
| note | VARCHAR(255) | |
| subtotal | DECIMAL(12,2) | |
| created_at | TIMESTAMPTZ | |

## 10. Order Item Options

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| order_item_id | BIGINT | FK → order_items |
| option_id | BIGINT | FK → options |
| option_name | VARCHAR(255) | Snapshot |
| price | DECIMAL(12,2) | Snapshot |
| quantity | INT | |

---

## 11. Payments

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| order_id | BIGINT | UNIQUE FK → orders |
| method | VARCHAR(30) | COD, BANK_TRANSFER |
| status | VARCHAR(30) | UNPAID, PENDING, PAID, FAILED, REFUNDED |
| amount | DECIMAL(12,2) | |
| transaction_reference | VARCHAR(100) | |
| qr_code_url | TEXT | |
| paid_at | TIMESTAMPTZ | |
| actual_paid_amount | DECIMAL(12,2) | Số tiền thực nhận (VietQR) |
| note | TEXT | Ghi chú lệch tiền |
| verified_by | BIGINT | ID nhân viên xác nhận |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

---

## 12. Vouchers

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| code | VARCHAR(50) | UNIQUE |
| name | VARCHAR(255) | |
| discount_type | VARCHAR(20) | FIXED, PERCENTAGE |
| discount_value | DECIMAL(12,2) | |
| minimum_order_value | DECIMAL(12,2) | |
| maximum_discount | DECIMAL(12,2) | Áp dụng cho PERCENTAGE |
| usage_limit | INT | Tổng lượt dùng toàn hệ thống |
| usage_per_customer | INT | Lượt dùng tối đa trên từng khách |
| start_at | TIMESTAMPTZ | |
| end_at | TIMESTAMPTZ | |
| status | VARCHAR(30) | ACTIVE, INACTIVE |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## 13. Voucher Usages

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| voucher_id | BIGINT | FK → vouchers |
| customer_id | BIGINT | FK → customers |
| order_id | BIGINT | FK → orders |
| discount_amount | DECIMAL(12,2) | |
| status | VARCHAR(30) | APPLIED, RELEASED |
| used_at | TIMESTAMPTZ | |

---

## 14. Notifications

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| customer_id | BIGINT | FK → customers |
| order_id | BIGINT | FK → orders, nullable |
| type | VARCHAR(50) | ORDER_STATUS, PROMOTION |
| title | VARCHAR(255) | |
| message | TEXT | |
| is_read | BOOLEAN | |
| created_at | TIMESTAMPTZ | |
| read_at | TIMESTAMPTZ | |

---

## 15. Users (Nhân viên / Admin)

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| zalo_user_id | VARCHAR(100) | Nullable, định danh Zalo nhận thông báo OA |
| name | VARCHAR(255) | |
| phone | VARCHAR(20) | UNIQUE |
| email | VARCHAR(255) | UNIQUE |
| password_hash | VARCHAR(255) | |
| role | VARCHAR(50) | STAFF, ADMIN |
| status | VARCHAR(50) | ACTIVE, INACTIVE |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

## 16. Audit Logs

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK |
| user_id | BIGINT | FK → users |
| action | VARCHAR(100) | UPDATE_ORDER_STATUS, VERIFY_PAYMENT, UPDATE_SHOP_CONFIG |
| entity_type | VARCHAR(50) | ORDER, PRODUCT, PAYMENT, SHOP_CONFIG |
| entity_id | BIGINT | |
| old_data | JSONB | |
| new_data | JSONB | |
| created_at | TIMESTAMPTZ | |

---

## 17. Shop Configs (Singleton)

| Cột | Kiểu | Ghi chú |
| :--- | :--- | :--- |
| id | BIGSERIAL | PK (Singleton id=1) |
| shop_name | VARCHAR(255) | Tên quán ("Bếp Dì 6") |
| hotline | VARCHAR(20) | Số hotline CSKH |
| address_text | TEXT | Địa chỉ thực tế |
| latitude | DECIMAL(10,8) | Vĩ độ quán |
| longitude | DECIMAL(11,8) | Kinh độ quán |
| is_open | BOOLEAN | Mở/đóng nhận đơn |
| open_time | TIME | Giờ mở cửa hàng ngày |
| close_time | TIME | Giờ đóng cửa hàng ngày |
| min_order_amount | DECIMAL(12,2) | Giá trị đơn tối thiểu để đặt (0 = không giới hạn) |
| max_delivery_radius_km | DECIMAL(4,2) | Bán kính giao tối đa (VD: 7.0km) |
| haversine_multiplier | DECIMAL(3,2) | Hệ số bù trừ đường đi (VD: 1.3) |
| shipping_tiers | JSONB | Bảng bậc thang phí ship `[{from_km, to_km, fee}]` |
| min_order_for_freeship | DECIMAL(12,2) | Ngưỡng đơn được freeship (0 = tắt) |
| vietqr_bank_id | VARCHAR(20) | Mã ngân hàng VietQR (MB, VCB,...) |
| vietqr_account_no | VARCHAR(50) | Số tài khoản nhận tiền |
| vietqr_account_name | VARCHAR(255) | Tên chủ tài khoản |
| announcement_banner | TEXT | Thông báo hiển thị đầu app (Nullable) |
| updated_at | TIMESTAMPTZ | |

---

## 18. Indexes cần đánh

| Bảng | Cột |
| :--- | :--- |
| customers | zalo_user_id |
| orders | customer_id, status, created_at |
| orders | order_code |
| orders | customer_id, idempotency_key | UNIQUE |
| order_items | order_id |
| vouchers | code, status |
| voucher_usages | voucher_id, customer_id |
| notifications | customer_id, is_read |
