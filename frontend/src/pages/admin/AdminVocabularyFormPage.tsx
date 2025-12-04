import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { VocabularySet, VocabularyWord, Category } from '../../types';
import { toast } from 'react-hot-toast';

import Alert from '@mui/material/Alert';
import {
  TextField, Container, Select, MenuItem, FormControl, InputLabel,
  Paper, Button, IconButton, CircularProgress, Box, Typography,
  Grid
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
// Import Icons
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
// -----------------------------


type VocabFormParams = {
  id?: string; // id cho Edit
};

// Kiểu dữ liệu cho một Word trong state (thêm ID tạm)
interface WordState extends Partial<VocabularyWord> {
  tempId: number; // ID tạm thời cho React key
}

const AdminVocabularyFormPage: React.FC = () => {
  const { id } = useParams<VocabFormParams>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // --- Giữ nguyên state form và state quản lý ---
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | ''>('');
  const [words, setWords] = useState<WordState[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // --- Giữ nguyên useEffect tải dữ liệu ---
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const catResponse = await api.get<Category[]>('/api/learning/categories');
        setAllCategories(catResponse.data);
        if (isEditMode && id) {
          const setResponse = await api.get<VocabularySet & { words: VocabularyWord[] }>(`/api/vocabulary/sets/${id}/details`);
          const setData = setResponse.data;
          setTitle(setData.title);
          setDescription(setData.description || '');
          setCategoryId(setData.category_id?.toString() || '');
          setWords(setData.words.map(w => ({ ...w, tempId: w.id || Date.now() + Math.random() })));
        } else {
            if (words.length === 0) addWord(); // Thêm từ trống mặc định khi tạo mới
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


  // --- Giữ nguyên các hàm quản lý words (addWord, removeWord, ...) ---
    const addWord = () => {
        setWords(prev => [...prev, { tempId: Date.now(), word: '', definition: '' }]);
    };
    const removeWord = (tempIdToRemove: number) => {
        setWords(prev => prev.filter(w => w.tempId !== tempIdToRemove));
    };
    const handleWordChange = (tempId: number, field: keyof WordState, value: string) => {
        setWords(prev => prev.map(w => w.tempId === tempId ? { ...w, [field]: value } : w));
    };

  // --- Giữ nguyên hàm handleSubmit ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (words.some(w => !w.word || !w.definition)) {
        toast.error('Mỗi từ phải có ít nhất "Từ" và "Định nghĩa".');
        return;
    }
    setIsSaving(true);
    // Chuẩn bị payload
    const setPayload = {
      title,
      description: description || null,
      category_id: categoryId ? parseInt(categoryId, 10) : null, // Gửi null nếu không chọn category
      // Chỉ gửi đi các trường cần thiết của words
      words: words.map(({ word, part_of_speech, definition, example_sentence, audio_url }) => ({
          word, part_of_speech: part_of_speech || null, definition,
          example_sentence: example_sentence || null, audio_url: audio_url || null
      }))
    };

    try {
      if (isEditMode) { await api.put(`/api/vocabulary/sets/${id}`, setPayload); }
      else { await api.post('/api/vocabulary/sets', setPayload); }
      navigate('/admin/vocabulary-sets');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || (isEditMode ? 'Cập nhật thất bại.' : 'Tạo mới thất bại.');
      toast.error(errorMessage); // <-- 3. DÙNG TOAST
      setIsSaving(false);
    }
  };

  // --- Hàm xử lý Select MUI ---
  const handleCategoryChange = (event: SelectChangeEvent) => setCategoryId(event.target.value);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="lg"> {/* Tăng chiều rộng */}
      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          {isEditMode ? 'Chỉnh sửa Bộ Từ vựng' : 'Thêm Bộ Từ vựng mới'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {/* --- Phần thông tin Set --- */}
          <Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Thông tin Bộ Từ vựng</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField label="Tiêu đề Bộ (*)" fullWidth required value={title}
                  onChange={(e) => setTitle(e.target.value)} disabled={isSaving}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth disabled={isSaving}>
                  <InputLabel id="category-select-label">Chủ đề (tùy chọn)</InputLabel>
                  <Select labelId="category-select-label" id="category-select" value={categoryId} label="Chủ đề (tùy chọn)" onChange={handleCategoryChange}>
                    <MenuItem value="">-- Không chọn --</MenuItem>
                    {allCategories.map(cat => <MenuItem key={cat.id} value={cat.id.toString()}>{cat.name}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField label="Mô tả (tùy chọn)" fullWidth multiline rows={2} value={description}
                  onChange={(e) => setDescription(e.target.value)} disabled={isSaving}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* --- Phần quản lý Words --- */}
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>Các Từ vựng trong Bộ</Typography>
            {words.map((wordState, index) => (
              <Box key={wordState.tempId} sx={{ mb: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
                 <Grid container spacing={2} alignItems="center">
                    {/* Từ & Loại từ */}
                    <Grid item xs={12} sm={5}>
                        <TextField label={`Từ #${index + 1} (*)`} fullWidth required size="small"
                           value={wordState.word || ''} onChange={(e) => handleWordChange(wordState.tempId, 'word', e.target.value)} disabled={isSaving}/>
                    </Grid>
                     <Grid item xs={12} sm={4}>
                        <TextField label="Loại từ" fullWidth size="small"
                           value={wordState.part_of_speech || ''} onChange={(e) => handleWordChange(wordState.tempId, 'part_of_speech', e.target.value)} disabled={isSaving}/>
                    </Grid>
                    {/* Nút xóa */}
                    <Grid item xs={12} sm={3} sx={{ textAlign: 'right' }}>
                       <IconButton aria-label="remove word" color="error" onClick={() => removeWord(wordState.tempId)} disabled={words.length <= 1 || isSaving}>
                            <RemoveCircleOutlineIcon />
                        </IconButton>
                    </Grid>
                     {/* Định nghĩa */}
                     <Grid item xs={12}>
                         <TextField label="Định nghĩa (*)" fullWidth required multiline rows={2} size="small"
                           value={wordState.definition || ''} onChange={(e) => handleWordChange(wordState.tempId, 'definition', e.target.value)} disabled={isSaving}/>
                    </Grid>
                    {/* Ví dụ */}
                     <Grid item xs={12}>
                         <TextField label="Câu ví dụ" fullWidth multiline rows={2} size="small"
                           value={wordState.example_sentence || ''} onChange={(e) => handleWordChange(wordState.tempId, 'example_sentence', e.target.value)} disabled={isSaving}/>
                    </Grid>
                    {/* Audio URL */}
                    <Grid item xs={12}>
                         <TextField label="URL Audio" fullWidth size="small"
                           value={wordState.audio_url || ''} onChange={(e) => handleWordChange(wordState.tempId, 'audio_url', e.target.value)} disabled={isSaving} placeholder="https://..."/>
                    </Grid>
                 </Grid>
              </Box>
            ))}
             <Button startIcon={<AddCircleOutlineIcon />} onClick={addWord} disabled={isSaving} sx={{ mt: 1 }}>
              Thêm từ mới
            </Button>
          </Paper>
          {/* Nút bấm Submit/Cancel */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button type="submit" variant="contained" disabled={isSaving} startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}>
              {isSaving ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo Bộ Từ vựng')}
            </Button>
            <Button type="button" variant="outlined" onClick={() => navigate('/admin/vocabulary-sets')} disabled={isSaving}>
              Hủy
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminVocabularyFormPage;