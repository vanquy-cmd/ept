import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import axios from 'axios'; // Import axios gốc để tải file lên S3
import type { User } from '../../types';
import toast from 'react-hot-toast';
import {
  Button, TextField, Box, Typography, Container, Paper, Grid, Avatar,
  Badge, IconButton, CircularProgress, Chip
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LockResetIcon from '@mui/icons-material/LockReset';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
// -----------------------------

const ProfilePage: React.FC = () => {
  const { user, setUser } = useAuth(); // setUser đã được thêm vào Context
  
  // --- Giữ nguyên các state ---
  const [full_name, setFullName] = useState(user?.full_name || ''); // Đã đổi sang full_name
  const [isUpdatingName, setIsUpdatingName] = useState(false);

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref cho input file

  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || full_name === user.full_name) return;
    setIsUpdatingName(true);
    try {
      const response = await api.put<{ message: string; user: User }>('/api/profile', { full_name });
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      toast.success(response.data.message);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Cập nhật tên thất bại.');
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu mới không khớp.');
      return;
    }
    setIsChangingPassword(true);
    try {
      const response = await api.put('/api/profile/change-password', { oldPassword, newPassword });
      toast.success(response.data.message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Đổi mật khẩu thất bại.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleUploadAvatar(e.target.files[0]);
    }
  };

  const handleUploadAvatar = async (file: File) => {
    if (!user) return;
    setIsUploadingAvatar(true);
    try {
      // B1: Xin link
      const presignedResponse = await api.post('/api/upload/presigned-url', { fileType: file.type });
      const { presignedUrl, key } = presignedResponse.data;
      // B2: Tải lên S3
      await axios.put(presignedUrl, file, { headers: { 'Content-Type': file.type } });
      // B3: Cập nhật profile
      const updateProfileResponse = await api.put<{ message: string; user: User }>('/api/profile/avatar', { avatarKey: key });
      
      localStorage.setItem('user', JSON.stringify(updateProfileResponse.data.user));
      setUser(updateProfileResponse.data.user);
      
      toast.success('Ảnh đại diện đã được cập nhật.');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tải ảnh đại diện thất bại.');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Hàm trigger input file
  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  if (!user) {
    return <p>Đang tải...</p>; 
  }

  const S3_BASE_URL = 'https://ept-mvp-assets.s3.ap-southeast-2.amazonaws.com';
  const defaultAvatar = `${S3_BASE_URL}/default-avatar.png`;
  
  const displayAvatarUrl = user.avatar_url 
    ? `${S3_BASE_URL}/${user.avatar_url}` // Xây dựng URL từ key
    : defaultAvatar;

  return (
    <Container component="main" maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>
        Hồ sơ của bạn
      </Typography>
      
      <Grid container spacing={3}>
        {/* Cột Avatar */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              badgeContent={
                <IconButton 
                  color="primary" 
                  aria-label="upload picture" 
                  component="span"
                  onClick={handleAvatarClick}
                  disabled={isUploadingAvatar}
                >
                  <PhotoCameraIcon />
                </IconButton>
              }
            >
              {isUploadingAvatar ? (
                <CircularProgress size={150} />
              ) : (
                <Avatar
                  src={displayAvatarUrl}
                  alt={user.full_name || ''}
                  sx={{ width: 150, height: 150, mb: 2, border: '2px solid #ccc' }}
                />
              )}
            </Badge>
            {/* Input file ẩn */}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              ref={fileInputRef}
              hidden // Ẩn đi
            />
            
            <Typography variant="h6" sx={{ mt: 1 }}>{user.full_name}</Typography>
            <Typography color="text.secondary">{user.email}</Typography>
            <Chip label={user.role} color="primary" size="small" sx={{ mt: 1 }} />
          </Paper>
        </Grid>
        
        {/* Cột Thông tin & Mật khẩu */}
        <Grid size={{ xs: 12, md: 8 }}>
          {/* Form Cập nhật Tên */}
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography component="h2" variant="h6" gutterBottom>
              Cập nhật Tên đầy đủ
            </Typography>
            <Box component="form" onSubmit={handleUpdateName}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="fullName"
                label="Tên đầy đủ"
                name="fullName"
                value={full_name}
                onChange={(e) => setFullName(e.target.value)}
                disabled={isUpdatingName}
              />
              <Button 
                type="submit" 
                variant="contained" 
                sx={{ mt: 2 }} 
                disabled={isUpdatingName || full_name === user.full_name}
                startIcon={isUpdatingName ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
              >
                Lưu thay đổi
              </Button>
            </Box>
          </Paper>
          
          {/* Form Đổi Mật khẩu */}
          <Paper sx={{ p: 3 }}>
             <Typography component="h2" variant="h6" gutterBottom>
              Đổi Mật khẩu
            </Typography>
            <Box component="form" onSubmit={handleChangePassword}>
              <TextField
                margin="normal" required fullWidth name="oldPassword" label="Mật khẩu cũ" type="password"
                id="oldPassword" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)}
                disabled={isChangingPassword}
              />
              <TextField
                margin="normal" required fullWidth name="newPassword" label="Mật khẩu mới (ít nhất 6 ký tự)" type="password"
                id="newPassword" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                disabled={isChangingPassword} inputProps={{ minLength: 6 }}
              />
              <TextField
                margin="normal" required fullWidth name="confirmPassword" label="Xác nhận mật khẩu mới" type="password"
                id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isChangingPassword}
              />
              <Button 
                type="submit" 
                variant="contained" 
                color="secondary" // Màu khác
                sx={{ mt: 2 }} 
                disabled={isChangingPassword}
                startIcon={isChangingPassword ? <CircularProgress size={20} color="inherit" /> : <LockResetIcon />}
              >
                Đổi Mật khẩu
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage;