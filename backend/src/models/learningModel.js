import pool from '../config/db.js';

/**
 * Lấy tất cả các danh mục (categories)
 */
export const getAllCategories = async () => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, skill_focus FROM categories ORDER BY id ASC'
    );
    return rows;
  } catch (error) {
    console.error('Lỗi khi lấy danh mục model:', error);
    throw error;
  }
};

/**
 * Lấy danh sách các bài học (tóm tắt) theo category_id
 */
export const getLessonsByCategoryId = async (categoryId) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, title, content_type FROM lessons WHERE category_id = ? ORDER BY id ASC',
      [categoryId]
    );
    return rows;
  } catch (error) {
    console.error('Lỗi khi lấy bài học theo danh mục model:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết một bài học (bao gồm nội dung) bằng lesson_id
 */
export const getLessonById = async (lessonId) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM lessons WHERE id = ?',
      [lessonId]
    );
    return rows[0]; // Trả về 1 bài học (hoặc undefined)
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết bài học model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Tạo một bài học mới
 */
export const createLesson = async (categoryId, title, contentType, contentBody) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO lessons (category_id, title, content_type, content_body) VALUES (?, ?, ?, ?)',
      [categoryId, title, contentType, contentBody]
    );
    return result.insertId;
  } catch (error) {
    console.error('Lỗi khi tạo bài học model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Cập nhật một bài học
 */
export const updateLesson = async (lessonId, categoryId, title, contentType, contentBody) => {
  try {
    const [result] = await pool.query(
      'UPDATE lessons SET category_id = ?, title = ?, content_type = ?, content_body = ? WHERE id = ?',
      [categoryId, title, contentType, contentBody, lessonId]
    );
    return result.affectedRows; // Trả về số hàng bị ảnh hưởng (1 là thành công)
  } catch (error) {
    console.error('Lỗi khi cập nhật bài học model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Xóa một bài học
 */
export const deleteLesson = async (lessonId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM lessons WHERE id = ?',
      [lessonId]
    );
    return result.affectedRows; // Trả về số hàng bị ảnh hưởng (1 là thành công)
  } catch (error) {
    console.error('Lỗi khi xóa bài học model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Tạo một category mới
 */
export const createCategory = async (name, description, skillFocus) => {
  try {
    const [result] = await pool.query(
      'INSERT INTO categories (name, description, skill_focus) VALUES (?, ?, ?)',
      [name, description || null, skillFocus]
    );
    return result.insertId;
  } catch (error) {
    console.error('Lỗi khi tạo category model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Cập nhật một category
 */
export const updateCategory = async (categoryId, name, description, skillFocus) => {
  try {
    const [result] = await pool.query(
      'UPDATE categories SET name = ?, description = ?, skill_focus = ? WHERE id = ?',
      [name, description || null, skillFocus, categoryId]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Lỗi khi cập nhật category model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Xóa một category
 */
export const deleteCategory = async (categoryId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM categories WHERE id = ?',
      [categoryId]
    );
    return result.affectedRows;
  } catch (error) {
    console.error('Lỗi khi xóa category model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Lấy chi tiết một category
 */
export const getCategoryById = async (categoryId) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, description, skill_focus FROM categories WHERE id = ?',
      [categoryId]
    );
    return rows[0];
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết category model:', error);
    throw error;
  }
};