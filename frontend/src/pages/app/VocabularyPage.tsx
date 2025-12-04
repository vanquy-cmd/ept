import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import type { VocabularySet } from '../../types'; // Import type
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Typography, Card, CardActionArea, CardContent,
  CircularProgress, Alert, Chip
} from '@mui/material';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
// -----------------------------

const VocabularyPage: React.FC = () => {
  const [sets, setSets] = useState<VocabularySet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Giữ nguyên useEffect tải dữ liệu
  useEffect(() => {
    const fetchVocabularySets = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<VocabularySet[]>('/api/vocabulary/sets');
        setSets(response.data);
      } catch (err: any) {
        console.error("Lỗi khi tải bộ từ vựng:", err);
        setError(err.response?.data?.message || 'Không thể tải danh sách.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVocabularySets();
  }, []);

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

    if (sets.length === 0) {
      return <Typography sx={{ mt: 2 }}>Chưa có bộ từ vựng nào.</Typography>;
    }

    return (
      <Box
        sx={{
          mt: 2,
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: '1fr', // 1 cột
            sm: 'repeat(2, 1fr)', // 2 cột
            md: 'repeat(3, 1fr)', // 3 cột
          },
          // QUAN TRỌNG: Yêu cầu các hàng tự động có chiều cao bằng nhau
          gridAutoRows: '1fr',
        }}
      >
        {sets.map((set) => (
          <Card 
            key={set.id} 
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
            <CardActionArea component={RouterLink} to={`/vocabulary/sets/${set.id}`}
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
                    maxHeight: '3.2em',
                  }}
                >
                  {set.title}
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
                    maxHeight: '4.5em',
                  }}
                >
                  {set.description || 'Không có mô tả'}
                </Typography>
                
                <Chip 
                  icon={<LibraryBooksIcon />} 
                  label={`${set.word_count} từ`} 
                  variant="outlined" 
                  size="small" 
                  sx={{ justifyContent: 'flex-start', paddingLeft: '0.5em' }}
                />
              </CardContent>
            </CardActionArea>
          </Card>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Trung tâm Từ vựng
      </Typography>
      <Typography variant="body1" color="text.secondary">
        Chọn một bộ từ vựng để bắt đầu học.
      </Typography>
      {renderContent()}
    </Box>
  );
};

export default VocabularyPage;