import {
  getAttemptHistory,
  getAttemptDetails
} from '../models/historyModel.js';
import { generateSignedGetUrl } from '../utils/s3.js';

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

    // Kèm presigned URL cho bài nói (nếu chỉ lưu S3 key)
    if (details.results?.length) {
      await Promise.all(details.results.map(async (item) => {
        if (!item.user_answer_url) return item;
        // Nếu đã là URL đầy đủ thì dùng luôn
        if (typeof item.user_answer_url === 'string' && item.user_answer_url.startsWith('http')) {
          item.user_answer_signed_url = item.user_answer_url;
          return item;
        }
        try {
          item.user_answer_signed_url = await generateSignedGetUrl(item.user_answer_url, 3600);
        } catch (err) {
          console.error('Không tạo được signed URL cho user_answer_url:', item.user_answer_url, err.message);
          item.user_answer_signed_url = null;
        }
        return item;
      }));
    }

    res.status(200).json(details);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết bài làm.' });
  }
};