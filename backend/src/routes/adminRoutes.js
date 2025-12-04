import express from 'express';
import { 
    handleGetAllUsers,
    handleGetUserById,
    handleCreateUser,
    handleUpdateUser,
    handleDeleteUser,
    handleGetAllLessons,
    handleGetAllQuestions,
    handleGetAllQuizzes,
    handleGetAllVocabularySets,
    handleGetDashboardStats,
    handleGetAllAttempts, // <-- Import mới
    handleGetAttemptDetailsAdmin
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Áp dụng middleware bảo vệ và kiểm tra quyền admin cho tất cả route trong file này
router.use(protect, admin);

// --- Dashboard ---
router.get('/dashboard-stats', handleGetDashboardStats); // <-- THÊM ROUTE MỚI

// --- User Management ---
router.get('/users', handleGetAllUsers);          // Lấy danh sách
router.post('/users', handleCreateUser);          // Tạo mới
router.get('/users/:id', handleGetUserById);      // Lấy chi tiết
router.put('/users/:id', handleUpdateUser);       // Cập nhật
router.delete('/users/:id', handleDeleteUser);    // Xóa

// --- Lesson Management ---
router.get('/lessons', handleGetAllLessons); 
// --- Question Management ---
router.get('/questions', handleGetAllQuestions);
// --- Quiz Management ---
router.get('/quizzes', handleGetAllQuizzes);

// --- Vocabulary Set Management ---
router.get('/vocabulary-sets', handleGetAllVocabularySets);

// --- Attempts Management ---
router.get('/attempts', handleGetAllAttempts);
router.get('/attempts/:id', handleGetAttemptDetailsAdmin);

// (Chúng ta sẽ thêm các route khác sau: POST /users, PUT /users/:id, ...)

export default router;