import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { QuizDetail, UserAnswerValue, SubmitQuizResponse } from '../../types';
import QuestionRenderer from '../../components/QuestionRenderer';
import {
  Box, Paper, Typography, CircularProgress, Button, LinearProgress, Chip, Divider, Alert
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';
import DoneIcon from '@mui/icons-material/Done';
// -----------------------------

type QuizDoingParams = {
  id: string;
};

// Hàm định dạng thời gian (giây -> MM:SS)
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const QuizDoingPage: React.FC = () => {
  const { id } = useParams<QuizDoingParams>();
  const navigate = useNavigate();

  // --- Giữ nguyên toàn bộ State và Refs ---
  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState(new Map<number, UserAnswerValue>());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const answersRef = useRef(userAnswers);
  answersRef.current = userAnswers;
  const uploadFunctionsRef = useRef(new Map<number, () => Promise<void>>());

  // 1. Tải chi tiết đề thi và Khởi tạo Timer
  useEffect(() => {
    if (!id) return;
    const fetchQuizDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<QuizDetail>(`/api/quizzes/${id}/start`);
        setQuiz(response.data);
        
        // Khởi tạo timer
        if (response.data.time_limit_minutes) {
          setTimeRemaining(response.data.time_limit_minutes * 60);
        } else {
          setTimeRemaining(-1); // -1 nghĩa là không giới hạn
        }
        
      } catch (err: any) {
        console.error("Lỗi khi tải đề thi:", err);
        setError(err.response?.data?.message || 'Không thể tải đề thi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuizDetails();
  }, [id]);

  // 2. Logic NỘP BÀI (tách ra)
  // Dùng useCallback để timer có thể gọi mà không tạo lại hàm
  const submitQuiz = useCallback(async () => {
    if (isSubmitting || !id) return; // Ngăn nộp 2 lần
    
    setIsSubmitting(true);

    try {
      // Tự động upload các audio chưa upload (nếu có)
      const uploadPromises: Promise<void>[] = [];
      uploadFunctionsRef.current.forEach((uploadFn) => {
        if (uploadFn) {
          uploadPromises.push(uploadFn().catch(err => {
            console.error("Lỗi khi tự động upload audio:", err);
            // Không throw để không chặn việc submit các câu hỏi khác
            // Nhưng vẫn log lỗi để debug
          }));
        }
      });
      
      if (uploadPromises.length > 0) {
        try {
          await Promise.all(uploadPromises);
          // Đợi một chút để state cập nhật (answersRef đã được cập nhật trong handleAnswerChange)
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (uploadErr) {
          console.error("Một số audio không thể upload:", uploadErr);
          // Tiếp tục submit dù có lỗi upload (có thể người dùng đã upload thủ công)
        }
      }

      // Đợi một chút để đảm bảo state đã được cập nhật sau khi upload
      // answersRef đã được cập nhật trong handleAnswerChange khi upload thành công
      await new Promise(resolve => setTimeout(resolve, 300));

      // Chuyển Map thành mảng mà backend yêu cầu
      // Sử dụng answersRef vì nó đã được cập nhật ngay lập tức trong handleAnswerChange
      const answersArray = Array.from(answersRef.current.entries()).map(([qId, ans]) => ({
        question_id: qId,
        ...ans
      }));
      
      console.log("Submitting answers:", answersArray.length, "questions");

      // Gọi API nộp bài
      const response = await api.post<SubmitQuizResponse>(`/api/quizzes/${id}/submit`, { 
        answers: answersArray 
      });
      
      const { attemptId } = response.data;
      
      // Chuyển hướng đến trang kết quả
      navigate(`/practice/attempt/${attemptId}/results`, { replace: true });

    } catch (err: any) {
      console.error("Lỗi khi nộp bài:", err);
      setError(err.response?.data?.message || 'Không thể nộp bài.');
      setIsSubmitting(false); // Cho phép thử lại nếu lỗi
    }
  }, [id, isSubmitting, navigate]);


  // 3. Logic Đồng hồ đếm ngược (Timer)
  useEffect(() => {
    if (isLoading || timeRemaining === null || timeRemaining === -1) {
      return; // Chưa tải xong, hoặc không giới hạn thời gian
    }

    if (timeRemaining === 0) {
      // Hết giờ -> Tự động nộp
      alert("Đã hết giờ! Bài làm của bạn sẽ được nộp tự động.");
      submitQuiz();
      return;
    }

    const timerId = setInterval(() => {
      setTimeRemaining(prevTime => (prevTime ? prevTime - 1 : 0));
    }, 1000);

    // Dọn dẹp
    return () => clearInterval(timerId);
  }, [isLoading, timeRemaining, submitQuiz]);


  // 4. Hàm cập nhật câu trả lời (callback)
  const handleAnswerChange = (questionId: number, answer: UserAnswerValue) => {
    setUserAnswers(prevMap => {
      const newMap = new Map(prevMap).set(questionId, answer);
      // Cập nhật ref ngay lập tức
      answersRef.current = newMap;
      return newMap;
    });
  };

  // 4b. Hàm để lưu upload function từ QuestionRenderer
  const handleUploadReady = (questionId: number, uploadFn: () => Promise<void>) => {
    uploadFunctionsRef.current.set(questionId, uploadFn);
  };

  // 5. Hàm điều hướng câu hỏi
  const handleNext = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // 6. Logic render
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Đang tải đề thi...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
  }

  if (!quiz || quiz.questions.length === 0) {
    return <Alert severity="warning" sx={{ mt: 2 }}>Đề thi này không có câu hỏi.</Alert>;
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const progress = (currentQuestionIndex + 1) / quiz.questions.length * 100;

  return (
    // Sử dụng Paper làm khung chính
    <Paper elevation={3} sx={{ p: 3, maxWidth: '900px', margin: 'auto' }}>
      {/* Header: Tiêu đề và Đồng hồ */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5" component="h1">
          {quiz.quiz_title}
        </Typography>
        <Chip
          icon={<TimerIcon />}
          label={timeRemaining === -1 ? 'Không giới hạn' : formatTime(timeRemaining || 0)}
          color={timeRemaining !== null && timeRemaining < 60 ? 'error' : 'primary'}
          variant="filled"
          sx={{ fontSize: '1rem', fontWeight: 600, px: 1 }}
        />
      </Box>

      {/* Video chung cho đề thi (nếu có) */}
      {quiz.quiz_video_url && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Video
          </Typography>
          <video
            controls
            src={quiz.quiz_video_url}
            crossOrigin="anonymous"
            style={{ width: '100%', maxHeight: '500px', borderRadius: '8px' }}
          >
            Trình duyệt của bạn không hỗ trợ video.
          </video>
        </Box>
      )}

      {/* Audio chung cho bài Listening (nếu có) */}
      {quiz.quiz_asset_url && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            File nghe
          </Typography>
          <audio
            controls
            src={quiz.quiz_asset_url}
            crossOrigin="anonymous"
            style={{ width: '100%' }}
          >
            Trình duyệt của bạn không hỗ trợ audio.
          </audio>
        </Box>
      )}

      {/* Thanh tiến trình */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          Câu hỏi {currentQuestionIndex + 1} / {quiz.questions.length}
        </Typography>
        <LinearProgress variant="determinate" value={progress} />
      </Box>
      
      <Divider sx={{ my: 2 }} />

      {/* Nội dung câu hỏi (từ QuestionRenderer) */}
      <Box sx={{ minHeight: '300px', p: 2 }}>
        <QuestionRenderer
          question={currentQuestion}
          currentAnswer={userAnswers.get(currentQuestion.question_id)}
          onAnswerChange={handleAnswerChange}
          onUploadReady={(uploadFn) => handleUploadReady(currentQuestion.question_id, uploadFn)}
        />
      </Box>

      <Divider sx={{ my: 2 }} />

      {/* Thanh điều hướng (Next/Prev/Submit) */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button 
          onClick={handlePrev} 
          disabled={currentQuestionIndex === 0 || isSubmitting}
          variant="outlined"
          startIcon={<NavigateBeforeIcon />}
        >
          Câu trước
        </Button>
        
        {!isLastQuestion && (
          <Button 
            onClick={handleNext} 
            disabled={isSubmitting}
            variant="contained"
            endIcon={<NavigateNextIcon />}
          >
            Câu tiếp theo
          </Button>
        )}
        
        {isLastQuestion && (
          <Button 
            onClick={submitQuiz} 
            disabled={isSubmitting}
            variant="contained"
            color="success" // Màu xanh lá
            startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <DoneIcon />}
          >
            {isSubmitting ? 'Đang nộp...' : 'NỘP BÀI'}
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default QuizDoingPage;