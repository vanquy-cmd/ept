import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Category } from '../../types';
import { toast } from 'react-hot-toast';

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, CircularProgress, Alert, Box, Typography, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const AdminCategoryListPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get<Category[]>('/api/learning/categories');
      setCategories(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách chủ đề.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (categoryId: number, categoryName: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa chủ đề "${categoryName}" (ID: ${categoryId}) không?`)) {
      try {
        await api.delete(`/api/learning/categories/${categoryId}`);
        toast.success('Xóa chủ đề thành công!');
        fetchCategories();
      } catch (err: any) {
        const errorMessage = err.response?.data?.message || 'Xóa thất bại. Lỗi không xác định';
        toast.error(errorMessage);
      }
    }
  };

  const getSkillFocusColor = (skillFocus: string) => {
    const colors: Record<string, 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'> = {
      listening: 'primary',
      reading: 'info',
      speaking: 'success',
      writing: 'warning',
      general: 'default'
    };
    return colors[skillFocus] || 'default';
  };

  const getSkillFocusLabel = (skillFocus: string) => {
    const labels: Record<string, string> = {
      listening: 'Nghe',
      reading: 'Đọc',
      speaking: 'Nói',
      writing: 'Viết',
      general: 'Tổng hợp'
    };
    return labels[skillFocus] || skillFocus;
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }

    if (categories.length === 0) {
      return <Typography sx={{ mt: 2 }}>Chưa có chủ đề nào.</Typography>;
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><strong>ID</strong></TableCell>
              <TableCell><strong>Tên chủ đề</strong></TableCell>
              <TableCell><strong>Mô tả</strong></TableCell>
              <TableCell><strong>Kỹ năng</strong></TableCell>
              <TableCell align="right"><strong>Thao tác</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.id}</TableCell>
                <TableCell><strong>{category.name}</strong></TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell>
                  <Chip 
                    label={getSkillFocusLabel(category.skill_focus)} 
                    color={getSkillFocusColor(category.skill_focus)}
                    size="small"
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    color="primary"
                    onClick={() => navigate(`/admin/categories/${category.id}/edit`)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(category.id, category.name)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Quản lý Chủ đề
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/categories/new')}
        >
          Thêm chủ đề mới
        </Button>
      </Box>

      {renderContent()}
    </Box>
  );
};

export default AdminCategoryListPage;


