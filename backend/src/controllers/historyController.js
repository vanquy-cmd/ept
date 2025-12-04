import {
  getAttemptHistory,
  getAttemptDetails
} from '../models/historyModel.js';

/**
 * Controller để lấy danh sách lịch sử làm bài
 */
export const handleGetAttemptHistory = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware 'protect'
    const history = await getAttemptHistory(userId);
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy lịch sử làm bài.' });
  }
};

/**
 * Controller để lấy chi tiết một lần làm bài
 */
export const handleGetAttemptDetails = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware 'protect'
    const { id } = req.params;  // Lấy attempt_id từ URL
    
    const details = await getAttemptDetails(id, userId);

    if (!details) {
      return res.status(404).json({ message: 'Không tìm thấy lịch sử làm bài này hoặc bạn không có quyền xem.' });
    }

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết bài làm.' });
  }
};