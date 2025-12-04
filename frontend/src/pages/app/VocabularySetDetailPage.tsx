import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../../services/api';
import type { VocabularyWord, VocabularySet } from '../../types';
import {
  Box, Typography, CircularProgress, Alert, Breadcrumbs, 
  Link, Paper, List, ListItem, ListItemText, IconButton, Divider
} from '@mui/material';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
// -----------------------------

type SetDetailParams = {
  id: string;
};

const VocabularySetDetailPage: React.FC = () => {
  const { id } = useParams<SetDetailParams>();
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [setInfo, setSetInfo] = useState<VocabularySet | null>(null); // State mới
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchSet = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Gọi song song 2 API
        const [wordsResponse, setsResponse] = await Promise.all([
            api.get<VocabularyWord[]>(`/api/vocabulary/sets/${id}/words`),
            api.get<VocabularySet[]>(`/api/vocabulary/sets`) // Lấy tất cả sets để tìm tên
        ]);
        
        setWords(wordsResponse.data);
        const currentSet = setsResponse.data.find(s => s.id.toString() === id);
        setSetInfo(currentSet || null);

      } catch (err: any) {
        console.error("Lỗi khi tải từ vựng:", err);
        setError(err.response?.data?.message || 'Không thể tải danh sách từ.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchSet();
  }, [id]);

  // Hàm phát âm thanh (giữ nguyên)
  const playAudio = (audioUrl: string) => {
    const audio = new Audio(audioUrl);
    audio.crossOrigin = "anonymous";
    audio.play().catch(e => console.error("Lỗi phát âm thanh:", e));
  };

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

    if (words.length === 0) {
      return <Typography sx={{ mt: 2 }}>Bộ từ vựng này chưa có từ nào.</Typography>;
    }

    return (
      <Paper sx={{ mt: 2 }}>
        <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
          {words.map((word, index) => (
            <React.Fragment key={word.id}>
              <ListItem
                // Nút âm thanh ở cuối
                secondaryAction={
                  word.audio_url ? (
                    <IconButton edge="end" aria-label="play audio" onClick={() => playAudio(word.audio_url!)}>
                      <VolumeUpIcon />
                    </IconButton>
                  ) : null
                }
              >
                <ListItemText
                  // Phần chính (Từ và loại từ)
                  primary={
                    <Typography component="span" variant="h6" color="primary.main">
                      {word.word}
                      {word.part_of_speech && (
                        <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1, fontStyle: 'italic' }}>
                          ({word.part_of_speech})
                        </Typography>
                      )}
                    </Typography>
                  }
                  // Phần phụ (Định nghĩa và Ví dụ)
                  secondary={
                    <>
                      <Typography component="span" display="block" variant="body1" color="text.primary">
                        {word.definition}
                      </Typography>
                      {word.example_sentence && (
                        <Typography component="span" display="block" variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                          "{word.example_sentence}"
                        </Typography>
                      )}
                    </>
                  }
                />
              </ListItem>
              {/* Thêm đường phân cách */}
              {index < words.length - 1 && <Divider component="li" />}
            </React.Fragment>
          ))}
        </List>
      </Paper>
    );
  };

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/vocabulary">
          Từ vựng
        </Link>
        <Typography color="text.primary">
          {isLoading ? '...' : (setInfo?.title || 'Chi tiết')}
        </Typography>
      </Breadcrumbs>
      
      <Typography variant="h4" component="h1" gutterBottom>
        {setInfo?.title}
      </Typography>
      <Typography variant="body1" color="text.secondary">
        {setInfo?.description}
      </Typography>
      
      {renderContent()}
    </Box>
  );
};

export default VocabularySetDetailPage;