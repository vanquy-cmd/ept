import express from 'express';
import {
  handleGetProfile,
  handleUpdateProfile,
  handleChangePassword,
  handleUpdateAvatar
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';
import { 
  validateUpdateProfile, 
  validateChangePassword, 
  validateUpdateAvatar 
} from '../middleware/validationMiddleware.js';

const router = express.Router();

// Tất cả các route này đều yêu cầu đăng nhập
router.use(protect);

// GET /api/profile (Lấy hồ sơ)
router.get('/', handleGetProfile);

// PUT /api/profile (Cập nhật tên)
router.put('/', validateUpdateProfile, handleUpdateProfile);

// PUT /api/profile/change-password (Đổi mật khẩu)
router.put('/change-password', validateChangePassword, handleChangePassword);

// PUT /api/profile/avatar (Cập nhật avatar)
router.put('/avatar', validateUpdateAvatar, handleUpdateAvatar);

export default router;