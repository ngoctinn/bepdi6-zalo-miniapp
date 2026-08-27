# Research: Zalo Mini App Authentication & Token Handling Best Practices

**Research ID:** 2026-08-27-zalo-miniapp-auth-best-practices  
**Date:** 2026-08-27  

---

## 1. Zalo Mini App Official Auth Architecture

Theo tài liệu chính thức từ Zalo Mini App Platform (ZMP SDK & Social API):

```
+------------------+         +-------------------------+         +----------------------+
|  Zalo Mini App   |         |    Your Backend API     |         |  Zalo OpenAPI Graph  |
|   (Client/React) |         |     (Django / REST)     |         |  (graph.zalo.me)     |
+------------------+         +-------------------------+         +----------------------+
         |                                |                                 |
         | 1. getAccessToken({})          |                                 |
         |------------------------------->|                                 |
         | (ZMP SDK caches internally)    |                                 |
         |                                |                                 |
         | 2. POST /api/v1/auth/zalo      |                                 |
         |    { access_token: "..." }     |                                 |
         |------------------------------->|                                 |
         |                                | 3. Verify & Fetch Profile       |
         |                                |    GET /v2.0/me                 |
         |                                |    (with appsecret_proof)       |
         |                                |-------------------------------->|
         |                                |<--------------------------------|
         |                                |                                 |
         |                                | 4. Issue App JWT                |
         |                                |    { access_token, refresh_...} |
         | 5. Store App JWT & User State  |<--------------------------------|
         |<-------------------------------|
         |                                |
```

---

## 2. Các điểm cốt lõi (Best Practices)

### 2.1. Client-Side (ZMP SDK & React)
1. **Không can thiệp cache Zalo token**: `getAccessToken()` từ ZMP SDK tự động quản lý lifecycle và cache phiên đăng nhập của người dùng Zalo.
2. **Quản lý App JWT riêng biệt**: Sau khi exchange lấy App JWT của hệ thống (`access_token`, `refresh_token`), lưu trữ tại `localStorage` với key nhất quán.
3. **Tránh Hook Re-trigger & Infinite Loop**:
   - Tách rời execution trigger khỏi dependency thay đổi liên tục của `useMutation`.
   - Sử dụng In-Flight Guard (`isLoggingIn` ref hoặc abort controller) để đảm bảo không bắn song song nhiều request auth trong cùng 1 thời điểm.
   - Chỉ trigger auto-login **1 lần** khi app khởi chạy và `!isAuthenticated()`.
4. **Chuẩn hóa API Contract**: Field name trả về giữa Backend (`access_token`, `refresh_token`) và Frontend Type interface (`access_token`, `refresh_token`) phải đồng nhất 100%.

### 2.2. Server-Side (Backend Django)
1. **App Secret Proof**: Bắt buộc tạo HMAC-SHA256(`zalo_token`, `app_secret`) gửi kèm header/param khi gọi Zalo Graph API `https://graph.zalo.me/v2.0/me`.
2. **Response Envelope**: Luôn wrap response theo chuẩn `{ success: true, data: { access_token, refresh_token, customer } }`.
3. **Idempotent User Linking**: `get_or_create` theo `zalo_user_id` và cập nhật thông tin mới nhất.
