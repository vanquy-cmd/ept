import {
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionById
} from '../models/questionModel.js';

/**
 * [ADMIN] Lấy chi tiết một câu hỏi
 */
export const handleGetQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = await getQuestionById(id);
    if (!question) {
      return res.status(404).json({ message: 'Không tìm thấy câu hỏi.' });
    }
    res.status(200).json(question);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy câu hỏi.' });
  }
};

/**
 * [ADMIN] Tạo câu hỏi mới
 */
export const handleCreateQuestion = async (req, res) => {
  try {
    const {
      category_id,
      skill_focus,
      question_type,
      question_text,
      asset_url,
      correct_answer,
      options // Mảng [{ option_text, is_correct }]
    } = req.body;

    // 1. Validation cơ bản
    if (!category_id || !skill_focus || !question_type || !question_text) {
      return res.status(400).json({ message: 'Vui lòng điền các trường bắt buộc.' });
    }

    // 2. Tách dữ liệu
    const questionData = {
      category_id,
      skill_focus,
      question_type,
      question_text,
      asset_url: asset_url || null,
      correct_answer: correct_answer || null
    };

    const newQuestionId = await createQuestion(questionData, options);
    
    res.status(201).json({ 
      message: 'Tạo câu hỏi thành công.', 
      questionId: newQuestionId 
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo câu hỏi.' });
  }
};

/**
 * [ADMIN] Cập nhật câu hỏi
 */
export const handleUpdateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      category_id,
      skill_focus,
      question_type,
      question_text,
      asset_url,
      correct_answer,
      options
    } = req.body;

    // 1. Validation cơ bản
    if (!category_id || !skill_focus || !question_type || !question_text) {
      return res.status(400).json({ message: 'Vui lòng điền các trường bắt buộc.' });
    }
    
    // 2. Tách dữ liệu
    const questionData = {
      category_id,
      skill_focus,
      question_type,
      question_text,
      asset_url: asset_url || null,
      correct_answer: correct_answer || null
    };
    
    // 3. Kiểm tra xem câu hỏi có tồn tại không
    const existingQuestion = await getQuestionById(id);
    if (!existingQuestion) {
      return res.status(404).json({ message: 'Không tìm thấy câu hỏi để cập nhật.' });
    }

    // 4. Gọi hàm update
    await updateQuestion(id, questionData, options);
    
    res.status(200).json({ message: 'Cập nhật câu hỏi thành công.' });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật câu hỏi.' });
  }
};

/**
 * [ADMIN] Xóa câu hỏi
 */
/**
 * [ADMIN] Xóa câu hỏi
 */
export const handleDeleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Kiểm tra xem có thể xóa không trước
    const canDelete = await canDeleteQuestion(id);
    
    if (!canDelete) {
      return res.status(400).json({ 
        message: 'Không thể xóa câu hỏi này vì nó đã được sử dụng trong bài thi hoặc có câu trả lời từ người dùng.' 
      });
    }
    
    const affectedRows = await deleteQuestion(id);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy câu hỏi để xóa.' });
    }

    res.status(200).json({ message: 'Xóa câu hỏi thành công.' });

  } catch (error) {
    if (error.code === 'CANNOT_DELETE') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Lỗi khi xóa câu hỏi:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa câu hỏi.' });
  }
};

/**
 * [ADMIN] Nhập hàng loạt câu hỏi
 */
export const handleBulkCreateQuestions = async (req, res) => {
  try {
    const { questions } = req.body; // Mảng các câu hỏi

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ message: 'Vui lòng cung cấp mảng câu hỏi hợp lệ.' });
    }

    const results = {
      success: [],
      failed: []
    };

    // Tạo từng câu hỏi
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      try {
        // Validation
        if (!q.category_id || !q.skill_focus || !q.question_type || !q.question_text) {
          results.failed.push({
            index: i,
            question: q.question_text?.substring(0, 50) || `Câu hỏi ${i + 1}`,
            error: 'Thiếu các trường bắt buộc (category_id, skill_focus, question_type, question_text)'
          });
          continue;
        }

        // Tách dữ liệu
        const questionData = {
          category_id: q.category_id,
          skill_focus: q.skill_focus,
          question_type: q.question_type,
          question_text: q.question_text,
          asset_url: q.asset_url || null,
          correct_answer: q.correct_answer || null
        };

        const options = q.options || [];

        // Validation cho multiple choice
        if (questionData.question_type === 'multiple_choice') {
          if (!options || options.length < 2) {
            results.failed.push({
              index: i,
              question: q.question_text?.substring(0, 50),
              error: 'Câu hỏi trắc nghiệm cần ít nhất 2 lựa chọn'
            });
            continue;
          }
          // Kiểm tra có ít nhất 1 đáp án đúng
          if (!options.some(opt => opt.is_correct)) {
            results.failed.push({
              index: i,
              question: q.question_text?.substring(0, 50),
              error: 'Câu hỏi trắc nghiệm cần ít nhất 1 đáp án đúng'
            });
            continue;
          }
        }

        const newQuestionId = await createQuestion(questionData, options);
        results.success.push({
          index: i,
          question_id: newQuestionId,
          question_text: q.question_text?.substring(0, 50)
        });
      } catch (error) {
        results.failed.push({
          index: i,
          question: q.question_text?.substring(0, 50) || `Câu hỏi ${i + 1}`,
          error: error.message || 'Lỗi không xác định'
        });
      }
    }

    res.status(200).json({
      message: `Đã xử lý ${questions.length} câu hỏi. Thành công: ${results.success.length}, Thất bại: ${results.failed.length}`,
      results
    });

  } catch (error) {
    console.error('Lỗi khi nhập hàng loạt câu hỏi:', error);
    res.status(500).json({ message: 'Lỗi máy chủ khi nhập hàng loạt câu hỏi.' });
  }
};