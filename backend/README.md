Node.js + Express.js (để tạo máy chủ và API) và MySQL Workbench 8.0 CE(làm cơ sở dữ liệu).

ept_backend/
├── node_modules/       (Thư viện đã cài)
├── src/                (Nơi chứa mã nguồn chính)
│   ├── config/         (Cấu hình)
│   │   └── db.js       (Kết nối database)
│   ├── controllers/    (Logic xử lý yêu cầu)
│   │   └── userController.js
│   ├── middleware/   
│   ├── models/
│   │   └── userModel.js
│   ├── routes/         (Định nghĩa các đường dẫn API)
│   │   └── userRoutes.js
│   ├── utils/   
│   └── index.js        (Tệp máy chủ chính)
├── .env                (Tệp bí mật - KHÔNG chia sẻ)
├── package.json
└ ──package-lock.json
└── README.md