import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
// Import type AdminLessonSummary và PaginatedResponse
import type { AdminLessonSummary, PaginatedResponse } from '../../types'; 

// --- CẬP NHẬT IMPORT CỦA MUI ---
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, CircularProgress, Alert, Box, Typography, Chip,
  Pagination // <-- Đảm bảo có Pagination
} from '@mui/material';

import { toast } from 'react-hot-toast';
// Import Icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
// -----------------------------

// Định nghĩa kiểu cho phản hồi API Lesson
type LessonPaginatedResponse = PaginatedResponse<AdminLessonSummary>;

const AdminLessonListPage: React.FC = () => {
  const [lessons, setLessons] = useState<AdminLessonSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- STATE MỚI CHO PHÂN TRANG ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10); // Có thể thay đổi
  // ---------------------------------

  // Hàm tải danh sách (Cập nhật)
  const fetchLessons = async (currentPage: number) => {
      try {
        setIsLoading(true);
        setError(null);
        // Gửi 'page' và 'limit' làm params
        const response = await api.get<LessonPaginatedResponse>('/api/admin/lessons', {
          params: {
            page: currentPage,
            limit: limit
          }
        });
        
        setLessons(response.data.data); // <-- ĐỌC TỪ 'data'
        setTotalPages(response.data.totalPages);
        setPage(response.data.currentPage);

      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải danh sách bài học.');
      } finally {
        setIsLoading(false);
      }
    };

  // useEffect (Cập nhật)
  useEffect(() => {
    fetchLessons(page); // Gọi fetchLessons với 'page'
  }, [page]); // <-- Thêm 'page' vào dependency array

  // Hàm xử lý nút Xóa (Cập nhật)
  const handleDelete = async (lessonId: number, lessonTitle: string) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa bài học "${lessonTitle}" (ID: ${lessonId}) không?`)) {
          try {
              await api.delete(`/api/learning/lessons/${lessonId}`);
              toast.success('Xóa bài học thành công!');
              fetchLessons(page);
          } catch (err: any) {
               const errorMessage = err.response?.data?.message || 'Xóa thất bại. Lỗi không xác định';
               toast.error(errorMessage);
          }
      }
  };

  // Hàm xử lý thay đổi trang
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  // Hàm render nội dung sử dụng MUI Table
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

    if (lessons.length === 0) {
      return <Typography sx={{ mt: 2 }}>Chưa có bài học nào.</Typography>;
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="lesson table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Chủ đề</TableCell>
              <TableCell>Cập nhật lần cuối</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lessons.map((lesson) => (
              <TableRow
                key={lesson.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                hover // Thêm hiệu ứng hover
              >
                <TableCell>{lesson.id}</TableCell>
                <TableCell>{lesson.title}</TableCell>
                <TableCell>
                  {/* Dùng Chip cho đẹp */}
                  <Chip
                    label={lesson.content_type === 'video' ? 'Video' : 'Text'}
                    color={lesson.content_type === 'video' ? 'secondary' : 'primary'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{lesson.category_name}</TableCell>
                <TableCell>
                  {new Date(lesson.updated_at).toLocaleString('vi-VN')}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="edit"
                    color="primary"
                    onClick={() => navigate(`/admin/lessons/${lesson.id}/edit`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => handleDelete(lesson.id, lesson.title)}
                    sx={{ ml: 1 }}
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Quản lý Bài học
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/lessons/new')}
        >
          Thêm mới
        </Button>
      </Box>
      {renderContent()}
      {/* --- THÊM COMPONENT PAGINATION --- */}
      {totalPages > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={handlePageChange}
            color="primary"
            shape="rounded"
            showFirstButton
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
};

export default AdminLessonListPage;