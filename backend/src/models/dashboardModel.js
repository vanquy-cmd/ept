import pool from '../config/db.js';

/**
 * Lấy các số liệu thống kê chính cho dashboard của người dùng
 */
export const getDashboardStats = async (userId) => {
  try {
    // Tổng quan chung
    const summaryQuery = `
      SELECT
          COUNT(id) AS total_completed_quizzes,
          AVG(final_score) AS average_score
      FROM
          user_quiz_attempts
      WHERE
          user_id = ? AND status = 'completed';
    `;

    // Thống kê theo kỹ năng (dựa trên skill_focus của questions)
    const bySkillQuery = `
      SELECT
          q.skill_focus AS skill,
          COUNT(DISTINCT uqa.id) AS attempts_count,
          AVG(uqa.final_score) AS avg_score
      FROM user_quiz_attempts uqa
      JOIN user_answers ua ON ua.attempt_id = uqa.id
      JOIN questions q ON ua.question_id = q.id
      WHERE
          uqa.user_id = ?
          AND uqa.status = 'completed'
          AND q.skill_focus IS NOT NULL
      GROUP BY q.skill_focus;
    `;

    const [summaryRows] = await pool.query(summaryQuery, [userId]);
    const [skillRows] = await pool.query(bySkillQuery, [userId]);

    const summary = summaryRows[0] || {};

    // Chuẩn hóa mảng skill_stats để frontend dùng
    const skillStats = (skillRows || []).map((row) => ({
      skill: row.skill,
      attempts_count: parseInt(row.attempts_count, 10) || 0,
      average_score: parseFloat(row.avg_score) || 0,
    }));

    return {
      total_completed_quizzes: parseInt(summary.total_completed_quizzes, 10) || 0,
      average_score: parseFloat(summary.average_score) || 0,
      skill_stats: skillStats,
    };
  } catch (error) {
    console.error('Lỗi khi lấy dashboard stats model:', error);
    throw error;
  }
};