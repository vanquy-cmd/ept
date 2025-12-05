# ⚡ Quick Start - Deploy EPT Lên Hosting

Hướng dẫn nhanh để deploy dự án lên hosting miễn phí trong 15 phút.

---

## 🎯 Tóm Tắt

1. **Backend** → Railway (https://railway.app)
2. **Frontend** → Vercel (https://vercel.com)
3. **Database** → MySQL từ Railway (tự động)

---

## 📝 Checklist Trước Khi Bắt Đầu

- [ ] Code đã push lên GitHub: `https://github.com/vanquy-cmd/ept`
- [ ] Có tài khoản GitHub
- [ ] Có Google Gemini API Key (lấy từ https://aistudio.google.com)
- [ ] (Tùy chọn) Có AWS S3 credentials nếu muốn dùng tính năng upload

---

## 🚀 5 Bước Deploy

### Bước 1: Deploy Backend Lên Railway (5 phút)

1. Đăng ký Railway: https://railway.app → Login với GitHub
2. **New Project** → **Deploy from GitHub repo** → Chọn `vanquy-cmd/ept`
3. Vào service → **Settings** → **Root Directory**: `backend`
4. **+ New** → **Database** → **Add MySQL**
5. Vào Backend service → **Variables** → Thêm:

```bash
DATABASE_URL=<copy từ MySQL service>
PORT=4000
DEFAULT_ADMIN_EMAIL=admin@ept.com
DEFAULT_ADMIN_PASSWORD=Admin123!@#
DEFAULT_ADMIN_NAME=EPT Admin
GEMINI_API_KEY=<your_api_key>
AI_EVAL_MOCK=false
GEMINI_EVAL_MODEL=gemini-2.0-flash-exp
GEMINI_TRANSCRIBE_MODEL=gemini-2.0-flash-exp
```

6. Chờ deploy xong → Copy **Public Domain** (ví dụ: `https://ept-backend.up.railway.app`)

---

### Bước 2: Chạy Migrations (2 phút)

```bash
npm install -g @railway/cli
railway login
railway link
cd backend
railway run npm run init-db
```

Hoặc dùng Railway Console: Vào service → **Console** → `npm run init-db`

---

### Bước 3: Deploy Frontend Lên Vercel (5 phút)

1. Đăng ký Vercel: https://vercel.com → Login với GitHub
2. **Add New Project** → Chọn repo `vanquy-cmd/ept`
3. Cấu hình:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables** → Thêm:
   ```bash
   VITE_API_BASE_URL=<URL backend từ Railway>
   ```
5. **Deploy** → Chờ 2-3 phút → Copy URL (ví dụ: `https://ept.vercel.app`)

---

### Bước 4: Test (2 phút)

1. Test Backend: Mở URL Railway → Thấy `Chào mừng đến với EPT Backend API! 🚀`
2. Test Frontend: Mở URL Vercel → Thấy trang chủ
3. Đăng nhập Admin:
   - Email: `admin@ept.com` (hoặc giá trị `DEFAULT_ADMIN_EMAIL`)
   - Password: `Admin123!@#` (hoặc giá trị `DEFAULT_ADMIN_PASSWORD`)

---

### Bước 5: Chia Sẻ Cho Bạn Test (1 phút)

Gửi URL Frontend cho bạn: `https://ept.vercel.app`

---

## ✅ Xong!

Bây giờ mỗi khi bạn push code lên GitHub:
- ✅ Vercel tự động deploy frontend
- ✅ Railway tự động deploy backend

Không cần làm gì thêm!

---

## 🆘 Gặp Lỗi?

Xem **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** để biết:
- Hướng dẫn chi tiết từng bước
- Cách xử lý lỗi thường gặp
- Troubleshooting

---

## 📚 Tài Liệu Tham Khảo

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Setup local trên máy
- **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** - Hướng dẫn deploy chi tiết
- **[README.md](./README.md)** - Tổng quan dự án

