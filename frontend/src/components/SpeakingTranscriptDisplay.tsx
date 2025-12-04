import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

interface TokenMatch {
  word: string;
  match: boolean;
}

interface SpeakingTranscriptDisplayProps {
  transcript: string;
  tokenMatches: TokenMatch[];
  targetSentence?: string; // Đề mẫu (target sentence)
  score?: number;
}

const SpeakingTranscriptDisplay: React.FC<SpeakingTranscriptDisplayProps> = ({
  transcript,
  tokenMatches,
  targetSentence,
  score
}) => {
  // Parse target sentence thành từng từ để hiển thị
  const targetWords = targetSentence
    ? targetSentence.split(/\s+/).filter(Boolean)
    : [];

  return (
    <Box sx={{ mt: 2 }}>
      {/* Score Display */}
      {score !== undefined && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'success.light',
            color: 'success.contrastText',
            textAlign: 'center'
          }}
        >
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
            {score}%
          </Typography>
        </Paper>
      )}

      {/* Target Sentence (Đề mẫu) - Hiển thị nếu có */}
      {targetSentence && targetWords.length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              alignItems: 'center',
              lineHeight: 1.8
            }}
          >
            {targetWords.map((word, index) => {
              // Kiểm tra xem từ này có trong transcript và match không
              const normalizedWord = word.toLowerCase().replace(/[^a-z]/g, '');
              const isMatched = tokenMatches.some(
                (token) =>
                  token.match &&
                  token.word.toLowerCase().replace(/[^a-z]/g, '') === normalizedWord
              );

              return (
                <Box
                  key={index}
                  sx={{
                    px: 1,
                    py: 0.5,
                    border: '1px solid',
                    borderColor: isMatched ? 'success.main' : 'error.main',
                    borderRadius: 1,
                    bgcolor: isMatched ? 'success.light' : 'error.light',
                    color: isMatched ? 'success.dark' : 'error.dark',
                    fontWeight: isMatched ? 'bold' : 'normal'
                  }}
                >
                  {word}
                </Box>
              );
            })}
          </Box>
        </Paper>
      )}

      {/* Transcript with Color Coding */}
      <Paper
        sx={{
          p: 3,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2
        }}
      >
        <Typography
          variant="body2"
          sx={{
            mb: 1,
            color: 'text.secondary',
            fontWeight: 500
          }}
        >
          Phát âm của bạn:
        </Typography>
        
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 0.5,
            alignItems: 'center',
            lineHeight: 1.8
          }}
        >
          {tokenMatches.map((token, index) => (
            <Typography
              key={index}
              component="span"
              sx={{
                fontWeight: token.match ? 'bold' : 'normal',
                color: token.match ? 'success.main' : 'error.main',
                fontSize: '1.1rem',
                px: 0.5
              }}
            >
              {token.word}
            </Typography>
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default SpeakingTranscriptDisplay;

