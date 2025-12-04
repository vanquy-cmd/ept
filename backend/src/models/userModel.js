import pool from '../config/db.js';

// Model để tạo người dùng mới
export const createUser = async (email, password, full_name) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO users (email, password, full_name) VALUES (?, ?, ?)',
      [email, password, full_name]
    );
    return result.insertId; // Trả về ID của người dùng vừa tạo
  } catch (error) {
    console.error('Lỗi khi tạo user model:', error);
    throw error;
  }
};

// Model để tìm người dùng bằng email
export const findUserByEmail = async (email) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0]; // Trả về người dùng đầu tiên tìm thấy (hoặc undefined)
  } catch (error) {
    console.error('Lỗi khi tìm user model:', error);
    throw error;
  }
};

// Model để tìm người dùng bằng ID
export const findUserById = async (id) => {
  try {
    const [rows] = await pool.query(
      // Chúng ta không lấy password
      'SELECT id, email, full_name, role, avatar_url FROM users WHERE id = ?',
      [id]
    );
    return rows[0]; // Trả về người dùng đầu tiên tìm thấy (hoặc undefined)
  } catch (error) {
    console.error('Lỗi khi tìm user by ID model:', error);
    throw error;
  }
};

/**
 * Lưu một Refresh Token vào CSDL
 */
export const saveRefreshToken = async (userId, token, expiresAt) => {
  try {
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
      [userId, token, expiresAt]
    );
  } catch (error) {
    console.error('Lỗi khi lưu refresh token model:', error);
    throw error;
  }
};

/**
 * Tìm một Refresh Token trong CSDL
 */
export const findRefreshToken = async (token) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
      [token]
    );
    return rows[0]; // Trả về token nếu hợp lệ
  } catch (error) {
    console.error('Lỗi khi tìm refresh token model:', error);
    throw error;
  }
};

/**
 * Xóa một Refresh Token (dùng khi logout)
 */
export const deleteRefreshToken = async (token) => {
  try {
    await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
  } catch (error) {
    console.error('Lỗi khi xóa refresh token model:', error);
    throw error;
  }
};

/**
 * [PROFILE] Cập nhật Tên đầy đủ của người dùng
 */
export const updateUserProfile = async (userId, full_name) => {
  try {
    const [result] = await pool.query(
      'UPDATE users SET full_name = ? WHERE id = ?',
      [full_name, userId]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Lỗi khi cập nhật profile model:', error);
    throw error;
  }
};

/**
 * [PROFILE] Cập nhật mật khẩu của người dùng
 */
export const updateUserPassword = async (userId, hashedPassword) => {
  try {
    const [result] = await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Lỗi khi cập nhật mật khẩu model:', error);
    throw error;
  }
};

  /**
   * [PROFILE] Cập nhật URL avatar của người dùng
   * (Lưu ý: Chúng ta lưu key, không phải URL đầy đủ)
   */
  export const updateUserAvatar = async (userId, avatarKey) => {
    try { 
    const [result] = await pool.query(
      'UPDATE users SET avatar_url = ? WHERE id = ?',
      [avatarKey, userId]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Lỗi khi cập nhật avatar model:', error);
    throw error;
  }
  };

/**
 * [AUTH] Lưu token reset mật khẩu vào CSDL
 */
export const savePasswordResetToken = async (userId, token, expires) => {
  try {
    await pool.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      [token, expires, userId]
    );
  } catch (error) {
    console.error('Lỗi khi lưu token reset pass model:', error);
    throw error;
  }
};

/**
 * [AUTH] Tìm người dùng bằng token reset hợp lệ
 */
export const findUserByResetToken = async (token) => {
  try {
    const [rows] = await pool.query(
      // Tìm token VÀ đảm bảo token chưa hết hạn (expires > NOW())
      'SELECT * FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      [token]
    );
    return rows[0]; // Trả về user nếu tìm thấy
  } catch (error) {
    console.error('Lỗi khi tìm user bằng reset token model:', error);
    throw error;
  }
};

/**
 * [AUTH] Cập nhật mật khẩu VÀ xóa token (sau khi reset thành công)
 */
export const resetUserPassword = async (userId, hashedPassword) => {
  try {
    await pool.query(
      'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      [hashedPassword, userId]
    );
  } catch (error) {
    console.error('Lỗi khi reset mật khẩu model:', error);
    throw error;
  }
};