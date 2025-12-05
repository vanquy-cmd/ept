# 🚀 Hướng Dẫn Deploy Dự Án EPT Lên Hosting Miễn Phí

Hướng dẫn chi tiết từng bước để deploy **Backend** và **Frontend** lên hosting miễn phí, giúp bạn của bạn có thể test từ xa qua Internet.

---

## 📋 Tổng Quan

- **Frontend**: Deploy lên **Vercel** (miễn phí, tự động deploy từ GitHub)
- **Backend**: Deploy lên **Railway** hoặc **Render** (miễn phí, hỗ trợ Node.js + MySQL)
- **Database**: Dùng MySQL miễn phí từ Railway/Render hoặc PlanetScale

---

## 🎯 BƯỚC 1: Chuẩn Bị Code Trên GitHub

### 1.1. Đảm bảo code đã được push lên GitHub

```powershell
cd "C:\-WorkDesk-\(2025-2026-nam5) HK1\BaoCaoTotNghiep\ept"

# Kiểm tra status
git status

# Nếu có file mới, commit và push
git add .
git commit -m "Add deployment guides"
git push origin main
```

### 1.2. Kiểm tra repo trên GitHub

Truy cập: `https://github.com/vanquy-cmd/ept`  
Đảm bảo bạn thấy đầy đủ các file: `backend/`, `frontend/`, `README.md`, `SETUP_GUIDE.md`

---

## 🗄️ BƯỚC 2: Setup Database (MySQL)

Bạn có 2 lựa chọn:

### Option A: Dùng MySQL từ Railway (Khuyến nghị - Dễ nhất)

Railway tự động tạo MySQL cho bạn khi deploy backend. Bạn không cần làm gì thêm ở bước này, sẽ làm ở Bước 3.

### Option B: Dùng PlanetScale (MySQL miễn phí, riêng biệt)

1. **Đăng ký PlanetScale**: https://planetscale.com
2. **Tạo database mới**:
   - Vào Dashboard → "Create database"
   - Tên database: `ept_db`
   - Region: Chọn gần nhất (ví dụ: `ap-southeast-1`)
   - Plan: Free
3. **Lấy connection string**:
   - Vào database vừa tạo → "Connect" → "Connect with"
   - Chọn "Prisma" hoặc "General"
   - Copy connection string, format: `mysql://username:password@host:port/database`
   - **Lưu lại**, sẽ dùng ở Bước 3

---

## ⚙️ BƯỚC 3: Deploy Backend Lên Railway

### 3.1. Đăng ký Railway

1. Truy cập: https://railway.app
2. Click **"Start a New Project"**
3. Đăng nhập bằng **GitHub** (khuyến nghị) hoặc email

### 3.2. Tạo Project Mới

1. Click **"New Project"**
2. Chọn **"Deploy from GitHub repo"**
3. Chọn repo **`vanquy-cmd/ept`**
4. Railway sẽ tự động detect code

### 3.3. Cấu Hình Service Backend

1. Railway sẽ tự động tạo một service. Click vào service đó
2. Vào tab **"Settings"** → tìm **"Root Directory"**
3. Đặt **Root Directory** = `backend`
4. Vào tab **"Variables"** → thêm các biến môi trường sau:

#### Biến môi trường cần thêm:

```bash
# Database (nếu dùng PlanetScale, paste connection string vào đây)
DATABASE_URL=mysql://username:password@host:port/database

# Hoặc nếu dùng MySQL từ Railway (sẽ làm ở bước sau):
# DATABASE_URL sẽ được Railway tự động tạo, bạn chỉ cần copy từ MySQL service

# Server Port (Railway tự set, nhưng có thể để PORT=4000)
PORT=4000

# Admin Account
DEFAULT_ADMIN_EMAIL=admin@ept.com
DEFAULT_ADMIN_PASSWORD=Admin123!@#
DEFAULT_ADMIN_NAME=EPT Admin

# Google Gemini API
GEMINI_API_KEY=paste_api_key_của_bạn_vào_đây
AI_EVAL_MOCK=false
GEMINI_EVAL_MODEL=gemini-2.0-flash-exp
GEMINI_TRANSCRIBE_MODEL=gemini-2.0-flash-exp

# AWS S3 (nếu có)
S3_BUCKET=your_s3_bucket_name
S3_REGION=ap-southeast-1
S3_ACCESS_KEY_ID=YOUR_AWS_ACCESS_KEY_ID
S3_SECRET_ACCESS_KEY=YOUR_AWS_SECRET_ACCESS_KEY
```

