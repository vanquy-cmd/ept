import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
// --- IMPORT MỚI ĐỂ KHỞI TẠO ADMIN ---
import bcrypt from 'bcryptjs';
import pool from './config/db.js';
// ------------------------------------
// Import routes
import userRoutes from './routes/userRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import vocabularyRoutes from './routes/vocabularyRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import historyRoutes from './routes/historyRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { notFound, globalErrorHandler } from './middleware/errorMiddleware.js';
import adminRoutes from './routes/adminRoutes.js';

// Tải biến môi trường
dotenv.config();

// Khởi tạo ứng dụng Express
const app = express();

// Sử dụng các middleware quan trọng
app.use(cors());
app.use(express.json());

// --- Định nghĩa Routes ---
app.use('/api/users', userRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/profile', profileRoutes);

// API cho Admin
app.use('/api/admin', adminRoutes); // <-- THÊM DÒNG NÀY

// Một route cơ bản để kiểm tra xem server có hoạt động không
app.get('/', (req, res) => {
  res.send('Chào mừng đến với EPT Backend API! 🚀');
});

// --- XỬ LÝ LỖI TOÀN CỤC (MỚI) ---
// (Phải được đặt sau TẤT CẢ các app.use(routes))

// Bắt lỗi 404
app.use(notFound);
// Bắt tất cả các lỗi khác
app.use(globalErrorHandler);

// --- HÀM KHỞI TẠO ADMIN (MỚI) ---
/**
 * Kiểm tra và tạo tài khoản Admin mặc định nếu chưa tồn tại
 */
const ensureAdminUserExists = async () => {
  let connection;
  try {
    connection = await pool.getConnection();
    console.log('🔄 Đang kiểm tra tài khoản Admin...');

    // 1. Kiểm tra xem có admin nào chưa
    const [rows] = await connection.query(
      "SELECT 1 FROM users WHERE role = 'admin' LIMIT 1"
    );

    // 2. Nếu có, bỏ qua
    if (rows.length > 0) {
      console.log('✅ Tài khoản Admin đã tồn tại. Bỏ qua bước tạo.');
      connection.release();
      return;
    }

    // 3. Nếu không, tạo mới
    console.log('⚠️  Không tìm thấy tài khoản Admin. Đang tạo tài khoản mặc định...');

    const email = process.env.DEFAULT_ADMIN_EMAIL;
    const plainPassword = process.env.DEFAULT_ADMIN_PASSWORD;
    const fullName = process.env.DEFAULT_ADMIN_NAME;

    if (!email || !plainPassword || !fullName) {
      console.error('⛔ Lỗi: Vui lòng đặt DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD, DEFAULT_ADMIN_NAME trong .env');
      connection.release();
      return;
    }

    // Băm mật khẩu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(plainPassword, salt);

    // Thêm vào CSDL
    await connection.query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'admin')",
      [fullName, email, hashedPassword]
    );

    console.log('✅ Đã tạo tài khoản Admin mặc định thành công:');
    console.log(`   Email: ${email}`);
    console.log(`   Mật khẩu: ${plainPassword}`);
    
    connection.release();

  } catch (error) {
    console.error('⛔ Lỗi nghiêm trọng khi khởi tạo Admin User:', error.message);
    if (connection) connection.release();
    // Chúng ta vẫn tiếp tục chạy server dù có lỗi này
  }
};


// --- KHỞI ĐỘNG MÁY CHỦ (ĐÃ CẬP NHẬT) ---
/**
 * Chúng ta chuyển app.listen vào một hàm async
 * để có thể 'await' hàm ensureAdminUserExists trước
 */
const startServer = async () => {
  try {
    // 1. Đảm bảo Admin User tồn tại
    await ensureAdminUserExists();

    // 2. Khởi động máy chủgfg
    
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Máy chủ đang chạy tại http://localhost:${PORT}`);
      // (Lưu ý: thông báo '✅ Đã kết nối thành công đến MySQL'
      //  sẽ xuất hiện từ tệp 'db.js' của bạn)
    });

  } catch (error) {
    console.error('⛔ Không thể khởi động máy chủ:', error);
    process.exit(1); // Thoát nếu không thể khởi động
  }
};

// Export default app cho serverless platforms (Vercel, AWS Lambda, etc.)
// Platform sẽ tự động gọi app như một handler
export default app;

// Chạy máy chủ chỉ khi không phải môi trường serverless
// Serverless platforms thường set biến môi trường đặc biệt
if (!process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.VERCEL && !process.env.RAILWAY_ENVIRONMENT) {
  startServer();
}