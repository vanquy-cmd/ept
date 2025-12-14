import React, { useState } from 'react';
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useColorMode } from '../contexts/ColorModeContext';
import Footer from './Footer'; // Import Footer

// --- (Import MUI) ---
import {
  AppBar, Box, Toolbar, Typography, Button, Container,
  Avatar, IconButton, useTheme, CircularProgress,
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Divider
} from '@mui/material';

// --- (Import Icons) ---
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import HomeIcon from '@mui/icons-material/Home';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
// ------------------------------

// Cập nhật navItems để chứa icons
const navItems = [
  { text: 'Trang chủ', path: '/', icon: <HomeIcon /> },
  { text: 'Học tập', path: '/learning', icon: <SchoolIcon /> },
  { text: 'Luyện tập', path: '/practice', icon: <QuizIcon /> },
  { text: 'Từ vựng', path: '/vocabulary', icon: <MenuBookIcon /> },
  { text: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> }
];
const drawerWidth = 240;

const StudentLayout: React.FC = () => {
  // 1. LẤY USER VÀ LOADING TỪ AUTHCONTEXT
  const { user, isLoading, logout } = useAuth(); // Lấy thêm isLoading
  const location = useLocation();
  const theme = useTheme();
  const colorMode = useColorMode();
  const navigate = useNavigate();
  
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  // ... (logic 'displayAvatarUrl' giữ nguyên) ...
  const S3_BASE_URL = 'https://ept-mvp-assets.s3.ap-southeast-2.amazonaws.com';
  const defaultAvatar = `${S3_BASE_URL}/default-avatar.png`;
  const displayAvatarUrl = user?.avatar_url 
    ? `${S3_BASE_URL}/${user.avatar_url}`
    : defaultAvatar;

  // Thêm sau các biến declarations (sau dòng 50):
  const viewingAsStudent = localStorage.getItem('viewingAsStudent') === 'true';
  const isAdmin = user?.role === 'admin';

  // --- NỘI DUNG SIDEBAR (CHO MOBILE KHI ĐĂNG NHẬP) ---
  const drawerContent = (
    <Box onClick={handleDrawerToggle} sx={{ textAlign: 'center' }}>
      <Typography variant="h6" sx={{ my: 2 }}>
        EPT-TDMU
      </Typography>
      <Divider />
      <List>
        {navItems.map((item) => {
          const isHome = item.path === '/';
          const isActive = isHome
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path);
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={RouterLink}
                to={item.path}
                selected={isActive}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        sx={{ bgcolor: 'background.paper', color: 'text.primary' }} 
        elevation={1}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters>

            {/* --- 2. LOGIC NÚT HAMBURGER (CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP TRÊN MOBILE) --- */}
            {user && (
              <Box sx={{ flexGrow: 0, display: { xs: 'flex', md: 'none' } }}>
                <IconButton
                  size="large"
                  onClick={handleDrawerToggle}
                  color="inherit"
                >
                  <MenuIcon />
                </IconButton>
              </Box>
            )}

            {/* Logo/Title */}
            <Typography
              variant="h6"
              noWrap
              component={RouterLink}
              to={user ? "/dashboard" : "/"} // Nếu đăng nhập, về dashboard. Nếu chưa, về trang chủ
              sx={{
                mr: 2,
                // flexGrow: 1 (luôn chiếm phần còn lại nếu không có menu desktop)
                flexGrow: 1, 
                fontFamily: 'monospace',
                fontWeight: 700,
                letterSpacing: '.2rem',
                color: 'inherit',
                textDecoration: 'none',
              }}
            >
              EPT-TDMU
            </Typography>

            {/* --- 3. LOGIC MENU ĐIỀU HƯỚNG (CHỈ HIỂN THỊ KHI ĐÃ ĐĂNG NHẬP TRÊN DESKTOP) --- */}
            {user && (
              <Box sx={{ 
                  flexGrow: 1, // Đẩy menu user sang phải
                  display: { xs: 'none', md: 'flex' }, 
                  ml: 2 
              }}>
                {navItems.map((item) => {
                  const isHome = item.path === '/';
                  const isActive = isHome
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);
                  return (
                    <Button
                      key={item.text}
                      component={RouterLink}
                      to={item.path}
                      sx={{
                        my: 2,
                        color: 'inherit',
                        display: 'block',
                        fontWeight: isActive ? 700 : 400,
                        borderBottom: isActive ? '2px solid' : 'none',
                        borderRadius: 0,
                      }}
                    >
                      {item.text}
                    </Button>
                  );
                })}
              </Box>
            )}

            {/* --- 4. LOGIC MENU BÊN PHẢI (User hoặc Khách) --- */}
            <Box sx={{ flexGrow: 0, display: 'flex', alignItems: 'center', gap: 1 }}>
              {/* Nút Đổi Theme (Luôn hiển thị) */}
              <IconButton 
                sx={{ ml: 1 }} 
                onClick={colorMode.toggleColorMode} 
                color="inherit" 
                title={theme.palette.mode === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
              >
                {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>

              {/* Nếu đang loading, không hiển thị gì */}
              {isLoading ? (
                <CircularProgress size={24} color="inherit" />
              ) : user ? (
                // --- KHI ĐÃ ĐĂNG NHẬP ---
                <>
                  {/* Nút Trang Quản Trị - chỉ hiển thị cho admin khi đang xem giao diện student */}
                  {isAdmin && viewingAsStudent && (
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        localStorage.removeItem('viewingAsStudent');
                        navigate('/admin/dashboard');
                      }}
                      startIcon={<AdminPanelSettingsIcon />}
                      sx={{ mr: 1, display: { xs: 'none', sm: 'flex' } }}
                    >
                      Trang Quản Trị
                    </Button>
                  )}
                  <Button
                    component={RouterLink}
                    to="/profile"
                    sx={{ color: 'inherit', textTransform: 'none', display: { xs: 'none', sm: 'flex' } }} // Ẩn trên xs
                    startIcon={<Avatar src={displayAvatarUrl} sx={{ width: 32, height: 32 }} />}
                  >
                    {user?.full_name || 'Hồ sơ'}
                  </Button>
                  <Button variant="outlined" color="primary" onClick={logout} size="small">
                    Đăng xuất
                  </Button>
                </>
              ) : (
                // --- KHI CHƯA ĐĂNG NHẬP ---
                <>
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
                    sx={{ display: { xs: 'none', sm: 'flex' } }} // Ẩn nút ĐK trên mobile
                  >
                    Đăng ký
                  </Button>
                </>
              )}
            </Box>
            
          </Toolbar>
        </Container>
      </AppBar>

      {/* --- SIDEBAR MOBILE (CHỈ KHI ĐÃ ĐĂNG NHẬP) --- */}
      {user && (
        <Box component="nav">
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth, 
                bgcolor: 'background.default'
              },
            }}
          >
            {drawerContent}
          </Drawer>
        </Box>
      )}

      {/* Main Content (Trang chủ HOẶC Dashboard,...) */}
      <Container component="main" maxWidth="lg" sx={{ mt: 12, mb: 12, flexGrow: 1 }}>
        <Outlet />
      </Container>
      
      {/* Footer (Luôn hiển thị) */}
      <Footer />
    </Box>
  );
};

export default StudentLayout;