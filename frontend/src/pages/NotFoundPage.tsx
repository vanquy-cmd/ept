import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '80vh', // Chiều cao tối thiểu để căn giữa
      textAlign: 'center',
      padding: '20px'
    }}>
      <h1>404 - Không tìm thấy trang</h1>
      <p>Xin lỗi, trang bạn đang tìm kiếm không tồn tại.</p>
      <Link 
        to="/dashboard" // Link quay về trang chủ (Dashboard)
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          textDecoration: 'none', 
          borderRadius: '5px' 
        }}
      >
        Quay về Trang chủ
      </Link>
    </div>
  );
};

export default NotFoundPage;