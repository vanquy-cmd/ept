import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api'; // Import axios instance của chúng ta
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>; // Thay đổi return type
  logout: () => void;
  // (Chúng ta có thể thêm 'register' sau)
}

// Tạo Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Tạo Provider (Component bao bọc)
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Trạng thái chờ

  // Hàm chạy khi component được mount (tải lần đầu)
  useEffect(() => {
    // Kiểm tra xem có token trong localStorage không (để giữ đăng nhập)
    try {
      const storedToken = localStorage.getItem('accessToken');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setAccessToken(storedToken);
        setUser(JSON.parse(storedUser));
        // Cập nhật header mặc định của axios
        api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error("Lỗi khi tải trạng thái đăng nhập:", error);
      // Nếu lỗi (ví dụ JSON hỏng), xóa hết
      localStorage.clear();
    } finally {
      setIsLoading(false); // Dừng tải
    }
  }, []);

  // Hàm Đăng nhập
  const login = async (email: string, password: string): Promise<User> => {
    // Gọi API login từ backend
    const response = await api.post('/api/users/login', {
      email,
      password,
    });
    
    const { accessToken, refreshToken, user } = response.data;

    // Lưu trữ vào localStorage
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));

    // Cập nhật state
    setAccessToken(accessToken);
    setUser(user);
    
    // Cập nhật header mặc định của axios
    api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    return user; // Trả về user để có thể sử dụng ngay
  };

  // Hàm Đăng xuất
  const logout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        // Gọi API logout để backend xóa refresh token
        await api.post('/api/users/logout', { refreshToken });
      } catch (error) {
        console.error("Lỗi khi gọi API logout, nhưng vẫn tiến hành logout ở client", error);
      }
    }
    
    // Dọn dẹp localStorage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    
    // Cập nhật state
    setAccessToken(null);
    setUser(null);
    
    // Xóa header
    delete api.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, setUser, accessToken, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Tạo Custom Hook (để dễ sử dụng)
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth phải được dùng bên trong AuthProvider');
  }
  return context;
};