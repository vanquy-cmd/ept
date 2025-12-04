import React from 'react';
import {
  Box, Typography, Paper, Chip, LinearProgress, Divider,
  List, ListItem, ListItemIcon, ListItemText, Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EditIcon from '@mui/icons-material/Edit';
import LightbulbIcon from '@mui/icons-material/Lightbulb';

interface DetailedScore {
  label: string;
  score: number;
  icon: string;
}

interface GrammarError {
  error: string;
  correction: string;
  explanation: string;
}

interface VocabularyIssue {
  word: string;
  suggestion: string;
  reason: string;
}

interface FeedbackData {
  overallScore: number;
  detailedScores: DetailedScore[];
  overallFeedback: string;
  strengths: string[];
  improvements: string[];
  grammarErrors: GrammarError[];
  vocabularyIssues: VocabularyIssue[];
  recommendations: string[];
}

interface Props {
  feedbackString: string;
}

const AIFeedbackDisplay: React.FC<Props> = ({ feedbackString }) => {
  let feedbackData: FeedbackData | null = null;
  
  try {
    feedbackData = JSON.parse(feedbackString);
  } catch (error) {
    // Fallback: display raw text if not JSON
    return (
      <Paper sx={{ p: 2, mt: 2 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {feedbackString}
        </Typography>
      </Paper>
    );
  }

  if (!feedbackData) return null;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ mt: 2 }}>
      {/* Overall Score */}
      <Paper sx={{ p: 3, mb: 2, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
          Overall Score: {feedbackData.overallScore}/100
        </Typography>
      </Paper>

      {/* Detailed Scores */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          📊 Detailed Scores
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {feedbackData.detailedScores.map((item, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2">
                {item.icon} {item.label}
              </Typography>
              <Chip 
                label={`${item.score}/100`} 
                color={getScoreColor(item.score)} 
                size="small" 
              />
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={item.score} 
              color={getScoreColor(item.score)}
              sx={{ height: 8, borderRadius: 1 }}
            />
          </Box>
        ))}
      </Paper>

      {/* Overall Feedback */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          💬 Overall Feedback
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
          {feedbackData.overallFeedback}
        </Typography>
      </Paper>

      {/* Strengths */}
      {feedbackData.strengths.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleIcon color="success" /> Strengths
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List dense>
            {feedbackData.strengths.map((strength, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <CheckCircleIcon color="success" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={strength} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Areas for Improvement */}
      {feedbackData.improvements.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingUpIcon color="warning" /> Areas for Improvement
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List dense>
            {feedbackData.improvements.map((improvement, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <TrendingUpIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={improvement} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* Grammar Corrections */}
      {feedbackData.grammarErrors.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="error" /> Grammar Corrections
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {feedbackData.grammarErrors.map((error, index) => (
            <Alert severity="info" key={index} sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Error:</strong> <span style={{ textDecoration: 'line-through', color: 'red' }}>"{error.error}"</span>
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Correction:</strong> <span style={{ color: 'green', fontWeight: 'bold' }}>"{error.correction}"</span>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {error.explanation}
              </Typography>
            </Alert>
          ))}
        </Paper>
      )}

      {/* Vocabulary Suggestions */}
      {feedbackData.vocabularyIssues.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            📚 Vocabulary Suggestions
          </Typography>
          <Divider sx={{ mb: 2 }} />
          {feedbackData.vocabularyIssues.map((issue, index) => (
            <Alert severity="info" key={index} sx={{ mb: 1 }}>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Instead of:</strong> "{issue.word}"
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Try:</strong> <span style={{ color: 'green', fontWeight: 'bold' }}>"{issue.suggestion}"</span>
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {issue.reason}
              </Typography>
            </Alert>
          ))}
        </Paper>
      )}

      {/* Recommendations */}
      {feedbackData.recommendations.length > 0 && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LightbulbIcon color="primary" /> Recommendations
          </Typography>
          <Divider sx={{ mb: 2 }} />
          <List dense>
            {feedbackData.recommendations.map((rec, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <LightbulbIcon color="primary" fontSize="small" />
                </ListItemIcon>
                <ListItemText primary={rec} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default AIFeedbackDisplay;
