import React, { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import api from '../../services/api';
import type { AttemptDetails, AttemptResultItem, ResultOption } from '../../types';
import {
  Box, Typography, CircularProgress, Alert, Button, Accordion, AccordionSummary, 
  AccordionDetails, List, ListItem, ListItemText, ListItemIcon, Divider
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle'; 
import CancelIcon from '@mui/icons-material/Cancel';
import AIFeedbackDisplay from '../../components/AIFeedbackDisplay';
import SpeakingTranscriptDisplay from '../../components/SpeakingTranscriptDisplay';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';

// Nhận diện loại asset để hiển thị audio/ảnh trong phần xem lại
const isAudioUrl = (url?: string | null) =>
  !!url && /\.(mp3|wav|ogg|m4a|aac)$/i.test(url);

const isImageUrl = (url?: string | null) =>
  !!url && /\.(png|jpg|jpeg|gif|webp)$/i.test(url);

// -----------------------------


type ResultsParams = {
  attemptId: string;
};

const QuizResultsPage: React.FC = () => {
  const { attemptId } = useParams<ResultsParams>();
  // Giữ nguyên state
  const [attempt, setAttempt] = useState<AttemptDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;

    const fetchResults = async () => {
      try {
        setIsLoading(true);
        setError(null);
        // Gọi API Lịch sử (history) mà chúng ta đã tạo
        const response = await api.get<AttemptDetails>(`/api/history/attempts/${attemptId}`);
        setAttempt(response.data);
      } catch (err: any)
 {
        console.error("Lỗi khi tải kết quả:", err);
        setError(err.response?.data?.message || 'Không thể tải kết quả bài làm.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [attemptId]);

  // Hàm parse tokenMatches từ feedback cho Speaking
  const parseSpeakingFeedback = (feedback: string) => {
    if (!feedback) return null;

    // Tìm transcript (dòng có "Transcript (AI chuyển từ audio):" và dòng tiếp theo)
    const transcriptMatch = feedback.match(/Transcript \(AI chuyển từ audio\):\s*"([^"]+)"/);
    const transcript = transcriptMatch ? transcriptMatch[1] : '';

    // Tìm tokenMatches JSON
    const tokensMatch = feedback.match(/__TOKENS_JSON_START__([\s\S]*?)__TOKENS_JSON_END__/);
    if (!tokensMatch) return null;

    try {
      const tokenMatches = JSON.parse(tokensMatch[1]);
      return { transcript, tokenMatches };
    } catch (error) {
      console.error('Error parsing tokenMatches:', error);
      return null;
    }
  };

  // Hàm render một câu hỏi (để review) BẰNG ACCORDION
  const renderResultItem = (item: AttemptResultItem) => {
    const correctness = item.is_correct as any; // backend có thể trả 0/1
    const isCorrect = correctness === true || correctness === 1;
    const isIncorrect = correctness === false || correctness === 0;
    const isAIGraded = item.question_type === 'essay' || item.question_type === 'speaking';
    const isSpeaking = item.question_type === 'speaking';
    const audioUrl = item.user_answer_signed_url || (item.user_answer_url?.startsWith('http') ? item.user_answer_url : undefined);
    const assetAudio = item.asset_url && isAudioUrl(item.asset_url) ? item.asset_url : null;
    const assetImage = item.asset_url && isImageUrl(item.asset_url) ? item.asset_url : null;
    const fallbackAsset = item.asset_url && !assetAudio && !assetImage ? item.asset_url : null;
    
    // Style cho lựa chọn trắc nghiệm
    const getOptionStyle = (option: ResultOption) => {
      if (option.is_correct) {
        return { color: 'green', fontWeight: 'bold' }; // Đáp án đúng
      }
      if (item.user_answer_option_id === option.id && isIncorrect) {
        return { color: 'red', textDecoration: 'line-through' }; // Người dùng chọn sai
      }
      return {};
    };

    return (
      <Accordion key={item.question_id} defaultExpanded={isIncorrect || isAIGraded}>
        {/* Tiêu đề Accordion (Câu hỏi) */}
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{
            bgcolor: isCorrect ? 'success.light' : (isIncorrect ? 'error.light' : 'undefined')
          }}
        >
          {isCorrect && <CheckCircleIcon color="success" sx={{ mr: 1 }} />}
          {isIncorrect && <CancelIcon color="error" sx={{ mr: 1 }} />}
          <Typography sx={{ flexShrink: 0, fontWeight: 500 }}>
            Đề bài: {item.question_text.substring(0, 100)}...
          </Typography>
        </AccordionSummary>
        
        {/* Nội dung Accordion (Chi tiết) */}
        <AccordionDetails sx={{ borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
          <Typography variant="body2" sx={{ mb: 1 }}><strong>Đề bài đầy đủ:</strong> {item.question_text}</Typography>

          {/* Hiển thị asset kèm câu hỏi (audio/ảnh cho Listening/Speaking) */}
          {item.asset_url && (
            <Box sx={{ mb: 2 }}>
              {assetAudio && (
                <audio
                  controls
                  src={assetAudio}
                  crossOrigin="anonymous"
                  style={{ width: '100%' }}
                >
                  Trình duyệt của bạn không hỗ trợ audio.
                </audio>
              )}
              {assetImage && (
                <img
                  src={assetImage}
                  alt="Minh họa câu hỏi"
                  style={{ width: '100%', maxHeight: 320, objectFit: 'contain' }}
                />
              )}
              {!assetAudio && !assetImage && (
                <audio
                  controls
                  src={fallbackAsset || undefined}
                  crossOrigin="anonymous"
                  style={{ width: '100%' }}
                >
                  Trình duyệt của bạn không hỗ trợ audio.
                </audio>
              )}
            </Box>
          )}
          
          {item.question_type === 'multiple_choice' && item.options && (
            <List dense>
              {item.options.map((opt) => {
                let icon;
                if (opt.is_correct) {
                  icon = <CheckCircleIcon fontSize="small" color="success" />;
                } else if (item.user_answer_option_id === opt.id && isIncorrect) {
                  icon = <CancelIcon fontSize="small" color="error" />;
                } else {
                  icon = <RadioButtonUncheckedIcon fontSize="small" sx={{ color: 'text.disabled' }} />;
                }

                return (
                  <ListItem key={opt.id}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      {icon}
                    </ListItemIcon>
                    <ListItemText primary={opt.option_text} sx={getOptionStyle(opt)} />
                  </ListItem>
                );
              })}
            </List>
          )}
          
          {item.question_type === 'fill_blank' && (
            <Box>
              <Typography variant="body2"><strong>Câu trả lời của bạn: </strong>
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
              {isSpeaking && item.ai_feedback ? (
                // Hiển thị transcript với color-coding cho Speaking
                (() => {
                  const parsed = parseSpeakingFeedback(item.ai_feedback);
                  if (parsed && parsed.tokenMatches) {
                    return (
                      <SpeakingTranscriptDisplay
                        transcript={parsed.transcript}
                        tokenMatches={parsed.tokenMatches}
                        targetSentence={item.question_text}
                        audioUrl={audioUrl || undefined}
                      />
                    );
                  }
                  // Fallback nếu không parse được
                  return (
                    <Box>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {item.ai_feedback}
                      </Typography>
                    </Box>
                  );
                })()
              ) : (
                // Hiển thị feedback chi tiết cho Writing (essay)
                <>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>AI Score: {item.ai_score || 0}/100</strong>
                  </Typography>
                  {item.ai_feedback && (
                    <AIFeedbackDisplay feedbackString={item.ai_feedback} />
                  )}
                </>
              )}
            </Box>
          )}

        </AccordionDetails>
      </Accordion>
    );
  };

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

  if (!attempt) {
    return <Typography sx={{ mt: 2 }}>Không tìm thấy bài làm.</Typography>;
  }

  return (
    <Box>
      <Typography variant="h4" component="h1">Kết quả: {attempt.quiz_title}</Typography>
      {/* Thẻ điểm tổng kết */}
      <Alert severity="success" icon={<CheckCircleIcon fontSize="inherit" />} sx={{ mt: 2, fontSize: '1.2rem' }}>
        <strong>Điểm tổng kết: {attempt.final_score}%</strong>
      </Alert>
      
      <Box sx={{ my: 3, display: 'flex', flexWrap: 'wrap', gap: 2 }}>
        {/* Nút làm lại chính đề thi này */}
        <Button
          component={RouterLink}
          to={`/practice/quiz/${attempt.quiz_id}/start`}
          variant="contained"
          color="success"
        >
          Làm lại đề này
        </Button>

        {/* Nút làm bài thi khác */}
        <Button component={RouterLink} to="/practice" variant="outlined">
          Làm bài thi khác
        </Button>

        {/* Nút về Dashboard */}
        <Button component={RouterLink} to="/dashboard" variant="outlined">
          Về Dashboard
        </Button>
      </Box>
      
      <Divider />
      
      <Typography variant="h5" sx={{ mt: 3, mb: 2 }}>Xem lại chi tiết:</Typography>
      {/* Hiển thị danh sách câu hỏi review */}
      <Box>
        {attempt.results.map(renderResultItem)}
      </Box>
    </Box>
  );
};

export default QuizResultsPage;