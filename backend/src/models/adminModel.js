import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

/**
 * [ADMIN] Lấy danh sách người dùng CÓ PHÂN TRANG
 */
export const getAllUsers = async (page, limit) => {
  try {
    const offset = (page - 1) * limit;

    // 1. Chạy 2 truy vấn song song: một để đếm, một để lấy dữ liệu
    const [countResult, dataResult] = await Promise.all([
      // Truy vấn 1: Đếm tổng số người dùng
      pool.query('SELECT COUNT(*) as totalCount FROM users'),
      
      // Truy vấn 2: Lấy dữ liệu của trang hiện tại
      pool.query(
        `SELECT id, full_name, email, role, created_at 
         FROM users 
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [Number(limit), Number(offset)]
      )
    ]);

    const totalCount = countResult[0][0].totalCount;
    const users = dataResult[0];

    // 2. Trả về cả dữ liệu và tổng số lượng
    return { users, totalCount };

  } catch (error) {
    console.error('Lỗi khi lấy danh sách users (admin) model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Lấy thông tin chi tiết của một người dùng (không lấy mật khẩu)
 */
export const getUserById = async (userId) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, full_name, email, role, avatar_url, created_at 
       FROM users 
       WHERE id = ?`,
       [userId]
    );
    return rows[0]; // Trả về user hoặc undefined
  } catch (error) {
    console.error('Lỗi khi lấy user by ID (admin) model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Tạo người dùng mới
 */
export const createUserAdmin = async (userData) => {
  try {
    // Băm mật khẩu trước khi lưu
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    
    const newUser = {
        full_name: userData.full_name,
        email: userData.email,
        password: hashedPassword,
        role: userData.role || 'student' // Mặc định là student nếu không cung cấp
    };

    const [result] = await pool.query(
      'INSERT INTO users SET ?',
      [newUser]
    );
    return result.insertId;
  } catch (error) {
    console.error('Lỗi khi tạo user (admin) model:', error);
    // Xử lý lỗi email trùng lặp
    if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Email này đã tồn tại.');
    }
    throw error;
  }
};

/**
 * [ADMIN] Cập nhật thông tin người dùng
 * (Không cho phép cập nhật mật khẩu ở đây - nên có API riêng nếu cần)
 */
export const updateUserAdmin = async (userId, userData) => {
  try {
     const updateData = {
        full_name: userData.full_name,
        email: userData.email,
        role: userData.role
     };
    const [result] = await pool.query(
      'UPDATE users SET ? WHERE id = ?',
      [updateData, userId]
    );
    return result.affectedRows; // 1 nếu thành công
  } catch (error) {
    console.error('Lỗi khi cập nhật user (admin) model:', error);
     if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Email này đã tồn tại.');
    }
    throw error;
  }
};

/**
 * [ADMIN] Xóa người dùng
 */
export const deleteUserAdmin = async (userId) => {
  try {
    // Cần kiểm tra để không cho xóa chính mình (nếu cần)
    const [result] = await pool.query(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );
    return result.affectedRows; // 1 nếu thành công
  } catch (error) {
    console.error('Lỗi khi xóa user (admin) model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Lấy danh sách tất cả các bài học (CÓ PHÂN TRANG)
 */
export const getAllLessonsAdmin = async (page, limit) => {
  try {
    const offset = (page - 1) * limit;

    // 1. Chạy 2 truy vấn song song: đếm và lấy dữ liệu
    const [countResult, dataResult] = await Promise.all([
      // Truy vấn 1: Đếm tổng số bài học
      pool.query('SELECT COUNT(*) as totalCount FROM lessons'),
      
      // Truy vấn 2: Lấy dữ liệu của trang hiện tại
      pool.query(
        `SELECT 
           l.id, l.title, l.content_type, l.updated_at, c.name AS category_name 
         FROM lessons l
         JOIN categories c ON l.category_id = c.id
         ORDER BY l.updated_at DESC
         LIMIT ? OFFSET ?`,
        [Number(limit), Number(offset)]
      )
    ]);

    const totalCount = countResult[0][0].totalCount;
    const lessons = dataResult[0];

    // 2. Trả về cả dữ liệu và tổng số lượng
    return { lessons, totalCount };

  } catch (error) {
    console.error('Lỗi khi lấy danh sách lessons (admin) model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Lấy danh sách tất cả các câu hỏi (CÓ PHÂN TRANG)
 */
export const getAllQuestionsAdmin = async (page, limit) => {
  try {
    const offset = (page - 1) * limit;

    // 1. Chạy 2 truy vấn song song
    const [countResult, dataResult] = await Promise.all([
      // Truy vấn 1: Đếm tổng số câu hỏi
      pool.query('SELECT COUNT(*) as totalCount FROM questions'),
      
      // Truy vấn 2: Lấy dữ liệu của trang hiện tại
      pool.query(
        `SELECT 
           q.id, q.question_text, q.question_type, q.skill_focus, c.name AS category_name 
         FROM questions q
         JOIN categories c ON q.category_id = c.id
         ORDER BY q.id DESC
         LIMIT ? OFFSET ?`,
        [Number(limit), Number(offset)]
      )
    ]);

    const totalCount = countResult[0][0].totalCount;
    const questions = dataResult[0];

    // Cắt bớt text (giữ nguyên logic cũ)
    questions.forEach(row => {
        if (row.question_text && row.question_text.length > 100) {
            row.question_text = row.question_text.substring(0, 100) + '...';
        }
    });

    // 2. Trả về
    return { questions, totalCount };

  } catch (error) {
    console.error('Lỗi khi lấy danh sách questions (admin) model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Lấy danh sách tất cả các đề thi (CÓ PHÂN TRANG)
 */
export const getAllQuizzesAdmin = async (page, limit) => {
  try {
    const offset = (page - 1) * limit;

    // 1. Chạy 2 truy vấn song song
    const [countResult, dataResult] = await Promise.all([
      // Truy vấn 1: Đếm tổng số đề thi
      // Chúng ta cần đếm từ một truy vấn con để COUNT() hoạt động đúng với GROUP BY (nếu cần)
      // Cách đơn giản hơn là chỉ cần đếm bảng quizzes
      pool.query('SELECT COUNT(*) as totalCount FROM quizzes'),
      
      // Truy vấn 2: Lấy dữ liệu của trang hiện tại (dùng lại query đã sửa)
      pool.query(
        `SELECT 
           q.id, q.title, q.time_limit_minutes, q.updated_at, 
           c.name AS category_name,
           COUNT(qq.question_id) AS question_count
         FROM quizzes q
         JOIN categories c ON q.category_id = c.id
         LEFT JOIN quiz_questions qq ON q.id = qq.quiz_id
         GROUP BY q.id, q.title, q.time_limit_minutes, q.updated_at, c.name
         ORDER BY q.updated_at DESC
         LIMIT ? OFFSET ?`,
        [Number(limit), Number(offset)]
      )
    ]);

    const totalCount = countResult[0][0].totalCount;
    const quizzes = dataResult[0];

    // 2. Trả về
    return { quizzes, totalCount };

  } catch (error) {
    console.error('Lỗi khi lấy danh sách quizzes (admin) model:', error);
    if (error.sqlMessage) {
        console.error('SQL Error:', error.sqlMessage);
    }
    throw error;
  }
};

/**
 * [ADMIN] Lấy danh sách tất cả các bộ từ vựng (CÓ PHÂN TRANG)
 * (Đã sửa lỗi SQL Error 'Unknown column' nếu cột updated_at chưa được thêm)
 */
export const getAllVocabularySetsAdmin = async (page, limit) => {
  try {
    const offset = (page - 1) * limit;

    // 1. Chạy 2 truy vấn song song
    const [countResult, dataResult] = await Promise.all([
      // Truy vấn 1: Đếm tổng số bộ
      pool.query('SELECT COUNT(*) as totalCount FROM vocabulary_sets'),
      
      // Truy vấn 2: Lấy dữ liệu của trang hiện tại
      // (Đảm bảo bạn đã thêm cột updated_at vào bảng vocabulary_sets)
      pool.query(
        `SELECT 
           vs.id, vs.title, vs.updated_at,
           c.name AS category_name,
           COUNT(vw.id) AS word_count
         FROM vocabulary_sets vs
         LEFT JOIN categories c ON vs.category_id = c.id
         LEFT JOIN vocabulary_words vw ON vs.id = vw.set_id
         GROUP BY vs.id, vs.title, vs.updated_at, c.name
         ORDER BY vs.updated_at DESC
         LIMIT ? OFFSET ?`,
        [Number(limit), Number(offset)]
      )
    ]);

    const totalCount = countResult[0][0].totalCount;
    const sets = dataResult[0];

    // 2. Trả về
    return { sets, totalCount };

  } catch (error) {
    console.error('Lỗi khi lấy danh sách vocabulary sets (admin) model:', error);
     if (error.sqlMessage) {
        console.error('SQL Error:', error.sqlMessage);
        // Nhắc nhở nếu quên thêm cột
        if (error.sqlMessage.includes("Unknown column 'vs.updated_at'")) {
            console.error("Gợi ý: Bạn quên chạy lệnh ALTER TABLE vocabulary_sets ADD COLUMN updated_at ... ?");
        }
    }
    throw error;
  }
};

/**
 * [ADMIN] Lấy dữ liệu thống kê cho Dashboard
 */
export const getDashboardStats = async () => {
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Chạy các truy vấn đếm (COUNT) song song
    const [
      [userCount],
      [lessonCount],
      [questionCount],
      [quizCount],
      [attemptCount]
    ] = await Promise.all([
      connection.query('SELECT COUNT(*) as count FROM users'),
      connection.query('SELECT COUNT(*) as count FROM lessons'),
      connection.query('SELECT COUNT(*) as count FROM questions'),
      connection.query('SELECT COUNT(*) as count FROM quizzes'),
      connection.query('SELECT COUNT(*) as count FROM user_quiz_attempts')
    ]);

    // 2. Lấy dữ liệu biểu đồ: Người dùng mới trong 7 ngày qua
    // (Lưu ý: Cú pháp này hoạt động tốt trên MySQL)
    const [userGrowth] = await connection.query(`
      SELECT 
        DATE(created_at) as date, 
        COUNT(id) as count
      FROM users
      WHERE created_at >= CURDATE() - INTERVAL 7 DAY
      GROUP BY DATE(created_at)
      ORDER BY date ASC;
    `);

    connection.release();

    // 3. Trả về đối tượng dữ liệu
    return {
      statCards: {
        totalUsers: userCount[0].count,
        totalLessons: lessonCount[0].count,
        totalQuestions: questionCount[0].count,
        totalQuizzes: quizCount[0].count,
        totalAttempts: attemptCount[0].count,
      },
      charts: {
        userGrowth: userGrowth,
      }
    };

  } catch (error) {
    if (connection) connection.release();
    console.error('Lỗi khi lấy dashboard stats (admin) model:', error);
    throw error;
  }
};

/**
 * [ADMIN] Lấy danh sách tất cả các lượt làm bài (CÓ PHÂN TRANG)
 */
export const getAllAttemptsAdmin = async (page, limit) => {
  try {
    const offset = (page - 1) * limit;

    // 1. Chạy 2 truy vấn song song
    const [countResult, dataResult] = await Promise.all([
      // Truy vấn 1: Đếm tổng số lượt làm bài
      pool.query('SELECT COUNT(*) as totalCount FROM user_quiz_attempts'),
      
      // Truy vấn 2: Lấy dữ liệu của trang hiện tại (JOIN với user và quiz)
      pool.query(
        `SELECT 
           uqa.id, uqa.status, uqa.final_score, uqa.start_time,
           u.full_name AS user_full_name,
           q.title AS quiz_title
         FROM user_quiz_attempts uqa
         JOIN users u ON uqa.user_id = u.id
         JOIN quizzes q ON uqa.quiz_id = q.id
         ORDER BY uqa.start_time DESC
         LIMIT ? OFFSET ?`,
        [Number(limit), Number(offset)]
      )
    ]);

    const totalCount = countResult[0][0].totalCount;
    const attempts = dataResult[0];

    // 2. Trả về
    return { attempts, totalCount };

  } catch (error) {
    console.error('Lỗi khi lấy danh sách attempts (admin) model:', error);
    if (error.sqlMessage) {
        console.error('SQL Error:', error.sqlMessage);
    }
    throw error;
  }
};

/**
 * [ADMIN] Lấy chi tiết 1 lần làm bài (dùng để review)
 * (Tương tự historyModel.getAttemptDetails nhưng không cần lọc userId)
 */
export const getAttemptDetailsAdmin = async (attemptId) => {
  let connection;
  try {
    connection = await pool.getConnection();
    await connection.query('SET SESSION group_concat_max_len = 100000;'); // Tăng giới hạn

    const query = `
      SELECT
          uqa.id AS attempt_id,
          uqa.final_score,
          uqa.start_time,
          uqa.end_time,
          q.id AS quiz_id,
          q.title AS quiz_title,
          u.full_name AS user_full_name, -- Lấy thêm tên user
          (
            SELECT CONCAT('[', 
                IFNULL(GROUP_CONCAT(
                    JSON_OBJECT(
                        'question_id', ques.id,
                        'question_order', qq.question_order,
                        'question_type', ques.question_type,
                        'question_text', ques.question_text,
                        'asset_url', ques.asset_url,
                        'user_answer_text', ua.user_answer_text,
                        'user_answer_option_id', ua.user_answer_option_id,
                        'user_answer_url', ua.user_answer_url,
                        'is_correct', ua.is_correct,
                        'ai_feedback', ua.ai_feedback,
                        'ai_score', ua.ai_score,
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
      JOIN
          users u ON uqa.user_id = u.id -- Lấy thêm tên user
      WHERE
          uqa.id = ?; -- Xóa điều kiện 'AND uqa.user_id = ?'
    `;

    const [rows] = await connection.query(query, [attemptId]);

    connection.release();

    if (!rows[0]) {
      return undefined; // Không tìm thấy
    }
    
    // Parse JSON lồng nhau (rất quan trọng)
    if (rows[0] && rows[0].results) {
      rows[0].results = JSON.parse(rows[0].results);
      if (rows[0].results.length > 0) {
        rows[0].results.forEach((item) => {
          if (item.options && typeof item.options === 'string') {
            item.options = JSON.parse(item.options);
          }
        });
      }
    } else {
      rows[0].results = [];
    }

    return rows[0];

  } catch (error) {
    if (connection) connection.release();
    console.error('Lỗi khi lấy chi tiết attempt (admin) model:', error);
    throw error;
  }
};