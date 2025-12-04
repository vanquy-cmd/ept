// Các types liên quan đến Bảng điều khiển
export interface RecentActivity {
  attempt_id: number;
  start_time: string;
  final_score: string;
  status: 'completed' | 'in_progress';
  quiz_title: string;
}

export interface DashboardData {
  total_completed_quizzes: number;
  average_score: number;
  recent_activity: RecentActivity[];
}