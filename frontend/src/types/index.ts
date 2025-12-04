// Đây là tệp trung tâm
// Nó tái xuất khẩu TẤT CẢ các types từ các tệp con.
// (Sử dụng 'export type *' để đảm bảo chúng chỉ được import dưới dạng types)

export type * from './user.types';
export type * from './dashboard.types';
export type * from './learning.types';
export type * from './quiz.types';
export type * from './history.types';
export type * from './vocabulary.types';
export type * from './quiz.types';
export type * from './vocabulary.types';
export type * from './admin.types';

// Kiểu dữ liệu chung cho phản hồi API có phân trang
export interface PaginatedResponse<T> {
  data: T[]; // Mảng chứa dữ liệu (ví dụ: User[])
  currentPage: number;
  totalPages: number;
  totalCount: number;
}