import express from 'express';
import {
  // Hàm cho người dùng
  handleGetAllVocabularySets,
  handleGetWordsBySetId,
  handleTranslateVocabulary,
  handleGetTranslationHistory,
  // Hàm cho Admin
  handleGetSetDetails,
  handleCreateSet,
  handleUpdateSet,
  handleDeleteSet
} from '../controllers/vocabularyController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// --- ROUTES CHO NGƯỜI DÙNG (Yêu cầu đăng nhập) ---

// POST /api/vocabulary/translate
// Dịch từ/cụm từ tiếng Việt sang tiếng Anh
// QUAN TRỌNG: Đặt route này TRƯỚC các route có tham số động để tránh conflict
router.post('/translate', protect, handleTranslateVocabulary);

// GET /api/vocabulary/history
// Lấy lịch sử tra từ điển của user
router.get('/history', protect, handleGetTranslationHistory);

// GET /api/vocabulary/sets
// Lấy tất cả các bộ từ vựng
router.get('/sets', protect, handleGetAllVocabularySets);

// GET /api/vocabulary/sets/:id/words
// Lấy tất cả các từ trong bộ có :id
router.get('/sets/:id/words', protect, handleGetWordsBySetId);


// --- ROUTES CHO ADMIN (Yêu cầu quyền Admin) ---

// POST /api/vocabulary/sets
// (Tạo bộ từ vựng mới)
router.post('/sets', protect, admin, handleCreateSet);

// GET /api/vocabulary/sets/:id/details
// (Lấy chi tiết bộ từ vựng cho trang edit)
router.get('/sets/:id/details', protect, admin, handleGetSetDetails);

// PUT /api/vocabulary/sets/:id
// (Cập nhật bộ từ vựng)
router.put('/sets/:id', protect, admin, handleUpdateSet);

// DELETE /api/vocabulary/sets/:id
// (Xóa bộ từ vựng)
router.delete('/sets/:id', protect, admin, handleDeleteSet);


export default router;