import React from 'react';
import { Outlet, Link as RouterLink } from 'react-router-dom';
import { useColorMode } from '../contexts/ColorModeContext'; // Vẫn cho phép đổi theme

// Import MUI và Icons
import {
  AppBar, Box, Toolbar, Typography, Button, Container,
  IconButton, useTheme
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

// Import Footer
import Footer from './Footer';

const PublicLayout: React.FC = () => {
  const theme = useTheme();
  const colorMode = useColorMode();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* 1. AppBar (Header Công khai) */}
      <AppBar 
        position="static" 
        sx={{ bgcolor: 'background.paper', color: 'text.primary' }} 
        elevation={1}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>
            {/* Logo/Title */}
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to="/" // Link về trang chủ
              sx={{
                mr: 2,
                flexGrow: 1, // Đẩy các nút sang phải
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.2rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              EPT-TDMU
            </Typography>

            {/* Nút Đăng nhập/Đăng ký */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <IconButton 
                sx={{ ml: 1 }} 
                onClick={colorMode.toggleColorMode} 
                color="inherit" 
                title={theme.palette.mode === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
              
              <Button 
                component={RouterLink} 
                to="/login" 
                variant="outlined" 
                color="primary" 
                size="small"
              >
                Đăng nhập
              </Button>
              <Button 
                component={RouterLink} 
                to="/register" 
                variant="contained" 
                color="primary" 
                size="small"
              >
                Đăng ký
              </Button>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flexGrow: 1 }}>
        <Outlet />
      </Container>
      {/* 3. Footer */}
      <Footer />
    </Box>
  );
};

export default PublicLayout;