// Các types liên quan đến Luyện tập (Đề thi)
export interface QuizSummary {
  id: number;
  title: string;
  description: string | null;
  time_limit_minutes: number | null;
  category_name: string;
}

export interface QuizQuestionOption {
  option_id: number;
  option_text: string;
  is_correct?: boolean | number;
}

export interface QuizQuestion {
  question_id: number;
  id?: number;
  category_id?: number;
  question_order: number;
  skill_focus: 'listening' | 'reading' | 'speaking' | 'writing';
  question_type: 'multiple_choice' | 'fill_blank' | 'essay' | 'speaking';
  question_text: string;
  asset_url: string | null;
  options: QuizQuestionOption[] | null;
  correct_answer?: string | null;
}

export interface QuizDetail {
  quiz_id: number;
  category_id: number;
  quiz_title: string;
  quiz_description: string | null;
  time_limit_minutes: number | null;
  quiz_asset_url?: string | null; // URL file audio/image cho quiz (đặc biệt cho Listening)
  questions: QuizQuestion[];
}

// Định nghĩa kiểu cho CÂU TRẢ LỜI của người dùng (lưu ở state)
export type UserAnswerValue = {
  option_id?: number | null;     // Dùng cho trắc nghiệm
  answer_text?: string | null;   // Dùng cho điền từ, viết luận
  user_answer_url?: string | null; // Dùng cho bài nói
}

// Định nghĩa kiểu cho Dữ liệu trả về khi nộp bài
export interface SubmitQuizResponse {
  attemptId: number;
  score: string;
  totalGraded: number;
}

// Kiểu tóm tắt câu hỏi cho danh sách Admin
export interface AdminQuestionSummary {
  id: number;
  question_text: string; // Đã được cắt ngắn
  question_type: 'multiple_choice' | 'fill_blank' | 'essay' | 'speaking';
  skill_focus: 'listening' | 'reading' | 'speaking' | 'writing';
  category_name: string;
}

// Kiểu tóm tắt đề thi cho danh sách Admin
export interface AdminQuizSummary {
  id: number;
  title: string;
  time_limit_minutes: number | null;
  updated_at: string;
  category_name: string;
  question_count: number; // Đã được đếm bởi backend
}