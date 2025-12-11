import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import type { DashboardData, RecentActivity } from '../../types';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, 
  Avatar, 
  Button, 
  CircularProgress, 
  List, 
  ListItem,
  ListItemAvatar, 
  ListItemText, 
  Paper, 
  Typography, 
  Alert,
  Divider,
  useTheme
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import HistoryIcon from '@mui/icons-material/History';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DiligenceChart from '../../components/DiligenceChart';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [history, setHistory] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const theme = useTheme();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setIsHistoryLoading(true);
        setError(null);
        // Lấy full lịch sử để biểu đồ chăm chỉ có đủ dữ liệu
        const [dashboardResp, historyResp] = await Promise.all([
          api.get<DashboardData>('/api/dashboard', {
            params: { limit: 'all' }
          }),
          api.get<RecentActivity[]>('/api/history/attempts', {
            params: { limit: 'all' }
          })
        ]);
        setData(dashboardResp.data);
        setHistory(historyResp.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải dữ liệu dashboard.');
      } finally {
        setIsLoading(false);
        setIsHistoryLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      );
    }

    if (!data) return null;

    const recentActivities = (data.recent_activity || []).slice(0, 8);

    return (
      <Box>
        {/* Thống kê tổng quan */}
        <Box sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
          gap: 3,
          mb: 4
        }}>
          {/* Thẻ điểm trung bình */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[3]
              }
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: 'primary.light', 
                color: 'primary.contrastText',
                mr: 2,
                width: 56,
                height: 56
              }}
            >
              <StarBorderIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Điểm trung bình
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {Math.round(data.average_score)}%
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Cập nhật hôm nay
              </Typography>
            </Box>
          </Paper>

          {/* Thẻ bài đã hoàn thành */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[3]
              }
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: 'success.light', 
                color: 'success.contrastText',
                mr: 2,
                width: 56,
                height: 56
              }}
            >
              <CheckCircleOutlineIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Bài đã hoàn thành
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {data.total_completed_quizzes}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Tổng số bài tập
              </Typography>
            </Box>
          </Paper>

          {/* Thẻ hoạt động gần đây */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[3]
              }
            }}
          >
            <Avatar 
              sx={{ 
                bgcolor: 'warning.light', 
                color: 'warning.contrastText',
                mr: 2,
                width: 56,
                height: 56
              }}
            >
              <HistoryIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                Hoạt động gần đây
              </Typography>
              <Typography variant="h4" fontWeight="bold">
                {recentActivities.length}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Trong 7 ngày qua
              </Typography>
            </Box>
          </Paper>
        </Box>

        {/* Phần nội dung chính */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, 
          gap: 3 
        }}>
          {/* Cột bên trái - Hoạt động gần đây */}
          <Paper 
            elevation={0}
            sx={{ 
              p: 3, 
              borderRadius: 2,
              border: '1px solid',
              borderColor: 'divider'
            }}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              mb: 3,
              pb: 2,
              borderBottom: '1px solid',
              borderColor: 'divider'
            }}>
              <Typography variant="h6" fontWeight="600">Hoạt động gần đây</Typography>
              <Button 
                component={RouterLink} 
                to="/history?limit=all" 
                size="small" 
                color="primary"
              >
                Xem tất cả
              </Button>
            </Box>
            
            {recentActivities.length > 0 ? (
              <List disablePadding>
                {recentActivities.map((activity, index) => (
                  <React.Fragment key={activity.attempt_id}>
                    <ListItem
                      component={RouterLink}
                      to={`/practice/attempt/${activity.attempt_id}/results`}
                      sx={{
                        px: 0,
                        py: 2,
                        textDecoration: 'none',
                        color: 'inherit',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          borderRadius: 1
                        }
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: 'primary.light' }}>
                          <HistoryIcon />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={activity.quiz_title}
                        secondary={`Điểm: ${activity.final_score}% • ${new Date(activity.start_time).toLocaleString('vi-VN')}`}
                        primaryTypographyProps={{
                          fontWeight: 500
                        }}
                        secondaryTypographyProps={{
                          color: 'text.secondary'
                        }}
                      />
                      <ChevronRightIcon color="action" />
                    </ListItem>
                    {index < recentActivities.length - 1 && (
                      <Divider component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box 
                sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  py: 4,
                  textAlign: 'center'
                }}
              >
                <HistoryIcon 
                  sx={{ 
                    fontSize: 48, 
                    color: 'text.disabled',
                    mb: 2
                  }} 
                />
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  Chưa có hoạt động nào gần đây
                </Typography>
                <Button 
                  variant="contained" 
                  component={RouterLink} 
                  to="/practice"
                  size="small"
                  sx={{ mt: 2 }}
                >
                  Bắt đầu luyện tập
                </Button>
              </Box>
            )}
          </Paper>

          {/* Cột bên phải - Biểu đồ chăm chỉ và truy cập nhanh */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <DiligenceChart 
              activities={history.length ? history : data.recent_activity} 
              loading={isLoading || isHistoryLoading}
            />
            
            <Paper 
              elevation={0}
              sx={{ 
                p: 3, 
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider'
              }}
            >
              <Typography variant="h6" fontWeight="600" gutterBottom>
                Truy cập nhanh
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button 
                  variant="contained" 
                  component={RouterLink} 
                  to="/practice"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  sx={{ 
                    justifyContent: 'flex-start',
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem'
                  }}
                >
                  Bắt đầu Luyện tập
                </Button>
                <Button 
                  variant="outlined" 
                  component={RouterLink} 
                  to="/learning"
                  size="large"
                  startIcon={<SchoolIcon />}
                  sx={{ 
                    justifyContent: 'flex-start',
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem'
                  }}
                >
                  Vào Trung tâm Học tập
                </Button>
                <Button 
                  variant="outlined" 
                  component={RouterLink} 
                  to="/vocabulary"
                  size="large"
                  startIcon={<MenuBookIcon />}
                  sx={{ 
                    justifyContent: 'flex-start',
                    py: 1.5,
                    textTransform: 'none',
                    fontSize: '1rem'
                  }}
                >
                  Học Từ vựng
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <Box>
      {/* Tiêu đề */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            color: 'text.primary'
          }}
        >
          Bảng điều khiển
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
          sx={{ 
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <span>Chào mừng trở lại,</span>
          <Box 
            component="span" 
            sx={{ 
              fontWeight: 500,
              color: 'primary.main'
            }}
          >
            {user?.full_name || 'Học viên'}!
          </Box>
          <span>Hãy xem tiến độ của bạn.</span>
        </Typography>
      </Box>
      
      {/* Nội dung thống kê và hoạt động */}
      {renderContent()}
    </Box>
  );
};

export default DashboardPage;