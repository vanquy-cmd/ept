// Dữ liệu cho biểu đồ tăng trưởng
export interface UserGrowthData {
  date: string; // "YYYY-MM-DD"
  count: number;
}

// Dữ liệu cho các thẻ thống kê
export interface StatCardsData {
  totalUsers: number;
  totalLessons: number;
  totalQuestions: number;
  totalQuizzes: number;
  totalAttempts: number;
}

// Kiểu dữ liệu đầy đủ từ API /api/admin/dashboard-stats
export interface AdminDashboardStats {
  statCards: StatCardsData;
  charts: {
    userGrowth: UserGrowthData[];
  };
}