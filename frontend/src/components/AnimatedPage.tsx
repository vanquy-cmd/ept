import React from 'react';
import { motion } from 'framer-motion';

// Định nghĩa các hiệu ứng
// Chúng ta sẽ dùng hiệu ứng "opacity" (độ mờ) và "y" (trượt nhẹ từ dưới lên)
const animations = {
  initial: { opacity: 0, y: 20 }, // Trạng thái ban đầu: mờ, ở dưới 20px
  animate: { opacity: 1, y: 0 },  // Trạng thái khi xuất hiện: rõ, ở vị trí 0
  exit:    { opacity: 0, y: -20 }, // Trạng thái khi thoát: mờ, trượt lên -20px
};

interface AnimatedPageProps {
  children: React.ReactNode;
}

const AnimatedPage: React.FC<AnimatedPageProps> = ({ children }) => {
  return (
    <motion.div
      variants={animations}      // Áp dụng các hiệu ứng đã định nghĩa
      initial="initial"         // Trạng thái bắt đầu
      animate="animate"         // Trạng thái kết thúc
      exit="exit"               // Trạng thái khi rời đi
      transition={{ duration: 0.3 }} // Thời gian chuyển động (0.3 giây)
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;