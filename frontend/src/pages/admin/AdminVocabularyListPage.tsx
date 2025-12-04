import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { AdminVocabularySetSummary, PaginatedResponse } from '../../types'; 
import { toast } from 'react-hot-toast';

import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, CircularProgress, Alert, Box, Typography,
  Pagination
} from '@mui/material';

import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
// -----------------------------

// Định nghĩa kiểu cho phản hồi API
type VocabSetPaginatedResponse = PaginatedResponse<AdminVocabularySetSummary>;

const AdminVocabularyListPage: React.FC = () => {
  const [sets, setSets] = useState<AdminVocabularySetSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // --- STATE MỚI CHO PHÂN TRANG ---
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);
  // ---------------------------------

  // Hàm tải danh sách (Cập nhật)
  const fetchSets = async (currentPage: number) => {
      try {
        setIsLoading(true);
        setError(null);
        // Gửi 'page' và 'limit' làm params
        const response = await api.get<VocabSetPaginatedResponse>('/api/admin/vocabulary-sets', {
          params: {
            page: currentPage,
            limit: limit
          }
        });
        
        setSets(response.data.data); // <-- ĐỌC TỪ 'data'
        setTotalPages(response.data.totalPages);
        setPage(response.data.currentPage);

      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải danh sách bộ từ vựng.');
      } finally {
        setIsLoading(false);
      }
    };

  // useEffect (Cập nhật)
  useEffect(() => {
    fetchSets(page);
  }, [page]); // <-- Thêm 'page' vào dependency array

  // Hàm xử lý nút Xóa (Cập nhật)
  const handleDelete = async (setId: number, setTitle: string) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa bộ từ vựng "${setTitle}" (ID: ${setId}) không?`)) {
          try {
              await api.delete(`/api/vocabulary/sets/${setId}`);
              toast.success('Xóa bộ từ vựng thành công!');
              fetchSets(page); // Tải lại trang
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

    if (sets.length === 0) {
      return <Typography sx={{ mt: 2 }}>Chưa có bộ từ vựng nào.</Typography>;
    }

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="vocabulary sets table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tiêu đề</TableCell>
              <TableCell>Chủ đề</TableCell>
              <TableCell>Số từ</TableCell>
              <TableCell>Cập nhật lần cuối</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sets.map((s) => (
              <TableRow key={s.id} hover>
                <TableCell>{s.id}</TableCell>
                <TableCell>{s.title}</TableCell>
                <TableCell>{s.category_name || 'N/A'}</TableCell>
                <TableCell>{s.word_count}</TableCell>
                <TableCell>
                  {s.updated_at ? new Date(s.updated_at).toLocaleString('vi-VN') : 'N/A'}
                </TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="edit"
                    color="primary"
                    onClick={() => navigate(`/admin/vocabulary-sets/${s.id}/edit`)}
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    color="error"
                    onClick={() => handleDelete(s.id, s.title)}
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
          Quản lý Bộ Từ vựng
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/admin/vocabulary-sets/new')}
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

export default AdminVocabularyListPage;