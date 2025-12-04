import pool from '../config/db.js';

/**
 * Lấy danh sách (tóm tắt) lịch sử các lần làm bài của 1 user
 */
export const getAttemptHistory = async (userId) => {
  try {
    const query = `
      SELECT
          uqa.id AS attempt_id,
          uqa.start_time,
          uqa.final_score,
          uqa.status,
          q.title AS quiz_title
      FROM
          user_quiz_attempts uqa
      JOIN
          quizzes q ON uqa.quiz_id = q.id
      WHERE
          uqa.user_id = ?
      ORDER BY
          uqa.start_time DESC;
    `;
    const [rows] = await pool.query(query, [userId]);
    return rows;
  } catch (error) {
    console.error('Lỗi khi lấy lịch sử attempts model:', error);
    throw error;
  }
};

/**
 * Lấy chi tiết 1 lần làm bài (dùng để review)
 * (ĐÃ SỬA LỖI - Tăng group_concat_max_len)
 */
export const getAttemptDetails = async (attemptId, userId) => {
  let connection; // Khai báo connection ở ngoài
  try {
    // 1. Lấy một kết nối riêng từ pool
    connection = await pool.getConnection();
    
    // 2. Tăng giới hạn GROUP_CONCAT cho phiên này
    // (Giá trị 100000 là ~100KB, an toàn hơn 1024 mặc định)
    await connection.query('SET SESSION group_concat_max_len = 100000;');

    // 3. Truy vấn chính (giữ nguyên)
    const query = `
      SELECT
          uqa.id AS attempt_id,
          uqa.final_score,
          uqa.start_time,
          uqa.end_time,
          q.id AS quiz_id,
          q.title AS quiz_title,
          (
            SELECT CONCAT('[', 
                IFNULL(GROUP_CONCAT(
                    JSON_OBJECT(
                        'question_id', ques.id,
                        'question_order', qq.question_order,
                        'question_type', ques.question_type,
                        'question_text', ques.question_text,
                        'asset_url', ques.asset_url,

                        -- Câu trả lời của người dùng
                        'user_answer_text', ua.user_answer_text,
                        'user_answer_option_id', ua.user_answer_option_id,
                        'user_answer_url', ua.user_answer_url,
                        'is_correct', ua.is_correct,

                        -- Phản hồi (nếu có)
                        'ai_feedback', ua.ai_feedback,
                        'ai_score', ua.ai_score,

                        -- Đáp án đúng (để review)
                        'correct_answer_text', ques.correct_answer,
                        'options', (
                            SELECT IFNULL(JSON_ARRAYAGG(
                                JSON_OBJECT(
                                    'id', opt.id,
                                    'option_text', opt.option_text,
                                    'is_correct', opt.is_correct 
                                )
                            ), '[]')
                            FROM question_options opt
                            WHERE opt.question_id = ques.id
                        )
                    )
                    ORDER BY qq.question_order ASC
                ), '')
            , ']')
            FROM 
              user_answers ua
            JOIN 
              questions ques ON ua.question_id = ques.id
            JOIN
              quiz_questions qq ON ques.id = qq.question_id AND qq.quiz_id = q.id
            WHERE 
              ua.attempt_id = uqa.id
          ) AS results
      FROM
          user_quiz_attempts uqa
      JOIN
          quizzes q ON uqa.quiz_id = q.id
      WHERE
          uqa.id = ? AND uqa.user_id = ?;
    `;

    // 4. Thực thi truy vấn trên kết nối đã thiết lập
    const [rows] = await connection.query(query, [attemptId, userId]);

    // 5. Trả kết nối về pool ngay sau khi dùng xong
    connection.release();
    connection = null; // Đặt là null để khối finally không release lần nữa

    if (!rows[0]) {
      return undefined; // Không tìm thấy hoặc không thuộc sở hữu
    }
    
    // 6. Parse JSON (Bây giờ chuỗi JSON đã đầy đủ)
    if (rows[0] && rows[0].results) {
      // Dòng 109 của bạn (bây giờ sẽ hoạt động)
      rows[0].results = JSON.parse(rows[0].results);
    } else {
      rows[0].results = [];
    }
    // === THÊM ĐOẠN NÀY ĐỂ SỬA LỖI ===
    // Parse chuỗi JSON 'options' lồng bên trong
    if (rows[0] && rows[0].results.length > 0) {
      rows[0].results.forEach((item) => {
        // Kiểm tra xem 'options' có phải là string không
        if (item.options && typeof item.options === 'string') {
          item.options = JSON.parse(item.options);
        }
      });
    }

    return rows[0];

  } catch (error) {
    console.error('Lỗi khi lấy chi tiết attempt model:', error);
    // 7. Đảm bảo connection được release nếu có lỗi xảy ra
    if (connection) {
      connection.release();
    }
    throw error;
  }
};