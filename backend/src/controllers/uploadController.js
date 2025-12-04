import { generateUploadUrl } from '../utils/s3.js';

/**
 * Controller xử lý việc xin S3 Presigned URL
 */
export const handleGetPresignedUrl = async (req, res) => {
  try {
    const userId = req.user.id; // Lấy từ middleware 'protect'
    const { fileType, folder = 'speaking' } = req.body; // Mặc định là 'speaking', có thể là 'quiz-assets'

    if (!fileType) {
      return res.status(400).json({ message: 'Vui lòng cung cấp fileType (loại file).' });
    }

    // Gọi hàm tiện ích để tạo URL
    const { presignedUrl, key, publicUrl } = await generateUploadUrl(userId, fileType, folder);

    // Trả URL và key về cho client
    res.status(200).json({
      message: 'Tạo Presigned URL thành công.',
      presignedUrl: presignedUrl,
      key: key, // Client sẽ dùng 'key' này để nộp bài
      publicUrl: publicUrl // Public URL để truy cập file sau khi upload
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo Presigned URL.' });
  }
};