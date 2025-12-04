import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { AdminQuizSummary, PaginatedResponse } from '../../types'; 

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, CircularProgress, Alert, Box, Typography, Chip,
  Pagination
} from '@mui/material';

import { toast } from 'react-hot-toast';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
// -----------------------------

// Định nghĩa kiểu cho phản hồi API Quiz
type QuizPaginatedResponse = PaginatedResponse<AdminQuizSummary>;

const AdminQuizListPage: React.FC = () => {
  const [quizzes, setQuizzes] = useState<AdminQuizSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- STATE MỚI CHO PHÂN TRANG ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10); // Có thể thay đổi
  // ---------------------------------

  // Hàm tải danh sách (Cập nhật)
  const fetchQuizzes = async (currentPage: number) => {
      try {
        setIsLoading(true);
        setError(null);
        // Gửi 'page' và 'limit' làm params
        const response = await api.get<QuizPaginatedResponse>('/api/admin/quizzes', {
          params: {
            page: currentPage,
            limit: limit
          }
        });
        
        setQuizzes(response.data.data); // <-- ĐỌC TỪ 'data'
        setTotalPages(response.data.totalPages);
        setPage(response.data.currentPage);

      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải danh sách đề thi.');
      } finally {
        setIsLoading(false);
      }
    };

  // useEffect (Cập nhật)
  useEffect(() => {
    fetchQuizzes(page);
  }, [page]); // <-- Thêm 'page' vào dependency array

  // Hàm xử lý nút Xóa (Cập nhật)
  const handleDelete = async (quizId: number, quizTitle: string) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa đề thi "${quizTitle}" (ID: ${quizId}) không?`)) {
          try {
              await api.delete(`/api/quizzes/${quizId}`);
              toast.success('Xóa đề thi thành công!');
              fetchQuizzes(page); // Tải lại trang
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

    if (quizzes.length === 0) {
      return <Typography sx={{ mt: 2 }}>Chưa có đề thi nào.</Typography>;
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="quizzes table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Chủ đề</TableCell>
              <TableCell>Số câu</TableCell>
              <TableCell>Thời gian (phút)</TableCell>
              <TableCell>Cập nhật</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {quizzes.map((q) => (
              <TableRow key={q.id} hover>
                <TableCell>{q.id}</TableCell>
                <TableCell sx={{ 
                  maxWidth: 300,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {q.title}
                </TableCell>
                <TableCell>
                  <Chip label={q.category_name} size="small" />
                </TableCell>
                <TableCell align="center">{q.question_count}</TableCell> {/* Căn giữa số câu */}
                <TableCell align="center">{q.time_limit_minutes || '—'}</TableCell> {/* Hiển thị — nếu không giới hạn */}
                <TableCell>
                  {q.updated_at ? new Date(q.updated_at).toLocaleString('vi-VN') : 'N/A'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="edit"
                    color="primary"
                    onClick={() => navigate(`/admin/quizzes/${q.id}/edit`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => handleDelete(q.id, q.title)}
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
          Quản lý Đề thi
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/quizzes/new')}
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

export default AdminQuizListPage;