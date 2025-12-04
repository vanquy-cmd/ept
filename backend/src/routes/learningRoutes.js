import express from 'express';
import {
  // Hàm cho người dùng
  handleGetAllCategories,
  handleGetLessonsByCategoryId,
  handleGetLessonById,
  // Hàm cho Admin - Lessons
  handleCreateLesson,
  handleUpdateLesson,
  handleDeleteLesson,
  // Hàm cho Admin - Categories
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory,
  handleGetCategoryById
} from '../controllers/learningController.js';

import { protect } from '../middleware/authMiddleware.js';
import { admin } from '../middleware/adminMiddleware.js';
// Import validation
import { validateLesson, validateIdParam } from '../middleware/validationMiddleware.js';

const router = express.Router();

// --- ROUTES NGƯỜI DÙNG ---
router.get('/categories', protect, handleGetAllCategories);
// QUAN TRỌNG: Route cụ thể hơn phải đặt TRƯỚC route có tham số động
router.get('/categories/:id/lessons', protect, validateIdParam, handleGetLessonsByCategoryId);
router.get('/lessons/:id', protect, validateIdParam, handleGetLessonById);

// --- ROUTES ADMIN ---
// Lessons
router.post('/lessons', protect, admin, validateLesson, handleCreateLesson);
router.put('/lessons/:id', protect, admin, validateIdParam, validateLesson, handleUpdateLesson);
router.delete('/lessons/:id', protect, admin, validateIdParam, handleDeleteLesson);

// Categories
// QUAN TRỌNG: Route cụ thể hơn phải đặt TRƯỚC route có tham số động
router.post('/categories', protect, admin, handleCreateCategory);
router.get('/categories/:id', protect, admin, validateIdParam, handleGetCategoryById);
router.put('/categories/:id', protect, admin, validateIdParam, handleUpdateCategory);
router.delete('/categories/:id', protect, admin, validateIdParam, handleDeleteCategory);

export default router;