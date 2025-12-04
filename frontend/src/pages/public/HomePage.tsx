import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
// --- IMPORT CÁC COMPONENT MUI CẦN THIẾT ---
import { Box, Typography, Button, Paper, Container, Avatar, useTheme 
} from '@mui/material';
// Import Icons
import SchoolIcon from '@mui/icons-material/School';
import QuizIcon from '@mui/icons-material/Quiz';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DevicesIcon from '@mui/icons-material/Devices';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
// --- THÊM CÁC ICON MỚI CHO PHẦN "TẠI SAO CHỌN" ---
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'; // Icon cho "Cá nhân hóa" (AI)
import AnalyticsIcon from '@mui/icons-material/Analytics'; // Icon cho "Phân tích"
import MicIcon from '@mui/icons-material/Mic'; // Icon cho "Kỹ năng nói"
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents'; // Icon cho "Gamification"
// ------------------------------------------------
// Component Thẻ Tính năng (Tái sử dụng từ bước trước)
interface FeatureCardProps {
  icon: React.ReactElement;
  title: string;
  description: string;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description }) => (
  <Paper 
    variant="outlined" 
    sx={{ 
      p: 3, 
      textAlign: 'center', 
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      // Thêm hiệu ứng hover tương tự như các card khác
      transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: (theme) => theme.shadows[4] // Sử dụng bóng đổ của theme
      }
    }}
  >
    <Avatar sx={{ bgcolor: 'primary.main', m: 'auto', width: 56, height: 56, fontSize: '2rem' }}>
      {icon}
    </Avatar>
    <Typography variant="h6" component="h3" sx={{ mt: 2, mb: 1 }}>
      {title}
    </Typography>
    <Typography variant="body2" color="text.secondary">
      {description}
    </Typography>
  </Paper>
);

// --- PHẦN "TẠI SAO CHỌN" ---
const whyFeatures = [
  {
    icon: <AutoAwesomeIcon fontSize="inherit" />,
    title: "Học tập cá nhân hóa",
    description: "AI phân tích trình độ và đưa ra gợi ý phù hợp với lộ trình của từng người học."
  },
  {
    icon: <AnalyticsIcon fontSize="inherit" />,
    title: "Phân tích kết quả",
    description: "Phân tích chi tiết kết quả học tập, chỉ ra điểm mạnh và điểm cần cải thiện."
  },
  {
    icon: <DevicesIcon fontSize="inherit" />,
    title: "Responsive Design",
    description: "Giao diện thân thiện, tương thích với mọi thiết bị từ desktop đến mobile."
  },
  {
    icon: <MicIcon fontSize="inherit" />,
    title: "Luyện kỹ năng nói",
    description: "AI phân tích phát âm và đưa ra nhận xét chi tiết để cải thiện kỹ năng."
  },
  {
    icon: <AccessTimeIcon fontSize="inherit" />,
    title: "Học mọi lúc",
    description: "Học tập 24/7, không giới hạn thời gian và địa điểm, linh hoạt theo lịch trình."
  },
  {
    icon: <EmojiEventsIcon fontSize="inherit" />,
    title: "Gamification",
    description: "Hệ thống điểm, huy hiệu và bảng xếp hạng để tạo động lực học tập."
  }
];

