import React, { useState } from 'react';
import {
  TextField, Button, Box, Typography, Card, CardContent,
  IconButton, CircularProgress, Alert, FormHelperText
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import AudioFileIcon from '@mui/icons-material/AudioFile';
import ImageIcon from '@mui/icons-material/Image';
import api from '../services/api';
import { toast } from 'react-hot-toast';

interface FileUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

const FileUploadField: React.FC<FileUploadFieldProps> = ({
  value,
  onChange,
  disabled = false,
  label = 'URL file đính kèm (Audio/Image)',
  helperText
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const isAudio = file.type.startsWith('audio/');
      const isImage = file.type.startsWith('image/');
      
      if (!isAudio && !isImage) {
        toast.error('Vui lòng chọn file audio hoặc hình ảnh.');
        return;
      }
      
      // Kiểm tra kích thước file (tối đa 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast.error('Kích thước file không được vượt quá 50MB.');
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
      // Bước 1: Xin presigned URL từ backend (dùng folder 'quiz-assets')
      const presignedResponse = await api.post('/api/upload/presigned-url', {
        fileType: selectedFile.type,
        folder: 'quiz-assets'
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
      toast.success('Tải file lên thành công!');
      
    } catch (err: any) {
      console.error('Lỗi khi upload file:', err);
      toast.error(err.response?.data?.message || 'Lỗi khi tải file lên.');
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
            File đã được tải lên thành công
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
            accept="audio/*,image/*"
            style={{ display: 'none' }}
            id="file-upload-input"
            type="file"
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
          />
          <label htmlFor="file-upload-input">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={disabled || isUploading}
              fullWidth
            >
              Chọn file từ máy tính (Audio/Image)
            </Button>
          </label>
          <FormHelperText sx={{ mt: 1 }}>
            Hoặc nhập URL trực tiếp bên dưới
          </FormHelperText>
        </Box>
      )}

      {/* Hiển thị file đã chọn và nút upload */}
      {selectedFile && (
        <Box sx={{ mb: 2 }}>
          <Card variant="outlined">
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {selectedFile.type.startsWith('audio/') ? (
                  <AudioFileIcon color="primary" />
                ) : (
                  <ImageIcon color="primary" />
                )}
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
        label="Hoặc nhập URL file trực tiếp" 
        fullWidth 
        value={value}
        onChange={(e) => onChange(e.target.value)} 
        disabled={disabled || isUploading || !!selectedFile}
        placeholder="https://..."
        helperText={helperText || "Nhập URL file audio hoặc hình ảnh"}
      />
    </Box>
  );
};

export default FileUploadField;

