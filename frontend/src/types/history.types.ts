// Định nghĩa kiểu cho một Lựa chọn (để review)
export interface ResultOption {
  id: number;
  option_text: string;
  is_correct: boolean;
}

// Định nghĩa kiểu cho một Câu hỏi/Kết quả (từ API history)
export interface AttemptResultItem {
  question_id: number;
  question_text: string;
  question_type: string;
  asset_url: string | null;
  user_answer_text: string | null;
  user_answer_option_id: number | null;
  user_answer_url: string | null;
  user_answer_signed_url?: string | null;
  is_correct: boolean | null;
  ai_feedback: string | null;
  ai_score: string | null;
  correct_answer_text: string | null;
  options: ResultOption[] | null;
}

// Kiểu tóm tắt cho danh sách Admin (MỚI)
export interface AdminAttemptSummary {
  id: number;
  status: 'completed' | 'in_progress';
  final_score: string;
  start_time: string;
  user_full_name: string; // Tên học viên
  quiz_title: string; // Tên đề thi
}

// Định nghĩa kiểu cho Chi tiết Lịch sử/Kết quả (từ API /api/history/attempts/:id)
export interface AttemptDetails {
  attempt_id: number;
  final_score: string;
  start_time: string;
  end_time: string;
  quiz_id: number;
  quiz_title: string;
  user_full_name?: string;
  results: AttemptResultItem[];
}