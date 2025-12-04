import { getDashboardStats } from '../models/dashboardModel.js';
import { getAttemptHistory } from '../models/historyModel.js'; // Tái sử dụng hàm
import pool from '../config/db.js';

/**
 * Controller để lấy tất cả dữ liệu cho Dashboard
 */
export const handleGetDashboard = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware 'protect'

    // 1. Lấy các số liệu thống kê (chạy song song)
    const statsPromise = getDashboardStats(userId);
    
    // 2. Lấy 5 hoạt động gần đây (chạy song song)
    const historyPromise = getAttemptHistory(userId); // Hàm này đã sắp xếp DESC

    // 3. Chờ cả hai hoàn thành
    const [stats, fullHistory] = await Promise.all([statsPromise, historyPromise]);

    // 4. Cắt 5 bài gần nhất
    const recent_activity = fullHistory.slice(0, 5);

    // 5. Gửi phản hồi
    res.status(200).json({
      ...stats, // Gồm total_completed_quizzes và average_score
      recent_activity
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu dashboard.' });
  }
};