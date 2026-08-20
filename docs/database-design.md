# Food Order — Database Design

## 1. Nguyên tắc

- PostgreSQL là database chính.
- Dữ liệu Order phải giữ lịch sử.
- Giá tại thời điểm mua phải được snapshot.
- Không lưu dữ liệu quan trọng chỉ ở Redis.
- Quan hệ giữa các entity phải rõ ràng.
- Không thiết kế inventory/POS trong MVP.

---

## 2. Entity Overview

```text
Customer
   │
   ├── Address
   │
   └── Order
          │
          ├── OrderItem
          │      └── OrderItemOption
          │
          └── Payment

Category
   │
   └── Product
          │
          └── ProductOption

Voucher
   │
   └── VoucherUsage

Order
   │
   └── Notification

User
   └── Role
```

---

## 3. Customer

```text
customers
-----------
id
zalo_user_id
name
phone
created_at
updated_at
```

`zalo_user_id` dùng để nhận diện Customer.

---

## 4. Address

```text
addresses
-----------
id
customer_id
label
recipient_name
phone
address_text
latitude
longitude
is_default
created_at
updated_at
```

Ví dụ:

```text
label = "Nhà"
address_text = "..."
latitude = ...
longitude = ...
```

Customer có nhiều Address.

---

## 5. Category

```text
categories
-----------
id
name
description
image_url
sort_order
status
created_at
updated_at
```

---

## 6. Product

```text
products
-----------
id
category_id
name
description
image_url
product_type
price
status
created_at
updated_at
```

`product_type`:

```text
REGULAR
COMBO
```

`status`:

```text
AVAILABLE
OUT_OF_STOCK
INACTIVE
```

---

## 7. Product Option

Nếu Product có Option:

```text
option_groups
--------------
id
product_id
name
is_required
min_select
max_select
sort_order
```

Option:

```text
options
--------
id
option_group_id
name
price
status
sort_order
```

Ví dụ:

```text
Combo cơm + nước
        │
        └── Option Group: Chọn nước
                ├── Coca
                ├── Pepsi
                └── Trà
```

---

## 8. Order

```text
orders
-------
id
order_code
customer_id

status

delivery_type
delivery_address
delivery_latitude
delivery_longitude
distance_km
shipping_fee

subtotal
discount
total_amount

voucher_id

payment_method

scheduled_delivery_at

confirmed_at
completed_at
cancelled_at

cancellation_reason

created_at
updated_at
```

Order lưu snapshot thông tin giao hàng để lịch sử không bị ảnh hưởng khi Customer thay đổi Address.

---

## 9. Order Status

```text
PENDING_CONFIRMATION
CONFIRMED
PREPARING
READY
DELIVERING
COMPLETED
CANCELLED
```

---

## 10. Order Item

```text
order_items
-----------
id
order_id
product_id

product_name
unit_price
quantity

note

subtotal
created_at
```

`product_name` và `unit_price` là snapshot.

Không phụ thuộc hoàn toàn vào Product hiện tại.

---

## 11. Order Item Option

```text
order_item_options
------------------
id
order_item_id
option_id

option_name
price
quantity
```

`option_name` và `price` được snapshot.

---

## 12. Payment

```text
payments
--------
id
order_id
method
status
amount
transaction_reference
paid_at
verified_by
created_at
updated_at
```

Method:

```text
COD
BANK_TRANSFER
```

Status:

```text
UNPAID
PENDING
PAID
FAILED
REFUNDED
```

---

## 13. Voucher

```text
vouchers
--------
id
code
name

discount_type
discount_value

minimum_order_value
maximum_discount

usage_limit
usage_per_customer

start_at
end_at

status

created_at
updated_at
```

Discount type:

```text
FIXED
PERCENTAGE
```

---

## 14. Voucher Usage

```text
voucher_usages
--------------
id
voucher_id
customer_id
order_id
discount_amount
used_at
```

Dùng để kiểm tra Customer đã sử dụng Voucher bao nhiêu lần.

---

## 15. Notification

```text
notifications
-------------
id
customer_id
order_id

type
title
message

is_read
created_at
read_at
```

---

## 16. User / Staff

```text
users
-----
id
name
phone
email
password_hash
role_id
status
created_at
updated_at
```

Role:

```text
roles
-----
id
name
```

Ví dụ:

```text
STAFF
ADMIN
```

---

## 17. Audit Log

```text
audit_logs
----------
id
user_id
action
entity_type
entity_id
old_data
new_data
created_at
```

Ví dụ:

```text
user_id: 10
action: UPDATE_ORDER_STATUS
entity_type: ORDER
entity_id: 1001

old_data:
PENDING_CONFIRMATION

new_data:
CONFIRMED
```

---

## 18. Relationships

```text
Customer 1 ─── N Address

Customer 1 ─── N Order

Category 1 ─── N Product

Product 1 ─── N OptionGroup

OptionGroup 1 ─── N Option

Order 1 ─── N OrderItem

OrderItem 1 ─── N OrderItemOption

Order 1 ─── 1 Payment

Voucher 1 ─── N VoucherUsage

Customer 1 ─── N VoucherUsage

Order 1 ─── N Notification
```

---

## 19. Order Price Snapshot

Đây là nguyên tắc quan trọng.

Không được tính lại Order cũ bằng Product.price hiện tại.

Ví dụ:

```text
Product:
Cơm sườn = 35.000đ

OrderItem:
product_id = 1
product_name = "Cơm sườn"
unit_price = 35.000đ
quantity = 2
```

Sau đó Product đổi giá:

```text
Cơm sườn = 40.000đ
```

Order cũ vẫn:

```text
35.000 × 2 = 70.000đ
```

---

## 20. Address Snapshot

Order cũng phải lưu:

```text
delivery_address
delivery_latitude
delivery_longitude
```

Không chỉ lưu `address_id`.

Lý do:

Customer có thể sửa địa chỉ sau khi đặt Order.

Order cũ vẫn phải giữ đúng địa chỉ tại thời điểm đặt.

---

## 21. MVP không cần các bảng

Chưa cần:

```text
inventory
ingredients
recipes
suppliers
tables
kitchen_stations
drivers
delivery_tracking
loyalty_points
reviews
```

Có thể bổ sung sau.
