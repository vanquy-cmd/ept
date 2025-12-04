import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { AdminAttemptSummary, PaginatedResponse } from '../../types';

// Import MUI
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, IconButton, CircularProgress, Alert, Box, Typography, Chip,
  Pagination
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility'; // Icon xem chi tiết

// Định nghĩa kiểu phản hồi
type AttemptPaginatedResponse = PaginatedResponse<AdminAttemptSummary>;

const AdminAttemptListPage: React.FC = () => {
  const [attempts, setAttempts] = useState<AdminAttemptSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // State phân trang
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [limit] = useState(10);

  // Hàm tải dữ liệu
  const fetchAttempts = async (currentPage: number) => {
      try {
        setIsLoading(true);
        setError(null);
        // Gọi API admin/attempts
        const response = await api.get<AttemptPaginatedResponse>('/api/admin/attempts', {
          params: { page: currentPage, limit: limit }
        });
        
        setAttempts(response.data.data);
        setTotalPages(response.data.totalPages);
        setPage(response.data.currentPage);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải danh sách lượt làm bài.');
      } finally {
        setIsLoading(false);
      }
    };

  // Tải dữ liệu khi trang thay đổi
  useEffect(() => {
    fetchAttempts(page);
  }, [page]);

  // Xử lý chuyển trang
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };
  
  // Hàm xem chi tiết
  const handleViewDetails = (attemptId: number) => {
      // Chuyển đến trang chi tiết Admin
      navigate(`/admin/attempts/${attemptId}/details`);
  };

  const renderContent = () => {
    if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}><CircularProgress /></Box>;
    if (error) return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    if (attempts.length === 0) return <Typography sx={{ mt: 2 }}>Chưa có lượt làm bài nào.</Typography>;

    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Học viên</TableCell>
              <TableCell>Đề thi</TableCell>
              <TableCell align="center">Điểm số</TableCell>
              <TableCell>Trạng thái</TableCell>
              <TableCell>Ngày làm</TableCell>
              <TableCell align="right">Hành động</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {attempts.map((att) => (
              <TableRow key={att.id} hover>
                <TableCell>{att.id}</TableCell>
                <TableCell>{att.user_full_name}</TableCell>
                <TableCell>{att.quiz_title}</TableCell>
                <TableCell align="center">
                    <Chip 
                        label={`${att.final_score || 0}%`}
                        color={Number(att.final_score) >= 50 ? 'success' : 'error'}
                        size="small"
                    />
                </TableCell>
                <TableCell>
                   <Chip 
                        label={att.status === 'completed' ? 'Hoàn thành' : 'Đang làm'}
                        color={att.status === 'completed' ? 'primary' : 'default'}
                        size="small"
                    />
                </TableCell>
                <TableCell>{new Date(att.start_time).toLocaleString('vi-VN')}</TableCell>
                <TableCell align="right">
                  <IconButton
                    aria-label="view"
                    color="primary"
                    onClick={() => handleViewDetails(att.id)}
                    title="Xem chi tiết"
                  >
                    <VisibilityIcon />
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
      <Typography variant="h4" component="h1" gutterBottom>
        Quản lý Lượt làm bài
      </Typography>
      {renderContent()}
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

export default AdminAttemptListPage;