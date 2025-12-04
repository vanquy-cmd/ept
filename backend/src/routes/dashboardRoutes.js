import express from 'express';
import { handleGetDashboard } from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/dashboard/
// Chúng ta áp dụng middleware 'protect' cho toàn bộ route
router.get('/', protect, handleGetDashboard);

export default router;