import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { LessonDetail, Category } from '../../types';
import { toast } from 'react-hot-toast';

// --- THÊM IMPORT CỦA MUI ---
import type { SelectChangeEvent } from '@mui/material/Select';

import {
  Select, Container, MenuItem, FormControl, TextField,
  Paper, Button, InputLabel, CircularProgress, Box, Typography
} from '@mui/material';
// -----------------------------


type LessonFormParams = {
  id?: string; // id cho Edit
};

const AdminLessonFormPage: React.FC = () => {
  const { id } = useParams<LessonFormParams>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Giữ nguyên state form
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [contentType, setContentType] = useState<'text' | 'video'>('text');
  const [contentBody, setContentBody] = useState('');

  // Giữ nguyên state quản lý
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Giữ nguyên useEffect tải dữ liệu
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const catResponse = await api.get<Category[]>('/api/learning/categories');
        setCategories(catResponse.data);
        if (catResponse.data.length > 0 && !isEditMode) {
            setCategoryId(catResponse.data[0].id.toString());
        }
        if (isEditMode && id) {
          const lessonResponse = await api.get<LessonDetail>(`/api/learning/lessons/${id}`);
          const lessonData = lessonResponse.data;
          setTitle(lessonData.title);
          setCategoryId(lessonData.category_id.toString());
          setContentType(lessonData.content_type);
          setContentBody(lessonData.content_body);
        }
      } catch (err: any) {
        toast.error('Không thể tải dữ liệu cần thiết.'); // <-- 3. DÙNG TOAST
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, isEditMode]);

  // Giữ nguyên hàm handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const lessonData = {
      title,
      category_id: parseInt(categoryId, 10),
      content_type: contentType,
      content_body: contentBody
    };
    try {
      if (isEditMode) {
        await api.put(`/api/learning/lessons/${id}`, lessonData);
        toast.success('Cập nhật bài học thành công!'); // <-- 3. DÙNG TOAST
      } else {
        await api.post('/api/learning/lessons', lessonData);
        toast.success('Tạo bài học mới thành công!'); // <-- 3. DÙNG TOAST
      }
      navigate('/admin/lessons');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || (isEditMode ? 'Cập nhật thất bại.' : 'Tạo mới thất bại.');
      toast.error(errorMessage); // <-- 3. DÙNG TOAST
      setIsSaving(false);
    }
  };

  // Hàm xử lý Select MUI
  const handleCategoryChange = (event: SelectChangeEvent) => {
    setCategoryId(event.target.value);
  };
  const handleContentTypeChange = (event: SelectChangeEvent) => {
    setContentType(event.target.value as 'text' | 'video');
  };


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container component="main" maxWidth="md"> {/* Tăng chiều rộng cho form nội dung */}
      <Paper elevation={3} sx={{ mt: 4, p: 3 }}>
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          {isEditMode ? 'Chỉnh sửa Bài học' : 'Thêm Bài học mới'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {/* Tiêu đề */}
          <TextField
            margin="normal" required fullWidth id="title" label="Tiêu đề Bài học"
            name="title" autoFocus={!isEditMode} value={title}
            onChange={(e) => setTitle(e.target.value)} disabled={isSaving}
          />

          {/* Chủ đề */}
          <FormControl fullWidth margin="normal" required disabled={isSaving}>
            <InputLabel id="category-select-label">Chủ đề</InputLabel>
            <Select
              labelId="category-select-label" id="category-select" value={categoryId}
              label="Chủ đề" onChange={handleCategoryChange}
            >
              {categories.length === 0 && <MenuItem disabled>Đang tải...</MenuItem>}
              {categories.map(cat => (
                <MenuItem key={cat.id} value={cat.id.toString()}>{cat.name}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Loại nội dung */}
           <FormControl fullWidth margin="normal" required disabled={isSaving}>
            <InputLabel id="content-type-select-label">Loại nội dung</InputLabel>
            <Select
              labelId="content-type-select-label" id="content-type-select" value={contentType}
              label="Loại nội dung" onChange={handleContentTypeChange}
            >
              <MenuItem value="text">Văn bản (Text)</MenuItem>
              <MenuItem value="video">Video (URL)</MenuItem>
            </Select>
          </FormControl>

          {/* Nội dung */}
          <TextField
            margin="normal" required fullWidth id="contentBody" label="Nội dung"
            name="contentBody" multiline // Cho phép nhập nhiều dòng
            rows={contentType === 'text' ? 15 : 3} // Số dòng tùy loại
            value={contentBody} onChange={(e) => setContentBody(e.target.value)}
            disabled={isSaving}
            placeholder={contentType === 'video' ? 'Dán URL video (ví dụ: YouTube)' : 'Nhập nội dung bài học...'}
          />

          {/* Nút bấm */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit" variant="contained" disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSaving ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo bài học')}
            </Button>
            <Button
              type="button" variant="outlined" onClick={() => navigate('/admin/lessons')}
              disabled={isSaving}
            >
              Hủy
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default AdminLessonFormPage;