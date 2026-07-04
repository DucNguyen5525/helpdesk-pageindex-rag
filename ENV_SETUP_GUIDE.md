# Hướng Dẫn Chi Tiết Lấy API Keys Cho File `.env`

Tài liệu này hướng dẫn từng bước cách đăng ký, tạo và lấy tất cả các API Key / thông số cấu hình cần thiết cho dự án **Helpdesk PageIndex RAG**.

---

## 📋 Danh sách các biến môi trường trong `.env`

| Biến Môi Trường | Loại | Bắt buộc? | Mô tả |
| --- | --- | --- | --- |
| `MONGODB_URI` | Database | **Bắt buộc** | Chuỗi kết nối MongoDB Atlas |
| `MONGODB_DB` | Database | Mặc định: `helpdesk_rag` | Tên Database lưu trữ tài liệu và tin nhắn |
| `GCLI_BASE_URL` | LLM Proxy | Mặc định: `https://gcli.ggchan.dev/v1` | URL Endpoint của GCLI Proxy |
| `GCLI_API_KEYS` | LLM Proxy | **Bắt buộc** | Danh sách GCLI / Gemini API keys xoay vòng theo trọng số |
| `GCLI_MODEL` | LLM Model | Mặc định: `gemini-3.5-flash` | Tên model AI xử lý trả lời câu hỏi |
| `GCLI_ROTATION_STRATEGY` | LLM Proxy | Mặc định: `swrr` | Thuật toán xoay vòng (`swrr` hoặc `random`) |
| `R2_ACCOUNT_ID` | Cloud Storage | Tùy chọn | Cloudflare Account ID |
| `R2_ACCESS_KEY_ID` | Cloud Storage | Tùy chọn | Cloudflare R2 Access Key ID |
| `R2_SECRET_ACCESS_KEY` | Cloud Storage | Tùy chọn | Cloudflare R2 Secret Access Key |
| `R2_BUCKET_NAME` | Cloud Storage | Tùy chọn | Tên Bucket lưu trữ backup PageIndex JSON |
| `R2_PUBLIC_BASE_URL` | Cloud Storage | Tùy chọn | URL Public/Custom Domain của R2 Bucket |
| `PAGEINDEX_MODEL_API_KEY` | PageIndex Ingest | Tùy chọn | Gemini API Key dùng riêng cho Python Worker |
| `RAILWAY_WORKER_URL` | Worker Service | Tùy chọn | URL service worker trên Railway (nếu có) |

---

## 1. 🍃 MongoDB Atlas (`MONGODB_URI`, `MONGODB_DB`)

MongoDB Atlas được sử dụng làm cơ sở dữ liệu chính để lưu trữ danh sách tài liệu, các nodes PageIndex đã flatten, lịch sử trò chuyện (conversations & messages).

