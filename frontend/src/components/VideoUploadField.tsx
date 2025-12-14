import React, { useState } from 'react';
import {
  TextField, Button, Box, Typography, Card, CardContent,
  IconButton, CircularProgress, Alert, FormHelperText
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import VideoFileIcon from '@mui/icons-material/VideoFile';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface VideoUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

const VideoUploadField: React.FC<VideoUploadFieldProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'Video đính kèm',
  helperText
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isVideo = file.type.startsWith('video/');
      
      if (!isVideo) {
        toast.error('Vui lòng chọn file video.');
        return;
      }
      
      // Kiểm tra kích thước file (tối đa 500MB cho video)
      const maxSize = 500 * 1024 * 1024; // 500MB
      if (file.size > maxSize) {
        toast.error('Kích thước file video không được vượt quá 500MB.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleUploadFile = async () => {
    if (!selectedFile) {
      toast.error('Vui lòng chọn file trước.');
      return;
    }

    setIsUploading(true);
    
    try {
      // Bước 1: Xin presigned URL từ backend (dùng folder 'quiz-videos')
      const presignedResponse = await api.post('/api/upload/presigned-url', {
        fileType: selectedFile.type,
        folder: 'quiz-videos'
      });
      
      const { presignedUrl, publicUrl } = presignedResponse.data;

      // Bước 2: Upload file lên S3
      await fetch(presignedUrl, {
        method: 'PUT',
        body: selectedFile,
        headers: {
          'Content-Type': selectedFile.type,
        },
      });

      // Bước 3: Lưu public URL vào state
      onChange(publicUrl);
      setSelectedFile(null);
      toast.success('Tải video lên thành công!');
      
    } catch (err: any) {
      console.error('Lỗi khi upload video:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi tải video lên.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onChange('');
  };

  return (
    <Box>
      <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
        {label}
      </Typography>
      
      {/* Nếu đã có URL */}
      {value && !selectedFile && (
        <Box sx={{ mb: 2 }}>
          <Alert severity="success" sx={{ mb: 1 }}>
            Video đã được tải lên thành công
          </Alert>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {value}
            </Typography>
            <IconButton
              size="small"
              color="error"
              onClick={handleRemoveFile}
              disabled={disabled || isUploading}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* Chọn file */}
      {!value && !selectedFile && (
        <Box sx={{ mb: 2 }}>
          <input
            accept="video/*"
            style={{ display: 'none' }}
            id="video-upload-input"
            type="file"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
          />
          <label htmlFor="video-upload-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={disabled || isUploading}
              fullWidth
            >
              Chọn video từ máy tính
            </Button>
          </label>
          <FormHelperText sx={{ mt: 1 }}>
            Hoặc nhập URL video trực tiếp bên dưới (tối đa 500MB)
          </FormHelperText>
        </Box>
      )}

      {/* Hiển thị file đã chọn và nút upload */}
      {selectedFile && (
        <Box sx={{ mb: 2 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <VideoFileIcon color="primary" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" noWrap>
                    {selectedFile.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  size="small"
                  onClick={handleUploadFile}
                  disabled={isUploading || disabled}
                  startIcon={isUploading ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                >
                  {isUploading ? 'Đang tải lên...' : 'Tải lên'}
                </Button>
                <IconButton
                  size="small"
                  onClick={() => setSelectedFile(null)}
                  disabled={isUploading}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Hoặc nhập URL trực tiếp */}
      <TextField 
        label="Hoặc nhập URL video trực tiếp" 
        fullWidth 
        value={value}
        onChange={(e) => onChange(e.target.value)} 
        disabled={disabled || isUploading || !!selectedFile}
        placeholder="https://..."
        helperText={helperText || "Nhập URL video (YouTube, Vimeo, hoặc direct link)"}
      />
    </Box>
  );
};

export default VideoUploadField;
