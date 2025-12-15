import {
  getAllQuizzes,
  getQuizDetailsById,
  getGradingDataForQuiz,
  createQuizAttempt,
  saveUserAnswers,
  updateQuizAttemptScore,
  createQuizWithQuestions,
  updateQuizWithQuestions,
  deleteQuiz
} from '../models/quizModel.js';
import { gradeWriting, gradeSpeaking } from '../utils/ai.js';
import pool from '../config/db.js';
import asyncHandler from 'express-async-handler';

/**
 * Controller để lấy danh sách tất cả Quizzes
 */
export const handleGetAllQuizzes = async (req, res) => {
  try {
    const quizzes = await getAllQuizzes();
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách quizzes.' });
  }
};

/**
 * Controller để lấy chi tiết một Quiz (bao gồm câu hỏi, lựa chọn)
 */
export const handleGetQuizDetails = async (req, res) => {
  try {
    const { id } = req.params; // Lấy quiz_id từ URL
    const quizDetails = await getQuizDetailsById(id);

    if (!quizDetails) {
      return res.status(404).json({ message: 'Không tìm thấy bài quiz.' });
    }
    
    res.status(200).json(quizDetails);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy chi tiết quiz.' });
  }
};

/**
 * Controller để nhận bài làm (submit) của Quiz
 * (PHIÊN BẢN ĐÃ SỬA LỖI RACE CONDITION)
 */
