import express from 'express';
import { handleGetPresignedUrl } from '../controllers/uploadController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/upload/presigned-url
// Client sẽ gọi API này trước khi upload file Speaking
// Yêu cầu phải đăng nhập
router.post('/presigned-url', protect, handleGetPresignedUrl);

export default router;