import asyncHandler from 'express-async-handler';
import {
  getAllCategories,
  getLessonsByCategoryId,
  getLessonById,
  // Thêm các import mới
  createLesson,
  updateLesson,
  deleteLesson,
  // Category CRUD
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById
} from '../models/learningModel.js';

/**
 * Controller để lấy tất cả danh mục
 */
export const handleGetAllCategories = asyncHandler(async (req, res) => {
  const categories = await getAllCategories();
  res.status(200).json(categories);
});



/**
 * Controller để lấy các bài học thuộc một danh mục
 */
export const handleGetLessonsByCategoryId = asyncHandler(async (req, res) => {
    const { id } = req.params; // Lấy 'id' từ URL (ví dụ: /categories/1/lessons)
    const lessons = await getLessonsByCategoryId(id);
    if (lessons.length === 0) {
      // Vẫn trả về 200 (OK) nhưng là một mảng rỗng
      return res.status(200).json([]);
    }
    res.status(200).json(lessons);
});

/**
 * Controller để lấy chi tiết một bài học
 */
export const handleGetLessonById = asyncHandler(async (req, res) => {
    const { id } = req.params; // Lấy 'id' từ URL (ví dụ: /lessons/1)
    const lesson = await getLessonById(id);
    if (!lesson) {
      return res.status(404).json({ message: 'Không tìm thấy bài học.' });
    }
    res.status(200).json(lesson);
});

// --- CÁC HÀM CỦA ADMIN ---

/**
 * [ADMIN] Controller để tạo bài học mới
 */
export const handleCreateLesson = asyncHandler(async (req, res) => {
    const { category_id, title, content_type, content_body } = req.body;
    // Kiểm tra dữ liệu đầu vào
    if (!category_id || !title || !content_type || !content_body) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin.' });
    }
    const newLessonId = await createLesson(category_id, title, content_type, content_body);
    res.status(201).json({ 
      message: 'Tạo bài học thành công.',
      lessonId: newLessonId 
    });
});

/**
 * [ADMIN] Controller để cập nhật bài học
 */
export const handleUpdateLesson = asyncHandler(async (req, res) => {
    const { id } = req.params; // Lấy lessonId từ URL
    const { category_id, title, content_type, content_body } = req.body;
    if (!category_id || !title || !content_type || !content_body) {
      return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin.' });
    }
    const affectedRows = await updateLesson(id, category_id, title, content_type, content_body);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài học để cập nhật.' });
    }
    res.status(200).json({ message: 'Cập nhật bài học thành công.' });
});

/**
 * [ADMIN] Controller để xóa bài học
 */
export const handleDeleteLesson = asyncHandler(async (req, res) => {
    const { id } = req.params; // Lấy lessonId từ URL 
    const affectedRows = await deleteLesson(id);
    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bài học để xóa.' });
    }
    res.status(200).json({ message: 'Xóa bài học thành công.' });
});

// --- CÁC HÀM QUẢN LÝ CATEGORY (ADMIN) ---

/**
 * [ADMIN] Controller để tạo category mới
 */
export const handleCreateCategory = asyncHandler(async (req, res) => {
  const { name, description, skill_focus } = req.body;
  
  if (!name || !skill_focus) {
    return res.status(400).json({ message: 'Vui lòng cung cấp name và skill_focus.' });
  }

  const validSkillFocus = ['listening', 'reading', 'speaking', 'writing', 'general'];
  if (!validSkillFocus.includes(skill_focus)) {
    return res.status(400).json({ message: 'skill_focus không hợp lệ. Phải là: listening, reading, speaking, writing, hoặc general.' });
  }

  const newCategoryId = await createCategory(name, description, skill_focus);
  res.status(201).json({ 
    message: 'Tạo chủ đề thành công.',
    categoryId: newCategoryId 
  });
});

/**
 * [ADMIN] Controller để cập nhật category
 */
export const handleUpdateCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, skill_focus } = req.body;
  
  if (!name || !skill_focus) {
    return res.status(400).json({ message: 'Vui lòng cung cấp name và skill_focus.' });
  }

  const validSkillFocus = ['listening', 'reading', 'speaking', 'writing', 'general'];
  if (!validSkillFocus.includes(skill_focus)) {
    return res.status(400).json({ message: 'skill_focus không hợp lệ.' });
  }

  const affectedRows = await updateCategory(id, name, description, skill_focus);
  if (affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy chủ đề để cập nhật.' });
  }
  res.status(200).json({ message: 'Cập nhật chủ đề thành công.' });
});

/**
 * [ADMIN] Controller để xóa category
 */
export const handleDeleteCategory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const affectedRows = await deleteCategory(id);
  if (affectedRows === 0) {
    return res.status(404).json({ message: 'Không tìm thấy chủ đề để xóa.' });
  }
  res.status(200).json({ message: 'Xóa chủ đề thành công.' });
});

/**
 * [ADMIN] Controller để lấy chi tiết category
 */
export const handleGetCategoryById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  console.log('handleGetCategoryById called with id:', id);
  const category = await getCategoryById(id);
  if (!category) {
    return res.status(404).json({ message: 'Không tìm thấy chủ đề.' });
  }
  res.status(200).json(category);
});