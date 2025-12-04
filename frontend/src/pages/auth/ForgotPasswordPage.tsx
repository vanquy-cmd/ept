import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

import {
  Button, TextField, Box, Typography, Container, Alert,
  CircularProgress, Paper, Link
} from '@mui/material';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(null);
    setIsLoading(true);

    try {
      // Gọi API backend
      const response = await api.post('/api/users/forgot-password', { email });
      setSuccess(response.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đã xảy ra lỗi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography component="h1" variant="h5" gutterBottom>
          Quên Mật khẩu
        </Typography>
        
        {/* Nếu chưa thành công, hiển thị form */}
        {!success && (
          <>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              Nhập email của bạn. Chúng tôi sẽ gửi một liên kết để đặt lại mật khẩu.
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal" required fullWidth id="email"
                label="Địa chỉ Email" name="email" type="email"
                autoComplete="email" autoFocus value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit" fullWidth variant="contained"
                sx={{ mt: 3, mb: 2 }} disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Gửi liên kết'}
              </Button>
            </Box>
          </>
        )}

        {/* Nếu đã thành công, chỉ hiển thị thông báo */}
        {success && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              {success}
            </Alert>
        )}
        
        <Link component={RouterLink} to="/login" variant="body2" sx={{ mt: 2 }}>
          Quay lại Đăng nhập
        </Link>
      </Paper>
    </Container>
  );
};

export default ForgotPasswordPage;