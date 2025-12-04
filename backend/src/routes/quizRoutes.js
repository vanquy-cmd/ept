import express from 'express';
import {
  // Hàm cho người dùng
  handleGetAllQuizzes,
  handleGetQuizDetails,
  handleSubmitQuiz,
  // Hàm cho Admin
  handleCreateQuiz,
  handleUpdateQuiz,
  handleDeleteQuiz
} from '../controllers/quizController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// --- ROUTES CHO NGƯỜI DÙNG (Yêu cầu đăng nhập) ---
// GET /api/quizzes
// Lấy danh sách tất cả các bài quiz
router.get('/', protect, handleGetAllQuizzes);
// GET /api/quizzes/:id/start
// Lấy chi tiết một bài quiz (câu hỏi, lựa chọn) để bắt đầu làm bài
router.get('/:id/start', protect, handleGetQuizDetails);
// POST /api/quizzes/:id/submit
// Yêu cầu xác thực (phải đăng nhập)
router.post('/:id/submit', protect, handleSubmitQuiz);

// --- ROUTES CHO ADMIN (Yêu cầu quyền Admin) ---
// POST /api/quizzes
// (Tạo đề thi mới)
router.post('/', protect, admin, handleCreateQuiz);
// PUT /api/quizzes/:id
// (Cập nhật đề thi)
router.put('/:id', protect, admin, handleUpdateQuiz);
// DELETE /api/quizzes/:id
// (Xóa đề thi)
router.delete('/:id', protect, admin, handleDeleteQuiz);

export default router;