### Các bước lấy `MONGODB_URI`:
1. Truy cập [MongoDB Atlas Console](https://www.mongodb.com/cloud/atlas) và đăng nhập/tạo tài khoản miễn phí.
2. Tạo một **Cluster** mới (chọn gói M0 Free nếu dùng thử).
3. Vẫn tại console, vào mục **Database Access** -> bấm **Add New Database User**:
   - Nhập Username và Password (nhớ lưu lại mật khẩu này).
   - Chọn quyền `Read and write to any database`.
4. Vào mục **Network Access** -> bấm **Add IP Address**:
   - Chọn `Allow Access from Anywhere` (`0.0.0.0/0`) để Vercel và máy local của bạn có thể truy cập được.
5. Quay lại tab **Database / Clusters** -> Bấm nút **Connect**:
   - Chọn **Drivers** (Node.js).
   - Coppy chuỗi Connection String dạng:
     `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority`
6. Thay `<username>` và `<password>` bằng thông tin user bạn vừa tạo ở Bước 3.
7. Điền vào file `.env`:
   ```env
   MONGODB_URI=mongodb+srv://admin_user:MySecurePassword123@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
   MONGODB_DB=helpdesk_rag
   ```

---

## 2. 🔑 GCLI Proxy & API Keys (`GCLI_API_KEYS`, `GCLI_BASE_URL`, `GCLI_MODEL`)

Dự án sử dụng cơ chế **Key Rotation** qua GCLI Proxy để phân bổ lưu lượng gọi Gemini AI, giúp tránh chạm rate limit và tự động retry khi có key lỗi.

### Hướng dẫn cấu hình:

#### **Cách 1: Lấy API Key từ Google AI Studio (Cơ bản)**
1. Truy cập [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Đăng nhập tài khoản Google và bấm nút **Create API Key**.
3. Copy mã API Key tạo ra (có dạng `AIzaSy...`).
4. Bạn có thể tạo nhiều API Key từ các tài khoản Google khác nhau để xoay vòng.

#### **Cấu hình chuỗi `GCLI_API_KEYS` trong `.env`**:
- **Cú pháp chuẩn (Có trọng số - Weight)**: `key1:weight1,key2:weight2,...`
  ```env
  GCLI_BASE_URL=https://gcli.ggchan.dev/v1
  GCLI_API_KEYS=AIzaSyKeyThuNhat:10,AIzaSyKeyThuHai:20,AIzaSyKeyThuBa:10
  GCLI_MODEL=gemini-3.5-flash
  GCLI_ROTATION_STRATEGY=swrr
  ```
- **Cú pháp đơn giản (Cùng trọng số 1)**:
  ```env
  GCLI_API_KEYS=AIzaSyKeyThuNhat,AIzaSyKeyThuHai
  ```
- **Nếu chỉ dùng 1 Key duy nhất**:
  ```env
  GCLI_API_KEYS=AIzaSyKeyDuyNhat:1
  ```

---

## 3. ☁️ Cloudflare R2 Storage (Tùy chọn - Cloud Backup)

Cloudflare R2 dùng để lưu bản sao lưu (backup) các file gốc và file PageIndex JSON cấu trúc cây. Bạn có thể bỏ qua nếu chỉ chạy ứng dụng cơ bản.

### Các bước lấy API Keys của Cloudflare R2:
1. Truy cập [Cloudflare Dashboard](https://dash.cloudflare.com/) và đăng nhập.
2. Chọn mục **R2 Object Storage** ở menu bên trái.
3. Bấm **Create Bucket** -> Nhập tên bucket (ví dụ: `helpdesk-pageindex-backup`) -> Bấm **Create Bucket**.
4. Quay lại trang quản lý R2 -> Ở cột bên phải bấm **Manage R2 API Tokens**.
5. Bấm **Create API Token**:
   - Permissions: Chọn `Admin Read & Write`.
   - Bấm **Create API Token**.
6. Lưu lại 3 thông tin quan trọng được hiển thị:
   - **Account ID** (Hiển thị ở trang quản lý R2 hoặc URL trang dash).
   - **Access Key ID**
   - **Secret Access Key**
7. (Tùy chọn) Nếu muốn mở public link cho file: Vào cài đặt Bucket -> mục **Custom Domains** hoặc **R2.dev subdomain** -> Bấm **Allow Access** để lấy `R2_PUBLIC_BASE_URL`.

Điền vào file `.env`:
```env
R2_ACCOUNT_ID=a1b2c3d4e5f678901234567890abcdef
R2_ACCESS_KEY_ID=1234567890abcdef1234567890abcdef
R2_SECRET_ACCESS_KEY=fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321
R2_BUCKET_NAME=helpdesk-pageindex-backup
R2_PUBLIC_BASE_URL=https://pub-xxxxxx.r2.dev
```

---

## 4. 🐍 Python Worker Ingest (Tùy chọn)

Nếu bạn chạy công cụ Python xử lý file PDF/Markdown thành PageIndex JSON (`workers/pageindex-ingest/`):

- `PAGEINDEX_MODEL_API_KEY`: Điền Gemini API Key dùng riêng cho script Python xử lý PDF.
- `RAILWAY_WORKER_URL`: Nhập URL service worker nếu bạn deploy worker này lên Railway.

---

## 📝 Mẫu File `.env` Hoàn Chỉnh (Template)

Bạn có thể copy nội dung dưới đây dán vào file `.env` ở thư mục gốc của dự án:

```env
# ----------------------------------------------------------------------
# DATABASE CONFIGURATION (MongoDB Atlas)
# ----------------------------------------------------------------------
MONGODB_URI=mongodb+srv://your_user:your_password@cluster0.xxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=helpdesk_rag

# ----------------------------------------------------------------------
# GCLI PROXY & LLM KEY ROTATION
# ----------------------------------------------------------------------
GCLI_BASE_URL=https://gcli.ggchan.dev/v1
GCLI_API_KEYS=AIzaSyKeyThuNhat:10,AIzaSyKeyThuHai:20
GCLI_MODEL=gemini-3.5-flash
GCLI_ROTATION_STRATEGY=swrr

# ----------------------------------------------------------------------
# CLOUDFLARE R2 BUCKET (OPTIONAL)
# ----------------------------------------------------------------------
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_NAME=helpdesk-pageindex-backup
R2_PUBLIC_BASE_URL=

# ----------------------------------------------------------------------
# PAGEINDEX PYTHON WORKER (OPTIONAL)
# ----------------------------------------------------------------------
PAGEINDEX_MODEL_API_KEY=
RAILWAY_WORKER_URL=
```
