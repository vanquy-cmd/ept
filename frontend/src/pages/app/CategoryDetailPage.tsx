import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../../services/api';
import type { LessonSummary, Category } from '../../types';

import { 
  Box, Typography, CircularProgress, Alert, Breadcrumbs, Link,
  List, ListItem, ListItemButton, ListItemIcon, ListItemText 
} from '@mui/material';

import ArticleIcon from '@mui/icons-material/Article'; 
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
// -----------------------------

type CategoryDetailParams = {
  id: string;
};

const CategoryDetailPage: React.FC = () => {
  const { id } = useParams<CategoryDetailParams>();
  
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchPageData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Gọi song song 2 API: lấy danh sách bài học VÀ lấy tên chủ đề
        const [lessonsResponse, categoriesResponse] = await Promise.all([
          api.get<LessonSummary[]>(`/api/learning/categories/${id}/lessons`),
          api.get<Category[]>(`/api/learning/categories`) // Lấy tất cả categories
        ]);
        setLessons(lessonsResponse.data);
        // Tìm tên category từ id
        const currentCategory = categoriesResponse.data.find(cat => cat.id.toString() === id);
        setCategory(currentCategory || null);
      } catch (err: any) {
        console.error("Lỗi khi tải dữ liệu trang:", err);
        setError(err.response?.data?.message || 'Không thể tải dữ liệu.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchPageData();
  }, [id]);

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

    if (lessons.length === 0) {
        return <Typography sx={{ mt: 2 }}>Chủ đề này chưa có bài học nào.</Typography>
    }

    return (
      // Sử dụng List của MUI
      <List sx={{ width: '100%', bgcolor: 'background.paper', mt: 2 }}>
        {lessons.map((lesson) => (
          <ListItem key={lesson.id} disablePadding>
            <ListItemButton
              component={RouterLink} // Biến thành Link
              to={`/learning/lessons/${lesson.id}`}
            >
              <ListItemIcon>
                {lesson.content_type === 'video' ? <PlayCircleOutlineIcon color="secondary" /> : <ArticleIcon color="primary" />}
              </ListItemIcon>
              <ListItemText 
                primary={lesson.title} 
                primaryTypographyProps={{ fontWeight: 500 }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    // Box này nằm bên trong StudentLayout
    <Box>
      {/* Breadcrumbs để điều hướng */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/learning">
          Học tập
        </Link>
        <Typography color="text.primary">
          {category ? category.name : (isLoading ? '...' : 'Chi tiết')}
        </Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" component="h1" gutterBottom>
        {category ? category.name : 'Các bài học'}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {category?.description || 'Chọn một bài học để bắt đầu.'}
      </Typography>
      
      {renderContent()}
    </Box>
  );
};

export default CategoryDetailPage;