# 🎓 EPT Learning Platform

Platform học tiếng Anh EPT với các tính năng:
- 📝 Làm bài tập Writing & Speaking (AI chấm điểm)
- 📚 Học từ vựng
- 📊 Quiz & Practice
- 👨‍💼 Admin Dashboard

---

## 🚀 Quick Start

### Yêu cầu:
- Node.js v18+
- MySQL 8.0+
- Git

### Cài đặt:

```bash
# Clone repo
git clone https://github.com/vanquy-cmd/ept.git
cd ept

# Setup Backend
cd backend
npm install
copy .env.example .env  # Windows
# Sửa .env với thông tin thật của bạn
npm run dev

# Setup Frontend (terminal mới)
cd frontend
npm install
copy .env.example .env  # Windows
# Sửa .env: VITE_API_BASE_URL=http://localhost:4000
npm run dev
```

Truy cập: `http://localhost:5173`

---

## 📖 Chi tiết Setup

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Hướng dẫn setup local trên máy
- **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** - Hướng dẫn chi tiết deploy lên hosting miễn phí (Vercel + Railway)

---

## 🛠️ Tech Stack

- **Backend**: Node.js + Express + MySQL
- **Frontend**: React + TypeScript + Vite + Material-UI
- **AI**: Google Gemini API (chấm điểm Writing/Speaking)
- **Storage**: AWS S3 (upload audio/file)

---

## 📁 Cấu trúc Project

```
ept/
├── backend/          # Backend API (Express)
│   ├── src/
│   │   ├── config/   # Database config
│   │   ├── controllers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/    # AI, S3 utilities
│   └── .env.example
│
├── frontend/         # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/ # API client
│   │   └── contexts/ # Auth context
│   └── .env.example
│
└── SETUP_GUIDE.md    # Hướng dẫn setup chi tiết
```

---

## 🔐 Environment Variables

### Backend (`backend/.env`):
- `DATABASE_URL` - MySQL connection string
- `PORT` - Server port (default: 4000)
- `GEMINI_API_KEY` - Google Gemini API key
- `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY` - AWS S3 config
- `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `DEFAULT_ADMIN_NAME` - Admin account

### Frontend (`frontend/.env`):
- `VITE_API_BASE_URL` - Backend API URL

Xem file `.env.example` trong mỗi thư mục để biết chi tiết.

---

## 📝 License

ISC

---

## 👤 Author

vanquy-cmd
