import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles?: ('student' | 'admin')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ allowedRoles }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Đang tải...</div>; // Màn hình chờ
  }

  if (!user) {
    // Nếu chưa đăng nhập, đá về /login
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Nếu đăng nhập nhưng không có quyền (ví dụ student vào trang admin)
    return <Navigate to="/dashboard" replace />; // Đá về dashboard
  }

  // Nếu mọi thứ OK, hiển thị nội dung trang
  return <Outlet />;
};

export default ProtectedRoute;