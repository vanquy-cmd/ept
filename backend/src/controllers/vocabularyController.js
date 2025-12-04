import {
  getAllVocabularySets,
  getWordsBySetId,
  getVocabularySetDetails,
  createSetWithWords,
  updateSetWithWords,
  deleteSet,
  saveTranslationHistory,
  getTranslationHistory
} from '../models/vocabularyModel.js';
import { translateVocabulary } from '../utils/ai.js';

/**
 * Controller để lấy tất cả các bộ từ vựng
 */
export const handleGetAllVocabularySets = async (req, res) => {
  try {
    const sets = await getAllVocabularySets();
    res.status(200).json(sets);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy bộ từ vựng.' });
  }
};

/**
 * Controller để lấy các từ trong một bộ
 */
export const handleGetWordsBySetId = async (req, res) => {
  try {
    const { id } = req.params; // Lấy set_id từ URL
    const words = await getWordsBySetId(id);

    // Lấy thông tin chi tiết của bộ từ vựng (nếu cần, nhưng hiện tại chỉ cần trả về từ)
    // Nếu muốn trả về cả thông tin set + danh sách từ, chúng ta có thể điều chỉnh
    
    res.status(200).json(words);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách từ vựng.' });
  }
};

// --- CÁC HÀM CỦA ADMIN ---

/**
 * [ADMIN] Lấy chi tiết một bộ từ vựng (cho trang Edit)
 */
export const handleGetSetDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const setDetails = await getVocabularySetDetails(id);
    if (!setDetails) {
      return res.status(404).json({ message: 'Không tìm thấy bộ từ vựng.' });
    }
    res.status(200).json(setDetails);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết bộ từ vựng.' });
  }
};

/**
 * [ADMIN] Tạo bộ từ vựng mới
 */
export const handleCreateSet = async (req, res) => {
  try {
    const { title, description, category_id, words } = req.body;

    // 1. Validation
    if (!title || !Array.isArray(words)) {
      return res.status(400).json({ message: 'Vui lòng cung cấp title và mảng words.' });
    }

    // 2. Tách dữ liệu
    const setData = {
      title,
      description: description || null,
      category_id: category_id || null
    };

    const newSetId = await createSetWithWords(setData, words);
    
    res.status(201).json({ 
      message: 'Tạo bộ từ vựng thành công.', 
      setId: newSetId 
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo bộ từ vựng.' });
  }
};

/**
 * [ADMIN] Cập nhật bộ từ vựng
 */
export const handleUpdateSet = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category_id, words } = req.body;

    // 1. Validation
    if (!title || !Array.isArray(words)) {
      return res.status(400).json({ message: 'Vui lòng cung cấp title và mảng words.' });
    }

    // 2. Tách dữ liệu
    const setData = {
      title,
      description: description || null,
      category_id: category_id || null
    };

    // 3. Kiểm tra
    const existingSet = await getVocabularySetDetails(id);
    if (!existingSet) {
      return res.status(404).json({ message: 'Không tìm thấy bộ từ vựng để cập nhật.' });
    }

    await updateSetWithWords(id, setData, words);
    
    res.status(200).json({ message: 'Cập nhật bộ từ vựng thành công.' });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật bộ từ vựng.' });
  }
};

/**
 * [ADMIN] Xóa bộ từ vựng
 */
export const handleDeleteSet = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await deleteSet(id);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bộ từ vựng để xóa.' });
    }

    res.status(200).json({ message: 'Xóa bộ từ vựng thành công.' });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa bộ từ vựng.' });
  }
};

/**
 * Translate between Vietnamese and English
 */
export const handleTranslateVocabulary = async (req, res) => {
  try {
    const { text, fromLanguage = 'vi', toLanguage = 'en' } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Vui lòng cung cấp từ hoặc cụm từ cần dịch.' });
    }

    if (text.length > 50) {
      return res.status(400).json({ message: 'Vượt quá giới hạn 50 ký tự.' });
    }

    // Validate language codes
    const validLanguages = ['vi', 'en'];
    if (!validLanguages.includes(fromLanguage) || !validLanguages.includes(toLanguage)) {
      return res.status(400).json({ message: 'Ngôn ngữ không hợp lệ. Chỉ hỗ trợ "vi" (Tiếng Việt) và "en" (Tiếng Anh).' });
    }

    if (fromLanguage === toLanguage) {
      return res.status(400).json({ message: 'Ngôn ngữ nguồn và đích phải khác nhau.' });
    }

    const result = await translateVocabulary(text.trim(), fromLanguage, toLanguage);
    
    // Lưu lịch sử tra từ điển
    try {
      await saveTranslationHistory(userId, result);
    } catch (historyError) {
      console.error('Lỗi khi lưu lịch sử tra từ điển:', historyError);
      // Không throw error, chỉ log để không ảnh hưởng đến kết quả dịch
    }
    
    res.status(200).json(result);

  } catch (error) {
    console.error('Lỗi khi dịch từ vựng:', error);
    res.status(500).json({ 
      message: error.message || 'Hệ thống hiện đang quá tải. Vui lòng thử lại sau.' 
    });
  }
};

/**
 * Lấy lịch sử tra từ điển của user
 */
export const handleGetTranslationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    
    const history = await getTranslationHistory(userId, limit);
    res.status(200).json(history);
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử tra từ điển:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy lịch sử tra từ điển.' });
  }
};