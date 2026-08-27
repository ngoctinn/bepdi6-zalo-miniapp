# Phase 2: Important Fixes (W1-W7)

**Plan:** [README.md](./README.md)
**Type:** sequential

## Progress

| Status  | Task                                                        |
| ------- | ----------------------------------------------------------- |
| ✅ DONE | 1. Migrate Footer sang ZaUI BottomNavigation (W1)           |
| ✅ DONE | 2. Giảm !important và chuẩn hóa CSS overrides (W2)         |
| ✅ DONE | 3. Chuẩn hóa border-radius theo ZDS tokens (W4)            |
| ✅ DONE | 4. Chuyển hardcoded strings sang copy constants (W6)        |
| ✅ DONE | 5. Sửa input type=tel + bỏ Unsplash fallback (W7, S6)      |

## Tasks

### 1. Migrate Footer sang ZaUI BottomNavigation (W1)

Thay thế custom bottom navigation bằng `<BottomNavigation>` của `zmp-ui` để tuân thủ nguyên tắc "sử dụng tối đa thành phần chuẩn ZaUI".

- Files:
  - `apps/frontend/src/components/layout/footer.tsx` — Rewrite hoàn toàn
  - `apps/frontend/src/css/app.scss` — Thêm override styles cho `<BottomNavigation>` nếu cần
- Changes:
  Rewrite `footer.tsx` sử dụng `<BottomNavigation>` từ `zmp-ui`:
  ```tsx
  import { BottomNavigation } from "zmp-ui";
  import { useLocation, useNavigate } from "react-router-dom";
  import { HomeIcon, CartNavIcon, OrderIcon } from "@/components/common/vectors";
  import { useCartStore } from "@/stores/cart.store";
  import { copy } from "@/constants/copy";

  export default function Footer() {
    const navigate = useNavigate();
    const location = useLocation();
    const { items } = useCartStore();
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

    const activeKey = /* tính toán activeKey dựa trên location.pathname */;

    return (
      <BottomNavigation
        activeKey={activeKey}
        onChange={(key) => navigate(key as string)}
      >
        <BottomNavigation.Item
          key="/"
          label={copy.nav.home || "Thực đơn"}
          icon={<HomeIcon active={false} />}
          activeIcon={<HomeIcon active={true} />}
        />
        <BottomNavigation.Item
          key="/checkout"
          label={copy.nav.cart || "Giỏ hàng"}
          icon={<CartNavIcon active={false} />}
          activeIcon={<CartNavIcon active={true} />}
        />
        <BottomNavigation.Item
          key="/order"
          label={copy.nav.order || "Đơn hàng"}
          icon={<OrderIcon active={false} />}
          activeIcon={<OrderIcon active={true} />}
        />
      </BottomNavigation>
    );
  }
  ```
  Badge (số lượng giỏ hàng) sẽ cần tích hợp — kiểm tra `<BottomNavigation.Item>` có hỗ trợ `badge` prop không. Nếu không, dùng CSS overlay.
- Verify: `npm run build` thành công. Bottom navigation render đúng trên app. Badge hiển thị khi có items trong giỏ.

---

### 2. Giảm !important và chuẩn hóa CSS overrides (W2)

Thay thế `!important` hardcoded colors bằng CSS variables. Ưu tiên: focus ring override (L44-52).

- Files:
  - `apps/frontend/src/css/app.scss` — Sửa focus ring (L44-52): dùng `var(--zaui-primary-color)` thay `#4d7c0f`
- Changes:
  ```diff
  # app.scss — Focus ring
  input:focus, textarea:focus, button:focus, select:focus {
    outline: none !important;
  -  border-color: #4d7c0f !important;
  -  box-shadow: 0 0 0 1px rgba(77, 124, 15, 0.25) !important;
  +  border-color: var(--zaui-primary-color, #4d7c0f) !important;
  +  box-shadow: 0 0 0 1px rgba(77, 124, 15, 0.25) !important;
  }
  ```
  ```diff
  # app.scss — Bottom nav active color (L106-108)
  .zaui-bottom-navigation-item-active .zaui-bottom-navigation-item-label {
  -  color: #4d7c0f;
  +  color: var(--zaui-primary-color, #4d7c0f);
  }
  ```
  **Scope giới hạn:** Không refactor toàn bộ 68 `!important` (sẽ mất nhiều thời gian và rủi ro break). Chỉ sửa hardcoded hex → CSS variable ở những nơi rõ ràng nhất. Phần snackbar/toast overrides giữ nguyên vì đã hoạt động ổn định.
- Verify: Grep `#4d7c0f` trong `app.scss` — chỉ còn xuất hiện ở `:root` CSS variables (dùng đúng). `npm run build` thành công.

---

### 3. Chuẩn hóa border-radius theo ZDS tokens (W4)

ZDS cho phép 5 mức bo góc: `4px (corner_04)`, `8px (corner_08)`, `12px (corner_12)`, `16px (corner_16)`, `9999px (corner_100)`. Sửa các giá trị `rounded-[20px]` thành `rounded-2xl` (16px).

- Files:
  - `apps/frontend/src/css/app.scss` (L311) — Modal content: `20px` → `16px`
  - `apps/frontend/src/components/common/confirm-modal.tsx` (L54) — `rounded-[20px]` → `rounded-2xl`
  - `apps/frontend/src/pages/select-location/index.tsx` (L205) — `rounded-[20px]` → `rounded-2xl`
- Changes:
  ```diff
  # app.scss
  .zaui-modal-content {
  -  border-radius: 20px !important;
  +  border-radius: 16px !important;
  }
  
  # confirm-modal.tsx
  -modalClassName="rounded-[20px] overflow-hidden p-0 max-w-[340px] shadow-2xl border-0"
  +modalClassName="rounded-2xl overflow-hidden p-0 max-w-[340px] shadow-2xl border-0"
  
  # select-location/index.tsx
  -modalClassName="rounded-[20px] overflow-hidden p-0 max-w-[340px] shadow-2xl border-0"
  +modalClassName="rounded-2xl overflow-hidden p-0 max-w-[340px] shadow-2xl border-0"
  ```
- Verify: Grep `rounded-\[20px\]` trả về 0 kết quả. Grep `border-radius: 20px` trả về 0 kết quả. `npm run build` thành công.

---

### 4. Chuyển hardcoded strings sang copy constants (W6)

Các chuỗi tiếng Việt hardcoded cần được chuyển vào hệ thống `copy` (qua `tokens.js` > `text`).

- Files:
  - `apps/frontend/src/tokens.js` — Thêm các key mới vào section `text`
  - `apps/frontend/src/pages/order-detail/index.tsx` — Thay hardcoded strings
  - `apps/frontend/src/pages/checkout/index.tsx` — Thay hardcoded strings
  - `apps/frontend/src/pages/order-success/index.tsx` — Thay hardcoded strings
- Changes:
  Thêm vào `tokens.js > text`:
  ```js
  order: {
    ...existing,
    status: {
      ...existing,
      delivering: "Đang giao",
      readyForPickup: "Mời đến lấy",
      pickedUp: "Đã nhận món",
    },
    orderCodePrefix: "Đơn hàng #",
  },
  checkout: {
    ...existing,
    recommended: "Khuyên dùng",
    deliveryMethod: "Hình thức",
    selfPickupFree: "Tự đến lấy (0đ)",
  },
  orderSuccess: {
    ...existing,
    backToHome: "Về trang chủ",
    viewOrders: "Xem đơn hàng",
  },
  ```
  Sau đó thay thế hardcoded strings trong các page bằng `copy.order.status.delivering`, `copy.checkout.recommended`, v.v.
- Verify: Grep cho từng chuỗi hardcoded (`"Đang giao"`, `"Khuyên dùng"`, `"Về trang chủ"`, v.v.) trong `src/pages/` trả về 0 kết quả (chỉ còn trong `tokens.js`). `npm run lint` pass.

---

### 5. Sửa input type=tel + bỏ Unsplash fallback (W7, S6)

- Files:
  - `apps/frontend/src/pages/checkout/index.tsx` (L430-431) — `type="text"` → `type="tel"` cho phone
  - `apps/frontend/src/pages/select-location/index.tsx` (L243-244) — `type="text"` → `type="tel"` cho phone
  - `apps/frontend/src/components/common/product-card.tsx` (L33) — Thay Unsplash URL bằng placeholder nội bộ hoặc empty string
- Changes:
  ```diff
  # checkout/index.tsx (phone field)
  -<input type="text" value={pickupPhone} ...
  +<input type="tel" value={pickupPhone} ...
  
  # select-location/index.tsx (phone field)  
  -<input type="text" value={formData.phone} ...
  +<input type="tel" value={formData.phone} ...
  
  # product-card.tsx
  -"https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=60"
  +"/placeholder-food.svg"
  ```
  **Lưu ý placeholder-food.svg:** Cần tạo file SVG placeholder đơn giản trong `apps/frontend/public/` hoặc `apps/frontend/src/static/` — một hình tròn xám với icon ảnh, đủ để không bị blank nhưng rõ ràng là placeholder.
- Verify: `npm run build` thành công. Grep `type="text"` trong các phone input fields trả về 0 kết quả. Grep `unsplash.com` trả về 0 kết quả.
