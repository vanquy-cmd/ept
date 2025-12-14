import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Button, TextField, Box, Typography, Container, CircularProgress, Grid, Link
} from '@mui/material';
// -----------------------------

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const auth = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = await auth.login(email, password);
      // Kiểm tra role và redirect tương ứng
      if (user.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error(err);
      const errorMessage = err.response?.data?.message || 'Đăng nhập thất bại.';
      toast.error(errorMessage);
    } finally { 
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
          Đăng nhập EPT
        </Typography>

        {/* Form sử dụng Box */}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          {/* Trường Email */}
          <TextField
            margin="normal" // Thêm khoảng cách
            required
            fullWidth // Chiếm toàn bộ chiều rộng
            id="email"
            label="Địa chỉ Email" // Nhãn hiển thị đẹp hơn
            name="email"
            autoComplete="email"
            autoFocus // Tự động focus vào trường này
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          {/* Trường Mật khẩu */}
          <TextField
            margin="normal"
            required
            fullWidth
            name="password"
            label="Mật khẩu"
            type="password"
            id="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />    
          <Button
            type="submit"
            fullWidth
            variant="contained" // Kiểu nút có nền
            sx={{ mt: 3, mb: 2 }} // Thêm khoảng cách trên dưới
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Đăng nhập'} 
          </Button>

          {/* Cập nhật Grid container cho 2 link */}
          <Grid container sx={{ mt: 2 }}>
            <Grid size="grow">
              <Link component={RouterLink} to="/forgot-password" variant="body2">
                Quên mật khẩu?
              </Link>
            </Grid>
            <Grid size="grow">
              Chưa có tài khoản?
              <Link component={RouterLink} to="/register" variant="body2">
                {"Đăng ký"}
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;