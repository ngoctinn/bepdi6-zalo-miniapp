---
title: "Hành Trình Tối Ưu Menu Module: Database Indexes, N+1 Queries và Caching"
category: "debugging"
tags: [CF Teach, django, performance, database-indexes, n-plus-one]
created: 2026-08-27
updated: 2026-08-27
---

# Hành Trình Tối Ưu Menu Module: Database Indexes, N+1 Queries và Caching

Ngồi xuống làm một ly cà phê nhé ☕. Hãy cùng nhau nhìn lại bức tranh toàn cảnh về cách chúng ta đã "mổ xẻ" và tối ưu module Menu (`apps/backend/apps/menu`) từ đầu đến cuối — không chỉ là kết quả, mà là **tại sao**, **như thế nào** và **bài học rút ra** là gì.

---

### 1. Cách tiếp cận & Tư duy đằng sau giải pháp
Khi bạn yêu cầu kiểm tra hiệu năng, thay vì nhảy vào đoán mò hay refactor bừa bãi, chúng ta đã đi theo một quy trình chẩn đoán 3 tầng:
1. **Tầng Lưu Trữ (Database Indexing)**: Xem schema đã có chỉ mục hỗ trợ các câu lệnh `filter()` và `order_by()` phổ biến chưa?
2. **Tầng Truy Vấn (ORM Query Optimization & N+1)**: Django ORM có bị bệnh "lười" (lazy loading) sinh ra hàng chục query lặp lại không?
3. **Tầng Cache & Application**: Cơ chế vô hiệu hóa cache (cache invalidation) có chuẩn và an toàn không?

Bằng việc rà soát từng tệp (`models.py`, `admin.py`, `views.py`, `serializers.py`), chúng ta nhanh chóng phát hiện 2 điểm nghẽn lớn nhất: thiếu chỉ mục kép (composite indexes) cho các bảng có trạng thái (`status` + `sort_order`, `status` + `category`) và lỗi N+1 kinh điển trong Admin khi render các quan hệ Foreign Key.

---

