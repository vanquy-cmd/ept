import { body, validationResult, param } from 'express-validator';

/**
 * Middleware trung gian để kiểm tra kết quả validation
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// --- QUY TẮC CHO USER ---
export const validateRegister = [
  body('email').isEmail().withMessage('Email không hợp lệ.'),
  body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải có ít nhất 6 ký tự.'),
  body('full_name').notEmpty().withMessage('Họ tên là bắt buộc.'),
  handleValidationErrors
];

export const validateLogin = [
  body('email').isEmail().withMessage('Email không hợp lệ.'),
  body('password').notEmpty().withMessage('Mật khẩu là bắt buộc.'),
  handleValidationErrors
];

// --- QUY TẮC CHO BÀI HỌC (LESSONS) ---
export const validateLesson = [
  body('category_id').isInt({ gt: 0 }).withMessage('category_id phải là số nguyên dương.'),
  body('title').notEmpty().withMessage('Tiêu đề là bắt buộc.'),
  body('content_type').isIn(['text', 'video']).withMessage('Loại nội dung phải là "text" hoặc "video".'),
  body('content_body').notEmpty().withMessage('Nội dung là bắt buộc.'),
  handleValidationErrors
];

// --- QUY TẮC CHO ID (dùng trong params) ---
export const validateIdParam = [
  param('id').isInt({ gt: 0 }).withMessage('ID trong URL phải là số nguyên dương.'),
  handleValidationErrors
];

// --- QUY TẮC CHO PROFILE ---
export const validateUpdateProfile = [
  body('full_name').notEmpty().withMessage('Họ tên là bắt buộc.').isLength({ max: 255 }),
  handleValidationErrors
];

export const validateChangePassword = [
  body('oldPassword').notEmpty().withMessage('Mật khẩu cũ là bắt buộc.'),
  body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải có ít nhất 6 ký tự.'),
  handleValidationErrors
];

export const validateUpdateAvatar = [
  body('avatarKey').notEmpty().withMessage('avatarKey (S3 key) là bắt buộc.'),
  handleValidationErrors
];