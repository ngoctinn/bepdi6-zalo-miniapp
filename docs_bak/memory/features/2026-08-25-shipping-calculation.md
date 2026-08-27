---
title: "Shipping Calculation & Distance Haversine"
description: "Ước tính khoảng cách thực tế bằng công thức Haversine với hệ số đường vòng và biểu phí lũy tiến"
tags: [features, shipping, haversine, distance, freeship]
created: 2026-08-25
updated: 2026-08-25
type: "fact"
importance: 3
source: scan
---

# Shipping Calculation & Distance Haversine

## Overview
Module Shipping tính toán khoảng cách đường bộ ước lượng giữa quán và vị trí khách hàng dựa trên tọa độ GPS (kinh độ, vĩ độ) bằng công thức Haversine nhân với hệ số đường vòng (circuity multiplier), sau đó áp dụng bảng biểu phí bậc thang.

## Key Points
- **Distance Formula**: `Estimated Distance = Haversine(Shop_Coords, Cust_Coords) * Multiplier` (mặc định multiplier ~1.25).
- **Delivery Radius Validation**: Kiểm tra bán kính giao hàng tối đa `max_delivery_radius_km` từ singleton `ShopConfig`. Nếu vượt quá sẽ báo lỗi `OutOfDeliveryRadiusError`.
- **Freeship Rule**: Miễn phí ship nếu giá trị tạm tính của đơn hàng (`subtotal`) đạt ngưỡng tối thiểu `min_order_for_freeship`.
- **Progressive Tiers**: Cấu hình các mốc km trong `ShopConfig.shipping_tiers` (ví dụ 0-2km: 10k, 2-5km: 15k, 5-7km: 20k).

## Related
- `apps/backend/apps/shipping/models.py`
- `apps/backend/apps/shipping/services.py`
- `apps/backend/apps/shipping/views.py`