### 2. Các hướng đi đã cân nhắc và loại bỏ (The Roads Not Taken)
- **Đưa việc nén ảnh WebP sang Celery Async**: Trong `serializers.py`, thao tác `optimize_image_to_webp()` dùng Pillow nén ảnh WebP chạy đồng bộ. Chúng ta đã cân nhắc đẩy sang Celery task. Tuy nhiên, chúng ta **loại bỏ** vì phạm vi hiện tại là Admin upload món ăn (tần suất thấp, vài món/ngày), thêm Celery task ở đây sẽ làm phức tạp luồng lưu form (phải xử lý trạng thái ảnh đang xử lý/draft). Nguyên tắc YAGNI (You Aren't Gonna Need It) được áp dụng.
- **Sử dụng Cache Tagging / Redis Key Versioning phức tạp**: Thay vì xây dựng hẳn hệ thống cache tagging phân tán, chúng ta chỉ cần chuẩn hóa các key tĩnh `all:available`, `all:OUT_OF_STOCK`, `all:INACTIVE` và gọi `delete_many()` kết hợp `delete_pattern()` an toàn. Điều này giữ cho codebase gọn gàng mà không phụ thuộc vào thư viện bên thứ 3.

---

### 3. Các mắt xích kết nối với nhau như thế nào?
Hãy hình dung luồng dữ liệu của một món ăn:
```
[Database: PostgreSQL]
   │ (Index Scan: idx_cat_status_sort, idx_prod_status_cat)
   ▼
[Django ORM] ── Prefetch (Product -> OptionGroup -> Option) + select_related(Category)
   │
   ▼
[Serializers] ──> Chuyển đổi dữ liệu và gắn effective_image_url
   │
   ▼
[Redis Cache] ──> Lưu trữ cache 10 phút (menu:products:list, menu:product:detail:id)
   │
   ▼
[API Response] ──> Phản hồi tức thì cho Zalo Mini App / Admin Dashboard
```
- Khi Admin chỉnh sửa món hoặc đổi trạng thái `toggle-status`, `invalidate_menu_cache()` sẽ kích hoạt để dọn sạch các cache keys liên quan, đảm bảo Mini App của khách hàng nhận ngay dữ liệu mới nhất mà không phải đợi timeout 10 phút.

---

### 4. Công cụ, Kỹ thuật và Mẫu thiết kế đã sử dụng
- **`django.db.models.Index` (Composite Indexing)**: Tạo chỉ mục đa cột (`status`, `sort_order`) và (`category`, `status`). Khi lọc danh mục đang hoạt động và sắp xếp theo thứ tự, PostgreSQL chỉ cần quét trên index B-Tree (Index Scan/Index Only Scan) mà không cần quét toàn bộ bảng (Seq Scan).
- **`select_related` vs `prefetch_related` + `Prefetch` object**:
  - `select_related`: Dùng cho quan hệ 1-1 hoặc N-1 (`Product -> Category`, `OptionGroup -> Product`) — tạo câu lệnh `INNER/LEFT JOIN` trong 1 query duy nhất.
  - `prefetch_related` kèm `Prefetch`: Dùng cho quan hệ 1-N hoặc N-N (`Product -> OptionGroup -> Option`) — Django chạy 3 câu queries riêng biệt nhưng gom dữ liệu theo `id` trong bộ nhớ Python, thay vì chạy 1 + N + N*M queries.
- **`django_assert_num_queries` trong Pytest**: Đây là công cụ "chốt chặn" tốt nhất để kiểm tra hiệu năng. Chúng ta viết test chặn cứng `with django_assert_num_queries(3):` — nếu trong tương lai có dev nào vô tình thêm một field truy cập database gây N+1, test suite sẽ gãy ngay lập tức!

---

### 5. Sự đánh đổi (Trade-offs)
- **Tốc độ đọc (Read) vs Tốc độ ghi (Write/Storage)**: Thêm 4 indexes giúp câu lệnh `SELECT` nhanh gấp nhiều lần, nhưng mỗi lần `INSERT/UPDATE` sẽ tốn thêm vài micro-giây để cập nhật cây B-Tree của index trên đĩa. Với module Menu có tỷ lệ Đọc/Ghi là ~99/1 (khách xem menu liên tục, admin hiếm khi đổi món), đây là sự đánh đổi hoàn toàn tối ưu và chuẩn xác.
- **Prefetch dữ liệu trong Admin**: AdminProductDetailView giờ load toàn bộ options trong 3 queries. Nếu một món có hàng trăm option, RAM của server sẽ gánh một lượng nhỏ dữ liệu, nhưng đổi lại database không bị "dội bom" queries liên tục.

---

### 6. Những góc khuất, sự cố & cách khắc phục trong quá trình làm
- **Format linter (Ruff)**: Khi tạo file migration tự động từ Django `makemigrations`, Django sinh mã theo chuẩn PEP8 mặc định của nó (dùng dấu nháy đơn `'`). Khi chạy `ruff format --check .`, công cụ báo lỗi do dự án quy định dấu nháy kép `"` và line length 88. Chúng ta đã chạy `uv run ruff format .` để tự động chuẩn hóa toàn bộ file migration và test mới.
- **Cache Invalidation Key Format**: Ban đầu `invalidate_menu_cache()` xóa key `menu:products:list:all`, trong khi view thực tế lại lưu key là `menu:products:list:all:available`. Việc rà soát đã giúp sửa lại đúng định dạng key thực tế.

---

### 7. Những cạm bẫy cần lưu ý cho tương lai (Pitfalls)
1. **Quên `list_select_related` trong Django Admin**: Rất nhiều người nghĩ Django Admin chỉ để quản trị nội bộ nên bỏ qua hiệu năng. Nhưng khi bảng có hàng ngàn bản ghi, một trang Admin load 100 items không có `list_select_related` sẽ bắn 101 câu query vào DB làm treo database.
2. **`prefetch_related` không lọc điều kiện**: Nếu bạn gọi `product.option_groups.prefetch_related('options')` nhưng trong serializer lại gọi `instance.options.filter(status='AVAILABLE')`, Django sẽ bỏ qua kết quả đã prefetch và bắn query mới vào DB! Để prefetch có điều kiện, **bắt buộc** phải dùng `Prefetch('options', queryset=Option.objects.filter(...))` như chúng ta đã làm.

---

### 8. Điều mà một Kỹ sư Cấp cao (Senior) sẽ nhìn thấy
- **Kiến trúc bảo vệ truy vấn bằng Test**: Senior dev không chỉ quan tâm code chạy được, mà quan tâm code **không bị thoái lui (regression)** sau 6 tháng nữa. Việc bổ sung `test_admin_product_detail_prefetch_and_queries` với `django_assert_num_queries` chính là chữ ký chất lượng của một giải pháp bền vững.
- **Đặt tên Index rõ ràng (`idx_...`)**: Thay vì để Django tự sinh tên index ngẫu nhiên khó tra cứu trong pgAdmin/DBeaver, chúng ta đã chủ động đặt tên định danh rõ nghĩa: `idx_cat_status_sort`, `idx_prod_status_cat`, `idx_opt_group_status`.

---

### 9. Bài học chuyển giao (Transferable Lessons)
> **"Đo lường trước, đánh chỉ mục đúng chỗ, gom nhóm truy vấn (Batch/Prefetch), và khoá chặt bằng Test."**

Bất kỳ dự án backend nào (dù là Django, NestJS, FastAPI hay Spring Boot) khi gặp bài toán đọc danh mục/sản phẩm dạng cây lồng nhau (hierarchical data), công thức 4 bước này đều áp dụng hoàn hảo:
1. Xác định các trường hay dùng trong mệnh đề `WHERE` và `ORDER BY` -> Đánh composite index.
2. Tránh N+1 bằng `JOIN` (1-1, N-1) hoặc Data Loader / Prefetch (1-N).
3. Thêm caching tầng ứng dụng (In-memory/Redis).
4. Viết test assert số lượng query để bảo vệ thành quả.
