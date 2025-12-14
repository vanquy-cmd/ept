import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { User, PaginatedResponse } from '../../types';
import { toast } from 'react-hot-toast'; // <-- 1. THÊM IMPORT
import { useAuth } from '../../contexts/AuthContext'; // Thêm import này

// --- (Import MUI giữ nguyên) ---
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, IconButton, CircularProgress, Alert, Box, Typography,
  Pagination,
  Tooltip  // Thêm Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
// -----------------------------

// Định nghĩa kiểu cho phản hồi API User
type UserPaginatedResponse = PaginatedResponse<User>;

const AdminUserListPage: React.FC = () => {
  const { user: currentUser } = useAuth(); // Thêm dòng này
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // --- STATE MỚI CHO PHÂN TRANG ---
  const [page, setPage] = useState(1); // Trang hiện tại
  const [totalPages, setTotalPages] = useState(0); // Tổng số trang
  const [limit] = useState(10); // Số mục mỗi trang
  // ---------------------------------

  // Hàm tải danh sách (Cập nhật)
  const fetchUsers = async (currentPage: number) => {
      try {
        setIsLoading(true);
        setError(null);
        // Gửi 'page' và 'limit' làm params
        const response = await api.get<UserPaginatedResponse>('/api/admin/users', {
          params: {
            page: currentPage,
            limit: limit
          }
        });
        
        setUsers(response.data.data); // Cập nhật danh sách users
        setTotalPages(response.data.totalPages); // Cập nhật tổng số trang
        setPage(response.data.currentPage); // Đảm bảo state page là đúng

      } catch (err: any) {
        setError(err.response?.data?.message || 'Không thể tải danh sách người dùng.');
      } finally {
        setIsLoading(false);
      }
    };

  // useEffect (Cập nhật)
  useEffect(() => {
    fetchUsers(page); // Gọi fetchUsers với 'page'
  }, [page]); // <-- Thêm 'page' vào dependency array

  // Hàm xử lý nút Xóa (Cập nhật)
  const handleDelete = async (userId: number, userName: string) => {
      if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${userName}" (ID: ${userId}) không?`)) {
          try {
              await api.delete(`/api/admin/users/${userId}`);
              toast.success('Xóa người dùng thành công!'); // Dùng toast (nếu đã cài)
              fetchUsers(page); 
          } catch (err: any) {
               const errorMessage = err.response?.data?.message || 'Xóa thất bại. Lỗi không xác định';
               toast.error(errorMessage); 
          }
      }
  };
  
  // Hàm xử lý thay đổi trang
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value); // Cập nhật state 'page', useEffect sẽ tự động gọi lại API
  };

  // Thêm function này sau các state declarations
  const canDeleteUser = (targetUser: User): boolean => {
    if (!currentUser) return false;
    
    const SUPER_ADMIN_EMAIL = 'admin@ept.tdmu.edu.vn';
    
    // Không thể xóa chính mình
    if (currentUser.id === targetUser.id) {
      return false;
    }
    
    // Super admin có thể xóa bất kỳ ai (trừ chính mình)
    if (currentUser.email === SUPER_ADMIN_EMAIL) {
      return true;
    }
    
    // Admin thường chỉ có thể xóa student
    if (currentUser.role === 'admin' && targetUser.role === 'student') {
      return true;
    }
    
    return false;
  };

  // Thêm function này sau canDeleteUser (sau dòng 105)
  const getDeleteTooltip = (targetUser: User): string => {
    if (!currentUser) return 'Không có quyền xóa';
    
    if (currentUser.id === targetUser.id) {
      return 'Bạn không thể xóa chính mình';
    }
    
    if (currentUser.email !== 'admin@ept.tdmu.edu.vn' && targetUser.role === 'admin') {
      return 'Bạn không có quyền xóa tài khoản admin khác';
    }
    
    return 'Xóa người dùng';
  };

  // Hàm render nội dung sử dụng MUI Table
  const renderContent = () => {
    if (isLoading) {
      // Hiển thị loading indicator ở giữa
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <CircularProgress />
        </Box>
      );
    }
    
    if (error) {
      return <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>;
    }

    if (users.length === 0) {
      return <Typography sx={{ mt: 2 }}>Không có người dùng nào.</Typography>;
    }

    // Sử dụng TableContainer và Paper để bao bọc Table
    return (
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          {/* Phần Header của Bảng */}
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Tên đầy đủ</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Vai trò</TableCell>
              <TableCell>Ngày tạo</TableCell>
              <TableCell align="right">Hành động</TableCell> {/* Căn lề phải cho cột Action */}
            </TableRow>
          </TableHead>
          {/* Phần Body của Bảng */}
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }} // Bỏ border dòng cuối
              >
                <TableCell component="th" scope="row">
                  {user.id}
                </TableCell>
                <TableCell>{user.full_name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>
                  {user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : 'N/A'}
                </TableCell>
                <TableCell align="right">
                  {/* Nút Sửa dùng IconButton */}
                  <IconButton
                    aria-label="edit"
                    color="primary"
                    onClick={() => navigate(`/admin/users/${user.id}/edit`)}
                  >
                    <EditIcon />
                  </IconButton>
                  {/* Nút xóa luôn hiển thị nhưng disabled khi không có quyền */}
                  <Tooltip title={getDeleteTooltip(user)}>
                    <span>
                      <IconButton
                        aria-label="delete"
                        color="error"
                        onClick={() => handleDelete(user.id, user.full_name || '')}
                        disabled={!canDeleteUser(user)}
                        sx={{ ml: 1 }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </span>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    // Sử dụng Box thay cho div ngoài cùng
    <Box sx={{ p: 3 }}> {/* Thêm padding bằng sx prop */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">
          Quản lý Người dùng
        </Typography>
        {/* Nút Thêm mới dùng Button */}
        <Button
          variant="contained"
          startIcon={<AddIcon />} // Thêm icon vào nút
          onClick={() => navigate('/admin/users/new')}
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

export default AdminUserListPage;