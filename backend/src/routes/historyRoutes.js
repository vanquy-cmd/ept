import express from 'express';
import {
  handleGetAttemptHistory,
  handleGetAttemptDetails
} from '../controllers/historyController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Tất cả các route trong file này đều yêu cầu đăng nhập
// Chúng ta áp dụng middleware 'protect' cho tất cả
router.use(protect);

// GET /api/history/attempts
// Lấy danh sách tóm tắt tất cả các lần làm bài
router.get('/attempts', handleGetAttemptHistory);

// GET /api/history/attempts/:id
// Lấy chi tiết một lần làm bài (để review)
router.get('/attempts/:id', handleGetAttemptDetails);

export default router;