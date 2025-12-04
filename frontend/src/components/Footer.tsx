import React from 'react';
import { Box, Typography, Container, Grid, Link as MuiLink, IconButton, Divider } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// Import Icons (Giả sử bạn muốn thêm icon social media)
import FacebookIcon from '@mui/icons-material/Facebook';
import YouTubeIcon from '@mui/icons-material/YouTube';
import InstagramIcon from '@mui/icons-material/Instagram';

// Component Link cho Footer
const FooterLink: React.FC<{ to: string; text: string }> = ({ to, text }) => (
  <MuiLink
    component={RouterLink}
    to={to}
    variant="body2"
    color="text.secondary" // Màu chữ phụ
    underline="hover"
    sx={{ display: 'block', mb: 1 }} // Hiển thị dạng block, thêm margin bottom
  >
    {text}
  </MuiLink>
);

const Footer: React.FC = () => {
  return (
    <Box 
      component="footer" 
      sx={{ 
        // Dùng màu 'paper' (nền) và 'text.primary' (chữ) của theme
        bgcolor: 'background.paper', 
        color: 'text.primary',
        borderTop: (theme) => `1px solid ${theme.palette.divider}`, // Thêm viền mỏng ở trên
        p: { xs: 4, md: 6 }, // Tăng padding
        mt: 'auto', // Đẩy footer xuống cuối
      }}
    >
      <Container maxWidth="lg">
        {/* 1. BỐ CỤC 4 CỘT */}
        <Grid container spacing={4} justifyContent="space-between">
          
          {/* CỘT 1: GIỚI THIỆU (Rộng hơn) */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" component="h3" gutterBottom sx={{ fontWeight: 700 }}>
              EPT Learning
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Website học tập Tiếng Anh EPT cho sinh viên Đại học Thủ Dầu Một.
            </Typography>
            {/* Social Icons */}
            <Box>
              <IconButton 
                aria-label="Facebook" 
                color="inherit" 
                href="#" // Thêm link FB của bạn
                sx={{ mr: 1 }}
              >
                <FacebookIcon />
              </IconButton>
              <IconButton 
                aria-label="YouTube" 
                color="inherit" 
                href="#" // Thêm link YouTube của bạn
                sx={{ mr: 1 }}
              >
                <YouTubeIcon />
              </IconButton>
              <IconButton 
                aria-label="Instagram" 
                color="inherit" 
                href="#" // Thêm link Instagram của bạn
              >
                <InstagramIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* CỘT 2: LIÊN KẾT */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="overline" component="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Liên kết
            </Typography>
            {/* Lưu ý: Chúng ta dùng /learning, /practice thay vì /dashboard
              để người dùng chưa đăng nhập cũng có thể nhấp vào (và bị chuyển đến login)
            */}
            <FooterLink to="/learning" text="Bài học" />
            <FooterLink to="/practice" text="Bài tập" />
            <FooterLink to="/practice" text="Kiểm tra" />
            <FooterLink to="/dashboard" text="Kết quả" /> {/* Chỉ người đăng nhập mới thấy */}
          </Grid>

          {/* CỘT 3: HỖ TRỢ */}
          <Grid item xs={6} sm={3} md={2}>
            <Typography variant="overline" component="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Hỗ trợ
            </Typography>
            <FooterLink to="/faq" text="FAQ" />
            <FooterLink to="/contact" text="Liên hệ" />
            <FooterLink to="/report-bug" text="Báo lỗi" />
            {/* (Chúng ta chưa tạo các trang này, nhưng link có thể để sẵn) */}
          </Grid>

          {/* CỘT 4: THÔNG TIN */}
          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="overline" component="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Thông tin
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Đại học Thủ Dầu Một
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Website học tập EPT
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Email: support@ept.edu.vn
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Điện thoại: (0274) 3 822 058
            </Typography>
          </Grid>

        </Grid>

        {/* 2. PHẦN BẢN QUYỀN (Copyright) */}
        <Divider sx={{ my: 4 }} /> 
        <Typography variant="body2" color="text.secondary" align="center">
          &copy; {new Date().getFullYear()} EPT Learning. Tất cả quyền được bảo lưu.
        </Typography>

      </Container>
    </Box>
  );
};

export default Footer;