import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { AdminDashboardStats, UserGrowthData } from '../../types';

// --- THÊM IMPORT CỦA MUI VÀ RECHARTS ---
import { Box, Typography, Grid, Paper, CircularProgress, Alert, Avatar } from '@mui/material';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts'; // Import Recharts

// Import Icons
import PeopleIcon from '@mui/icons-material/People';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import PlayCircleFilledIcon from '@mui/icons-material/PlayCircleFilled';
// ------------------------------------

// Component Thẻ Thống kê Tái sử dụng
interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactElement;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <Paper 
    elevation={3} 
    sx={{ 
      p: 2, 
      display: 'flex', 
      alignItems: 'center', 
      height: '100px' 
    }}
  >
    <Avatar sx={{ bgcolor: color, width: 56, height: 56, mr: 2 }}>
      {icon}
    </Avatar>
    <Box>
      <Typography color="text.secondary" noWrap>{title}</Typography>
      <Typography variant="h4" component="p" fontWeight="bold">
        {value}
      </Typography>
    </Box>
  </Paper>
);

// Component Biểu đồ Tăng trưởng Người dùng
interface UserChartProps {
  data: UserGrowthData[];
}

const UserGrowthChart: React.FC<UserChartProps> = ({ data }) => {
  // Định dạng lại ngày tháng cho dễ đọc
  const formattedData = data.map(item => ({
    // Tách lấy ngày và tháng: "2025-10-30" -> "30/10"
    date: new Date(item.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    'Người dùng mới': item.count,
  }));

  return (
    <Paper elevation={3} sx={{ p: 2, height: '400px', mt: 3 }}>
      <Typography variant="h6" gutterBottom>Người dùng mới (7 ngày qua)</Typography>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={formattedData}
          margin={{ top: 5, right: 20, left: -20, bottom: 40 }} // Tăng bottom margin cho label
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            angle={-45} // Xoay label
            textAnchor="end" // Căn lề
            height={60} // Tăng chiều cao cho XAxis
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend verticalAlign="top" />
          <Line 
            type="monotone" 
            dataKey="Người dùng mới" 
            stroke="#8884d8" 
            strokeWidth={2}
            activeDot={{ r: 8 }} 
          />
        </LineChart>
      </ResponsiveContainer>
    </Paper>
  );
};


// Component Trang Dashboard Chính
const AdminDashboardPage: React.FC = () => {
  const [data, setData] = useState<AdminDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<AdminDashboardStats>('/api/admin/dashboard-stats');
        setData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!data) {
    return <Typography>Không có dữ liệu.</Typography>;
  }

  const { statCards, charts } = data;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Tổng quan
      </Typography>

      {/* Grid chứa các thẻ thống kê */}
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard title="Tổng số Người dùng" value={statCards.totalUsers} icon={<PeopleIcon />} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard title="Tổng số Bài học" value={statCards.totalLessons} icon={<SchoolIcon />} color="#388e3c" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard title="Tổng số Câu hỏi" value={statCards.totalQuestions} icon={<QuestionAnswerIcon />} color="#f57c00" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard title="Tổng số Đề thi" value={statCards.totalQuizzes} icon={<QuizIcon />} color="#d32f2f" />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2.4}>
          <StatCard title="Tổng lượt làm bài" value={statCards.totalAttempts} icon={<PlayCircleFilledIcon />} color="#7b1fa2" />
        </Grid>
      </Grid>
      
      {/* Grid chứa Biểu đồ */}
      <Grid container spacing={3}>
         <Grid item xs={12} lg={8}>
            {charts.userGrowth.length > 0 ? (
                <UserGrowthChart data={charts.userGrowth} />
            ) : (
                <Paper elevation={3} sx={{ p: 2, height: '400px', mt: 3, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography>Chưa có dữ liệu tăng trưởng người dùng.</Typography>
                </Paper>
            )}
         </Grid>
         <Grid item xs={12} lg={4}>
            {/* Bạn có thể thêm biểu đồ tròn (Pie Chart) ở đây, ví dụ: Phân bố Quiz theo chủ đề */}
         </Grid>
      </Grid>

    </Box>
  );
};

export default AdminDashboardPage; 