import React, { useState } from 'react'; // <-- Thêm useState
import { Outlet, Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useColorMode } from '../contexts/ColorModeContext';
import {
  AppBar, Box, Toolbar, List, Typography, Divider, Drawer,
  IconButton, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Button, useTheme, useMediaQuery // <-- Thêm useTheme, useMediaQuery
} from '@mui/material';

import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import SchoolIcon from '@mui/icons-material/School'; 
import QuestionAnswerIcon from '@mui/icons-material/QuestionAnswer';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AssessmentIcon from '@mui/icons-material/Assessment';
import Brightness4Icon from '@mui/icons-material/Brightness4'; 
import Brightness7Icon from '@mui/icons-material/Brightness7';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
// -----------------------------

const drawerWidth = 240; // Chiều rộng của Sidebar

// Định nghĩa các mục trong Sidebar
const menuItems = [
  { text: 'Dashboard', path: '/admin/dashboard', icon: <DashboardIcon /> },
  { text: 'Quản lý Users', path: '/admin/users', icon: <PeopleIcon /> },
  { text: 'Quản lý Chủ đề', path: '/admin/categories', icon: <CategoryIcon /> },
  { text: 'Quản lý Bài học', path: '/admin/lessons', icon: <SchoolIcon /> },
  { text: 'Quản lý Câu hỏi', path: '/admin/questions', icon: <QuestionAnswerIcon /> },
  { text: 'Quản lý Đề thi', path: '/admin/quizzes', icon: <QuizIcon /> },
  { text: 'Quản lý Từ vựng', path: '/admin/vocabulary-sets', icon: <MenuBookIcon /> },
  { text: 'Kết quả Làm bài', path: '/admin/attempts', icon: <AssessmentIcon /> },
];

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate(); // Thêm dòng này
  const theme = useTheme();
  const colorMode = useColorMode();

  // Hàm kiểm tra link có active không
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  // 2. State để bật/tắt sidebar trên mobile
  const [mobileOpen, setMobileOpen] = useState(false);
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  const isActive = (path: string) => location.pathname.startsWith(path);

  const drawerContent = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          EPT Admin
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              component={RouterLink}
              to={item.path}
              selected={isActive(item.path)}
              onClick={!isDesktop ? handleDrawerToggle : undefined}
              sx={{ // Thêm style khi selected
                '&.Mui-selected': {
                  backgroundColor: 'rgba(25, 118, 210, 0.08)', // Màu nền nhẹ khi chọn
                  '& .MuiListItemIcon-root, & .MuiListItemText-primary': {
                    color: 'primary.main', // Màu icon và text khi chọn
                  },
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: '40px' }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ mt: 'auto' }} /> {/* Đẩy nút Logout xuống dưới */}
       <Box sx={{ p: 2 }}> {/* Thêm padding cho nút Logout */}
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              localStorage.setItem('viewingAsStudent', 'true');
              navigate('/dashboard');
            }}
            fullWidth
            startIcon={<PersonIcon />}
            sx={{ mb: 2 }}
          >
            Xem giao diện Student
          </Button>
          <Button variant="outlined" color="error" onClick={logout} fullWidth>
            Đăng xuất
          </Button>
       </Box>
    </div>
  );

  return (
    // Sử dụng Box làm layout chính, display: flex
    <Box sx={{ display: 'flex' }}>
      {/* AppBar (Thanh Header - Tùy chọn) */}
      <AppBar
        position="fixed"
        sx={{
          // 3. Điều chỉnh width và marginLeft dựa trên 'isDesktop'
          width: { md: `calc(100% - ${drawerWidth}px)` }, // Chỉ áp dụng width này cho desktop
          ml: { md: `${drawerWidth}px` }, // Chỉ áp dụng margin này cho desktop
          bgcolor: 'background.paper', 
          color: 'text.primary'
        }}
        elevation={1}
      >
        <Toolbar>
          {/* 4. Nút Hamburger (chỉ hiển thị trên mobile) */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }} // Chỉ hiển thị khi KHÔNG PHẢI desktop
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
             Chào mừng, {user?.full_name || 'Admin'}!
          </Typography>
           
          {/* Nút chuyển chế độ */}
          <IconButton 
            sx={{ ml: 'auto' }}
            onClick={colorMode.toggleColorMode} 
            color="inherit" 
            title={theme.palette.mode === 'dark' ? 'Chế độ sáng' : 'Chế độ tối'}
          >
            {theme.palette.mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* --- SỬA: Sidebar (Drawer) --- */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
        aria-label="mailbox folders"
      >
        {/* 5. Drawer cho Mobile (ẩn/hiện) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Tốt hơn cho SEO và mobile
          }}
          sx={{
            display: { xs: 'block', md: 'none' }, // Hiển thị trên xs, sm; Ẩn trên md, lg, xl
            [`& .MuiDrawer-paper`]: { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              bgcolor: 'background.paper'
            },
          }}
        >
          {drawerContent}
        </Drawer>
        
        {/* 6. Drawer cho Desktop (cố định) */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' }, // Ẩn trên xs, sm; Hiển thị trên md, lg, xl
            [`& .MuiDrawer-paper`]: { 
              width: drawerWidth, 
              boxSizing: 'border-box',
              bgcolor: 'background.paper'
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content Area (Giữ nguyên) */}
      <Box
        component="main"
        sx={{
          flexGrow: 1, 
          bgcolor: 'background.default',
          p: 3, 
          marginTop: '64px' // Luôn cách AppBar 64px
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;