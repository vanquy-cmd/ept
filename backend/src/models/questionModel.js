import pool from '../config/db.js';

/**
 * [ADMIN] Lấy chi tiết một câu hỏi (bao gồm các lựa chọn)
 * Tương thích MySQL 5.7
 */
export const getQuestionById = async (questionId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('SET SESSION group_concat_max_len = 100000;');

    const query = `
      SELECT
          q.*,
          (
            SELECT CONCAT('[', 
                IFNULL(GROUP_CONCAT(
                    JSON_OBJECT(
                        'id', opt.id,
                        'option_text', opt.option_text,
                        'is_correct', opt.is_correct
                    )
                ), '')
            , ']')
            FROM question_options opt
            WHERE opt.question_id = q.id
          ) AS options
      FROM
          questions q
      WHERE
          q.id = ?;
    `;
    const [rows] = await connection.query(query, [questionId]);
    connection.release();

    if (!rows[0]) return undefined;

    // Parse chuỗi JSON
    if (rows[0] && rows[0].options) {
      rows[0].options = JSON.parse(rows[0].options);
    } else {
      rows[0].options = [];
    }
    return rows[0];

  } catch (error) {
    if (connection) connection.release();
    console.error('Lỗi khi lấy chi tiết câu hỏi model:', error);
    throw error;
  }
};


/**
 * [ADMIN] Tạo câu hỏi mới (sử dụng Transaction)
 * @param {object} questionData - Dữ liệu cho bảng 'questions'
 * @param {array} optionsData - Mảng các lựa chọn (cho trắc nghiệm)
 */
