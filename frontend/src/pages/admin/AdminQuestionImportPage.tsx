import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Category } from '../../types';
import { toast } from 'react-hot-toast';
import {
  Container, Paper, Typography, Box, Button, TextField, FormControl, InputLabel, Select, MenuItem,
  Grid, Alert, CircularProgress, Divider, Card, CardContent, Chip
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

interface ParsedQuestion {
  questionNumber?: number;
  questionText: string;
  options: Array<{
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
}

const AdminQuestionImportPage: React.FC = () => {
  const navigate = useNavigate();
  
  const [categoryId, setCategoryId] = useState('');
  const [skillFocus, setSkillFocus] = useState<'reading' | 'listening' | 'speaking' | 'writing'>('reading');
  const [textInput, setTextInput] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<any>(null);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await api.get<Category[]>('/api/learning/categories');
        setCategories(response.data);
        if (response.data.length > 0) {
          setCategoryId(response.data[0].id.toString());
        }
      } catch (err) {
        toast.error('Không thể tải danh sách chủ đề.');
      } finally {
        setIsLoading(false);
      }
    };
    loadCategories();
  }, []);

  // Parse text to questions
  const parseQuestions = (text: string): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];
    // Không trim các dòng để giữ nguyên khoảng trống trong câu hỏi (như dấu gạch ngang ______)
    // Chỉ loại bỏ dòng hoàn toàn trống
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    let currentQuestion: ParsedQuestion | null = null;
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];
      
      // Check if line is a question (starts with number followed by period)
      // Loại bỏ khoảng trắng đầu dòng nhưng giữ nguyên phần sau số
      const trimmedLine = line.trimStart();
      const questionMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
      
      if (questionMatch) {
        // Save previous question if exists
        if (currentQuestion && currentQuestion.questionText) {
          questions.push(currentQuestion);
        }
        
        // Start new question - giữ nguyên toàn bộ phần câu hỏi kể cả khoảng trống
        currentQuestion = {
          questionNumber: parseInt(questionMatch[1]),
          questionText: questionMatch[2].trimEnd(), // Giữ nguyên khoảng trống ở giữa, chỉ trim cuối dòng
          options: []
        };
      } else if (currentQuestion) {
        // Check if line is an option (starts with A. B. C. D.)
        // Loại bỏ khoảng trắng đầu dòng để match pattern
        const trimmedLine = line.trimStart();
        const optionMatch = trimmedLine.match(/^([A-D])\.\s*(.+)$/i);
        
        if (optionMatch) {
          const label = optionMatch[1].toUpperCase();
          const text = optionMatch[2].trimEnd(); // Giữ nguyên khoảng trống, chỉ trim cuối
          
          // Users will need to manually mark the correct answer in the preview
          const isCorrect = false;
          
          currentQuestion.options.push({
            label,
            text,
            isCorrect
          });
        } else if (line.trim().length > 0) {
          // If it's not an option but has content, might be continuation of question text
          // Chỉ thêm vào nếu chưa có options (câu hỏi có thể xuống dòng)
          if (currentQuestion.options.length === 0) {
            currentQuestion.questionText += ' ' + line.trimEnd();
          }
        }
      }
      
      i++;
    }
    
    // Add last question
    if (currentQuestion && currentQuestion.questionText) {
      questions.push(currentQuestion);
    }
    
    return questions.filter(q => q.options.length >= 2); // Only keep questions with at least 2 options
  };

  const handleParse = () => {
    if (!textInput.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi.');
      return;
    }
    
    const parsed = parseQuestions(textInput);
    if (parsed.length === 0) {
      toast.error('Không thể phân tích câu hỏi. Vui lòng kiểm tra định dạng.');
      return;
    }
    
    setParsedQuestions(parsed);
    toast.success(`Đã phân tích được ${parsed.length} câu hỏi.`);
  };

  const handleToggleCorrect = (questionIndex: number, optionIndex: number) => {
    setParsedQuestions(prev => prev.map((q, qIdx) => {
      if (qIdx === questionIndex) {
        return {
          ...q,
          options: q.options.map((opt, optIdx) => ({
            ...opt,
            isCorrect: optIdx === optionIndex // Only one correct answer
          }))
        };
      }
      return q;
    }));
  };

  const handleImport = async () => {
    if (!categoryId) {
      toast.error('Vui lòng chọn chủ đề.');
      return;
    }
    
    if (parsedQuestions.length === 0) {
      toast.error('Không có câu hỏi nào để import.');
      return;
    }

    setIsImporting(true);
    
    try {
      // Convert parsed questions to API format
      const questionsToImport = parsedQuestions.map(q => ({
        category_id: parseInt(categoryId),
        skill_focus: skillFocus,
        question_type: 'multiple_choice',
        question_text: q.questionText,
        options: q.options.map(opt => ({
          option_text: `${opt.label}. ${opt.text}`,
          is_correct: opt.isCorrect
        }))
      }));

      const response = await api.post('/api/questions/bulk', { questions: questionsToImport });
      setImportResults(response.data);
      
      if (response.data.results.failed.length === 0) {
        toast.success(`Đã nhập thành công ${response.data.results.success.length} câu hỏi!`);
        setTimeout(() => {
          navigate('/admin/questions');
        }, 2000);
      } else {
        toast(`Đã nhập ${response.data.results.success.length} câu hỏi. ${response.data.results.failed.length} câu hỏi thất bại.`, { icon: '⚠️' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi nhập câu hỏi.');
    } finally {
      setIsImporting(false);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="lg">
      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography component="h1" variant="h5">
            Nhập hàng loạt câu hỏi
          </Typography>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/questions')}
            variant="outlined"
          >
            Quay lại
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2" gutterBottom>
            <strong>Hướng dẫn nhập:</strong>
          </Typography>
          <Typography variant="body2" component="div">
            Nhập câu hỏi theo định dạng sau:
            <pre style={{ marginTop: 8, marginBottom: 0, fontSize: '0.9em' }}>
{`101. The car ______ to my uncle.
A. belongs
B. are belonging
C. belong
D. belonging

102. She ______ yawns in English class.
A. sometimes
B. already
C. sometime
D. though`}
            </pre>
            <Box sx={{ mt: 1 }}>
              • Mỗi câu hỏi bắt đầu bằng số và dấu chấm (101., 102., ...)<br/>
              • Các lựa chọn bắt đầu bằng chữ cái A., B., C., D.<br/>
              • Lựa chọn đầu tiên sẽ được đánh dấu là đáp án đúng (có thể thay đổi bên dưới)
            </Box>
          </Typography>
        </Alert>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel id="category-label">Chủ đề</InputLabel>
              <Select
                labelId="category-label"
                id="category-select"
                value={categoryId}
                label="Chủ đề"
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map(cat => (
                  <MenuItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormControl fullWidth required>
              <InputLabel id="skill-label">Kỹ năng</InputLabel>
              <Select
                labelId="skill-label"
                id="skill-select"
                value={skillFocus}
                label="Kỹ năng"
                onChange={(e) => setSkillFocus(e.target.value as any)}
              >
                <MenuItem value="reading">Reading</MenuItem>
                <MenuItem value="listening">Listening</MenuItem>
                <MenuItem value="speaking">Speaking</MenuItem>
                <MenuItem value="writing">Writing</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={15}
              label="Nhập nội dung câu hỏi"
              placeholder="Dán nội dung câu hỏi vào đây..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              sx={{ fontFamily: 'monospace', fontSize: '0.9em' }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button
              variant="contained"
              startIcon={<UploadFileIcon />}
              onClick={handleParse}
              disabled={!textInput.trim()}
              fullWidth
            >
              Phân tích câu hỏi
            </Button>
          </Grid>
        </Grid>

        {parsedQuestions.length > 0 && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Xem trước ({parsedQuestions.length} câu hỏi)
            </Typography>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Quan trọng:</strong> Vui lòng click vào từng đáp án đúng để đánh dấu trước khi nhập. 
                Mỗi câu hỏi phải có đúng 1 đáp án đúng.
              </Typography>
            </Alert>

            <Box sx={{ maxHeight: '500px', overflowY: 'auto', mb: 3 }}>
              {parsedQuestions.map((q, qIdx) => (
                <Card key={qIdx} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'start', mb: 1 }}>
                      <Chip 
                        label={`Câu ${q.questionNumber || qIdx + 1}`} 
                        color="primary" 
                        size="small" 
                        sx={{ mr: 1 }}
                      />
                      <Typography variant="body1" sx={{ flex: 1 }}>
                        {q.questionText}
                      </Typography>
                    </Box>
                    <Box sx={{ mt: 2 }}>
                      {q.options.map((opt, optIdx) => (
                        <Box
                          key={optIdx}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            p: 1,
                            mb: 0.5,
                            cursor: 'pointer',
                            borderRadius: 1,
                            bgcolor: opt.isCorrect ? 'success.light' : 'transparent',
                            '&:hover': { bgcolor: 'action.hover' }
                          }}
                          onClick={() => handleToggleCorrect(qIdx, optIdx)}
                        >
                          {opt.isCorrect ? (
                            <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                          ) : (
                            <CancelIcon color="disabled" sx={{ mr: 1 }} />
                          )}
                          <Typography variant="body2">
                            <strong>{opt.label}.</strong> {opt.text}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Box>

            <Button
              variant="contained"
              color="success"
              fullWidth
              size="large"
              onClick={handleImport}
              disabled={
                isImporting || 
                !categoryId || 
                parsedQuestions.some(q => !q.options.some(opt => opt.isCorrect))
              }
              startIcon={isImporting ? <CircularProgress size={20} color="inherit" /> : <UploadFileIcon />}
            >
              {isImporting ? 'Đang nhập...' : `Nhập ${parsedQuestions.length} câu hỏi`}
            </Button>
            {parsedQuestions.some(q => !q.options.some(opt => opt.isCorrect)) && (
              <Alert severity="error" sx={{ mt: 2 }}>
                Vui lòng đánh dấu đáp án đúng cho tất cả các câu hỏi trước khi nhập.
              </Alert>
            )}
          </>
        )}

        {importResults && (
          <>
            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom>
              Kết quả nhập
            </Typography>
            <Alert severity={importResults.results.failed.length === 0 ? 'success' : 'warning'} sx={{ mb: 2 }}>
              {importResults.message}
            </Alert>
            
            {importResults.results.failed.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom color="error">
                  Các câu hỏi thất bại:
                </Typography>
                {importResults.results.failed.map((item: any, idx: number) => (
                  <Alert key={idx} severity="error" sx={{ mt: 1 }}>
                    Câu {item.index + 1}: {item.error}
                  </Alert>
                ))}
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
};

export default AdminQuestionImportPage;