**Lưu ý**: 
- Thay `GEMINI_API_KEY` bằng API key thật của bạn (lấy từ https://aistudio.google.com)
- Nếu không có S3, có thể bỏ qua 4 biến S3 (tính năng upload sẽ không hoạt động)

### 3.4. Tạo MySQL Database (Nếu dùng Railway MySQL)

1. Trong project Railway, click **"+ New"** → chọn **"Database"** → **"Add MySQL"**
2. Railway sẽ tự động tạo MySQL service
3. Vào MySQL service → tab **"Variables"** → tìm `MYSQL_URL` hoặc `DATABASE_URL`
4. **Copy giá trị** của `DATABASE_URL`
5. Quay lại Backend service → tab **"Variables"** → sửa `DATABASE_URL` = giá trị vừa copy

### 3.5. Chạy Migrations (Tạo Tables)

Sau khi backend deploy xong, bạn cần chạy migrations để tạo tables. Dự án đã có sẵn script tự động!

**Cách 1: Dùng Script Tự Động (Khuyến nghị - Dễ nhất)**

Script `backend/scripts/init-db.js` đã được tạo sẵn. Bạn chỉ cần:

1. **Cài Railway CLI** (nếu chưa có):
   ```bash
   npm install -g @railway/cli
   ```

2. **Login và link project**:
   ```bash
   railway login
   railway link
   # Chọn project và service backend của bạn
   ```

3. **Chạy migrations**:
   ```bash
   cd backend
   railway run npm run init-db
   ```

   Script sẽ tự động:
   - Kết nối database từ `DATABASE_URL`
   - Chạy tất cả migrations theo thứ tự
   - Bỏ qua các table/column đã tồn tại (không báo lỗi)

**Cách 2: Dùng Railway Console (Nếu không muốn cài CLI)**

1. Vào Backend service trên Railway
2. Tab **"Settings"** → tìm **"Run Command"** hoặc **"Console"**
3. Chạy lệnh: `npm run init-db`

**Cách 3: Dùng MySQL Client (Nếu muốn kiểm tra thủ công)**

1. Vào MySQL service → tab **"Connect"** → copy connection info
2. Dùng MySQL Workbench, DBeaver, hoặc `mysql` CLI kết nối
3. Chạy các file SQL trong `backend/migrations/` theo thứ tự:
   - `create_vocabulary_translation_history.sql`
   - `add_example_sentence_column.sql`
   - `add_asset_url_to_quizzes.sql`

### 3.6. Lấy URL Backend

1. Vào Backend service → tab **"Settings"** → tìm **"Public Domain"**
2. Click **"Generate Domain"** (nếu chưa có)
3. Copy URL (ví dụ: `https://ept-backend-production.up.railway.app`)
4. **Lưu lại URL này**, sẽ dùng cho frontend

---

## 🎨 BƯỚC 4: Deploy Frontend Lên Vercel

### 4.1. Đăng ký Vercel

1. Truy cập: https://vercel.com
2. Click **"Sign Up"** → chọn **"Continue with GitHub"**
3. Authorize Vercel truy cập GitHub repos

### 4.2. Import Project

1. Vào Dashboard → click **"Add New..."** → **"Project"**
2. Tìm và chọn repo **`vanquy-cmd/ept`**
3. Click **"Import"**

### 4.3. Cấu Hình Build Settings

Vercel sẽ tự detect, nhưng bạn cần chỉnh lại:

1. **Framework Preset**: `Vite`
2. **Root Directory**: `frontend` (quan trọng!)
3. **Build Command**: `npm run build` (hoặc để mặc định)
4. **Output Directory**: `dist` (hoặc để mặc định)
5. **Install Command**: `npm install` (hoặc để mặc định)

### 4.4. Thêm Environment Variables

Trong phần **"Environment Variables"**, thêm:

```bash
VITE_API_BASE_URL=https://ept-backend-production.up.railway.app
```

**Lưu ý**: Thay URL bằng URL backend của bạn từ Railway (Bước 3.6)

### 4.5. Deploy

1. Click **"Deploy"**
2. Vercel sẽ tự động:
   - Install dependencies
   - Build project
   - Deploy lên CDN
3. Đợi 2-3 phút → bạn sẽ thấy **"Congratulations!"**
4. Copy URL (ví dụ: `https://ept.vercel.app`)
5. **Lưu lại URL này**, đây là link để chia sẻ cho bạn test

---

## 🔄 BƯỚC 5: Kiểm Tra & Test

### 5.1. Test Backend

Mở trình duyệt, truy cập:

```
https://ept-backend-production.up.railway.app
```

Bạn sẽ thấy: `Chào mừng đến với EPT Backend API! 🚀`

### 5.2. Test Frontend

Mở trình duyệt, truy cập:

```
https://ept.vercel.app
```

Bạn sẽ thấy trang chủ của ứng dụng.

### 5.3. Test Đăng Nhập Admin

1. Vào trang login: `https://ept.vercel.app/login`
2. Đăng nhập với:
   - **Email**: Giá trị của `DEFAULT_ADMIN_EMAIL` (ví dụ: `admin@ept.com`)
   - **Password**: Giá trị của `DEFAULT_ADMIN_PASSWORD` (ví dụ: `Admin123!@#`)

---

## 🔧 BƯỚC 6: Xử Lý Lỗi Thường Gặp

### Lỗi: Frontend không gọi được API Backend

**Nguyên nhân**: CORS hoặc URL backend sai

**Giải quyết**:
1. Kiểm tra `VITE_API_BASE_URL` trong Vercel = URL backend đúng
2. Kiểm tra backend có cho phép CORS từ domain frontend:
   - Vào `backend/src/index.js` → đảm bảo có `app.use(cors())`
   - Hoặc thêm origin cụ thể: `app.use(cors({ origin: 'https://ept.vercel.app' }))`
3. Redeploy cả backend và frontend

### Lỗi: Database connection failed

**Nguyên nhân**: `DATABASE_URL` sai hoặc database chưa được tạo

**Giải quyết**:
1. Kiểm tra `DATABASE_URL` trong Railway Variables
2. Đảm bảo đã chạy migrations để tạo tables
3. Kiểm tra database service đang chạy (Railway)

### Lỗi: 401 Unauthorized khi đăng nhập

**Nguyên nhân**: Admin account chưa được tạo

**Giải quyết**:
1. Backend tự động tạo admin khi khởi động lần đầu
2. Kiểm tra logs trong Railway → tìm dòng `✅ Đã tạo tài khoản Admin mặc định`
3. Nếu không thấy, restart backend service

### Lỗi: Build failed trên Vercel

**Nguyên nhân**: Thiếu dependencies hoặc lỗi TypeScript

**Giải quyết**:
1. Kiểm tra logs trong Vercel → tab "Build Logs"
2. Thử build local trước: `cd frontend && npm run build`
3. Fix lỗi → commit → push → Vercel tự động rebuild

---

## 📝 BƯỚC 7: Cập Nhật Code Sau Này

Mỗi khi bạn push code mới lên GitHub:

- **Vercel**: Tự động deploy lại (trong vòng 1-2 phút)
- **Railway**: Tự động deploy lại (trong vòng 2-3 phút)

Bạn không cần làm gì thêm!

---

## 🎁 Bonus: Setup Custom Domain (Tùy chọn)

### Vercel (Frontend)

1. Vào project → tab **"Settings"** → **"Domains"**
2. Thêm domain của bạn (ví dụ: `ept.yourdomain.com`)
3. Thêm DNS records theo hướng dẫn của Vercel

### Railway (Backend)

1. Vào service → tab **"Settings"** → **"Networking"**
2. Thêm custom domain
3. Thêm DNS records theo hướng dẫn của Railway

---

## 📊 Tổng Kết

Sau khi hoàn thành, bạn sẽ có:

- ✅ **Frontend URL**: `https://ept.vercel.app` (chia sẻ cho bạn test)
- ✅ **Backend URL**: `https://ept-backend-production.up.railway.app` (dùng nội bộ)
- ✅ **Database**: MySQL trên Railway hoặc PlanetScale
- ✅ **Auto-deploy**: Mỗi khi push code → tự động deploy

---

## 🆘 Cần Hỗ Trợ?

Nếu gặp lỗi, kiểm tra:
1. **Railway Logs**: Vào service → tab "Deployments" → click vào deployment mới nhất → xem logs
2. **Vercel Logs**: Vào project → tab "Deployments" → click vào deployment → xem logs
3. **Browser Console**: Mở DevTools (F12) → tab "Console" → xem lỗi frontend

---

## 📞 Liên Hệ

Nếu cần hỗ trợ thêm, liên hệ người phát triển dự án.

**Chúc bạn deploy thành công! 🎉**

