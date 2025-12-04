import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../../services/api';
import type { LessonDetail } from '../../types';

import {
  Box, Typography, CircularProgress, Alert, Breadcrumbs, Link, Paper
  } from '@mui/material';

type LessonDetailParams = {
  id: string;
};

// Hàm trợ giúp để chuyển đổi URL YouTube
const getEmbedUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'www.youtube.com' || urlObj.hostname === 'youtube.com') {
      const videoId = urlObj.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    return url;
  } catch (error) {
    return null;
  }
};

const LessonDetailPage: React.FC = () => {
  const { id } = useParams<LessonDetailParams>();
  
  const [lesson, setLesson] = useState<LessonDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchLesson = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<LessonDetail>(`/api/learning/lessons/${id}`);
        setLesson(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải chi tiết bài học.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchLesson();
  }, [id]);

  // Hàm render nội dung
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

    if (!lesson) {
      return <Typography sx={{ mt: 2 }}>Không tìm thấy bài học.</Typography>;
    }

    if (lesson.content_type === 'video') {
      const embedUrl = getEmbedUrl(lesson.content_body);
      if (embedUrl) {
        return (
          // Box để giữ tỷ lệ 16:9 cho video
          <Box sx={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 1, mt: 2 }}>
            <iframe
              src={embedUrl}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          </Box>
        );
      }
      return <Alert severity="warning" sx={{ mt: 2 }}>Không thể hiển thị video từ URL này.</Alert>;
    }

    // Nếu là 'text'
    return (
      <Paper sx={{ p: 3, mt: 2 }}>
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', lineHeight: '1.7' }}>
          {lesson.content_body}
        </Typography>
      </Paper>
    );
  };

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/learning">
          Học tập
        </Link>
        {lesson && (
          <Link component={RouterLink} underline="hover" color="inherit" to={`/learning/categories/${lesson.category_id}`}>
            Chủ đề
          </Link>
        )}
        <Typography color="text.primary">
          {isLoading ? '...' : (lesson?.title || 'Bài học')}
        </Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" component="h1" gutterBottom>
        {lesson?.title}
      </Typography>
      
      {renderContent()}
    </Box>
  );
};

export default LessonDetailPage;