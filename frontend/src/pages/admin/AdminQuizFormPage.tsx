import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Select from 'react-select'; // Giữ lại react-select
import type { MultiValue } from 'react-select';
import api from '../../services/api';
import type { QuizDetail, Category, AdminQuestionSummary } from '../../types';
import { toast } from 'react-hot-toast';
import FileUploadField from '../../components/FileUploadField';
import VideoUploadField from '../../components/VideoUploadField';

// --- THÊM/CẬP NHẬT IMPORT CỦA MUI ---
import {
  TextField, Container, MenuItem, FormControl, InputLabel,
  Paper, Button, Grid, CircularProgress, Box, Typography,
  FormHelperText, Tabs, Tab, Alert, Card, CardContent, Chip, Divider
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select'; // Đổi tên Select của MUI thành MuiSelect
import MuiSelect from '@mui/material/Select';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
// -----------------------------


type QuizFormParams = {
  id?: string;
};

interface QuestionOption {
  value: number;
  label: string;
}

interface ParsedQuestion {
  questionNumber?: number;
  questionText: string;
  questionType?: 'multiple_choice' | 'fill_blank';
  correctAnswer?: string; // Cho fill_blank - có thể là JSON string cho nhiều đáp án
  blankAnswers?: Record<string, string>; // Cho câu hỏi có nhiều chỗ trống: { "blank1": "answer1", "blank2": "answer2" }
  options: Array<{
    label: string;
    text: string;
    isCorrect: boolean;
  }>;
}

const AdminQuizFormPage: React.FC = () => {
  const { id } = useParams<QuizFormParams>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // --- Giữ nguyên state form và state quản lý ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [timeLimit, setTimeLimit] = useState<number | ''>('');
  const [assetUrl, setAssetUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [selectedQuestions, setSelectedQuestions] = useState<MultiValue<QuestionOption>>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [allQuestions, setAllQuestions] = useState<AdminQuestionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // State cho nhập hàng loạt
  const [questionMode, setQuestionMode] = useState<'select' | 'import'>('select'); // Tab hiện tại
  const [importTextInput, setImportTextInput] = useState('');
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [importSkillFocus, setImportSkillFocus] = useState<'reading' | 'listening' | 'speaking' | 'writing'>('reading');
  const [importQuestionType, setImportQuestionType] = useState<'multiple_choice' | 'fill_blank'>('multiple_choice');
  const [isImporting, setIsImporting] = useState(false);

  // Tải categories, questions và dữ liệu quiz (nếu edit)
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Chạy song song tải categories và questions
        const [catRes, questionRes] = await Promise.all([
            api.get<Category[]>('/api/learning/categories'),
            api.get<{ data: AdminQuestionSummary[] }>('/api/admin/questions', {
              params: { page: 1, limit: 1000 } // Lấy tất cả questions (hoặc số lượng lớn)
            })
        ]);
        
        setAllCategories(catRes.data);
        // API trả về { data: [...], currentPage, totalPages, totalCount }
        setAllQuestions(Array.isArray(questionRes.data.data) ? questionRes.data.data : []);

        // Chọn category đầu tiên nếu tạo mới
        if (catRes.data.length > 0 && !isEditMode) {
            setCategoryId(catRes.data[0].id.toString()); 
        }

        // Nếu là edit, tải quiz detail (API GET /api/quizzes/:id/start đã có)
        if (isEditMode && id) {
          const quizRes = await api.get<QuizDetail>(`/api/quizzes/${id}/start`);
          const quizData = quizRes.data;
          setTitle(quizData.quiz_title);
          setDescription(quizData.quiz_description || '');
          setCategoryId(quizData.category_id.toString());
          setTimeLimit(quizData.time_limit_minutes || '');
          // Lấy asset_url từ quiz nếu có
          setAssetUrl(quizData.quiz_asset_url || '');
          // Lấy video_url từ quiz nếu có
          setVideoUrl(quizData.quiz_video_url || '');
          
          // Chuyển đổi questions của quiz thành dạng react-select options
          const currentQuizQuestions = quizData.questions.map(q => ({
              value: q.question_id,
              label: `ID: ${q.question_id} - ${q.question_type} - ${q.question_text.substring(0, 50)}...`
          }));
          setSelectedQuestions(currentQuizQuestions);
        }
      } catch (err: any) {
        toast.error('Không thể tải dữ liệu cần thiết.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, isEditMode]);

  // Lấy skill_focus của category đã chọn (đặt trước useMemo để tránh lỗi hoisting)
  const selectedCategory = allCategories.find(cat => cat.id.toString() === categoryId);
  const isListeningCategory = selectedCategory?.skill_focus === 'listening';

  // Chuẩn bị options cho react-select từ allQuestions
  // Dùng useMemo để tránh tính toán lại không cần thiết
  const questionOptions = useMemo((): QuestionOption[] => {
      if (!Array.isArray(allQuestions)) {
        return [];
      }
      // Nếu đã chọn chủ đề, chỉ hiển thị câu hỏi cùng skill_focus với chủ đề đó
      const filtered = allQuestions.filter(q => {
        if (!selectedCategory) return true;
        return q.skill_focus === selectedCategory.skill_focus;
      });

      return filtered.map(q => ({
          value: q.id,
          label: `ID: ${q.id} - ${q.question_type} (${q.skill_focus}) - ${q.question_text}`
      }));
  }, [allQuestions, selectedCategory]);

  // Parse text to questions (hỗ trợ cả multiple_choice và fill_blank)
  const parseQuestions = (text: string): ParsedQuestion[] => {
    const questions: ParsedQuestion[] = [];
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    if (importQuestionType === 'fill_blank') {
      // Kiểm tra xem có format "Conversation" không (một câu hỏi lớn với nhiều chỗ trống)
      const hasConversationFormat = lines.some(line => 
        /^Conversation\s+\d+/i.test(line.trim())
      );
      
      if (hasConversationFormat) {
        // Parse format Conversation (một câu hỏi duy nhất với nhiều chỗ trống)
        const blankAnswers: Record<string, string> = {};
        let blankIndex = 1;
        
        // Xử lý từng dòng để tìm chỗ trống
        const processedLines = lines.map((line, idx) => {
          const trimmed = line.trim();
          const originalLine = line; // Giữ nguyên indentation
          
          // Pattern 1: "Câu hỏi? Đáp án" (có đáp án)
          const questionWithAnswer = trimmed.match(/^(.+\?)\s+(.+)$/);
          if (questionWithAnswer) {
            const questionPart = questionWithAnswer[1].trim();
            const answerPart = questionWithAnswer[2].trim();
            // Nếu đáp án không phải là dấu gạch dưới, giữ nguyên
            if (!answerPart.match(/^_+$/)) {
              return originalLine;
            }
          }
          
          // Pattern 2: "Câu hỏi?" (chỉ có câu hỏi, không có đáp án)
          const questionOnly = trimmed.match(/^(.+\?)\s*$/);
          if (questionOnly) {
            // Kiểm tra dòng tiếp theo có phải là chỗ trống không
            const nextLine = idx < lines.length - 1 ? lines[idx + 1].trim() : '';
            if (nextLine.match(/^_+$/)) {
              // Dòng tiếp theo là chỗ trống, tạo blank
              const blankKey = `blank${blankIndex++}`;
              blankAnswers[blankKey] = '';
              // Trả về dòng câu hỏi và đánh dấu dòng tiếp theo để bỏ qua
              return originalLine;
            }
          }
          
          // Pattern 3: Dòng chỉ có dấu gạch dưới (chỗ trống)
          if (trimmed.match(/^_+$/)) {
            const blankKey = `blank${blankIndex++}`;
            blankAnswers[blankKey] = '';
            // Thay thế dòng gạch dưới bằng placeholder
            const indent = originalLine.match(/^(\s*)/)?.[0] || '';
            return `${indent}[${blankKey}]`;
          }
          
          // Pattern 4: "Câu hỏi? _______" (câu hỏi và chỗ trống trên cùng dòng)
          const questionWithBlank = trimmed.match(/^(.+\?)\s+_+$/);
          if (questionWithBlank) {
            const blankKey = `blank${blankIndex++}`;
            blankAnswers[blankKey] = '';
            const questionPart = questionWithBlank[1].trim();
            const indent = originalLine.match(/^(\s*)/)?.[0] || '';
            return `${indent}${questionPart} [${blankKey}]`;
          }
          
          return originalLine;
        });
        
        questions.push({
          questionNumber: 1,
          questionText: processedLines.join('\n'),
          questionType: 'fill_blank',
          correctAnswer: JSON.stringify(blankAnswers),
          blankAnswers: blankAnswers,
          options: []
        });
        
        return questions;
      } else {
        // Parse format fill_blank thông thường: "Câu hỏi? Đáp án" hoặc "Câu hỏi?"
        let questionNumber = 1;
        for (const line of lines) {
          const trimmed = line.trim();
          // Pattern: "Câu hỏi? Đáp án" hoặc "Câu hỏi?"
          const fillBlankMatch = trimmed.match(/^(.+\?)\s*(.+)?$/);
          if (fillBlankMatch) {
            const questionText = fillBlankMatch[1].trim();
            const answer = fillBlankMatch[2]?.trim() || '';
            
            questions.push({
              questionNumber: questionNumber++,
              questionText,
              questionType: 'fill_blank',
              correctAnswer: answer,
              options: []
            });
          } else if (trimmed.length > 0 && !trimmed.match(/^_+$/)) {
            // Nếu không match pattern và không phải là dòng chỉ có dấu gạch dưới
            questions.push({
              questionNumber: questionNumber++,
              questionText: trimmed,
              questionType: 'fill_blank',
              correctAnswer: '',
              options: []
            });
          }
        }
        return questions;
      }
    } else {
      // Parse format multiple_choice (logic cũ)
      let currentQuestion: ParsedQuestion | null = null;
      let i = 0;

      while (i < lines.length) {
        const line = lines[i];
        const trimmedLine = line.trimStart();
        const questionMatch = trimmedLine.match(/^(\d+)\.\s*(.+)$/);
        
        if (questionMatch) {
          if (currentQuestion && currentQuestion.questionText) {
            questions.push(currentQuestion);
          }
          
          currentQuestion = {
            questionNumber: parseInt(questionMatch[1]),
            questionText: questionMatch[2].trimEnd(),
            questionType: 'multiple_choice',
            options: []
          };
        } else if (currentQuestion) {
          const trimmedLine = line.trimStart();
          const optionMatch = trimmedLine.match(/^\(?([A-D])\)?[.)]?\s*(.+)$/i);
          
          if (optionMatch) {
            const label = optionMatch[1].toUpperCase();
            const text = optionMatch[2].trimEnd();
            
            currentQuestion.options.push({
              label,
              text,
              isCorrect: false
            });
          } else if (line.trim().length > 0 && currentQuestion.options.length === 0) {
            const spaceBefore = line.match(/^(\s*)/)?.[0] || '';
            currentQuestion.questionText += (spaceBefore ? ' ' : ' ') + line.trimEnd();
          }
        }
        
        i++;
      }
      
      if (currentQuestion && currentQuestion.questionText) {
        questions.push(currentQuestion);
      }
      
      return questions.filter(q => q.options.length >= 2);
    }
  };

  const handleParse = () => {
    if (!importTextInput.trim()) {
      toast.error('Vui lòng nhập nội dung câu hỏi.');
      return;
    }
    
    const parsed = parseQuestions(importTextInput);
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
            isCorrect: optIdx === optionIndex
          }))
        };
      }
      return q;
    }));
  };

  const handleFillBlankAnswerChange = (questionIndex: number, answer: string) => {
    setParsedQuestions(prev => prev.map((q, qIdx) => {
      if (qIdx === questionIndex) {
        return {
          ...q,
          correctAnswer: answer
        };
      }
      return q;
    }));
  };

  const handleBlankAnswerChange = (questionIndex: number, blankKey: string, answer: string) => {
    setParsedQuestions(prev => prev.map((q, qIdx) => {
      if (qIdx === questionIndex && q.blankAnswers) {
        const newBlankAnswers = { ...q.blankAnswers, [blankKey]: answer };
        return {
          ...q,
          blankAnswers: newBlankAnswers,
          correctAnswer: JSON.stringify(newBlankAnswers)
        };
      }
      return q;
    }));
  };

  // Nhập hàng loạt và tự động thêm vào danh sách đã chọn
  const handleImportAndAdd = async () => {
    if (!categoryId) {
      toast.error('Vui lòng chọn chủ đề.');
      return;
    }
    
    if (parsedQuestions.length === 0) {
      toast.error('Không có câu hỏi nào để import.');
      return;
    }

    // Validation: multiple_choice cần đánh dấu đáp án đúng, fill_blank cần có correctAnswer
    if (importQuestionType === 'multiple_choice') {
      if (parsedQuestions.some(q => !q.options.some(opt => opt.isCorrect))) {
        toast.error('Vui lòng đánh dấu đáp án đúng cho tất cả các câu hỏi.');
        return;
      }
    } else {
      // Kiểm tra cả correctAnswer và blankAnswers
      const hasEmptyAnswer = parsedQuestions.some(q => {
        if (q.blankAnswers && Object.keys(q.blankAnswers).length > 0) {
          // Kiểm tra tất cả các blank answers
          return Object.values(q.blankAnswers).some(answer => !answer || answer.trim() === '');
        } else {
          // Kiểm tra correctAnswer thông thường
          return !q.correctAnswer || q.correctAnswer.trim() === '';
        }
      });
      
      if (hasEmptyAnswer) {
        toast.error('Vui lòng nhập đáp án đúng cho tất cả các chỗ trống.');
        return;
      }
    }

    setIsImporting(true);
    
    try {
      // Convert parsed questions to API format
      const questionsToImport = parsedQuestions.map(q => {
        if (q.questionType === 'fill_blank') {
          return {
            category_id: parseInt(categoryId),
            skill_focus: importSkillFocus,
            question_type: 'fill_blank' as const,
            question_text: q.questionText,
            correct_answer: q.correctAnswer || '',
            options: []
          };
        } else {
          return {
            category_id: parseInt(categoryId),
            skill_focus: importSkillFocus,
            question_type: 'multiple_choice' as const,
            question_text: q.questionText,
            options: q.options.map(opt => ({
              option_text: `${opt.label}. ${opt.text}`,
              is_correct: opt.isCorrect
            }))
          };
        }
      });

      const response = await api.post('/api/questions/bulk', { questions: questionsToImport });
      
      if (response.data.results.success.length > 0) {
        // Lấy danh sách ID câu hỏi mới được tạo
        const newQuestionIds = response.data.results.success.map((item: any) => item.question_id);
        
        // Reload danh sách câu hỏi để lấy thông tin đầy đủ
        const questionRes = await api.get<{ data: AdminQuestionSummary[] }>('/api/admin/questions', {
          params: { page: 1, limit: 1000 }
        });
        setAllQuestions(Array.isArray(questionRes.data.data) ? questionRes.data.data : []);
        
        // Tự động thêm các câu hỏi mới vào danh sách đã chọn
        const newQuestions = questionRes.data.data.filter((q: AdminQuestionSummary) => 
          newQuestionIds.includes(q.id)
        );
        
        const newQuestionOptions: QuestionOption[] = newQuestions.map((q: AdminQuestionSummary) => ({
          value: q.id,
          label: `ID: ${q.id} - ${q.question_type} (${q.skill_focus}) - ${q.question_text}`
        }));
        
        // Thêm vào danh sách đã chọn (tránh trùng lặp)
        setSelectedQuestions(prev => {
          const existingIds = prev.map(p => p.value);
          const toAdd = newQuestionOptions.filter(opt => !existingIds.includes(opt.value));
          return [...prev, ...toAdd];
        });
        
        // Chuyển về tab chọn câu hỏi
        setQuestionMode('select');
        setParsedQuestions([]);
        setImportTextInput('');
        
        toast.success(`Đã nhập và thêm ${response.data.results.success.length} câu hỏi vào đề thi!`);
      } else {
        toast.error('Không có câu hỏi nào được nhập thành công.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lỗi khi nhập câu hỏi.');
    } finally {
      setIsImporting(false);
    }
  };


  // --- HÀM SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedQuestions.length === 0) {
        toast.error('Vui lòng chọn ít nhất một câu hỏi.');
        return;
    }
    setIsSaving(true);
    // Lấy ID câu hỏi từ react-select state
    const questionIds = selectedQuestions.map(opt => opt.value);

    const quizPayload: any = {
      title,
      description: description || null,
      category_id: parseInt(categoryId, 10),
      time_limit_minutes: timeLimit === '' ? null : Number(timeLimit),
      questionIds: questionIds // Backend mong đợi mảng ID này
    };

    // Chỉ thêm asset_url nếu là listening category
    if (isListeningCategory && assetUrl.trim()) {
      quizPayload.asset_url = assetUrl.trim();
    }

    // Thêm video_url nếu có (cho tất cả loại đề thi)
    if (videoUrl.trim()) {
      quizPayload.video_url = videoUrl.trim();
    }

    try {
      if (isEditMode) {
        // API PUT /api/quizzes/:id đã có
        await api.put(`/api/quizzes/${id}`, quizPayload);
        toast.success('Cập nhật đề thi thành công!');
      } else {
         // API POST /api/quizzes đã có
        await api.post('/api/quizzes', quizPayload);
        toast.success('Tạo đề thi mới thành công!');
      }
      navigate('/admin/quizzes'); // Quay lại danh sách
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || (isEditMode ? 'Cập nhật thất bại.' : 'Tạo mới thất bại.');
      toast.error(errorMessage);
      setIsSaving(false);
    } 
  };

  // --- Hàm xử lý MuiSelect ---
  const handleCategoryChange = (event: SelectChangeEvent) => {
    const newCategoryId = event.target.value;
    setCategoryId(newCategoryId);
    // Reset assetUrl nếu đổi sang category không phải Listening
    const newCategory = allCategories.find(cat => cat.id.toString() === newCategoryId);
    if (newCategory && newCategory.skill_focus !== 'listening') {
      setAssetUrl('');
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
    <Container component="main" maxWidth="md">
      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          {isEditMode ? 'Chỉnh sửa Đề thi' : 'Thêm Đề thi mới'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, display: 'grid', gap: 3 }}>
          {/* Khối: Thông tin đề thi */}
          <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Thông tin đề thi
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Tiêu đề Đề thi (*)"
                  fullWidth
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isSaving}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required disabled={isSaving}>
                  <InputLabel id="category-select-label">Chủ đề (*)</InputLabel>
                  <MuiSelect
                    labelId="category-select-label"
                    id="category-select"
                    value={categoryId}
                    label="Chủ đề (*)"
                    onChange={handleCategoryChange}
                  >
                    {allCategories.map((cat) => (
                      <MenuItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </MuiSelect>
                  <FormHelperText>Chỉ hiển thị câu hỏi có cùng kỹ năng với chủ đề.</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Thời gian làm bài (phút, bỏ trống nếu không giới hạn)"
                  fullWidth
                  type="number"
                  value={timeLimit}
                  InputProps={{ inputProps: { min: 1 } }}
                  onChange={(e) => setTimeLimit(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                  disabled={isSaving}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Mô tả (tùy chọn)"
                  fullWidth
                  multiline
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isSaving}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Khối: File đính kèm (chỉ hiện nếu listening) */}
          {isListeningCategory && (
            <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                File đính kèm (Audio/Image) cho Listening
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Nhập URL file audio/hình ảnh hoặc tải trực tiếp từ máy tính.
              </Typography>
              <FileUploadField
                value={assetUrl}
                onChange={setAssetUrl}
                disabled={isSaving}
                label="File đính kèm (Audio/Image)"
                helperText="Nếu là Listening, bạn cần cung cấp audio hoặc hình minh họa."
              />
            </Box>
          )}

          {/* Khối: Video đính kèm (cho tất cả đề thi) */}
          <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Video đính kèm (Tùy chọn)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Tải video lên hoặc nhập URL video (YouTube, Vimeo, hoặc direct link).
            </Typography>
            <VideoUploadField
              value={videoUrl}
              onChange={setVideoUrl}
              disabled={isSaving}
              label="Video đính kèm"
              helperText="Video sẽ được hiển thị trong đề thi (tối đa 500MB)"
            />
          </Box>

          {/* Khối: Quản lý câu hỏi */}
          <Box sx={{ p: 2.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: 'background.default' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Quản lý câu hỏi (*)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Thứ tự câu hỏi trong đề thi sẽ theo thứ tự bạn chọn ở đây. Hiện đã chọn: {selectedQuestions.length} câu hỏi.
            </Typography>
            <Tabs
              value={questionMode}
              onChange={(_, newValue) => setQuestionMode(newValue)}
              sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
            >
              <Tab label="Chọn từ bộ câu hỏi" value="select" />
              <Tab label="Nhập hàng loạt" value="import" />
            </Tabs>

            {/* Tab: Chọn từ bộ câu hỏi */}
            {questionMode === 'select' && (
              <FormControl fullWidth>
                <Select
                  isMulti
                  options={questionOptions}
                  value={selectedQuestions}
                  onChange={(selected) => setSelectedQuestions(selected)}
                  placeholder="Tìm kiếm và chọn câu hỏi..."
                  isLoading={isLoading}
                  closeMenuOnSelect={false}
                  isDisabled={isSaving}
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: '48px',
                      borderColor: '#c4c4c4',
                    }),
                  }}
                />
                <FormHelperText>
                  Danh sách lọc theo kỹ năng của chủ đề. Bạn có thể chọn nhiều câu hỏi cùng lúc.
                </FormHelperText>
              </FormControl>
            )}

            {/* Tab: Nhập hàng loạt */}
            {questionMode === 'import' && (
              <Box>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Nhập câu hỏi theo định dạng sau, sau khi nhập xong các câu hỏi sẽ tự động được thêm vào đề thi:
                  </Typography>
                  {importQuestionType === 'multiple_choice' ? (
                    <pre style={{ marginTop: 8, marginBottom: 0, fontSize: '0.9em' }}>
{`101. The car ______ to my uncle.
A. belongs
B. are belonging
C. belong
D. belonging`}
                    </pre>
                  ) : (
                    <pre style={{ marginTop: 8, marginBottom: 0, fontSize: '0.9em' }}>
{`Câu 1. Watch the video. Complete the notes...
Conversation 1
  What's your name? Chen
  Where are you from? _______
  Which part? _______
Conversation 2
  What's your name? Alexander
  Where are you from? _______
  Which part? _______`}
                    </pre>
                  )}
                </Alert>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel id="import-question-type-label">Loại câu hỏi</InputLabel>
                      <MuiSelect
                        labelId="import-question-type-label"
                        id="import-question-type-select"
                        value={importQuestionType}
                        label="Loại câu hỏi"
                        onChange={(e) => {
                          setImportQuestionType(e.target.value as 'multiple_choice' | 'fill_blank');
                          setParsedQuestions([]);
                          setImportTextInput('');
                        }}
                      >
                        <MenuItem value="multiple_choice">Trắc nghiệm</MenuItem>
                        <MenuItem value="fill_blank">Điền vào chỗ trống</MenuItem>
                      </MuiSelect>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <FormControl fullWidth>
                      <InputLabel id="import-skill-label">Kỹ năng</InputLabel>
                      <MuiSelect
                        labelId="import-skill-label"
                        id="import-skill-select"
                        value={importSkillFocus}
                        label="Kỹ năng"
                        onChange={(e) => setImportSkillFocus(e.target.value as any)}
                      >
                        <MenuItem value="reading">Reading</MenuItem>
                        <MenuItem value="listening">Listening</MenuItem>
                        <MenuItem value="speaking">Speaking</MenuItem>
                        <MenuItem value="writing">Writing</MenuItem>
                      </MuiSelect>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Button
                      variant="outlined"
                      onClick={handleParse}
                      disabled={!importTextInput.trim()}
                      fullWidth
                      sx={{ height: '56px' }}
                    >
                      Phân tích câu hỏi
                    </Button>
                  </Grid>
                </Grid>

                <TextField
                  fullWidth
                  multiline
                  rows={8}
                  label="Nhập nội dung câu hỏi"
                  placeholder={importQuestionType === 'fill_blank' 
                    ? "Ví dụ:\nCâu 1. Watch the video. Complete the notes...\nConversation 1\n  What's your name? Chen\n  Where are you from? _______\n  Which part? _______"
                    : "Dán nội dung câu hỏi vào đây..."}
                  value={importTextInput}
                  onChange={(e) => setImportTextInput(e.target.value)}
                  sx={{ fontFamily: 'monospace', fontSize: '0.9em', mb: 2 }}
                />

                {parsedQuestions.length > 0 && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      {importQuestionType === 'multiple_choice' 
                        ? 'Vui lòng click vào đáp án đúng cho từng câu hỏi trước khi nhập.'
                        : 'Vui lòng nhập đáp án đúng cho từng câu hỏi trước khi nhập.'}
                    </Alert>
                    <Box sx={{ maxHeight: '300px', overflowY: 'auto', mb: 2 }}>
                      {parsedQuestions.map((q, qIdx) => (
                        <Card key={qIdx} sx={{ mb: 1.5 }}>
                          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                            <Box sx={{ display: 'flex', alignItems: 'start', mb: 1 }}>
                              <Chip
                                label={`Câu ${q.questionNumber || qIdx + 1}`}
                                color="primary"
                                size="small"
                                sx={{ mr: 1 }}
                              />
                              <Typography variant="body2" sx={{ flex: 1, fontSize: '0.875rem' }}>
                                {q.questionText}
                              </Typography>
                            </Box>
                            {q.questionType === 'fill_blank' ? (
                              <Box sx={{ mt: 1 }}>
                                {q.blankAnswers && Object.keys(q.blankAnswers).length > 0 ? (
                                  // Hiển thị nhiều TextField cho nhiều chỗ trống
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                      Nhập đáp án cho từng chỗ trống (theo thứ tự xuất hiện trong câu hỏi):
                                    </Typography>
                                    {Object.entries(q.blankAnswers).map(([blankKey, currentAnswer], blankIdx) => {
                                      // Tìm câu hỏi trước chỗ trống này
                                      const blankPattern = new RegExp(`\\[${blankKey}\\]`);
                                      const blankIndex = q.questionText.search(blankPattern);
                                      
                                      let contextLabel = `Chỗ trống ${blankIdx + 1}`;
                                      if (blankIndex > 0) {
                                        // Tìm dòng chứa blank này
                                        const textBefore = q.questionText.substring(0, blankIndex);
                                        const linesBefore = textBefore.split('\n');
                                        const currentLine = linesBefore[linesBefore.length - 1];
                                        
                                        // Tìm câu hỏi gần nhất (có dấu ?)
                                        const questionMatch = currentLine.match(/([^?]+\?)/);
                                        if (questionMatch) {
                                          contextLabel = `${questionMatch[1].trim()} → Chỗ trống ${blankIdx + 1}`;
                                        }
                                      }
                                      
                                      return (
                                        <TextField
                                          key={blankKey}
                                          fullWidth
                                          size="small"
                                          label={contextLabel}
                                          value={currentAnswer || ''}
                                          onChange={(e) => handleBlankAnswerChange(qIdx, blankKey, e.target.value)}
                                          placeholder="Nhập đáp án..."
                                          sx={{ mb: 1 }}
                                        />
                                      );
                                    })}
                                  </Box>
                                ) : (
                                  // Hiển thị một TextField cho một đáp án
                                  <TextField
                                    fullWidth
                                    size="small"
                                    label="Đáp án đúng"
                                    value={q.correctAnswer || ''}
                                    onChange={(e) => handleFillBlankAnswerChange(qIdx, e.target.value)}
                                    placeholder="Nhập đáp án đúng..."
                                  />
                                )}
                              </Box>
                            ) : (
                              <Box sx={{ mt: 1 }}>
                                {q.options.map((opt, optIdx) => (
                                  <Box
                                    key={optIdx}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      p: 0.75,
                                      mb: 0.5,
                                      cursor: 'pointer',
                                      borderRadius: 1,
                                      bgcolor: opt.isCorrect ? 'success.light' : 'transparent',
                                      '&:hover': { bgcolor: 'action.hover' }
                                    }}
                                    onClick={() => handleToggleCorrect(qIdx, optIdx)}
                                  >
                                    {opt.isCorrect ? (
                                      <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: '1rem' }} />
                                    ) : (
                                      <CancelIcon color="disabled" sx={{ mr: 1, fontSize: '1rem' }} />
                                    )}
                                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                                      <strong>{opt.label}.</strong> {opt.text}
                                    </Typography>
                                  </Box>
                                ))}
                              </Box>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={handleImportAndAdd}
                      disabled={
                        isImporting ||
                        !categoryId ||
                        (importQuestionType === 'multiple_choice' 
                          ? parsedQuestions.some((q) => !q.options.some((opt) => opt.isCorrect))
                          : parsedQuestions.some((q) => {
                              if (q.blankAnswers && Object.keys(q.blankAnswers).length > 0) {
                                return Object.values(q.blankAnswers).some(answer => !answer || answer.trim() === '');
                              }
                              return !q.correctAnswer || q.correctAnswer.trim() === '';
                            }))
                      }
                      startIcon={isImporting ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                      {isImporting ? 'Đang nhập...' : `Nhập và thêm ${parsedQuestions.length} câu hỏi vào đề thi`}
                    </Button>
                    {importQuestionType === 'multiple_choice' && parsedQuestions.some((q) => !q.options.some((opt) => opt.isCorrect)) && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        Vui lòng đánh dấu đáp án đúng cho tất cả các câu hỏi.
                      </Alert>
                    )}
                    {importQuestionType === 'fill_blank' && parsedQuestions.some((q) => {
                        if (q.blankAnswers && Object.keys(q.blankAnswers).length > 0) {
                          return Object.values(q.blankAnswers).some(answer => !answer || answer.trim() === '');
                        }
                        return !q.correctAnswer || q.correctAnswer.trim() === '';
                      }) && (
                      <Alert severity="error" sx={{ mt: 1 }}>
                        Vui lòng nhập đáp án đúng cho tất cả các chỗ trống.
                      </Alert>
                    )}
                  </>
                )}
              </Box>
            )}
          </Box>

          {/* Nút bấm */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-start' }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSaving ? 'Đang lưu...' : isEditMode ? 'Lưu thay đổi' : 'Tạo đề thi'}
            </Button>
            <Button type="button" variant="outlined" onClick={() => navigate('/admin/quizzes')} disabled={isSaving}>
              Hủy
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminQuizFormPage;