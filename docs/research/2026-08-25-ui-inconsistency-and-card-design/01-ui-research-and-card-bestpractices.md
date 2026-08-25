# Đánh giá & Nghiên cứu: UI Inconsistencies & UX/UI Best Practices cho F&B Việt Nam (Bếp Dì 6)

## 1. Đánh giá nguyên nhân gây ra hiện tượng không nhất quán giao diện (UI Inconsistencies) trong Frontend

Qua việc rà soát toàn diện mã nguồn frontend (`tokens.js`, `app.scss`, `tailwind.config.js`, các components như `ProductCard`, `CartItemCard`, `QuantityStepper`, `CategoryList`, `Header`, `Footer`, `HomePage`, `CheckoutPage`), chúng tôi phát hiện 5 nguyên nhân cốt lõi gây ra tình trạng giao diện lộn xộn, thiếu đồng nhất:

### 1.1. Xung đột giữa Design Tokens và Inline Tailwind Classes
- **Vấn đề**: Trong [tokens.js](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/tokens.js), hệ thống định nghĩa rất chi tiết các token như `fontSize.fs300`, `fontSize.fs400`, `colors.neutral500`, `colors.primary`. Tuy nhiên, trong code UI:
  - Một số file dùng token tự chế: `text-xxxxsmall`, `text-xxsmall`, `text-normal`, `text-xlarge`.
  - Một số file khác lại dùng Tailwind mặc định hoặc giá trị hardcoded (arbitrary values): `text-[13.5px]`, `text-[11.5px]`, `text-[14px]`, `text-xs`, `text-sm`, `text-[17px]`.
  - Giá trị màu sắc bị phân mảnh: vừa dùng semantic color token `text-primary`, vừa dùng `text-stone-600`, `text-neutral-500`, `text-black`, `text-[#1E293B]`, `text-orange600`, `bg-yellow100`.

### 1.2. Trọng số Font (Font Weight) và Phân cấp Thứ bậc (Hierarchy) bị đảo lộn
- Trong `ProductCard` ([product-card.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/product-card.tsx)):
  - Tên món: Dùng `font-normal text-[13.5px]` (quá mờ nhạt, không tạo được điểm neo thị giác).
  - Giá món: Dùng `font-normal text-[14px] text-black` (bằng kích thước và độ đậm với tên món, không phân biệt rõ ràng).
  - Số lượng trong nút tăng giảm: Lại dùng `font-extrabold text-[#1E293B] text-xs` (nổi bật và đậm hơn cả tên món và giá tiền).
- Trong `QuantityStepper` ([quantity-stepper.tsx](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/quantity-stepper.tsx)): Số hiển thị dùng `font-semibold text-normal text-stone-800` (xung đột style với counter riêng trong `ProductCard`).

### 1.3. Sự phân mảnh trong việc sử dụng Thành phần (Component Fragmentation)
- **Bộ nút tăng giảm số lượng**:
  - `CartItemCard` và `CheckoutPage` dùng component dùng chung `QuantityStepper` (viền mảnh / rounded).
  - `ProductCard` lại tự code riêng một cụm nút stepper với kích thước `w-7 h-7`, background `bg-primary/10`, icon SVG inline, dẫn đến sai lệch về kích thước nút, padding và cách người dùng cảm nhận tương tác.
- **Thanh cuộn Tabs / Category**:
  - `CategoryList` dùng style pill viền nhẹ (`border-primary bg-primary/15`).
  - `ProductFeatureList` lại dùng style khác (`bg-yellow100 text-orange600` vs `bg-neutral100`).

### 1.4. Xung đột Font chữ và Line-height
- Trong `app.scss` khai báo Google Font `Be Vietnam Pro` nhưng trong `*` selector lại đặt font-stack:
  ```css
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Roboto", "Segoe UI", "Be Vietnam Pro", sans-serif;
  ```
  -> Khiến cho trên iOS sẽ ưu tiên `SF Pro`, trên Android ưu tiên `Roboto`, còn `Be Vietnam Pro` chỉ chạy khi các font trước không có, làm giao diện tiếng Việt bị nhảy font và baseline lệch nhau giữa 2 hệ điều hành.
- Định nghĩa line-height trong `tokens.js` có `lh_full: "100%"` kết hợp với dấu tiếng Việt (như ể, ễ, ậ, ồ) dễ gây cắt ngọn chữ (clipping) hoặc dính chữ khi hiển thị nhiều dòng trên mobile.

