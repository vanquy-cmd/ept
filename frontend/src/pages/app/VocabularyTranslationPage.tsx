import React, { useState } from 'react';
import api from '../../services/api';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  Fab
} from '@mui/material';
import TranslateIcon from '@mui/icons-material/Translate';
import GoogleIcon from '@mui/icons-material/Google';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';

interface TranslationResult {
  original: string;
  originalLanguage: 'vi' | 'en';
  translated: string;
  translatedLanguage: 'vi' | 'en';
  suggestions?: string[];
}

const VocabularyTranslationPage: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [fromLanguage, setFromLanguage] = useState<'vi' | 'en'>('vi');
  const [toLanguage, setToLanguage] = useState<'vi' | 'en'>('en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [history, setHistory] = useState<TranslationResult[]>([]);

  const MAX_LENGTH = 50;

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setResult(null);
  };

  const handleSwapLanguages = () => {
    setFromLanguage(toLanguage);
    setToLanguage(fromLanguage);
    setInput('');
    setResult(null);
    setError(null);
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

      setResult(response.data);
      // Thêm vào lịch sử
      setHistory(prev => [response.data, ...prev.slice(0, 9)]); // Giữ tối đa 10 kết quả
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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    // Tự động tra khi click suggestion
    setTimeout(() => {
      handleTranslate();
    }, 100);
  };

  return (
    <>
      {/* Floating Button - Chat Bubble */}
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
          bgcolor: '#4CAF50',
          '&:hover': {
            bgcolor: '#45a049',
            transform: 'scale(1.1)',
            transition: 'all 0.3s ease'
          },
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000
        }}
      >
        <SearchIcon sx={{ fontSize: 32, color: 'white' }} />
      </Fab>

      {/* Dialog Popup */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxHeight: '90vh'
          }
        }}
      >
        {/* Dialog Header */}
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
            borderBottom: '1px solid',
            borderColor: 'divider'
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            Tra từ vựng
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': {
                bgcolor: 'action.hover'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Error Message */}
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {/* Language Toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip
                label={fromLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
                color={fromLanguage === 'vi' ? 'primary' : 'default'}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
              <IconButton
                size="small"
                onClick={handleSwapLanguages}
                sx={{
                  color: 'success.main',
                  '&:hover': {
                    bgcolor: 'success.light',
                    transform: 'rotate(180deg)',
                    transition: 'transform 0.3s ease'
                  }
                }}
                title="Đổi ngôn ngữ"
              >
                <SwapHorizIcon />
              </IconButton>
              <Chip
                label={toLanguage === 'vi' ? 'Tiếng Việt' : 'English'}
                color={toLanguage === 'vi' ? 'primary' : 'default'}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            </Box>

            {/* Input Field */}
            <Box>
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
                placeholder={fromLanguage === 'vi' 
                  ? 'Nhập từ hoặc cụm từ tiếng Việt...' 
                  : 'Enter word or phrase in English...'}
                variant="outlined"
                disabled={isLoading}
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
                InputProps={{
                  endAdornment: (
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleGoogleSearch(input || 'vocabulary')}
                        sx={{ color: 'success.main' }}
                        title="Tìm trên Google"
                      >
                        <GoogleIcon />
                      </IconButton>
                    </Box>
                  )
                }}
              />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}
              >
                {input.length}/{MAX_LENGTH} ký tự
              </Typography>
            </Box>

            {/* Tra Button */}
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              onClick={handleTranslate}
              disabled={isLoading || !input.trim()}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontSize: '1rem',
                fontWeight: 'bold',
                textTransform: 'none'
              }}
              startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <TranslateIcon />}
            >
              {isLoading ? 'Đang tra từ vựng...' : 'Tra'}
            </Button>

            {/* Translation Result */}
            {result && (
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: 2,
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  mt: 1
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CheckCircleIcon sx={{ color: 'success.main' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                    Kết quả
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {result.originalLanguage === 'vi' ? 'Tiếng Việt' : 'English'}:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mt: 0.5 }}>
                    {result.original}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    {result.translatedLanguage === 'vi' ? 'Tiếng Việt' : 'English'}:
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'primary.main', fontWeight: 'bold', mt: 0.5 }}>
                    {result.translated}
                  </Typography>
                </Box>

                {/* Suggestions */}
                {result.suggestions && result.suggestions.length > 0 && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" gutterBottom>
                      Gợi ý khác:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                      {result.suggestions.map((suggestion, index) => (
                        <Chip
                          key={index}
                          label={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          size="small"
                          sx={{
                            cursor: 'pointer',
                            '&:hover': {
                              bgcolor: 'primary.light'
                            }
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Paper>
            )}

            {/* User Input History (nếu có) */}
            {history.length > 0 && !result && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                <Paper
                  sx={{
                    bgcolor: 'success.main',
                    color: 'white',
                    p: 1.5,
                    borderRadius: 3,
                    maxWidth: '80%',
                    wordBreak: 'break-word'
                  }}
                >
                  <Typography variant="body2">{history[0].original}</Typography>
                </Paper>
              </Box>
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VocabularyTranslationPage;

