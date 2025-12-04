import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"; 
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import dotenv from 'dotenv';
import crypto from 'crypto';

// Tải biến môi trường
dotenv.config();

// 1. Lấy thông tin cấu hình từ .env
const bucketName = process.env.S3_BUCKET;
const region = process.env.S3_REGION;
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;

// 2. Khởi tạo S3 Client
// Đảm bảo bạn đã cung cấp đủ thông tin trong .env
if (!bucketName || !region || !accessKeyId || !secretAccessKey) {
  console.warn("⚠️  Cảnh báo: Cấu hình S3 chưa đầy đủ trong .env. Tính năng upload sẽ không hoạt động.");
}

const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

/**
 * Hàm tạo Presigned URL
 * @param {string} userId - ID của người dùng để tạo thư mục
 * @param {string} fileType - Loại file (ví dụ: 'audio/webm' hoặc 'image/jpeg')
 * @param {string} folder - Thư mục trong S3 ('speaking' hoặc 'quiz-assets')
 * @returns {Promise<{presignedUrl: string, key: string, publicUrl: string}>}
 */
export const generateUploadUrl = async (userId, fileType, folder = 'speaking') => {
  try {
    // 3. Tạo một tên file ngẫu nhiên, duy nhất
    // Tên file an toàn (16 bytes ngẫu nhiên -> 32 ký tự hex)
    const randomBytes = crypto.randomBytes(16);
    const uniqueFileName = randomBytes.toString('hex');
    
    // Lấy phần mở rộng (extension) từ fileType
    const extension = fileType.split('/')[1] || 'bin'; // 'audio/webm' -> 'webm'
    
    // 4. Tạo "key" (đường dẫn đầy đủ trong S3)
    // Ví dụ: user-files/1/speaking/a1b2c3d4e5f6.webm
    // hoặc: quiz-assets/a1b2c3d4e5f6.mp3
    const key = folder === 'quiz-assets' 
      ? `quiz-assets/${uniqueFileName}.${extension}`
      : `user-files/${userId}/speaking/${uniqueFileName}.${extension}`;

    // 5. Chuẩn bị lệnh PutObject
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: fileType, // Báo cho S3 biết đây là loại file gì
    });

    // 6. Tạo Presigned URL
    // URL này cho phép client thực hiện lệnh 'command' (tức là PUT file)
    // Hết hạn sau 300 giây (5 phút)
    const presignedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 300, 
    });

    // 7. Tạo public URL (URL công khai để truy cập file sau khi upload)
    // Format: https://bucket-name.s3.region.amazonaws.com/key
    const publicUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;

    return { presignedUrl, key, publicUrl };
    
  } catch (error) {
    console.error("Lỗi khi tạo S3 Presigned URL:", error);
    throw error;
  }
};

/**
 * Tải một file từ S3 và trả về dưới dạng Buffer
 * @param {string} key - Đường dẫn file trong S3 (ví dụ: 'user-files/1/speaking/abc.mp3')
 * @returns {Promise<Buffer>}
 */
export const downloadFileBuffer = async (key) => {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  try {
    const response = await s3Client.send(command);
    // response.Body là một Stream
    // Chúng ta chuyển Stream thành Buffer
    const stream = response.Body;
    
    if (!stream) {
      throw new Error("Không tìm thấy file trên S3 hoặc file rỗng.");
    }
    
    const chunks = [];
    // 'for await...of' là cách hiện đại để xử lý stream
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    
    const buffer = Buffer.concat(chunks);
    return buffer;

  } catch (error) {
    console.error(`Lỗi khi tải file ${key} từ S3:`, error);
    
    // Kiểm tra nếu là lỗi AccessDenied
    if (error.name === 'AccessDenied' || error.Code === 'AccessDenied') {
      const errorMessage = `IAM user không có quyền GetObject để tải file từ S3. 
Vui lòng cập nhật IAM policy để thêm quyền s3:GetObject cho user.
Xem file backend/AWS_IAM_FIX.md để biết cách sửa.`;
      console.error('\n⚠️  LỖI QUYỀN TRUY CẬP S3:');
      console.error('   ' + errorMessage);
      console.error('   Chi tiết:', error.message);
      throw new Error(errorMessage);
    }
    
    throw error;
  }
};