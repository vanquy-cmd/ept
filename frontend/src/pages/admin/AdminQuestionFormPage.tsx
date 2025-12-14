import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import FileUploadField from '../../components/FileUploadField';
import type { QuizQuestion, QuizQuestionOption, Category } from '../../types';
import { toast } from 'react-hot-toast';

// --- THÊM IMPORT CỦA MUI ---
import {
  TextField, Container, Select, MenuItem, FormControl, InputLabel,
  Paper, Button, IconButton, CircularProgress, Box, Typography,
  Grid, Radio
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';

type QuestionFormParams = {
  id?: string; // id cho Edit
};

// Kiểu dữ liệu cho một Option trong state (thêm ID tạm để quản lý key)
interface OptionState extends Partial<QuizQuestionOption> {
  tempId: number; // ID tạm thời cho React key
  is_correct: boolean;
}

const AdminQuestionFormPage: React.FC = () => {
  const { id } = useParams<QuestionFormParams>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // === STATE CHO FORM ===
  const [categoryId, setCategoryId] = useState('');
  const [skillFocus, setSkillFocus] = useState<'listening' | 'reading' | 'speaking' | 'writing'>('listening');
  const [questionType, setQuestionType] = useState<'multiple_choice' | 'fill_blank' | 'essay' | 'speaking'>('multiple_choice');
  const [questionText, setQuestionText] = useState('');
  const [assetUrl, setAssetUrl] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState(''); // Cho fill_blank
  const [options, setOptions] = useState<OptionState[]>([]); // Cho multiple_choice
  
  // === STATE QUẢN LÝ ===
  const [categories, setCategories] = useState<Category[]>([]); 
  const [isLoading, setIsLoading] = useState(true); 
  const [isSaving, setIsSaving] = useState(false);

  // Tải categories và dữ liệu question (nếu edit)
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // Luôn tải categories
        const catResponse = await api.get<Category[]>('/api/learning/categories');
        setCategories(catResponse.data);
        if (catResponse.data.length > 0 && !isEditMode) {
            setCategoryId(catResponse.data[0].id.toString()); 
        }

        // Nếu là edit, tải question (API GET /api/questions/:id đã có)
        if (isEditMode && id) {
          // API này trả về cả options nếu là multiple_choice
          const qResponse = await api.get<QuizQuestion & { options: QuizQuestionOption[] }>(`/api/questions/${id}`);
          const qData = qResponse.data;
          if (qData.category_id) { // <-- THÊM KIỂM TRA NÀY
            setCategoryId(qData.category_id.toString());
          }
          setSkillFocus(qData.skill_focus);
          setQuestionType(qData.question_type);
          setQuestionText(qData.question_text);
          setAssetUrl(qData.asset_url || '');
          setCorrectAnswer(qData.correct_answer || '');
          // Chuyển đổi options từ API sang state
          if (qData.question_type === 'multiple_choice' && qData.options) {
             setOptions(qData.options.map(opt => ({ 
                ...opt, 
                option_id: opt.option_id, // Giữ lại ID thật nếu có
                tempId: opt.option_id || Date.now() + Math.random(), // Dùng ID thật hoặc tạo ID tạm
                is_correct: Boolean(opt.is_correct) // Chuyển 0/1 thành boolean
             })));
          } else {
             setOptions([]); // Reset options nếu không phải multiple choice
          }
        } else {
            // Nếu là tạo mới, thêm 2 option mặc định cho multiple choice
            if (questionType === 'multiple_choice' && options.length === 0) {
                addOption();
                addOption();
            }
        }
      } catch (err: any) {
        toast.error('Không thể tải dữ liệu cần thiết.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, isEditMode]); // Chỉ chạy lại khi id hoặc isEditMode thay đổi


  // --- HÀM QUẢN LÝ OPTIONS ---
  const addOption = () => {
    setOptions(prev => [...prev, { tempId: Date.now(), option_text: '', is_correct: false }]);
  };

  const removeOption = (tempIdToRemove: number) => {
    setOptions(prev => prev.filter(opt => opt.tempId !== tempIdToRemove));
  };

  const handleOptionTextChange = (tempId: number, text: string) => {
    setOptions(prev => prev.map(opt => 
        opt.tempId === tempId ? { ...opt, option_text: text } : opt
    ));
  };
  
  // Chỉ cho phép 1 đáp án đúng
  const handleCorrectOptionChange = (tempIdToMarkCorrect: number) => {
    setOptions(prev => prev.map(opt => ({
        ...opt,
        is_correct: opt.tempId === tempIdToMarkCorrect
    })));
  };

  // --- HÀM SUBMIT ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // Chuẩn bị dữ liệu gửi đi
    const questionPayload: any = {
      category_id: parseInt(categoryId, 10),
      skill_focus: skillFocus,
      question_type: questionType,
      question_text: questionText,
      asset_url: assetUrl || null,
    };

    // Thêm các trường tùy thuộc vào loại câu hỏi
    if (questionType === 'multiple_choice') {
       // Kiểm tra xem có ít nhất 1 đáp án đúng không
       if (!options.some(opt => opt.is_correct)) {
           toast.error('Vui lòng chọn một đáp án đúng.');
           setIsSaving(false);
           return;
       }
       // Chỉ gửi đi option_text và is_correct
       questionPayload.options = options.map(({ option_text, is_correct }) => ({ option_text, is_correct }));
    } else if (questionType === 'fill_blank') {
       questionPayload.correct_answer = correctAnswer;
    } else {
        // essay, speaking không cần gửi thêm gì đặc biệt (correct_answer có thể dùng làm gợi ý)
        questionPayload.correct_answer = correctAnswer || null; 
    }

    try {
      if (isEditMode) {
        await api.put(`/api/questions/${id}`, questionPayload);
      } else {
        await api.post('/api/questions', questionPayload);
      }
      navigate('/admin/questions'); // Quay lại danh sách
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || (isEditMode ? 'Cập nhật thất bại.' : 'Tạo mới thất bại.');
      toast.error(errorMessage);
      setIsSaving(false);
    } 
  };

  // --- Hàm xử lý Select MUI ---
  const handleCategoryChange = (event: SelectChangeEvent) => setCategoryId(event.target.value);
  const handleSkillFocusChange = (event: SelectChangeEvent) => setSkillFocus(event.target.value as any);
  const handleQuestionTypeChange = (event: SelectChangeEvent) => {
      const newType = event.target.value as any;
      setQuestionType(newType);
      // Reset options nếu chuyển sang loại không phải trắc nghiệm
      if (newType !== 'multiple_choice') {
          setOptions([]);
      } else if (options.length === 0) { // Thêm option mặc định nếu chuyển sang trắc nghiệm
          addOption();
          addOption();
      }
      // Reset correctAnswer nếu chuyển sang trắc nghiệm
      if (newType === 'multiple_choice') {
          setCorrectAnswer('');
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
          {isEditMode ? 'Chỉnh sửa Câu hỏi' : 'Thêm Câu hỏi mới'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {/* Grid Container cho các trường select */}
          <Grid container spacing={2}>
            {/* Category */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth required disabled={isSaving}>
                <InputLabel id="category-select-label">Chủ đề</InputLabel>
                <Select labelId="category-select-label" id="category-select" value={categoryId} label="Chủ đề" onChange={handleCategoryChange}>
                  {categories.map(cat => <MenuItem key={cat.id} value={cat.id.toString()}>{cat.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            {/* Skill Focus */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth required disabled={isSaving}>
                <InputLabel id="skill-select-label">Kỹ năng</InputLabel>
                <Select labelId="skill-select-label" id="skill-select" value={skillFocus} label="Kỹ năng" onChange={handleSkillFocusChange}>
                  <MenuItem value="listening">Listening</MenuItem>
                  <MenuItem value="reading">Reading</MenuItem>
                  <MenuItem value="speaking">Speaking</MenuItem>
                  <MenuItem value="writing">Writing</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Question Type */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth required disabled={isSaving}>
                <InputLabel id="type-select-label">Loại câu hỏi</InputLabel>
                <Select labelId="type-select-label" id="type-select" value={questionType} label="Loại câu hỏi" onChange={handleQuestionTypeChange}>
                  <MenuItem value="multiple_choice">Trắc nghiệm</MenuItem>
                  <MenuItem value="fill_blank">Điền từ</MenuItem>
                  <MenuItem value="essay">Viết luận</MenuItem>
                  <MenuItem value="speaking">Nói</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Question Text */}
          <TextField
            margin="normal" required fullWidth id="questionText" label="Đề bài" name="questionText"
            multiline rows={5} value={questionText} onChange={(e) => setQuestionText(e.target.value)}
            disabled={isSaving}
          />

          {/* Asset cho Listening/Speaking: chọn file từ máy hoặc nhập URL */}
          {(skillFocus === 'listening' || skillFocus === 'speaking') && (
            <Box sx={{ mt: 2 }}>
              <FileUploadField
                value={assetUrl}
                onChange={setAssetUrl}
                disabled={isSaving}
                label="File đính kèm (Audio/Image)"
                helperText="Chọn file từ máy hoặc nhập URL (hỗ trợ audio và ảnh minh họa cho Listening/Speaking)"
              />
            </Box>
          )}

          {/* --- PHẦN HIỂN THỊ ĐỘNG --- */}

          {/* Options (cho multiple_choice) */}
          {questionType === 'multiple_choice' && (
            <Box sx={{ border: '1px dashed grey', p: 2, mt: 2, borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>Các lựa chọn:</Typography>
              {options.map((opt, index) => (
                <Box key={opt.tempId} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Radio
                    checked={opt.is_correct}
                    onChange={() => handleCorrectOptionChange(opt.tempId)}
                    value={opt.tempId.toString()} // Value là duy nhất
                    name="correct_option_radio"
                    color="success"
                  />
                  <TextField
                    variant="outlined" size="small" fullWidth required
                    value={opt.option_text || ''}
                    onChange={(e) => handleOptionTextChange(opt.tempId, e.target.value)}
                    placeholder={`Lựa chọn ${index + 1}`}
                    disabled={isSaving}
                  />
                  <IconButton
                    aria-label="remove option" color="error"
                    onClick={() => removeOption(opt.tempId)}
                    disabled={options.length <= 2 || isSaving}
                    sx={{ ml: 1 }}
                  >
                    <RemoveCircleOutlineIcon />
                  </IconButton>
                </Box>
              ))}
              <Button
                startIcon={<AddCircleOutlineIcon />}
                onClick={addOption}
                disabled={isSaving}
                sx={{ mt: 1 }}
              >
                Thêm lựa chọn
              </Button>
            </Box>
          )}

          {/* Correct Answer (cho fill_blank) */}
          {questionType === 'fill_blank' && (
            <TextField
              margin="normal" required fullWidth id="correctAnswer" label="Đáp án đúng (Điền từ)"
              name="correctAnswer" value={correctAnswer} onChange={(e) => setCorrectAnswer(e.target.value)}
              disabled={isSaving}
            />
          )}

          {/* Correct Answer (Gợi ý cho Essay/Speaking) */}
          {(questionType === 'essay' || questionType === 'speaking') && (
            <TextField
              margin="normal" fullWidth id="correctAnswer" label="Gợi ý đáp án / Tiêu chí chấm (tùy chọn)"
              name="correctAnswer" multiline rows={3} value={correctAnswer}
              onChange={(e) => setCorrectAnswer(e.target.value)} disabled={isSaving}
            />
          )}

          {/* Nút bấm */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}>
              {isSaving ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo câu hỏi')}
            </Button>
            <Button type="button" variant="outlined" onClick={() => navigate('/admin/questions')} disabled={isSaving}>
              Hủy
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminQuestionFormPage;