import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import {
  findUserById,
  updateUserProfile,
  updateUserPassword,
  updateUserAvatar,
  findUserByEmail // Cần để lấy mật khẩu cũ
} from '../models/userModel.js';

/**
 * Lấy thông tin hồ sơ người dùng
 * GET /api/profile
 */
export const handleGetProfile = asyncHandler(async (req, res) => {
  // req.user đã được 'protect' middleware cung cấp
  res.status(200).json(req.user);
});

/**
 * Cập nhật thông tin (Tên)
 * PUT /api/profile
 */
export const handleUpdateProfile = asyncHandler(async (req, res) => {
  const { full_name } = req.body;
  const userId = req.user.id;

  if (!full_name) {
      res.status(400);
      throw new Error('Họ tên là bắt buộc.');
  }

  await updateUserProfile(userId, full_name);
  
  // Lấy lại thông tin user mới (vì req.user là thông tin cũ)
  const updatedUser = await findUserById(userId);
  
  res.status(200).json({
    message: 'Cập nhật hồ sơ thành công.',
    user: updatedUser
  });
});

/**
 * Đổi mật khẩu
 * PUT /api/profile/change-password
 */
export const handleChangePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  // 1. Lấy thông tin đầy đủ (bao gồm mật khẩu) của user
  // (Hàm findUserByEmail có lấy mật khẩu, findUserById thì không)
  const user = await findUserByEmail(req.user.email);
  if (!user) {
    res.status(404);
    throw new Error('Không tìm thấy người dùng.');
  }

  // 2. Kiểm tra mật khẩu cũ
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    res.status(400);
    throw new Error('Mật khẩu cũ không chính xác.');
  }

  // 3. Băm và lưu mật khẩu mới
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(newPassword, salt);
  
  await updateUserPassword(userId, hashedPassword);

  res.status(200).json({ message: 'Đổi mật khẩu thành công.' });
});

/**
 * Cập nhật Avatar
 * PUT /api/profile/avatar
 * (Giả định frontend đã tải file lên S3 và gửi 'key' về)
 */
export const handleUpdateAvatar = asyncHandler(async (req, res) => {
  const { avatarKey } = req.body;
  const userId = req.user.id;

  await updateUserAvatar(userId, avatarKey);
  const updatedUser = await findUserById(userId);
  
  res.status(200).json({
    message: 'Cập nhật ảnh đại diện thành công.',
    user: updatedUser
  });
});