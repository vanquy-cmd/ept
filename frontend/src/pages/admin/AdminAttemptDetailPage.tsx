import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { AttemptDetails, AttemptResultItem, ResultOption } from '../../types';
import { toast } from 'react-hot-toast'; // <-- 1. THÊM IMPORT
import AIFeedbackDisplay from '../../components/AIFeedbackDisplay';

// Import MUI
import {
  Box, Typography, CircularProgress, Alert, Button,
  Accordion, AccordionSummary, AccordionDetails, List, ListItem, ListItemIcon, ListItemText, Divider
} from '@mui/material';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

type ResultsParams = {
  id: string; // Đây là attempt_id
};

const AdminAttemptDetailPage: React.FC = () => {
  const { id } = useParams<ResultsParams>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<AttemptDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        // setError(null); // <-- Xóa
        // SỬA: Gọi API Admin
        const response = await api.get<AttemptDetails>(`/api/admin/attempts/${id}`);
        setAttempt(response.data);
      } catch (err: any) {
        console.error("Lỗi khi tải kết quả (admin):", err);
        // 3. THAY THẾ setError BẰNG toast.error
        toast.error(err.response?.data?.message || 'Không thể tải kết quả bài làm.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [id]);
  
  // Hàm render review câu hỏi (giống hệt QuizResultsPage)
  const renderResultItem = (item: AttemptResultItem, index: number) => {
    const isCorrect = item.is_correct === true;
    const isIncorrect = item.is_correct === false;
    const isAIGraded = item.question_type === 'essay' || item.question_type === 'speaking';
    
    const getOptionStyle = (option: ResultOption) => {
      if (option.is_correct) return { color: 'green', fontWeight: 'bold' };
      if (item.user_answer_option_id === option.id && isIncorrect) return { color: 'red', textDecoration: 'line-through' };
      return {};
    };

    return (
      <Accordion key={item.question_id} defaultExpanded={isIncorrect || isAIGraded}>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ backgroundColor: isCorrect ? '#edf7ed' : (isIncorrect ? '#fdeded' : '#f5f5f5') }}
        >
          {isCorrect && <CheckCircleIcon color="success" sx={{ mr: 1 }} />}
          {isIncorrect && <CancelIcon color="error" sx={{ mr: 1 }} />}
          <Typography sx={{ flexShrink: 0, fontWeight: 500 }}>
            Câu {index + 1}: {item.question_text.substring(0, 100)}...
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ borderTop: '1px solid #eee' }}>
          <Typography variant="body2" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
            <strong>Đề bài:</strong> {item.question_text}
          </Typography>
          
          {item.question_type === 'multiple_choice' && item.options && (
            <List dense>
              {item.options.map((opt) => (
                <ListItem key={opt.id}>
                  <ListItemIcon>
                    {opt.is_correct && <CheckCircleIcon fontSize="small" color="success" />}
                    {item.user_answer_option_id === opt.id && isIncorrect && <CancelIcon fontSize="small" color="error" />}
                    {!(opt.is_correct) && !(item.user_answer_option_id === opt.id) && <RadioButtonUncheckedIcon fontSize="small" sx={{ opacity: 0.3 }} />}
                  </ListItemIcon>
                  <ListItemText primary={opt.option_text} sx={getOptionStyle(opt)} />
                </ListItem>
              ))}
            </List>
          )}
          
          {item.question_type === 'fill_blank' && (
            <Box>
              <Typography variant="body2"><strong>Câu trả lời của học viên: </strong>
                <Typography component="span" sx={{ color: isIncorrect ? 'error.main' : 'success.main' }}>
                  {item.user_answer_text || '(Bỏ trống)'}
                </Typography>
              </Typography>
              {!isCorrect && (
                <Typography variant="body2"><strong>Đáp án đúng: </strong>
                  <Typography component="span" sx={{ color: 'success.main' }}>
                    {item.correct_answer_text}
                  </Typography>
                </Typography>
              )}
            </Box>
          )}

          {isAIGraded && (
             <Box sx={{ mt: 2 }}>
                {item.user_answer_signed_url || item.user_answer_url ? (
                  <Typography variant="body2">
                    <strong>File bài nói:</strong>{' '}
                    <a
                      href={item.user_answer_signed_url || item.user_answer_url || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Xem file
                    </a>
                  </Typography>
                ) : null}
                {item.user_answer_text && <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', mb: 2 }}><strong>Bài viết:</strong> {item.user_answer_text}</Typography>}
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>AI Score: {item.ai_score || 0}/100</strong>
                </Typography>
                {item.ai_feedback && (
                  <AIFeedbackDisplay feedbackString={item.ai_feedback} />
                )}
             </Box>
          )}
        </AccordionDetails>
      </Accordion>
    );
  };


  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
  if (!attempt) {
    return (
        <Box>
            <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
                &larr; Quay lại danh sách
            </Button>
            <Alert severity="error" sx={{ mt: 2 }}>
                Không thể tải kết quả bài làm. Vui lòng thử lại.
            </Alert>
        </Box>
    );
  }

  return (
    <Box>
      <Button variant="outlined" onClick={() => navigate(-1)} sx={{ mb: 2 }}>
        &larr; Quay lại danh sách
      </Button>
      
      <Typography variant="h4" component="h1">{attempt.quiz_title}</Typography>
      <Typography variant="h6" component="h2" color="text.secondary" gutterBottom>
        Học viên: {attempt.user_full_name}
      </Typography>
      
      <Alert severity={Number(attempt.final_score) >= 50 ? "success" : "error"} icon={false} sx={{ mt: 2, fontSize: '1.2rem' }}>
        <strong>Điểm tổng kết: {attempt.final_score}%</strong>
      </Alert>
            
      <Divider sx={{ my: 3 }} />
      
      <Typography variant="h5" sx={{ mt: 3, mb: 2 }}>Xem lại chi tiết:</Typography>
      <Box>
        {attempt.results.map(renderResultItem)}
      </Box>
    </Box>
  );
};

export default AdminAttemptDetailPage;