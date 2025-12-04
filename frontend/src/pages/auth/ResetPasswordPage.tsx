import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

// Import MUI
import {
  Button, TextField, Box, Typography, Container, Alert,
  CircularProgress, Paper
} from '@mui/material';

type ResetPasswordParams = {
  token: string;
};

const ResetPasswordPage: React.FC = () => {
  // Lấy token từ URL (ví dụ: /reset-password/abc123xyz)
  const { token } = useParams<ResetPasswordParams>();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [isLoading, setIsLoading] = useState(false); 
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setSuccess(null);

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (newPassword.length < 6) {
        toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
        return;
    }

    setIsLoading(true);

    try {
      // Gọi API backend
      const response = await api.post('/api/users/reset-password', {
        token: token,
        newPassword: newPassword
      });
      
      setSuccess(response.data.message + ' Đang chuyển hướng đến trang đăng nhập...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);

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
          Đặt lại Mật khẩu
        </Typography>
        
        {!success && (
          <>
            <Typography variant="body2" align="center" sx={{ mb: 2 }}>
              Nhập mật khẩu mới của bạn.
            </Typography>
            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal" required fullWidth name="newPassword" label="Mật khẩu mới"
                type="password" id="newPassword" value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={isLoading} autoFocus
              />
              <TextField
                margin="normal" required fullWidth name="confirmPassword" label="Xác nhận mật khẩu mới"
                type="password" id="confirmPassword" value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
              <Button
                type="submit" fullWidth variant="contained"
                sx={{ mt: 3, mb: 2 }} disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Lưu Mật khẩu mới'}
              </Button>
            </Box>
          </>
        )}
        
        {success && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              {success}
            </Alert>
        )}
      </Paper>
    </Container>
  );
};

export default ResetPasswordPage;