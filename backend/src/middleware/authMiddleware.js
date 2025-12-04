import jwt from 'jsonwebtoken';
import { findUserById } from '../models/userModel.js'; 

export const protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Thay đổi: Sử dụng ACCESS_SECRET
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET); 

      const user = await findUserById(decoded.userId);

      if (!user) {
        return res.status(401).json({ message: 'Xác thực thất bại, người dùng không tồn tại.' });
      }

      req.user = user;
      next();
    } catch (error) {
      // Bắt lỗi khi token hết hạn (15 phút)
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token đã hết hạn. Vui lòng làm mới (refresh).' });
      }
      res.status(401).json({ message: 'Xác thực thất bại, token không hợp lệ.' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Xác thực thất bại, không tìm thấy token.' });
  }
};