export const handleSubmitQuiz = asyncHandler(async (req, res) => {
  const quizId = req.params.id;
  const userId = req.user.id;
  const userAnswers = req.body.answers;

  console.log("\n🎯 SUBMIT QUIZ REQUEST");
  console.log("  Quiz ID:", quizId);
  console.log("  User ID:", userId);
  console.log("  Answers count:", userAnswers?.length || 0);

  if (!userAnswers || !Array.isArray(userAnswers)) {
    res.status(400);
    throw new Error('Định dạng bài nộp không hợp lệ.');
  }

  let connection;
  try {
    // 1. Bắt đầu Transaction
    console.log("\n[Transaction] Starting...");
    console.log("[Transaction] Pool status before getConnection:", {
      totalConnections: pool.pool?._allConnections?.length || 'N/A',
      freeConnections: pool.pool?._freeConnections?.length || 'N/A',
      queueLength: pool.pool?._connectionQueue?.length || 'N/A'
    });
    
    const connectionStartTime = Date.now();
    try {
      connection = await Promise.race([
        pool.getConnection(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('getConnection timeout after 20 seconds')), 20000)
        )
      ]);
    } catch (connError) {
      console.error("[Transaction] ✗ Failed to get connection:", connError.message);
      throw new Error(`Không thể lấy kết nối database: ${connError.message}`);
    }
    const connectionDuration = Date.now() - connectionStartTime;
    console.log(`[Transaction] ✓ Got connection in ${connectionDuration}ms`);
    console.log(`[Transaction] Connection ID: ${connection.threadId || 'N/A'}`);
    
    await connection.beginTransaction();
    console.log("[Transaction] ✓ Started");

    // 2. Tạo 'attempt'
    console.log("\n[Attempt] Creating...");
    const attemptId = await createQuizAttempt(userId, quizId, connection);
    console.log(`[Attempt] ✓ Created ID: ${attemptId}`);

    // 3. Lấy dữ liệu chấm điểm (gồm prompt, đáp án,...)
    // TÁCH RA: Query đọc không cần transaction, tránh lock conflict
    console.log("\n[Grading Data] Fetching...");
    console.log(`[Grading Data] Connection ID: ${connection.threadId || 'N/A'}`);
    console.log(`[Grading Data] Connection state: ${connection.state || 'unknown'}`);
    const gradingStartTime = Date.now();
    
    // Sử dụng pool.query thay vì connection.query để tránh lock trong transaction
    // Query đọc không cần transaction, chỉ cần transaction cho INSERT/UPDATE
    const questionsForGrading = await getGradingDataForQuiz(quizId, null);
    const gradingDuration = Date.now() - gradingStartTime;
    console.log(`[Grading Data] ✓ Fetched ${questionsForGrading.length} questions in ${gradingDuration}ms`);
    
    const questionsMap = new Map(
      questionsForGrading.map(q => [q.question_id, q])
    );

    let totalScore = 0;
    let gradedQuestionCount = 0;

    console.log("\n[Processing] Starting to grade answers...");

    // Tạo mảng 'answerProcessingPromises'
    // Mảng này sẽ chứa các promise xử lý *từng* câu trả lời
    const answerProcessingPromises = userAnswers.map(async (userAnswer, index) => {
      const questionId = userAnswer.question_id;
      const questionData = questionsMap.get(questionId);

      console.log(`\n  [Q${index + 1}] Question ID: ${questionId}`);

      if (!questionData) {
        console.log(`  [Q${index + 1}] ⚠️  Skipped (not in quiz)`);
        return null; // Bỏ qua nếu câu hỏi lạ
      }

      // Chuẩn bị object kết quả
      const resultData = {
        attempt_id: attemptId,
        question_id: questionId,
        user_answer_option_id: userAnswer.option_id || null,
        user_answer_text: userAnswer.answer_text || null,
        user_answer_url: userAnswer.user_answer_url || null,
        is_correct: null,
        ai_feedback: null, // Mặc định là null
        ai_score: 0        // Mặc định là 0
      };
      
      gradedQuestionCount++;

      console.log(`  [Q${index + 1}] Type: ${questionData.question_type}`);

      // Chấm điểm
      switch (questionData.question_type) {
        case 'multiple_choice':
          resultData.is_correct = (userAnswer.option_id == questionData.correct_option_id);
          resultData.ai_score = resultData.is_correct ? 100 : 0;
          totalScore += resultData.ai_score;
          console.log(`  [Q${index + 1}] ✓ MCQ graded: ${resultData.ai_score}`);
          break;
        
        case 'fill_blank':
          resultData.is_correct = (userAnswer.answer_text?.trim().toLowerCase() === questionData.correct_answer?.trim().toLowerCase());
          resultData.ai_score = resultData.is_correct ? 100 : 0;
          totalScore += resultData.ai_score;
          console.log(`  [Q${index + 1}] ✓ Fill Blank graded: ${resultData.ai_score}`);
          break;

        case 'essay':
        case 'writing':
          if (userAnswer.answer_text) {
            try {
              console.log(`  [Q${index + 1}] 📝 Calling AI for Writing/Essay...`);
              const aiResult = await gradeWriting(questionData.question_text, userAnswer.answer_text);
              resultData.ai_score = aiResult.score;
              resultData.ai_feedback = aiResult.feedback;
              totalScore += aiResult.score;
              console.log(`  [Q${index + 1}] ✅ Writing graded: ${aiResult.score}/100`);
            } catch (aiError) {
              console.error(`  [Q${index + 1}] ❌ AI Error:`, aiError.message);
              throw aiError;
            }
          } else {
             resultData.ai_feedback = "Không nộp bài.";
             resultData.ai_score = 0;
             console.log(`  [Q${index + 1}] ⚠️  No answer submitted`);
          }
          break;

        case 'speaking':
          if (userAnswer.user_answer_url) {
            try {
              console.log(`  [Q${index + 1}] 🎤 Calling AI for Speaking...`);
              const aiResult = await gradeSpeaking(questionData.question_text, userAnswer.user_answer_url);
              resultData.ai_score = aiResult.score;
              resultData.ai_feedback = aiResult.feedback;
              totalScore += aiResult.score;
              console.log(`  [Q${index + 1}] ✅ Speaking graded: ${aiResult.score}/100`);
            } catch (aiError) {
              console.error(`  [Q${index + 1}] ❌ AI Error:`, aiError.message);
              
              // Kiểm tra nếu là lỗi AccessDenied từ S3
              if (aiError.message && aiError.message.includes('AccessDenied') && aiError.message.includes('GetObject')) {
                console.error(`\n⚠️  [Q${index + 1}] QUAN TRỌNG: IAM user không có quyền GetObject từ S3!`);
                console.error('   Vui lòng cập nhật IAM policy để thêm quyền s3:GetObject.');
                console.error('   Xem file backend/AWS_IAM_FIX.md để biết cách sửa.\n');
              }
              
              throw aiError;
            }
          } else {
             resultData.ai_feedback = "Không nộp bài.";
             resultData.ai_score = 0;
             console.log(`  [Q${index + 1}] ⚠️  No audio submitted`);
          }
          break;
        
        default:
          gradedQuestionCount--; // Không chấm loại này
          console.log(`  [Q${index + 1}] ⚠️  Unknown type: ${questionData.question_type}`);
      }
      
      // Trả về dữ liệu đã xử lý
      return resultData;
    }); // Hết .map

    // 4. CHỜ TẤT CẢ CÁC PROMISE XỬ LÝ (bao gồm cả AI) HOÀN TẤT
    console.log("\n[Processing] Waiting for all promises...");
    const processedResults = await Promise.all(answerProcessingPromises);
    console.log("[Processing] ✓ All promises resolved");

    // 5. Tính điểm trung bình
    const finalScore = (gradedQuestionCount > 0) ? (totalScore / gradedQuestionCount) : 0;
    console.log(`\n[Score] Total: ${totalScore}, Count: ${gradedQuestionCount}, Final: ${finalScore.toFixed(2)}`);
    
    // 6. Chuẩn bị mảng 2 chiều để lưu vào CSDL
    const answersToSave = processedResults
      .filter(r => r !== null) // Lọc bỏ các câu hỏi bị null (nếu có)
      .map(r => [
        r.attempt_id,
        r.question_id,
        r.user_answer_option_id,
        r.user_answer_text,
        r.user_answer_url,
        r.is_correct,
        r.ai_feedback, // <-- Bây giờ giá trị này đã được AI cập nhật
        r.ai_score     // <-- Bây giờ giá trị này đã được AI cập nhật
      ]);

    // 7. Lưu tất cả câu trả lời vào DB (với dữ liệu AI chính xác)
    console.log("\n[Database] Saving answers...");
    if (answersToSave.length > 0) {
      await saveUserAnswers(answersToSave, connection);
      console.log(`[Database] ✓ Saved ${answersToSave.length} answers`);
    }

    // 8. Cập nhật điểm tổng kết
    console.log("\n[Database] Updating attempt score...");
    await updateQuizAttemptScore(attemptId, finalScore, connection);
    console.log("[Database] ✓ Score updated");
    
    // 9. Commit Transaction
    console.log("\n[Transaction] Committing...");
    await connection.commit();
    console.log("[Transaction] ✓ Committed");

    console.log("\n✅ SUBMIT SUCCESS\n");

    // 10. Trả kết quả về
    res.status(200).json({
      message: 'Nộp bài thành công! AI đã chấm điểm.',
      attemptId: attemptId,
      score: finalScore.toFixed(2),
      totalGraded: gradedQuestionCount
    });

  } catch (error) {
    // 11. Nếu có lỗi (kể cả lỗi Gemini API) -> Rollback
    if (connection) {
      console.log("\n[Transaction] Rolling back...");
      await connection.rollback();
      console.log("[Transaction] ✓ Rolled back");
    }
    
    console.error('\n❌❌❌ SUBMIT QUIZ ERROR ❌❌❌');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack?.split('\n').slice(0, 5).join('\n'));
    
    // Kiểm tra nếu là lỗi AccessDenied từ S3
    if (error.message && error.message.includes('AccessDenied') && error.message.includes('GetObject')) {
      console.error('\n⚠️  QUAN TRỌNG: IAM user không có quyền GetObject từ S3!');
      console.error('   Vui lòng cập nhật IAM policy để thêm quyền s3:GetObject.');
      console.error('   Xem file backend/AWS_IAM_FIX.md để biết cách sửa.');
      console.error('   Hoặc xem hướng dẫn trong file README.md\n');
    }
    
    console.error('❌❌❌❌❌❌❌❌❌❌❌❌❌❌❌\n');
    
    // Gửi lỗi cụ thể về frontend
    let userFriendlyMessage = 'Lỗi khi nộp bài';
    if (error.message && error.message.includes('AccessDenied') && error.message.includes('GetObject')) {
      userFriendlyMessage = 'Lỗi quyền truy cập S3: IAM user không có quyền tải file. Vui lòng liên hệ admin để cập nhật IAM policy.';
    }
    
    res.status(500).json({ 
      message: userFriendlyMessage,
      error: error.message
    });
  } finally {
    // 12. Luôn luôn trả connection về pool
    if (connection) {
      connection.release();
      console.log("[Connection] Released\n");
    }
  }
});

