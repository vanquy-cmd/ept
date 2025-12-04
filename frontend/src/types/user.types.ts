// Định nghĩa kiểu dữ liệu cho Người dùng
export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'student' | 'admin';
  avatar_url?: string | null;
  created_at?: string;
}