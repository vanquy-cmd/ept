/**
 * Middleware để kiểm tra quyền Admin
 * PHẢI được sử dụng SAU middleware 'protect'
 */
export const admin = (req, res, next) => {
  // req.user được tạo bởi middleware 'protect'
  if (req.user && req.user.role === 'admin') {
    next(); // Là admin, cho phép đi tiếp
  } else {
    // 403 Forbidden (Bị cấm) - khác với 401 Unauthorized (Chưa xác thực)
    res.status(403).json({ message: 'Truy cập bị cấm. Yêu cầu quyền Admin.' });
  }
};