### 1.5. Màu thương hiệu (Brand Palette) không đồng bộ
- Theme chính là Rustic Olive (`#4D7C0F`), tuy nhiên rải rác trong các component vẫn tồn tại màu cam/vàng của template cũ: `bg-yellow100`, `text-orange600`, `bg-amber-100/40`, `text-[#16a34a]` trong bottom navigation active.

---

## 2. Nghiên cứu Best Practices UX/UI cho Ẩm thực Việt Nam (F&B)

### 2.1. Chuẩn Typography cho Ứng dụng F&B Tiếng Việt trên Mobile (Zalo Mini App / Web)
Tiếng Việt có hệ thống nguyên âm có dấu thanh kép (ví dụ: `ẩ`, `ễ`, `ặ`, `ộ`). Nếu không căn chỉnh chuẩn sẽ rất dễ bị méo font, lỗi khoảng cách dòng hoặc mất dấu.

1. **Font Family**:
   - **Lựa chọn hàng đầu**: `Be Vietnam Pro` (thiết kế riêng tối ưu dấu tiếng Việt, nhịp chữ hiện đại, ấm cúng) hoặc font hệ thống đồng nhất `Inter` / `system-ui`.
   - **Quy tắc Font Stack**: Nếu muốn dùng `Be Vietnam Pro`, phải đặt lên đầu font-stack:
     `font-family: "Be Vietnam Pro", -apple-system, BlinkMacSystemFont, sans-serif;`
2. **Line-height (Chiều cao dòng)**:
   - Tuyệt đối không dùng `line-height: 1` hoặc `100%` cho tiếng Việt có dấu.
   - Tiêu đề / Tên món: Tối thiểu `leading-[1.25]` đến `leading-[1.35]` (125% - 135%).
   - Đoạn văn / Mô tả: Tối thiểu `leading-normal` hoặc `leading-relaxed` (`1.4` - `1.5`).
3. **Phân cấp Font Size & Font Weight chuẩn F&B Mobile**:
   | Thành phần UI | Font Size khuyến nghị | Font Weight | Line Height | Mục đích & Trải nghiệm thị giác |
   | :--- | :--- | :--- | :--- | :--- |
   | **Tên danh mục / Section Title** | `15px - 16px` | `700 (Bold)` | `22px` | Định hình cấu trúc menu khi lướt nhanh |
   | **Tên món ăn (Product Title)** | `14px - 15px` | `600 (SemiBold)` | `18px - 20px` | Rõ ràng, dễ đọc, kích thích vị giác |
   | **Mô tả món (Description/Topping)** | `11px - 12px` | `400 (Regular)` | `16px` | Màu phụ (Neutral 500), rút gọn 1 dòng |
   | **Giá bán chính (Price)** | `14px - 15px` | `700 (Bold)` | `18px` | Điểm nhấn quyết định mua, tương phản cao |
   | **Ký hiệu tiền tệ (đ / VND)** | `11px - 12px` | `500 (Medium)` | `14px` | Nhỏ hơn số giá để không làm loãng con số |
   | **Số lượng Stepper / Badge** | `12px - 13px` | `600 (SemiBold)` | `16px` | Rõ ràng, không quá lố so với tên món |

---

## 3. Các Sai Phạm Khi Thiết Kế Card Gọi Món & Phân Tích Lỗi Sai Hiện Có

### 3.1. Các Sai Phạm Phổ Biến Trong Thiết Kế Card F&B

| Sai phạm phổ biến | Tác động tiêu cực đến hành vi gọi món |
| :--- | :--- |
| **1. Tên món dùng font mỏng (Regular / Light)** | Khách hàng lướt menu nhanh không nhận diện được món ăn, tạo cảm giác thiếu chuyên nghiệp và khó đọc dưới ánh sáng ngoài trời. |
| **2. Giá tiền bị chìm hoặc ngang hàng với text phụ** | Khách hàng phải căng mắt tìm giá, làm chậm quyết định bấm "Thêm vào giỏ". |
| **3. Cụm nút Stepper lấn át nội dung món** | Nút `+ / -` hoặc số lượng quá to, màu sắc quá chói làm người dùng tập trung vào nút bấm thay vì hình ảnh hấp dẫn của món ăn. |
| **4. Thiếu Visual Feedback trạng thái món** | Món có tùy chọn bắt buộc (Size/Topping) nhưng lại hiển thị nút `+` nhanh khiến người dùng bấm vào bị bất ngờ khi nhảy popup/sheet mà không có gợi ý trước. |
| **5. Line-clamp cắt ngang chữ vô duyên** | Giới hạn 2 dòng nhưng không tính toán `min-height`, dẫn đến thẻ cao thẻ thấp lệch hàng (mất cân đối Grid). |
| **6. Khoảng cách chạm (Touch Target) dưới 44x44px** | Các nút bấm `+` / `-` nhỏ dưới 28px đặt quá sát nhau khiến người dùng Zalo trên điện thoại dễ bấm nhầm giữa tăng số lượng và mở chi tiết món. |

