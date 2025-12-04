import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { QuizDetail } from '../../types';
import {
  Box, Typography, CircularProgress, Alert, Breadcrumbs, Link,
  Paper, Button, List, ListItem, ListItemIcon, ListItemText, Avatar
} from '@mui/material';
import QuizIcon from '@mui/icons-material/Quiz';
import TimerIcon from '@mui/icons-material/Timer';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
// -----------------------------

type QuizStartParams = {
  id: string;
};

const QuizStartPage: React.FC = () => {
  const { id } = useParams<QuizStartParams>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Giữ nguyên useEffect tải dữ liệu
  useEffect(() => {
    if (!id) return;
    const fetchQuizDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get<QuizDetail>(`/api/quizzes/${id}/start`);
        setQuiz(response.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải chi tiết đề thi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchQuizDetails();
  }, [id]);

  // Giữ nguyên hàm Bắt đầu
  const handleStartQuiz = () => {
    navigate(`/practice/quiz/${id}/do`);
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

    if (!quiz) {
      return <Typography sx={{ mt: 2 }}>Không tìm thấy đề thi.</Typography>;
    }

    return (
      <Paper elevation={3} sx={{ 
        mt: 3, 
        p: { xs: 3, sm: 4 }, 
        maxWidth: '900px', 
        margin: 'auto',
        width: '100%'
      }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar sx={{ m: 'auto', bgcolor: 'primary.main', width: 56, height: 56 }}>
            <QuizIcon fontSize="large" />
          </Avatar>
          
          <Typography variant="h4" component="h1" gutterBottom sx={{ mt: 2 }}>
            {quiz.quiz_title}
          </Typography>
        </Box>

        {/* Phần mô tả được format đẹp */}
        {quiz.quiz_description && (
          <Box
            sx={{
              mb: 4,
              p: 3,
              bgcolor: 'grey.50',
              borderRadius: 2,
              borderLeft: '4px solid',
              borderColor: 'primary.main',
              textAlign: 'left',
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{
                whiteSpace: 'pre-wrap',
                lineHeight: 1.8,
                fontSize: '1rem',
              }}
            >
              {quiz.quiz_description}
            </Typography>
          </Box>
        )}

        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <List sx={{ width: 'fit-content', margin: 'auto', textAlign: 'left' }}>
          <ListItem>
            <ListItemIcon>
              <FormatListNumberedIcon />
            </ListItemIcon>
            <ListItemText primary={`${quiz.questions.length} câu hỏi`} />
          </ListItem>
          <ListItem>
            <ListItemIcon>
              <TimerIcon />
            </ListItemIcon>
            <ListItemText primary={`${quiz.time_limit_minutes || 'Không giới hạn'} phút`} />
          </ListItem>
          </List>
        </Box>
        
        <Box sx={{ textAlign: 'center' }}>
          <Button 
            onClick={handleStartQuiz}
            variant="contained"
            size="large"
            startIcon={<PlayCircleIcon />}
            sx={{ width: '100%', maxWidth: '300px', py: 1.5, fontSize: '1.1rem' }}
          >
            BẮT ĐẦU LÀM BÀI
          </Button>
        </Box>
      </Paper>
    );
  };

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link component={RouterLink} underline="hover" color="inherit" to="/practice">
          Luyện tập
        </Link>
        <Typography color="text.primary">
          {isLoading ? '...' : (quiz?.quiz_title || 'Bắt đầu')}
        </Typography>
      </Breadcrumbs>
      
      {renderContent()}
    </Box>
  );
};

export default QuizStartPage;