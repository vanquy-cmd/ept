import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
// Import type AdminQuestionSummary và PaginatedResponse
import type { AdminQuestionSummary, PaginatedResponse } from '../../types'; 

// --- CẬP NHẬT IMPORT CỦA MUI ---
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, CircularProgress, Alert, Box, Typography, Chip,
  Pagination
} from '@mui/material';

import { toast } from 'react-hot-toast';
// Import Icons
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import UploadFileIcon from '@mui/icons-material/UploadFile';
// -----------------------------

// Định nghĩa kiểu cho phản hồi API Question
type QuestionPaginatedResponse = PaginatedResponse<AdminQuestionSummary>;

// Giữ nguyên các hàm trợ giúp (nếu bạn đã thêm chúng)
const getSkillColor = (skill: string): "primary" | "secondary" | "success" | "warning" | "default" => {
    switch (skill) {
        case 'listening': return 'primary';
        case 'reading': return 'success';
        case 'speaking': return 'secondary';
        case 'writing': return 'warning';
        default: return 'default';
    }
}
const getTypeColor = (type: string): "primary" | "info" | "success" | "error" | "default" => {
     switch (type) {
        case 'multiple_choice': return 'primary';
        case 'fill_blank': return 'info';
        case 'essay': return 'success';
        case 'speaking': return 'error';
        default: return 'default';
    }
}

const AdminQuestionListPage: React.FC = () => {
  const [questions, setQuestions] = useState<AdminQuestionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- STATE MỚI CHO PHÂN TRANG ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10); // Có thể thay đổi
  // ---------------------------------

  // Hàm tải danh sách (Cập nhật)
  const fetchQuestions = async (currentPage: number) => {
      try {
        setIsLoading(true);
        setError(null);
        // Gửi 'page' và 'limit' làm params
        const response = await api.get<QuestionPaginatedResponse>('/api/admin/questions', {
          params: {
            page: currentPage,
            limit: limit
          }
        });
        
        setQuestions(response.data.data); // <-- ĐỌC TỪ 'data'
        setTotalPages(response.data.totalPages);
        setPage(response.data.currentPage);

      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải danh sách câu hỏi.');
      } finally {
        setIsLoading(false);
      }
    };

  // useEffect (Cập nhật)
  useEffect(() => {
    fetchQuestions(page);
  }, [page]); // <-- Thêm 'page' vào dependency array

  // Hàm xử lý nút Xóa (Cập nhật)
  const handleDelete = async (questionId: number) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa câu hỏi ID: ${questionId} không?`)) {
          try {
              await api.delete(`/api/questions/${questionId}`);
              toast.success('Xóa câu hỏi thành công!'); 
              fetchQuestions(page); // Tải lại trang
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

    if (questions.length === 0) {
      return <Typography sx={{ mt: 2 }}>Chưa có câu hỏi nào.</Typography>;
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="question table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Đề bài (tóm tắt)</TableCell>
              <TableCell>Loại</TableCell>
              <TableCell>Kỹ năng</TableCell>
              <TableCell>Chủ đề</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {questions.map((q) => (
              <TableRow key={q.id} hover>
                <TableCell>{q.id}</TableCell>
                <TableCell sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {q.question_text}
                </TableCell>
                <TableCell>
                  <Chip label={q.question_type.replace('_', ' ')} color={getTypeColor(q.question_type)} size="small" />
                </TableCell>
                <TableCell>
                  <Chip label={q.skill_focus} color={getSkillColor(q.skill_focus)} size="small" />
                </TableCell>
                <TableCell>{q.category_name}</TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="edit"
                    color="primary"
                    onClick={() => navigate(`/admin/questions/${q.id}/edit`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => handleDelete(q.id)}
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
          Quản lý Câu hỏi
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<UploadFileIcon />}
            onClick={() => navigate('/admin/questions/import')}
          >
            Nhập hàng loạt
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/questions/new')}
          >
            Thêm mới
          </Button>
        </Box>
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

export default AdminQuestionListPage;