import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Category } from '../../types';
import { toast } from 'react-hot-toast';

import {
  TextField, Container, MenuItem, FormControl, InputLabel,
  Paper, Button, Grid, CircularProgress, Box, Typography,
  Select
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';

type CategoryFormParams = {
  id?: string;
};

const AdminCategoryFormPage: React.FC = () => {
  const { id } = useParams<CategoryFormParams>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [skillFocus, setSkillFocus] = useState<'listening' | 'reading' | 'speaking' | 'writing' | 'general'>('general');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        if (isEditMode && id) {
          const response = await api.get<Category>(`/api/learning/categories/${id}`);
          const category = response.data;
          setName(category.name);
          setDescription(category.description || '');
          setSkillFocus(category.skill_focus);
        }
      } catch (err: any) {
        toast.error('Không thể tải dữ liệu chủ đề.');
        console.error(err);
        navigate('/admin/categories');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id, isEditMode, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Vui lòng nhập tên chủ đề.');
      return;
    }

    setIsSaving(true);

    const categoryPayload = {
      name: name.trim(),
      description: description.trim() || null,
      skill_focus: skillFocus
    };

    try {
      if (isEditMode && id) {
        await api.put(`/api/learning/categories/${id}`, categoryPayload);
        toast.success('Cập nhật chủ đề thành công!');
      } else {
        await api.post('/api/learning/categories', categoryPayload);
        toast.success('Tạo chủ đề mới thành công!');
      }
      navigate('/admin/categories');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || (isEditMode ? 'Cập nhật thất bại.' : 'Tạo mới thất bại.');
      toast.error(errorMessage);
      setIsSaving(false);
    }
  };

  const handleSkillFocusChange = (event: SelectChangeEvent) => {
    setSkillFocus(event.target.value as any);
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
          {isEditMode ? 'Chỉnh sửa Chủ đề' : 'Thêm Chủ đề mới'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            {/* Name */}
            <Grid item xs={12}>
              <TextField
                label="Tên chủ đề (*)"
                fullWidth
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
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

            {/* Skill Focus */}
            <Grid item xs={12}>
              <FormControl fullWidth required disabled={isSaving}>
                <InputLabel id="skill-focus-select-label">Kỹ năng (*)</InputLabel>
                <Select
                  labelId="skill-focus-select-label"
                  id="skill-focus-select"
                  value={skillFocus}
                  label="Kỹ năng (*)"
                  onChange={handleSkillFocusChange}
                >
                  <MenuItem value="listening">Nghe (Listening)</MenuItem>
                  <MenuItem value="reading">Đọc (Reading)</MenuItem>
                  <MenuItem value="speaking">Nói (Speaking)</MenuItem>
                  <MenuItem value="writing">Viết (Writing)</MenuItem>
                  <MenuItem value="general">Tổng hợp (General)</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Buttons */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSaving ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo chủ đề')}
            </Button>
            <Button
              type="button"
              variant="outlined"
              onClick={() => navigate('/admin/categories')}
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

export default AdminCategoryFormPage;

