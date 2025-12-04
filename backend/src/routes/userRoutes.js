import express from 'express';
import { 
    registerUser, 
    loginUser, 
    handleRefreshToken, 
    handleLogout,
    handleForgotPassword, // <-- THÊM IMPORT
    handleResetPassword 
} from '../controllers/userController.js';
// Import validation
import { validateRegister, validateLogin } from '../middleware/validationMiddleware.js';

const router = express.Router();

// Áp dụng validation
router.post('/register', validateRegister, registerUser);
router.post('/login', validateLogin, loginUser);

router.post('/refresh', handleRefreshToken);
router.post('/logout', handleLogout);

// --- ROUTES MỚI CHO QUÊN MẬT KHẨU ---
router.post('/forgot-password', handleForgotPassword);
router.post('/reset-password', handleResetPassword);

export default router;