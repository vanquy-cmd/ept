/**
 * Middleware xử lý lỗi 404 (Không tìm thấy route)
 * Sẽ được dùng KHI không có route nào khớp
 */
export const notFound = (req, res, next) => {
  const error = new Error(`Không tìm thấy - ${req.originalUrl}`);
  res.status(404);
  next(error); // Chuyển lỗi xuống globalErrorHandler
};

/**
 * Middleware xử lý lỗi toàn cục (Global Error Handler)
 * Đây PHẢI là middleware cuối cùng được 'app.use()'
 */
export const globalErrorHandler = (err, req, res, next) => {
  // Đôi khi lỗi xảy ra nhưng statusCode vẫn là 200
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message;

  // Lọc các lỗi cụ thể (ví dụ: lỗi SQL)
  if (err.code === 'ER_BAD_DB_ERROR') {
      statusCode = 500;
      message = 'Lỗi cơ sở dữ liệu.';
  }
  
  // (Bạn có thể thêm các 'if' khác để bắt lỗi JWT, lỗi S3, v.v.)

  res.status(statusCode).json({
    message: message,
    // Chỉ hiển thị 'stack' (dấu vết lỗi) khi đang ở môi trường phát triển
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};