---

### 3.2. Chỉ Ra Các Lỗi Cụ Thể Hiện Có Trong Card Gọi Món Của Dự Án

Chi tiết các sai sót trực tiếp từ file [ProductCard](file:///home/ngoctin/Projects/bepdi6-zalo-miniapp/apps/frontend/src/components/common/product-card.tsx):

1. **Lỗi Typography ở Tên món (Line 119)**:
   ```tsx
   <div className="line-clamp-2 min-h-[36px] text-[13.5px] font-normal leading-snug text-black">
     {product.name}
   </div>
   ```
   - *Sai phạm*: Dùng `font-normal` (400) và cỡ chữ lẻ `text-[13.5px]`. 
   - *Khắc phục*: Cần nâng lên `font-semibold text-sm` (`14px` hoặc `15px`), màu `text-neutral-900` chuẩn mực.
2. **Lỗi Typography ở Giá tiền (Line 130-133)**:
   ```tsx
   <div className="text-[14px] font-normal text-black">
     {formatCurrency(product.price)}
     <span className="ml-0.5 text-xs text-neutral-500">đ</span>
   </div>
   ```
   - *Sai phạm*: Giá tiền dùng `font-normal` làm giá bị "chìm" hoàn toàn, không tạo được cảm giác tin cậy và kích thích chốt đơn.
   - *Khắc phục*: Phải dùng `font-bold text-sm text-neutral-900` hoặc `text-primary`.
3. **Lỗi Cụm Stepper làm mất cân bằng thị giác (Line 142-186)**:
   - *Sai phạm*: Nút tăng giảm kích thước `h-7 w-7` (28px), nhỏ hơn khuyến nghị Touch Target (tối thiểu 36-44px), viền và background màu xanh nhạt lấn át cả tên món. Số lượng đặt `font-extrabold text-[#1E293B]` dùng mã màu hex ngoài token.
   - *Khắc phục*: Tái cấu trúc theo `QuantityStepper` chuẩn, kích thước chạm thoải mái, căn chỉnh padding trực quan.
4. **Lỗi Tag trạng thái "TẠM HẾT" (Line 97-98)**:
   - *Sai phạm*: Tag nằm chính giữa ảnh với màu xám đen mờ làm giảm tính thẩm mỹ của ảnh món ăn.
   - *Khắc phục*: Đặt badge góc hoặc overlay mượt mà hơn với badge màu trung tính chuẩn hệ thống.
5. **Lỗi thiếu chỉ báo món có Topping/Tùy chọn**:
   - Hiện tại món có Topping bắt buộc và món đơn lẻ đều hiển thị nút `+` giống hệt nhau. Khi khách bấm `+`, một số món thì tự tăng số lượng, món có options lại bật Sheet lên làm trải nghiệm bị gián đoạn bất ngờ.

---

## 4. Bảng Đề Xuất Chuẩn Hóa Hệ Thống (Actionable Matrix)

| Hạng mục | Hiện trạng | Đề xuất chuẩn hóa |
| :--- | :--- | :--- |
| **Font Family** | Xung đột OS (`SF Pro` vs `Roboto`) | Đồng nhất `Be Vietnam Pro` cho toàn bộ ứng dụng ẩm thực Việt |
| **Font Size tokens** | Lộn xộn `fs000`, `xxxxsmall`, `[13.5px]` | Đồng bộ về thang chuẩn: `xs (12px)`, `sm (14px)`, `base (15px/16px)`, `lg (18px)` |
| **Font Weight** | Lạm dụng `font-normal` cho tiêu đề và giá | Header/Price: `font-bold (700)`; Title món: `font-semibold (600)`; Body: `font-normal (400)` |
| **Product Card** | Custom inline Stepper, giá mỏng, chữ 13.5px | Tên món `font-semibold text-sm`, Giá `font-bold text-sm`, nút thêm giỏ tối ưu touch target |
| **Color Tokens** | Pha trộn `#16a34a`, `orange600`, `#1E293B` | Gom về triệt để Semantic: `primary (#4D7C0F)`, `brandAccent (#D97706)`, `neutral900 (#0F172A)` |
