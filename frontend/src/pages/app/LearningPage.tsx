import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { Category } from '../../types';
import { Link as RouterLink } from 'react-router-dom'; // Dùng để điều hướng

import {
  Alert, Card, CardActionArea, CardContent,
  Typography, Box
} from '@mui/material';

import HearingIcon from '@mui/icons-material/Hearing'; // Listening
import MenuBookIcon from '@mui/icons-material/MenuBook'; // Reading
import RecordVoiceOverIcon from '@mui/icons-material/RecordVoiceOver'; // Speaking
import CreateIcon from '@mui/icons-material/Create'; // Writing
import ExtensionIcon from '@mui/icons-material/Extension'; // General

import CategoryCardSkeleton from '../../components/CategoryCardSkeleton';
// -----------------------------

const LearningPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Giữ nguyên useEffect tải dữ liệu
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<Category[]>('/api/learning/categories');
        setCategories(response.data);
      } catch (err: any) {
        console.error("Lỗi khi tải chủ đề:", err);
        setError(err.response?.data?.message || 'Không thể tải danh sách chủ đề.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Hàm trợ giúp để lấy icon MUI dựa trên kỹ năng
  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'listening': return <HearingIcon sx={{ mr: 1 }} />;
      case 'reading': return <MenuBookIcon sx={{ mr: 1 }} />;
      case 'speaking': return <RecordVoiceOverIcon sx={{ mr: 1 }} />;
      case 'writing': return <CreateIcon sx={{ mr: 1 }} />;
      default: return <ExtensionIcon sx={{ mr: 1 }} />;
    }
  };

  // Hàm render nội dung sử dụng MUI Grid và Card
  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ mt: 2, display: 'grid', gap: 3,
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)',},
          }}
        >
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
          <CategoryCardSkeleton />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }

    if (categories.length === 0) {
      return <Typography sx={{ mt: 2 }}>Chưa có chủ đề học tập nào.</Typography>;
    }

    return (
      // Sử dụng Grid container
      <Box
        sx={{
          mt: 2,
          display: 'grid', // Sử dụng CSS Grid
          gap: 3, // Tương đương 'spacing={3}'
          // Định nghĩa các cột responsive:
          gridTemplateColumns: {
            xs: '1fr', // 1 cột trên màn hình siêu nhỏ
            sm: 'repeat(2, 1fr)', // 2 cột trên màn hình nhỏ
            md: 'repeat(3, 1fr)', // 3 cột trên màn hình trung bình
          },
          // QUAN TRỌNG: Yêu cầu các hàng tự động có chiều cao bằng nhau
          gridAutoRows: '1fr',
        }}
      >
        {categories.map((category) => (
          <Card 
            key={category.id} 
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
              to={`/learning/categories/${category.id}`}
              sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}
            >
              <CardContent sx={{ width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getSkillIcon(category.skill_focus)}
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
                      maxHeight: '3.2em',
                    }}
                  >
                    {category.name}
                  </Typography>
                </Box>
                <Typography 
                  variant="body2" 
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.5,
                    maxHeight: '4.5em',
                  }}
                >
                  {category.description || 'Không có mô tả'}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          // Kết thúc
        ))}
      </Box>
    );
  };

  return (
    // Box này nằm bên trong StudentLayout
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Trung tâm Học tập
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Chọn một chủ đề để bắt đầu học hoặc luyện tập.
      </Typography>
      
      {/* Nội dung danh sách chủ đề */}
      {renderContent()}
    </Box>
  );
};

export default LearningPage;