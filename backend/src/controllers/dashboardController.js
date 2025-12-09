import { getDashboardStats } from '../models/dashboardModel.js';
import { getAttemptHistory } from '../models/historyModel.js'; // Tái sử dụng hàm
import pool from '../config/db.js';

/**
 * Controller để lấy tất cả dữ liệu cho Dashboard
 */
export const handleGetDashboard = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware 'protect'

    // Cho phép client yêu cầu nhiều hơn hoặc toàn bộ lịch sử
    // - limit: số bản ghi muốn lấy (mặc định 5)
    // - limit=all hoặc limit=-1: trả về toàn bộ
    const { limit } = req.query;
    const parsedLimit = typeof limit === 'string' ? limit.toLowerCase() : undefined;
    const shouldReturnAll = parsedLimit === 'all' || parsedLimit === '-1';
    const numericLimit = !shouldReturnAll && Number.isFinite(Number(limit)) ? Number(limit) : 5;

    // 1. Lấy các số liệu thống kê (chạy song song)
    const statsPromise = getDashboardStats(userId);
    
    // 2. Lấy lịch sử làm bài (đã sắp xếp DESC)
    const historyPromise = getAttemptHistory(userId);

    // 3. Chờ cả hai hoàn thành
    const [stats, fullHistory] = await Promise.all([statsPromise, historyPromise]);

    // 4. Cắt theo limit nếu cần, hoặc trả full
    const recent_activity = shouldReturnAll
      ? fullHistory
      : fullHistory.slice(0, numericLimit);

    // 5. Gửi phản hồi
    res.status(200).json({
      ...stats, // Gồm total_completed_quizzes và average_score
      recent_activity
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy dữ liệu dashboard.' });
  }
};