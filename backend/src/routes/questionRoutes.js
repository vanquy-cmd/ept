import express from 'express';
import {
  handleCreateQuestion,
  handleUpdateQuestion,
  handleDeleteQuestion,
  handleGetQuestionById,
  handleBulkCreateQuestions
} from '../controllers/questionController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Tất cả các route quản lý câu hỏi đều yêu cầu quyền Admin
router.use(protect, admin);

// POST /api/questions
// (Tạo câu hỏi mới)
router.post('/', handleCreateQuestion);

// POST /api/questions/bulk
// (Nhập hàng loạt câu hỏi)
// Lưu ý: Phải đặt TRƯỚC route /:id để tránh conflict
router.post('/bulk', handleBulkCreateQuestions);

// GET /api/questions/:id
// (Lấy chi tiết 1 câu hỏi)
router.get('/:id', handleGetQuestionById);

// PUT /api/questions/:id
// (Cập nhật 1 câu hỏi)
router.put('/:id', handleUpdateQuestion);

// DELETE /api/questions/:id
// (Xóa 1 câu hỏi)
router.delete('/:id', handleDeleteQuestion);

export default router;