const HomePage: React.FC = () => {
  const theme = useTheme(); // Lấy theme để dùng màu sắc

  return (
    // Box này nằm bên trong PublicLayout
    <Box>
      {/* --- 1. Phần Hero --- */}
      <Container 
        maxWidth="lg" 
        sx={{ 
          textAlign: 'center', 
          my: { xs: 8, md: 16 }, // 'my' là margin top/bottom
          // Thêm hiệu ứng nền gradient tương tác nhẹ
          background: `radial-gradient(ellipse at 50% 30%, ${theme.palette.primary.main}11, transparent 60%)`
        }}
      >
        <Typography 
          variant="h2" 
          component="h1" 
          fontWeight={700}
          gutterBottom
        >
          Học Tiếng Anh EPT 
          <Typography 
            component="span" 
            variant="h2" 
            fontWeight={700} 
            // Hiệu ứng chữ gradient
            sx={{ 
              background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              ml: 1.5 // Thêm khoảng cách nhỏ
            }}
          >
            Hiệu quả
          </Typography>
        </Typography>
        
        <Typography 
          variant="h5" 
          color="text.secondary" 
          sx={{ mb: 4, maxWidth: '700px', mx: 'auto' }} // Giới hạn chiều rộng text
        >
          Website học tập trực tuyến hỗ trợ sinh viên luyện tập và kiểm tra các kỹ năng Tiếng Anh theo chuẩn EPT cấp độ 1 của Đại học Thủ Dầu Một.
        </Typography>
        
        <Button 
          component={RouterLink} 
          to="/register" 
          variant="contained" 
          size="large"
          sx={{ 
            py: 1.5, 
            px: 5, 
            fontSize: '1.1rem', 
            borderRadius: '25px', // Bo tròn
            transition: 'transform 0.2s',
            '&:hover': {
                transform: 'scale(1.05)' // Hiệu ứng hover
            }
          }}
          endIcon={<RocketLaunchIcon />}
        >
          Bắt đầu học ngay
        </Button>
      </Container>

      {/* --- 2. Phần Tính năng (Skills) --- */}
      <Box sx={{ my: { xs: 8, md: 16 }, bgcolor: 'background.default', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="primary.main" align="center" fontWeight="bold" gutterBottom>
            KỸ NĂNG
          </Typography>
          <Typography variant="h4" component="h2" align="center" gutterBottom fontWeight={600}>
            Phát triển toàn diện 4 Kỹ năng
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 5, maxWidth: '600px', mx: 'auto' }}>
            Hệ thống bài tập đa dạng, tập trung vào các kỹ năng cốt lõi cần thiết cho kỳ thi EPT.
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gap: 4,
              gridTemplateColumns: {
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(4, 1fr)',
              },
              gridAutoRows: '1fr', 
            }}
          >
            <FeatureCard 
              icon={<SchoolIcon fontSize="inherit" />}
              title="Học tập (Lessons)"
              description="Truy cập các bài giảng, video và mẹo làm bài chi tiết."
            />
            <FeatureCard 
              icon={<QuizIcon fontSize="inherit" />}
              title="Luyện tập (Practice)"
              description="Làm các bài thi thử mô phỏng đề thi thật, chấm điểm tự động."
            />
            <FeatureCard 
              icon={<MenuBookIcon fontSize="inherit" />}
              title="Từ vựng (Vocabulary)"
              description="Ôn luyện các bộ từ vựng học thuật và chuyên ngành."
            />
            <FeatureCard 
              icon={<TrendingUpIcon fontSize="inherit" />}
              title="Theo dõi Tiến độ"
              description="Xem lại lịch sử làm bài và theo dõi điểm số qua Dashboard."
            />
          </Box>
        </Container>
      </Box>

      {/* --- 3. PHẦN "TẠI SAO CHỌN" (MỚI TỪ HÌNH ẢNH) --- */}
      <Box sx={{ my: { xs: 8, md: 16 }, py: 1 }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="primary.main" align="center" fontWeight="bold" gutterBottom>
            TÍNH NĂNG
          </Typography>
          <Typography variant="h4" component="h2" align="center" gutterBottom fontWeight={600}>
            Tại sao chọn EPT Learning?
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 5, maxWidth: '600px', mx: 'auto' }}>
            Hệ thống học tập thông minh được thiết kế đặc biệt cho sinh viên Đại học Thủ Dầu Một.
          </Typography> 
          {/* Grid cho 6 tính năng */}
          <Box
            sx={{
              display: 'grid',
              gap: 3,
              // Bố cục 3 cột trên desktop, 2 trên tablet, 1 trên mobile
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)', // 3 cột
              },
              gridAutoRows: '1fr', // Đảm bảo chiều cao bằng nhau
            }}
          >
            {/* Lặp qua 6 tính năng mới */}
            {whyFeatures.map((feature, index) => (
              <FeatureCard 
                key={index}
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
              />
            ))}
          </Box>
        </Container>
      </Box>
      {/* --- 3. Phần CTA (Call to Action) --- */}
      <Container maxWidth="md" sx={{ my: { xs: 8, md: 16 } }}>
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            textAlign: 'center', 
            bgcolor: 'primary.main', // Nền màu chính
            color: 'primary.contrastText', // Chữ màu tương phản (trắng)
            borderRadius: 3
          }}
        >
          <Typography variant="h3" component="h2" fontWeight={600} gutterBottom>
            Sẵn sàng bắt đầu?
          </Typography>
          <Typography variant="body1" sx={{ mb: 4, opacity: 0.9 }}>
            Tham gia ngay để cải thiện kỹ năng Tiếng Anh. Hơn 1000+ sinh viên đã tin tưởng và đạt kết quả tốt.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button 
              component={RouterLink} 
              to="/register" 
              variant="contained" 
              size="large"
              // Nút màu trắng trên nền xanh
              sx={{ bgcolor: 'white', color: 'primary.main', '&:hover': { bgcolor: '#f0f0f0' } }}
            >
              Đăng ký miễn phí
            </Button>
            <Button 
              component={RouterLink} 
              to="/login" 
              variant="outlined" 
              size="large"
              // Nút viền trắng
              sx={{ color: 'white', borderColor: 'white', '&:hover': { borderColor: '#f0f0f0' } }}
            >
              Đã có tài khoản
            </Button>
          </Box>
           <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap', mt: 4, opacity: 0.8 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon fontSize="small" />
                <Typography variant="body2">Hoàn toàn miễn phí</Typography>
              </Box>
               <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTimeIcon fontSize="small" />
                <Typography variant="body2">Học mọi lúc mọi nơi</Typography>
              </Box>
           </Box>
        </Paper>
      </Container>
      
    </Box>
  );
};

export default HomePage;