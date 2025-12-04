import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { User } from '../../types';
import { toast } from 'react-hot-toast';

import {
  TextField, Container, Select, MenuItem, FormControl, InputLabel,
  Paper, Button, CircularProgress, Box, Typography
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
// -----------------------------


type UserFormParams = {
  id?: string; // id sẽ có khi Edit, không có khi Create
};

const AdminUserFormPage: React.FC = () => {
  const { id } = useParams<UserFormParams>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Giữ nguyên state form
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'student' | 'admin'>('student');
  
  // Giữ nguyên state quản lý
  const [isLoading, setIsLoading] = useState(isEditMode);
  const [isSaving, setIsSaving] = useState(false);

  // Giữ nguyên useEffect tải dữ liệu
  useEffect(() => {
    if (isEditMode && id) {
      const fetchUser = async () => {
        try {
          setIsLoading(true);
          const response = await api.get<User>(`/api/admin/users/${id}`);
          const userData = response.data;
          setFullName(userData.full_name); // Sử dụng full_name
          setEmail(userData.email);
          setRole(userData.role);
        } catch (err: any) {
          toast.error('Không thể tải thông tin người dùng.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchUser();
    } else {
        setIsLoading(false); // Không cần loading nếu là tạo mới
    }
  }, [id, isEditMode]);

  // Giữ nguyên hàm handleSubmit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const userData = {
      full_name: full_name,
      email,
      role,
      ...( !isEditMode && { password } )
    };

    try {
      if (isEditMode) {
        await api.put(`/api/admin/users/${id}`, userData);
        toast.success('Cập nhật người dùng thành công!');
      } else {
        await api.post('/api/admin/users', userData);
        toast.success('Tạo người dùng mới thành công!');
      }
      navigate('/admin/users');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || (isEditMode ? 'Cập nhật thất bại.' : 'Tạo mới thất bại.');
      toast.error(errorMessage); // <-- THÊM: Hiển thị toast lỗi
      setIsSaving(false);
    } 
  };

  // Hàm xử lý thay đổi Select của MUI
  const handleRoleChange = (event: SelectChangeEvent) => {
    setRole(event.target.value as 'student' | 'admin');
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    // Sử dụng Container và Paper
    <Container component="main" maxWidth="sm"> {/* Giới hạn chiều rộng */}
      <Paper elevation={3} sx={{ mt: 4, p: 3 }}> {/* Thêm elevation và padding */}
        <Typography component="h1" variant="h5" align="center" gutterBottom>
          {isEditMode ? 'Chỉnh sửa Người dùng' : 'Thêm Người dùng mới'}
        </Typography>

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          {/* Tên đầy đủ */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="fullName"
            label="Tên đầy đủ"
            name="fullName"
            autoComplete="name"
            autoFocus={!isEditMode} // Focus nếu là tạo mới
            value={full_name}
            onChange={(e) => setFullName(e.target.value)}
            disabled={isSaving}
          />
          {/* Email */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Địa chỉ Email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSaving}
          />
          {/* Mật khẩu (chỉ khi tạo mới) */}
          {!isEditMode && (
            <TextField
              margin="normal"
              required={!isEditMode}
              fullWidth
              name="password"
              label="Mật khẩu (ít nhất 6 ký tự)"
              type="password"
              id="password"
              inputProps={{ minLength: 6 }} // Thêm validation cơ bản HTML5
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSaving}
            />
          )}
          {/* Vai trò (sử dụng MUI Select) */}
          <FormControl fullWidth margin="normal" required disabled={isSaving}>
            <InputLabel id="role-select-label">Vai trò</InputLabel>
            <Select
              labelId="role-select-label"
              id="role-select"
              value={role}
              label="Vai trò"
              onChange={handleRoleChange}
            >
              <MenuItem value="student">Student</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          {/* Nút bấm */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}> {/* Sắp xếp nút */}
            <Button
              type="submit"
              variant="contained"
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSaving ? 'Đang lưu...' : (isEditMode ? 'Lưu thay đổi' : 'Tạo người dùng')}
            </Button>
            <Button
              type="button"
              variant="outlined" // Nút Hủy kiểu khác
              onClick={() => navigate('/admin/users')}
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

export default AdminUserFormPage;