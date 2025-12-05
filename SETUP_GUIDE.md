# 📖 Hướng Dẫn Setup Dự Án EPT

Dự án này gồm **Backend (Node.js + Express + MySQL)** và **Frontend (React + Vite)**.

---

## 🎯 PHƯƠNG ÁN 1: Chạy Local trên Máy (Khuyến nghị cho test nhanh)

### Yêu cầu:
- Node.js (v18 trở lên)
- MySQL (hoặc MySQL Workbench)
- Git

---

### Bước 1: Clone dự án từ GitHub

```bash
git clone https://github.com/vanquy-cmd/ept.git
cd ept
```

---

### Bước 2: Setup Backend

#### 2.1. Cài đặt dependencies

```bash
cd backend
npm install
```

#### 2.2. Tạo file `.env` từ `.env.example`

```bash
# Copy file mẫu
copy .env.example .env  # Windows
# hoặc
cp .env.example .env    # Mac/Linux
```

#### 2.3. Sửa file `backend/.env` với thông tin thật của bạn:

```bash
# Database
DATABASE_URL=mysql://root:password@localhost:3306/ept_db

# Server
PORT=4000

# Admin mặc định (ĐỔI MẬT KHẨU TRƯỚC KHI DÙNG THẬT!)
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=ChangeMe123!
DEFAULT_ADMIN_NAME=Admin

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here
AI_EVAL_MOCK=false
GEMINI_EVAL_MODEL=gemini-2.0-flash-exp
GEMINI_TRANSCRIBE_MODEL=gemini-2.0-flash-exp

# AWS S3 (nếu có)
S3_BUCKET=your_s3_bucket_name
S3_REGION=ap-southeast-1
S3_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
```

#### 2.4. Tạo database MySQL

Mở MySQL Workbench hoặc MySQL CLI, chạy:

```sql
CREATE DATABASE ept_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 2.5. Chạy migrations (nếu có)

Chạy các file SQL trong thư mục `backend/migrations/` theo thứ tự:
- `create_vocabulary_translation_history.sql`
- `add_example_sentence_column.sql`
- `add_asset_url_to_quizzes.sql`

#### 2.6. Khởi động backend

```bash
npm run dev
# hoặc
npm start
```

Backend sẽ chạy tại: `http://localhost:4000`

---

### Bước 3: Setup Frontend

#### 3.1. Cài đặt dependencies

Mở terminal mới:

```bash
cd frontend
npm install
```

#### 3.2. Tạo file `.env` từ `.env.example`

```bash
copy .env.example .env  # Windows
# hoặc
cp .env.example .env    # Mac/Linux
```

#### 3.3. Sửa file `frontend/.env`:

```bash
VITE_API_BASE_URL=http://localhost:4000
```

#### 3.4. Khởi động frontend

```bash
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:5173` (hoặc port khác nếu 5173 bận)

---

### Bước 4: Truy cập ứng dụng

Mở trình duyệt và vào: `http://localhost:5173`

**Tài khoản Admin mặc định** (sau khi backend chạy lần đầu):
- Email: Giá trị của `DEFAULT_ADMIN_EMAIL` trong `.env`
- Password: Giá trị của `DEFAULT_ADMIN_PASSWORD` trong `.env`

---

## 🌐 PHƯƠNG ÁN 2: Deploy lên Hosting Miễn Phí (Để bạn test từ xa)

### Frontend → Vercel (Miễn phí, dễ nhất)

1. **Đăng ký Vercel**: https://vercel.com
2. **Kết nối GitHub repo**: Import project `ept` từ GitHub
3. **Cấu hình Build**:
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Thêm Environment Variable**:
   - `VITE_API_BASE_URL` = URL backend của bạn (sẽ có sau khi deploy backend)
5. **Deploy**: Vercel tự động deploy, bạn sẽ có URL kiểu `https://ept.vercel.app`

---

### Backend → Railway hoặc Render (Miễn phí)

#### Option A: Railway (Khuyến nghị)

1. **Đăng ký Railway**: https://railway.app
2. **Tạo project mới** → Deploy từ GitHub repo
3. **Chọn thư mục**: `backend`
4. **Thêm Environment Variables** (từ file `.env` của bạn):
   - `DATABASE_URL` (Railway có thể tự tạo MySQL cho bạn)
   - `PORT` (Railway tự set, không cần)
   - `GEMINI_API_KEY`
   - `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`
   - `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_NAME`
5. **Deploy**: Railway tự động deploy, bạn sẽ có URL kiểu `https://ept-backend.railway.app`

#### Option B: Render

1. **Đăng ký Render**: https://render.com
2. **Tạo Web Service** → Connect GitHub repo
3. **Cấu hình**:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. **Thêm Environment Variables** (giống Railway)
5. **Deploy**: Render tự động deploy

---

### Sau khi deploy xong:

1. **Cập nhật `VITE_API_BASE_URL` trong Vercel** = URL backend vừa deploy
2. **Redeploy frontend** để frontend trỏ đúng backend
3. **Chia sẻ URL frontend** cho bạn test: `https://ept.vercel.app`

---

## ⚠️ Lưu ý quan trọng:

1. **Database**: Nếu deploy backend lên hosting, bạn cần:
   - Tạo MySQL database trên hosting đó (Railway/Render có sẵn)
   - Hoặc dùng MySQL cloud miễn phí như [PlanetScale](https://planetscale.com) hoặc [Aiven](https://aiven.io)

2. **AWS S3**: Nếu không có S3, bạn có thể:
   - Tạm thời bỏ qua tính năng upload audio/file
   - Hoặc dùng [Cloudinary](https://cloudinary.com) (miễn phí) thay thế

3. **Gemini API**: Cần có API key từ Google AI Studio

---

## 🆘 Gặp lỗi?

- **Backend không kết nối được MySQL**: Kiểm tra `DATABASE_URL` trong `.env`
- **Frontend không gọi được API**: Kiểm tra `VITE_API_BASE_URL` trong `.env` frontend
- **Lỗi CORS**: Đảm bảo backend đã cài `cors` và cho phép origin của frontend

---

## 📞 Liên hệ

Nếu cần hỗ trợ, liên hệ người phát triển dự án.

