// Các types liên quan đến Học tập (Bài học)
export interface Category {
  id: number;
  name: string;
  description: string | null;
  skill_focus: 'listening' | 'reading' | 'speaking' | 'writing' | 'general';
}

export interface LessonSummary {
  id: number;
  title: string;
  content_type: 'text' | 'video';
}

export interface LessonDetail {
  id: number;
  category_id: number;
  title: string;
  content_type: 'text' | 'video';
  content_body: string;
  created_at: string;
  updated_at: string;
}

// Kiểu tóm tắt bài học cho danh sách Admin
export interface AdminLessonSummary {
  id: number;
  title: string;
  content_type: 'text' | 'video';
  updated_at: string;
  category_name: string;
}