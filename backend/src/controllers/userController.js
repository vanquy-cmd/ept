import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import asyncHandler from 'express-async-handler';
import { 
    createUser, 
    findUserByEmail,
    saveRefreshToken,
    findRefreshToken,
    deleteRefreshToken,
    findUserById,
    savePasswordResetToken,   // <-- Import mới
    findUserByResetToken,     // <-- Import mới
    resetUserPassword
} from '../models/userModel.js';

/**
 * Hàm xử lý Đăng ký (Register)
 * (Đã bọc bằng asyncHandler và xóa validation)
 */
export const registerUser = asyncHandler(async (req, res) => {
  // Không cần kiểm tra if (!email) nữa, validator đã làm
  const { email, password, full_name } = req.body;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    res.status(400); // Đặt status code
    throw new Error('Email này đã được sử dụng.'); // Ném lỗi
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const newUserId = await createUser(email, hashedPassword, full_name);

  res.status(201).json({
    message: 'Đăng ký thành công!',
    userId: newUserId,
    email: email
  });
  // Không cần try...catch, asyncHandler sẽ bắt lỗi
});

/**
 * Hàm trợ giúp tạo Access Token (15 phút)
 */
const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role // Thêm role vào token
  };
  return jwt.sign(
    payload,
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRATION }
  );
};
/**
 * Hàm xử lý Đăng nhập (Login)
 * (Đã bọc bằng asyncHandler và xóa validation)
 */
export const loginUser = asyncHandler(async (req, res) => {
  // Không cần kiểm tra if (!email)
  const { email, password } = req.body;

  const user = await findUserByEmail(email);
  if (!user) {
    res.status(401);
    throw new Error('Email hoặc mật khẩu không chính xác.');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    res.status(401);
    throw new Error('Email hoặc mật khẩu không chính xác.');
  }
const accessToken = generateAccessToken(user);
  const refreshToken = crypto.randomBytes(64).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 ngày
  await saveRefreshToken(user.id, refreshToken, expiresAt);

  res.status(200).json({
    message: 'Đăng nhập thành công!',
    accessToken: accessToken,
    refreshToken: refreshToken,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      avatar_url: user.avatar_url
    }
  });
});

/**
 * HÀM MỚI: Làm mới Access Token
 * (Đã bọc bằng asyncHandler)
 */
export const handleRefreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(401);
    throw new Error('Không tìm thấy Refresh Token.');
  }

  // 1. Kiểm tra token có trong CSDL và còn hạn không
  const storedToken = await findRefreshToken(refreshToken);
  if (!storedToken) {
    res.status(403);
    throw new Error('Refresh Token không hợp lệ hoặc đã hết hạn.');
  }

  // 2. Lấy thông tin người dùng
  const user = await findUserById(storedToken.user_id);
  if (!user) {
    res.status(403);
    throw new Error('Người dùng không tồn tại.');
  }

  // 3. Tạo Access Token mới
  const newAccessToken = generateAccessToken(user);

  res.status(200).json({
    accessToken: newAccessToken
  });
});

/**
 * HÀM MỚI: Đăng xuất
 * (Đã bọc bằng asyncHandler)
 */
export const handleLogout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400);
    throw new Error('Không tìm thấy Refresh Token.');
  }

  // Xóa token khỏi CSDL
  await deleteRefreshToken(refreshToken);
  res.status(200).json({ message: 'Đăng xuất thành công.' });
});

/**
 * HÀM MỚI: Quên Mật khẩu (Tạo token)
 * POST /api/users/forgot-password
 */
export const handleForgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await findUserByEmail(email);

    if (!user) {
        // Luôn trả về 200 (OK) ngay cả khi không tìm thấy user
        // Đây là một biện pháp bảo mật để tránh lộ thông tin email nào đã đăng ký
        return res.status(200).json({ message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được một liên kết đặt lại mật khẩu.' });
    }

    // 1. Tạo một token ngẫu nhiên
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // 2. Băm token này (tùy chọn nhưng an toàn hơn, tạm thời bỏ qua để đơn giản)
    // Hiện tại, chúng ta sẽ lưu token gốc (sẽ cải thiện sau nếu cần)

    // 3. Đặt thời gian hết hạn (ví dụ: 1 giờ)
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ

    // 4. Lưu token vào CSDL
    await savePasswordResetToken(user.id, resetToken, expires);

    // 5. Gửi email (Hiện tại chúng ta sẽ MÔ PHỎNG)
    // Trong một ứng dụng thực tế, bạn sẽ dùng 'nodemailer' để gửi email
    const resetURL = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password/${resetToken}`;
    
    console.log('--- LINK ĐẶT LẠI MẬT KHẨU (MÔ PHỎNG GỬI EMAIL) ---');
    console.log(resetURL);
    console.log('----------------------------------------------------');

    res.status(200).json({ message: 'Nếu email của bạn tồn tại trong hệ thống, bạn sẽ nhận được một liên kết đặt lại mật khẩu.' });
});

/**
 * HÀM MỚI: Đặt lại Mật khẩu (Sử dụng token)
 * POST /api/users/reset-password
 */
export const handleResetPassword = asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
        res.status(400);
        throw new Error('Vui lòng cung cấp token và mật khẩu mới.');
    }
    
    // 1. Tìm người dùng bằng token và kiểm tra hạn
    const user = await findUserByResetToken(token);

    if (!user) {
        res.status(400);
        throw new Error('Token không hợp lệ hoặc đã hết hạn.');
    }

    // 2. Băm mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 3. Cập nhật mật khẩu và xóa token
    await resetUserPassword(user.id, hashedPassword);

    res.status(200).json({ message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập ngay bây giờ.' });
});