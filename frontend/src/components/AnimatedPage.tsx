import React from 'react';
import { motion } from 'framer-motion';

// Cho phép tắt animation nếu cần mượt tuyệt đối
const ENABLE_ANIMATION = false;

// Định nghĩa hiệu ứng nhẹ nhàng chỉ dùng opacity để tránh giật/nhảy layout
const animations = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit:    { opacity: 0 },
};

interface AnimatedPageProps {
  children: React.ReactNode;
}

const AnimatedPage: React.FC<AnimatedPageProps> = ({ children }) => {
  if (!ENABLE_ANIMATION) {
    // Trả về nội dung thẳng, không animation
    return <>{children}</>;
  }

  return (
    <motion.div
      variants={animations}      // Áp dụng các hiệu ứng đã định nghĩa
      initial="initial"         // Trạng thái bắt đầu
      animate="animate"         // Trạng thái kết thúc
      exit="exit"               // Trạng thái khi rời đi
      transition={{ duration: 0.18, ease: 'easeOut' }} // Nhẹ hơn, đỡ giật
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;