export const createQuestion = async (questionData, optionsData) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Chèn vào bảng 'questions'
    const [qResult] = await connection.query(
      'INSERT INTO questions SET ?',
      [questionData]
    );
    const newQuestionId = qResult.insertId;

    // 2. Nếu là 'multiple_choice' và có options, chèn vào 'question_options'
    if (questionData.question_type === 'multiple_choice' && optionsData && optionsData.length > 0) {
      const optionsValues = optionsData.map(opt => [
        newQuestionId,
        opt.option_text,
        opt.is_correct
      ]);
      await connection.query(
        'INSERT INTO question_options (question_id, option_text, is_correct) VALUES ?',
        [optionsValues]
      );
    }
    
    // 3. Commit giao dịch
    await connection.commit();
    connection.release();
    return newQuestionId;

  } catch (error) {
    if (connection) {
      await connection.rollback(); // Hoàn tác nếu có lỗi
      connection.release();
    }
    console.error('Lỗi khi tạo câu hỏi model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Cập nhật câu hỏi (sử dụng Transaction)
 * Lưu ý: Nếu câu hỏi đã có user_answers, sẽ không xóa options cũ mà chỉ thêm mới
 */
export const updateQuestion = async (questionId, questionData, optionsData) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Kiểm tra xem có user_answers nào đang tham chiếu đến options của câu hỏi này không
    const [hasAnswers] = await connection.query(
      `SELECT COUNT(*) as count 
       FROM user_answers ua 
       JOIN question_options qo ON ua.user_answer_option_id = qo.id 
       WHERE qo.question_id = ?`,
      [questionId]
    );

    const hasExistingAnswers = hasAnswers[0].count > 0;

    // 2. Cập nhật bảng 'questions'
    await connection.query(
      'UPDATE questions SET ? WHERE id = ?',
      [questionData, questionId]
    );

    // 3. Xử lý options
    if (questionData.question_type === 'multiple_choice' && optionsData && optionsData.length > 0) {
      if (hasExistingAnswers) {
        // Nếu đã có user_answers, không xóa options cũ, chỉ thêm options mới
        // (Để giữ lịch sử câu trả lời)
        const optionsValues = optionsData.map(opt => [
          questionId,
          opt.option_text,
          opt.is_correct
        ]);
        await connection.query(
          'INSERT INTO question_options (question_id, option_text, is_correct) VALUES ?',
          [optionsValues]
        );
      } else {
        // Nếu chưa có user_answers, có thể xóa và tạo lại hoàn toàn
        await connection.query(
          'DELETE FROM question_options WHERE question_id = ?',
          [questionId]
        );
        
        const optionsValues = optionsData.map(opt => [
          questionId,
          opt.option_text,
          opt.is_correct
        ]);
        await connection.query(
          'INSERT INTO question_options (question_id, option_text, is_correct) VALUES ?',
          [optionsValues]
        );
      }
    } else if (questionData.question_type !== 'multiple_choice') {
      // Nếu chuyển từ multiple_choice sang loại khác, chỉ xóa nếu không có answers
      if (!hasExistingAnswers) {
        await connection.query(
          'DELETE FROM question_options WHERE question_id = ?',
          [questionId]
        );
      }
    }
    
    // 4. Commit giao dịch
    await connection.commit();
    connection.release();

  } catch (error) {
    if (connection) {
      await connection.rollback(); // Hoàn tác nếu có lỗi
      connection.release();
    }
    console.error('Lỗi khi cập nhật câu hỏi model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Kiểm tra xem câu hỏi có thể xóa được không
 * Trả về true nếu không có user_answers hoặc quiz nào đang sử dụng
 */
export const canDeleteQuestion = async (questionId) => {
  try {
    // Kiểm tra xem câu hỏi có trong quiz nào không
    const [quizCheck] = await pool.query(
      'SELECT COUNT(*) as count FROM quiz_questions WHERE question_id = ?',
      [questionId]
    );
    
    // Kiểm tra xem có user_answers nào không
    const [answerCheck] = await pool.query(
      'SELECT COUNT(*) as count FROM user_answers WHERE question_id = ?',
      [questionId]
    );
    
    return quizCheck[0].count === 0 && answerCheck[0].count === 0;
  } catch (error) {
    console.error('Lỗi khi kiểm tra khả năng xóa câu hỏi:', error);
    return false;
  }
};

/**
 * [ADMIN] Xóa một câu hỏi
 * Lưu ý: Chỉ xóa được nếu câu hỏi chưa được sử dụng trong quiz hoặc có user_answers
 */
/**
 * [ADMIN] Xóa một câu hỏi
 * Lưu ý: Chỉ xóa được nếu câu hỏi chưa được sử dụng trong quiz hoặc có user_answers
 */
export const deleteQuestion = async (questionId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Kiểm tra xem có thể xóa không (sử dụng helper function)
    // Kiểm tra xem câu hỏi có trong quiz nào không
    const [quizCheck] = await connection.query(
      'SELECT COUNT(*) as count FROM quiz_questions WHERE question_id = ?',
      [questionId]
    );
    
    // Kiểm tra xem có user_answers nào không
    const [answerCheck] = await connection.query(
      'SELECT COUNT(*) as count FROM user_answers WHERE question_id = ?',
      [questionId]
    );
    
    if (quizCheck[0].count > 0 || answerCheck[0].count > 0) {
      await connection.rollback();
      connection.release();
      const error = new Error('Không thể xóa câu hỏi này vì nó đã được sử dụng trong bài thi hoặc có câu trả lời từ người dùng.');
      error.code = 'CANNOT_DELETE';
      throw error;
    }

    // 2. Xóa tất cả options trước (chỉ khi không có user_answers tham chiếu)
    await connection.query(
      'DELETE FROM question_options WHERE question_id = ?',
      [questionId]
    );

    // 3. Xóa câu hỏi
    const [result] = await connection.query(
      'DELETE FROM questions WHERE id = ?',
      [questionId]
    );
    
    await connection.commit();
    connection.release();
    
    return result.affectedRows; // 1 nếu thành công
  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    // Nếu là lỗi CANNOT_DELETE, giữ nguyên error để controller xử lý
    if (error.code !== 'CANNOT_DELETE') {
      console.error('Lỗi khi xóa câu hỏi model:', error);
    }
    throw error;
  }
};