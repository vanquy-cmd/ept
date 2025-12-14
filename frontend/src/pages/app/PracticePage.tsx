import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import type { QuizSummary } from '../../types'; // Import type
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Card, CardActionArea, CardContent, 
  CircularProgress, Alert, Chip, Stack
} from '@mui/material';
import TimerIcon from '@mui/icons-material/Timer';
import CategoryIcon from '@mui/icons-material/Category';
import FilterListIcon from '@mui/icons-material/FilterList';
// -----------------------------

const PracticePage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tải dữ liệu quizzes
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const quizzesRes = await api.get<QuizSummary[]>('/api/quizzes');
        setQuizzes(quizzesRes.data);
      } catch (err: any) {
        console.error("Lỗi khi tải dữ liệu:", err);
        setError(err.response?.data?.message || 'Không thể tải dữ liệu.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Filter quizzes theo category đã chọn
  const filteredQuizzes = useMemo(() => {
    if (!selectedCategory) {
      return quizzes;
    }
    return quizzes.filter(quiz => quiz.category_name === selectedCategory);
  }, [quizzes, selectedCategory]);

  // --- HÀM RENDERCONTENT (ĐÃ CẬP NHẬT VỚI CSS GRID) ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }

    if (filteredQuizzes.length === 0) {
      return (
        <Typography sx={{ mt: 2 }}>
          {selectedCategory ? `Không có đề thi nào thuộc chủ đề "${selectedCategory}".` : 'Chưa có đề thi nào.'}
        </Typography>
      );
    }

    return (
      <Box
        sx={{
          mt: 2,
          display: 'grid', // Sử dụng CSS Grid
          gap: 3, // Tương đương 'spacing={3}'
          gridTemplateColumns: {
            xs: '1fr', // 1 cột
            sm: 'repeat(2, 1fr)', // 2 cột
            md: 'repeat(3, 1fr)', // 3 cột
          },
          gridAutoRows: '1fr',
        }}
      >
        {filteredQuizzes.map((quiz) => (
          <Card 
            key={quiz.id} 
            elevation={3} // Thêm bóng đổ mặc định
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out', // 1. Thêm transition mượt
              '&:hover': {
                transform: 'translateY(-4px)', // 2. Di chuyển thẻ lên trên 4px
                boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)' // 3. Tăng bóng đổ
              }
            }}
          >
            <CardActionArea
              component={RouterLink}
              to={`/practice/quiz/${quiz.id}/start`}
              // SỬA 4: Yêu cầu CardActionArea co giãn để lấp đầy Card
              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <CardContent sx={{ width: '100%' }}>
                <Typography 
                  gutterBottom 
                  variant="h5" 
                  component="h2"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4,
                    maxHeight: '3.2em', // 2 lines * 1.4 line-height * 1.14 font-size
                  }}
                >
                  {quiz.title}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.5,
                    maxHeight: '4.5em', // 3 lines * 1.5 line-height
                  }}
                >
                  {quiz.description || 'Không có mô tả'}
                </Typography>
                
                <Stack direction="column" spacing={1}>
                  <Chip 
                    icon={<CategoryIcon />} 
                    label={quiz.category_name} 
                    variant="outlined" 
                    size="small" 
                    sx={{ justifyContent: 'flex-start', paddingLeft: '0.5em' }}
                  />
                  {quiz.time_limit_minutes && (
                     <Chip 
                        icon={<TimerIcon />} 
                        label={`${quiz.time_limit_minutes} phút`} 
                        variant="outlined" 
                        size="small" 
                        sx={{ justifyContent: 'flex-start', paddingLeft: '0.5em' }}
                      />
                  )}
                </Stack>
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    );
  };

  // Lấy danh sách category names từ quizzes (unique)
  const availableCategories = useMemo(() => {
    const categorySet = new Set(quizzes.map(q => q.category_name));
    return Array.from(categorySet).sort();
  }, [quizzes]);

  return (
    // Box này nằm bên trong StudentLayout
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Trung tâm Luyện tập
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Chọn một đề thi để bắt đầu làm bài.
      </Typography>
      
      {/* Filter by Category */}
      {availableCategories.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <FilterListIcon sx={{ color: 'text.secondary' }} />
            <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Lọc theo chủ đề:
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label="Tất cả"
              onClick={() => setSelectedCategory(null)}
              color={selectedCategory === null ? 'primary' : 'default'}
              variant={selectedCategory === null ? 'filled' : 'outlined'}
              sx={{ cursor: 'pointer' }}
            />
            {availableCategories.map((categoryName) => (
              <Chip
                key={categoryName}
                label={categoryName}
                onClick={() => setSelectedCategory(categoryName)}
                color={selectedCategory === categoryName ? 'primary' : 'default'}
                variant={selectedCategory === categoryName ? 'filled' : 'outlined'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Stack>
          {selectedCategory && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Đang hiển thị: <strong>{selectedCategory}</strong> ({filteredQuizzes.length} đề thi)
            </Typography>
          )}
        </Box>
      )}
      
      {/* Nội dung danh sách đề thi */}
      {renderContent()}
    </Box>
  );
};

export default PracticePage;