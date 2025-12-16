import pool from '../config/db.js';

/**
 * Lấy danh sách tất cả các bài Quizzes
 */
export const getAllQuizzes = async () => {
  try {
    const [rows] = await pool.query(
      `SELECT q.id, q.title, q.description, q.time_limit_minutes, c.name as category_name
       FROM quizzes q
       JOIN categories c ON q.category_id = c.id
       ORDER BY q.id ASC`
    );
    return rows;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách quizzes model:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết một bài Quiz, bao gồm tất cả câu hỏi và các lựa chọn
 * (SỬA LẠI - Tách riêng các truy vấn để tránh lỗi JSON parsing với ký tự đặc biệt)
 */
export const getQuizDetailsById = async (quizId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    // 1. Lấy thông tin quiz cơ bản
    const [quizRows] = await connection.query(
      `SELECT 
        id AS quiz_id,
        category_id,
        title AS quiz_title,
        description AS quiz_description,
        time_limit_minutes,
        asset_url AS quiz_asset_url
      FROM quizzes
      WHERE id = ?`,
      [quizId]
    );

    if (!quizRows[0]) {
      connection.release();
      return undefined;
    }

    const quiz = quizRows[0];

    // 2. Lấy danh sách câu hỏi với thứ tự
    const [questionRows] = await connection.query(
      `SELECT 
        q.id AS question_id,
        qq.question_order,
        q.skill_focus,
        q.question_type,
        q.question_text,
        q.asset_url
      FROM quiz_questions qq
      JOIN questions q ON qq.question_id = q.id
      WHERE qq.quiz_id = ?
      ORDER BY qq.question_order ASC`,
      [quizId]
    );

    // 3. Lấy options cho từng câu hỏi
    const questions = [];
    for (const qRow of questionRows) {
      const [optionRows] = await connection.query(
        `SELECT 
          id AS option_id,
          option_text
        FROM question_options
        WHERE question_id = ?`,
        [qRow.question_id]
      );

      questions.push({
        question_id: qRow.question_id,
        question_order: qRow.question_order,
        skill_focus: qRow.skill_focus,
        question_type: qRow.question_type,
        question_text: qRow.question_text,
        asset_url: qRow.asset_url,
        options: optionRows || []
      });
    }

    quiz.questions = questions;
    connection.release();
    return quiz;

  } catch (error) {
    if (connection) connection.release();
    console.error('Lỗi khi lấy chi tiết quiz model:', error);
    throw error;
  }
};

/**
 * Lấy dữ liệu cần thiết để chấm điểm cho một quiz
 * (Bao gồm câu hỏi AI và câu hỏi tự động)
 * (Thay thế cho hàm getAnswersForGrading cũ)
 * @param {number} quizId - ID của quiz
 * @param {object} connection - Connection từ pool (optional, nếu có transaction)
 */
export const getGradingDataForQuiz = async (quizId, connection = null) => {
  const logId = `[getGradingData-${Date.now()}]`;
  try {
    console.log(`${logId} Starting query for quizId: ${quizId}`);
    console.log(`${logId} Using connection: ${connection ? 'transaction' : 'pool'}`);
    console.log(`${logId} Connection state: ${connection ? (connection.state || 'unknown') : 'N/A'}`);
    
    // Log pool status if using pool (phục vụ debug hiệu năng, vẫn hữu ích)
    if (!connection) {
      console.log(`${logId} Pool status:`, {
        totalConnections: pool.pool?._allConnections?.length || 'N/A',
        freeConnections: pool.pool?._freeConnections?.length || 'N/A',
        queueLength: pool.pool?._connectionQueue?.length || 'N/A'
      });
    }
    
    // Tối ưu query: sử dụng LEFT JOIN thay vì correlated subquery để tăng performance
    const query = `
      SELECT
          q.id AS question_id,
          q.question_type,
          q.question_text, -- Cần cho AI prompt
          q.correct_answer, -- Dùng cho fill_blank
          MIN(o.id) AS correct_option_id
      FROM
          questions q
      JOIN
          quiz_questions qq ON q.id = qq.question_id
      LEFT JOIN
          question_options o ON o.question_id = q.id AND o.is_correct = 1
      WHERE
          qq.quiz_id = ?
      GROUP BY
          q.id, q.question_type, q.question_text, q.correct_answer;
    `;
    
    console.log(`${logId} Executing query...`);
    const startTime = Date.now();

    // Thực hiện query trực tiếp, không bọc thêm timeout nhân tạo
    const [rows] = connection 
      ? await connection.query(query, [quizId])
      : await pool.query(query, [quizId]);

    const duration = Date.now() - startTime;
    console.log(`${logId} ✓ Query completed in ${duration}ms`);
    console.log(`${logId} Returned ${rows.length} rows`);
    
    if (rows.length > 0) {
      console.log(`${logId} Sample question IDs:`, rows.slice(0, 3).map(r => r.question_id));
    }
    
    return rows;
  } catch (error) {
    console.error(`${logId} ✗ Query failed`);
    console.error(`${logId} Error type:`, error.constructor.name);
    console.error(`${logId} Error message:`, error.message);
    console.error(`${logId} Error code:`, error.code);
    console.error(`${logId} Error errno:`, error.errno);
    console.error(`${logId} Error sqlState:`, error.sqlState);
    if (error.stack) {
      console.error(`${logId} Stack trace:`, error.stack.split('\n').slice(0, 5).join('\n'));
    }
    throw error;
  }
};

/**
 * Bắt đầu một lần làm bài (tạo attempt)
 * (Giữ nguyên hàm này)
 */
export const createQuizAttempt = async (userId, quizId, connection) => {
  try {
    const [result] = await connection.query(
      'INSERT INTO user_quiz_attempts (user_id, quiz_id, status) VALUES (?, ?, ?)',
      [userId, quizId, 'in_progress']
    );
    return result.insertId; // Trả về attempt_id mới
  } catch (error) {
    console.error('Lỗi khi tạo attempt model:', error);
    throw error;
  }
};

/**
 * Lưu một mảng các câu trả lời (ĐÃ CẬP NHẬT)
 * Cần truyền 'connection' để dùng trong transaction
 */
export const saveUserAnswers = async (answersData, connection) => {
  try {
    // Cập nhật câu query để bao gồm các cột AI
    const query = `
      INSERT INTO user_answers 
        (attempt_id, question_id, user_answer_option_id, user_answer_text, 
         user_answer_url, is_correct, ai_feedback, ai_score) 
      VALUES ?
    `;
    
    // 'answersData' bây giờ sẽ là mảng 2 chiều 8 cột, ví dụ:
    // [ [1, 10, 5, null, null, true, null, 100], 
    //   [1, 11, null, 'essay...', null, null, 'Good essay', 80],
    //   [1, 12, null, null, 's3-key.mp3', null, 'Good speaking', 75] ]
       
    const [result] = await connection.query(query, [answersData]);
    return result.affectedRows;
  } catch (error) {
    console.error('Lỗi khi lưu câu trả lời model:', error);
    throw error;
  }
};

/**
 * Cập nhật trạng thái và điểm số sau khi chấm
 * (Giữ nguyên hàm này)
 */
export const updateQuizAttemptScore = async (attemptId, finalScore, connection) => {
  try {
    await connection.query(
      'UPDATE user_quiz_attempts SET status = ?, final_score = ?, end_time = NOW() WHERE id = ?',
      ['completed', finalScore, attemptId]
    );
  } catch (error) {
    console.error('Lỗi khi cập nhật điểm model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Tạo một Quiz mới và liên kết các câu hỏi (Transaction)
 * @param {object} quizData - Dữ liệu cho bảng 'quizzes'
 * @param {array} questionIds - Mảng các ID câu hỏi [1, 5, 10]
 */
export const createQuizWithQuestions = async (quizData, questionIds) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Chèn vào bảng 'quizzes'
    const [qResult] = await connection.query(
      'INSERT INTO quizzes SET ?',
      [quizData]
    );
    const newQuizId = qResult.insertId;

    // 2. Chuẩn bị dữ liệu cho 'quiz_questions'
    if (questionIds && questionIds.length > 0) {
      const questionsValues = questionIds.map((questionId, index) => [
        newQuizId,
        questionId,
        index + 1 // Gán 'question_order' (thứ tự câu hỏi)
      ]);
      
      // 3. Chèn vào bảng 'quiz_questions'
      await connection.query(
        'INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES ?',
        [questionsValues]
      );
    }
    
    // 4. Commit giao dịch
    await connection.commit();
    connection.release();
    return newQuizId;

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Lỗi khi tạo quiz model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Cập nhật một Quiz và các câu hỏi của nó (Transaction)
 */
export const updateQuizWithQuestions = async (quizId, quizData, questionIds) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();

    // 1. Cập nhật bảng 'quizzes'
    await connection.query(
      'UPDATE quizzes SET ? WHERE id = ?',
      [quizData, quizId]
    );

    // 2. Xóa tất cả liên kết câu hỏi cũ
    await connection.query(
      'DELETE FROM quiz_questions WHERE quiz_id = ?',
      [quizId]
    );

    // 3. Chuẩn bị và chèn lại các liên kết mới
    if (questionIds && questionIds.length > 0) {
      const questionsValues = questionIds.map((questionId, index) => [
        quizId,
        questionId,
        index + 1 // Gán 'question_order'
      ]);
      
      await connection.query(
        'INSERT INTO quiz_questions (quiz_id, question_id, question_order) VALUES ?',
        [questionsValues]
      );
    }
    
    // 4. Commit giao dịch
    await connection.commit();
    connection.release();

  } catch (error) {
    if (connection) {
      await connection.rollback();
      connection.release();
    }
    console.error('Lỗi khi cập nhật quiz model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Xóa một Quiz
 * (Bảng 'quiz_questions' và 'user_quiz_attempts' sẽ tự xóa nhờ 'ON DELETE CASCADE')
 */
export const deleteQuiz = async (quizId) => {
  try {
    const [result] = await pool.query(
      'DELETE FROM quizzes WHERE id = ?',
      [quizId]
    );
    return result.affectedRows; // 1 nếu thành công
  } catch (error) {
    console.error('Lỗi khi xóa quiz model:', error);
    throw error;
  }
};