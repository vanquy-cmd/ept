import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Fab,
  Slide,
  useTheme
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import GoogleIcon from '@mui/icons-material/Google';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

interface TranslationResult {
  original: string;
  originalLanguage: 'vi' | 'en';
  translated: string;
  translatedLanguage: 'vi' | 'en';
  suggestions?: string[];
  example_sentence?: string | null;
}

interface TranslationHistoryItem {
  id: number;
  original_text: string;
  original_language: 'vi' | 'en';
  translated_text: string;
  translated_language: 'vi' | 'en';
  suggestions: string[];
  example_sentence: string | null;
  created_at: string;
}

const DictionaryChatbox: React.FC = () => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [fromLanguage] = useState<'vi' | 'en'>('vi');
  const [toLanguage] = useState<'vi' | 'en'>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [chatHistory, setChatHistory] = useState<TranslationHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [currentWord, setCurrentWord] = useState<string>('');
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const MAX_LENGTH = 50;
  
  // Màu xanh nước biển theo chủ đề
  const primaryColor = theme.palette.primary.main; // #2b6cb0 (light) hoặc #63b3ed (dark)
  const primaryLight = theme.palette.mode === 'light' ? '#E3F2FD' : '#1E3A5F'; // Xanh nước biển nhạt
  const primaryDark = theme.palette.mode === 'light' ? '#1E88E5' : '#90CAF9'; // Xanh nước biển đậm

  // Load lịch sử khi mở chatbox
  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open]);

  // Auto scroll to bottom khi có lịch sử mới
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, result]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await api.get<TranslationHistoryItem[]>('/api/vocabulary/history', {
        params: { limit: 50 }
      });
      // Đảo ngược để hiển thị từ cũ đến mới (từ trên xuống dưới)
      setChatHistory(response.data.reverse());
    } catch (err) {
      console.error('Lỗi khi tải lịch sử:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setResult(null);
  };

  const handleTranslate = async () => {
    if (!input.trim()) {
      const langName = fromLanguage === 'vi' ? 'tiếng Việt' : 'tiếng Anh';
      setError(`Vui lòng nhập từ hoặc cụm từ ${langName}.`);
      return;
    }

    if (input.length > MAX_LENGTH) {
      setError(`Vượt quá giới hạn ${MAX_LENGTH} ký tự.`);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await api.post<TranslationResult>('/api/vocabulary/translate', {
        text: input.trim(),
        fromLanguage,
        toLanguage
      });

      const translationResult = response.data;
      setResult(translationResult);
      setCurrentWord(input.trim());
      setInput(''); // Clear input sau khi tra thành công
      
      // Reload lịch sử để hiển thị kết quả mới nhất
      await loadHistory();
      
      // Clear result sau một chút để tránh hiển thị trùng với lịch sử
      setTimeout(() => {
        setResult(null);
        setCurrentWord('');
      }, 100);
    } catch (err: any) {
      console.error('Lỗi khi tra từ vựng:', err);
      const errorMessage = err.response?.data?.message || 'Hệ thống hiện đang quá tải. Vui lòng thử lại sau.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTranslate();
    }
  };

  const handleGoogleSearch = (text: string) => {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(text)}`;
    window.open(searchUrl, '_blank');
  };

  // Removed unused handleSuggestionClick function

  // Hàm để highlight từ đã dịch trong câu ví dụ
  const highlightTranslatedWord = (sentence: string, translatedWord: string) => {
    if (!sentence || !translatedWord) return sentence;
    
    // Tìm và thay thế từ đã dịch bằng version in đậm
    // Sử dụng regex để tìm từ (case-insensitive, word boundary)
    const regex = new RegExp(`\\b${translatedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const matches = sentence.match(regex);
    
    if (!matches || matches.length === 0) {
      // Nếu không tìm thấy exact match, thử tìm không phân biệt hoa thường
      const lowerSentence = sentence.toLowerCase();
      const lowerTranslated = translatedWord.toLowerCase();
      const index = lowerSentence.indexOf(lowerTranslated);
      
      if (index !== -1) {
        const before = sentence.substring(0, index);
        const match = sentence.substring(index, index + translatedWord.length);
        const after = sentence.substring(index + translatedWord.length);
        return (
          <>
            {before}
            <strong style={{ fontWeight: 'bold', color: primaryColor }}>{match}</strong>
            {after}
          </>
        );
      }
      return sentence;
    }
    
    // Tạo JSX với các phần được highlight
    const result: React.ReactNode[] = [];
    let lastIndex = 0;
    
    matches.forEach((match, i) => {
      const matchIndex = sentence.toLowerCase().indexOf(match.toLowerCase(), lastIndex);
      if (matchIndex > lastIndex) {
        result.push(sentence.substring(lastIndex, matchIndex));
      }
      result.push(
        <strong key={i} style={{ fontWeight: 'bold', color: primaryColor }}>
          {match}
        </strong>
      );
      lastIndex = matchIndex + match.length;
    });
    
    if (lastIndex < sentence.length) {
      result.push(sentence.substring(lastIndex));
    }
    
    return <>{result}</>;
  };

  return (
    <>
      {/* Floating Button - Dictionary Icon */}
      <Fab
        color="primary"
        aria-label="tra từ vựng"
        onClick={handleOpen}
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 64,
          height: 64,
          bgcolor: primaryColor, // Màu xanh nước biển theo chủ đề
          '&:hover': {
            bgcolor: primaryDark,
            transform: 'scale(1.1)',
            transition: 'all 0.3s ease'
          },
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          display: open ? 'none' : 'flex' // Ẩn button khi chatbox mở
        }}
      >
        <MenuBookIcon sx={{ fontSize: 32, color: 'white' }} />
      </Fab>

      {/* Chatbox Dialog */}
      <Slide direction="up" in={open} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            width: { xs: 'calc(100% - 48px)', sm: 420 },
            maxWidth: 420,
            maxHeight: 'calc(100vh - 100px)',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 1001,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Header - Màu xanh lá nhạt */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.5,
              bgcolor: primaryLight, // Màu xanh nước biển nhạt
              color: 'text.primary'
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <MenuBookIcon sx={{ color: '#FF9800', fontSize: 28 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', fontSize: '1rem' }}>
                Tra từ vựng
              </Typography>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: primaryColor,
                  ml: 0.5
                }}
              />
            </Box>
            <IconButton
              onClick={handleClose}
              size="small"
              sx={{
                color: 'text.primary',
                '&:hover': {
                  bgcolor: 'rgba(0,0,0,0.05)'
                }
              }}
            >
              <ExpandMoreIcon />
            </IconButton>
          </Box>

          {/* Content - Chat History Area */}
          <Box
            ref={chatContainerRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              bgcolor: 'background.paper',
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5,
              minHeight: 0
            }}
          >
            {/* Loading History */}
            {isLoadingHistory && (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}

            {/* Chat History Messages */}
            {!isLoadingHistory && chatHistory.length > 0 && (
              <>
                {chatHistory.map((item) => (
                  <Box key={item.id} sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    {/* User Message - Original Text */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <Paper
                        sx={{
                          bgcolor: primaryColor,
                          color: 'white',
                          p: 1.5,
                          borderRadius: 2,
                          maxWidth: '80%',
                          wordBreak: 'break-word'
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {item.original_text}
                        </Typography>
                      </Paper>
                    </Box>

                    {/* Bot Response - Translation Result */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                      <Paper
                        sx={{
                          bgcolor: '#F5F5F5',
                          p: 2,
                          borderRadius: 2,
                          maxWidth: '85%',
                          border: '1px solid',
                          borderColor: 'divider'
                        }}
                      >
                        {/* Cụm tiếng Anh */}
                        <Box sx={{ mb: 1.5 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                            Cụm tiếng Anh:
                          </Typography>
                          <Typography variant="body2" sx={{ color: 'text.primary' }}>
                            {item.translated_text} ({item.original_text} - {item.suggestions?.[0] || ''})
                          </Typography>
                        </Box>

                        {/* Cụm từ tương đương */}
                        {item.suggestions && item.suggestions.length > 0 && (
                          <Box sx={{ mb: 1.5 }}>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                              Cụm từ tương đương:
                            </Typography>
                            <Box component="ul" sx={{ m: 0, pl: 2 }}>
                              {item.suggestions.slice(0, 3).map((suggestion, index) => (
                                <Box component="li" key={index}>
                                  <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
                                    {suggestion}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Box>
                        )}

                        {/* Câu gợi ý */}
                        {item.example_sentence && (
                          <Box>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                              Câu gợi ý:
                            </Typography>
                            <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, fontSize: '0.875rem' }}>
                              {highlightTranslatedWord(item.example_sentence, item.translated_text)}
                            </Typography>
                          </Box>
                        )}
                      </Paper>
                    </Box>
                  </Box>
                ))}
              </>
            )}

            {/* Current Result (nếu đang tra) */}
            {result && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {/* User Message */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Paper
                    sx={{
                      bgcolor: '#4CAF50',
                      color: 'white',
                      p: 1.5,
                      borderRadius: 2,
                      maxWidth: '80%',
                      wordBreak: 'break-word'
                    }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {currentWord}
                    </Typography>
                  </Paper>
                </Box>

                {/* Bot Response */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <Paper
                    sx={{
                      bgcolor: '#F5F5F5',
                      p: 2,
                      borderRadius: 2,
                      maxWidth: '85%',
                      border: '1px solid',
                      borderColor: 'divider'
                    }}
                  >
                    {/* Cụm tiếng Anh */}
                    <Box sx={{ mb: 1.5 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                        Cụm tiếng Anh:
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.primary' }}>
                        {result.translated} ({result.original} - {result.suggestions?.slice(0, 2).join(', ') || ''})
                      </Typography>
                    </Box>

                    {/* Cụm từ tương đương */}
                    {result.suggestions && result.suggestions.length > 0 && (
                      <Box sx={{ mb: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                          Cụm từ tương đương:
                        </Typography>
                        <Box component="ul" sx={{ m: 0, pl: 2 }}>
                          {result.suggestions.map((suggestion, index) => (
                            <Box component="li" key={index} sx={{ mb: 0.5 }}>
                              <Typography variant="body2" sx={{ color: 'text.primary', fontSize: '0.875rem' }}>
                                {suggestion}
                              </Typography>
                            </Box>
                          ))}
                        </Box>
                      </Box>
                    )}

                    {/* Câu gợi ý */}
                    {result.example_sentence && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold', mb: 0.5, display: 'block' }}>
                          Câu gợi ý:
                        </Typography>
                        <Typography variant="body2" sx={{ color: 'text.primary', lineHeight: 1.6, fontSize: '0.875rem' }}>
                          {highlightTranslatedWord(result.example_sentence, result.translated)}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              </Box>
            )}

            {/* Empty State */}
            {!isLoadingHistory && chatHistory.length === 0 && !result && (
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: '#90CAF9',
                  borderRadius: 2,
                  p: 2,
                  bgcolor: '#E3F2FD',
                  textAlign: 'center'
                }}
              >
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Bạn hãy nhập từ hoặc cụm từ tiếng Việt, YouPass sẽ gợi ý cụm từ tiếng Anh tương ứng
                </Typography>
              </Box>
            )}
          </Box>

          {/* Input Section */}
          <Box
            sx={{
              p: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2, mb: 1 }}>
                {error}
              </Alert>
            )}

            {/* Input Field */}
            <Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  value={input}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    if (newValue.length <= MAX_LENGTH) {
                      setInput(newValue);
                      setError(null);
                    }
                  }}
                  onKeyPress={handleKeyPress}
                  placeholder="Nhập từ tại đây"
                  variant="outlined"
                  disabled={isLoading}
                  autoFocus
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1
                    }
                  }}
                />
                <IconButton
                  onClick={() => handleGoogleSearch(input || 'vocabulary')}
                  sx={{ 
                    color: primaryColor,
                    '&:hover': {
                      bgcolor: `${primaryColor}1A` // 10% opacity
                    }
                  }}
                  title="Tìm trên Google"
                >
                  <GoogleIcon />
                </IconButton>
              </Box>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pt: 1
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Giới hạn: {input.length}/{MAX_LENGTH} ký tự
              </Typography>
              <Button
                variant="contained"
                color="success"
                size="medium"
                onClick={handleTranslate}
                disabled={isLoading || !input.trim()}
                sx={{
                  px: 3,
                  py: 0.75,
                  borderRadius: 1,
                  fontSize: '0.875rem',
                  fontWeight: 'bold',
                  textTransform: 'none',
                  bgcolor: primaryColor,
                  '&:hover': {
                    bgcolor: primaryDark
                  }
                }}
                startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <TranslateIcon />}
              >
                {isLoading ? 'Đang tra...' : 'Tra từ vựng'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Slide>
    </>
  );
};

export default DictionaryChatbox;