// --- CÁC HÀM CỦA ADMIN ---

/**
 * [ADMIN] Controller để tạo Quiz mới
 */
export const handleCreateQuiz = async (req, res) => {
  try {
    const { category_id, title, description, time_limit_minutes, questionIds, asset_url } = req.body;

    // 1. Validation
    if (!category_id || !title || !questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ message: 'Vui lòng điền các trường bắt buộc và mảng questionIds.' });
    }

    // 2. Tách dữ liệu
    const quizData = {
      category_id,
      title,
      description: description || null,
      time_limit_minutes: time_limit_minutes || null,
      asset_url: asset_url || null // Thêm asset_url cho quiz
    };

    const newQuizId = await createQuizWithQuestions(quizData, questionIds);
    
    res.status(201).json({ 
      message: 'Tạo đề thi thành công.', 
      quizId: newQuizId 
    });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi tạo đề thi.' });
  }
};

/**
 * [ADMIN] Controller để cập nhật Quiz
 */
export const handleUpdateQuiz = async (req, res) => {
  try {
    const { id } = req.params; // Lấy quizId từ URL
    const { category_id, title, description, time_limit_minutes, questionIds, asset_url } = req.body;

    // 1. Validation
    if (!category_id || !title || !questionIds || !Array.isArray(questionIds)) {
      return res.status(400).json({ message: 'Vui lòng điền các trường bắt buộc và mảng questionIds.' });
    }
    
    // 2. Tách dữ liệu
    const quizData = {
      category_id,
      title,
      description: description || null,
      time_limit_minutes: time_limit_minutes || null,
      asset_url: asset_url || null // Thêm asset_url cho quiz
    };

    // 3. Gọi hàm update
    await updateQuizWithQuestions(id, quizData, questionIds);
    
    res.status(200).json({ message: 'Cập nhật đề thi thành công.' });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi cập nhật đề thi.' });
  }
};

/**
 * [ADMIN] Controller để xóa Quiz
 */
export const handleDeleteQuiz = async (req, res) => {
  try {
    const { id } = req.params;
    const affectedRows = await deleteQuiz(id);

    if (affectedRows === 0) {
      return res.status(404).json({ message: 'Không tìm thấy đề thi để xóa.' });
    }

    res.status(200).json({ message: 'Xóa đề thi thành công.' });

  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi xóa đề thi.' });
  }
};