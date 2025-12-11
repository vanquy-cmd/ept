import React, { useRef } from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

interface TokenMatch {
  word: string;
  match: boolean;
}

interface SpeakingTranscriptDisplayProps {
  transcript: string;
  tokenMatches: TokenMatch[];
  targetSentence?: string; // Đề mẫu (target sentence)
  audioUrl?: string | null;
}

const SpeakingTranscriptDisplay: React.FC<SpeakingTranscriptDisplayProps> = ({
  transcript,
  tokenMatches,
  targetSentence,
  audioUrl
}) => {
  // Parse target sentence thành từng từ để hiển thị
  const targetWords = targetSentence
    ? targetSentence.split(/\s+/).filter(Boolean)
    : [];

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handlePlay = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <Box sx={{ mt: 2 }}>
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
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 1
          }}
        >
          <span>Phát âm của bạn:</span>
          {audioUrl && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <audio ref={audioRef} src={audioUrl} />
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={handlePlay}
                endIcon={<PlayArrowIcon />}
              >
                Nghe
              </Button>
            </Box>
          )}
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

