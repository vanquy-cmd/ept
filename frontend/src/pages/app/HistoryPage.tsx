import React, { useEffect, useState, useMemo } from 'react';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import api from '../../services/api';
import type { RecentActivity } from '../../types';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
  Chip
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';

const HistoryPage: React.FC = () => {
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const [items, setItems] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const limitParam = searchParams.get('limit');
        const query = limitParam ? `?limit=${limitParam}` : '';
        const resp = await api.get<RecentActivity[]>(`/api/history/attempts${query}`);
        setItems(resp.data);
      } catch (err: any) {
        setError(err?.response?.data?.message || 'Không thể tải lịch sử làm bài.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [searchParams]);

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Lịch sử làm bài
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Danh sách tất cả các lần làm bài của bạn (mới nhất ở trên).
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 3,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : items.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <HistoryIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography variant="body1" color="text.secondary">
              Chưa có lịch sử làm bài.
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {items.map((activity, idx) => {
              const isCompleted = activity.status === 'completed';
              const dateLabel = new Date(activity.start_time).toLocaleString('vi-VN');
              return (
                <React.Fragment key={activity.attempt_id}>
                  <ListItem
                    component={RouterLink}
                    to={`/practice/attempt/${activity.attempt_id}/results`}
                    sx={{
                      px: 0,
                      py: 2,
                      textDecoration: 'none',
                      color: 'inherit',
                      '&:hover': { backgroundColor: 'action.hover', borderRadius: 1 }
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: isCompleted ? 'success.light' : 'warning.light' }}>
                        {isCompleted ? <CheckCircleIcon /> : <HourglassTopIcon />}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.quiz_title}
                      secondary={`${dateLabel} • Điểm: ${activity.final_score}%`}
                      primaryTypographyProps={{ fontWeight: 500 }}
                      secondaryTypographyProps={{ color: 'text.secondary' }}
                    />
                    <Chip
                      label={isCompleted ? 'Hoàn thành' : 'Đang làm'}
                      color={isCompleted ? 'success' : 'warning'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </ListItem>
                  {idx < items.length - 1 && <Divider component="li" />}
                </React.Fragment>
              );
            })}
          </List>
        )}
      </Paper>
    </Box>
  );
};

export default HistoryPage;

