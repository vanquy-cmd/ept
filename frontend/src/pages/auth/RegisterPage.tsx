import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import {
  Button, TextField, Box, Typography, Container, Alert, CircularProgress, Link
} from '@mui/material';

const RegisterPage: React.FC = () => {
  // Giữ nguyên state (đã đổi tên thành full_name)
  const [full_name, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (password.length < 6) {
        toast.error('Mật khẩu phải có ít nhất 6 ký tự.');
        return;
    }

    setIsLoading(true);

    try {
      // Gửi 'full_name' như backend mong đợi
      const response = await api.post('/api/users/register', {
        full_name: full_name,
        email: email,
        password: password,
      });

      setSuccess(response.data.message + ' Bạn sẽ được chuyển đến trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err: any) {
      console.error("Lỗi đăng ký:", err);
      toast.error(err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.');
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Đăng ký tài khoản EPT
        </Typography>

        {/* Thông báo thành công đặt ở trên form */}
        {success && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              {success}
            </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {/* Trường Họ tên */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="full_name" // Giữ id để label hoạt động
            label="Họ và tên"
            name="full_name"
            autoComplete="name"
            autoFocus
            value={full_name} // State là full_name
            onChange={(e) => setFullName(e.target.value)}
            disabled={isLoading || Boolean(success)} // Disable khi thành công
          />
          {/* Trường Email */}
          <TextField
            margin="normal"
            required
            fullWidth
            id="email"
            label="Địa chỉ Email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading || Boolean(success)}
          />
          {/* Trường Mật khẩu */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mật khẩu (ít nhất 6 ký tự)"
            type="password"
            id="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading || Boolean(success)}
          />
          {/* Trường Xác nhận Mật khẩu */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="confirmPassword"
            label="Xác nhận mật khẩu"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading || Boolean(success)}
          />
          {/* Nút Đăng ký */}
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={isLoading || Boolean(success)}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Đăng ký'}
          </Button>

          {/* Link Đăng nhập */}
          <Typography variant="body2" align="center">
              Đã có tài khoản?{' '}
              <Link component={RouterLink} to="/login" variant="body2"> {/* Sửa ở đây */}
                Đăng nhập ngay
              </Link>
            </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage;