import axios from 'axios';

// Lấy URL cơ sở từ biến môi trường
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// 1. Tạo một instance Axios
const api = axios.create({
  baseURL: API_BASE_URL,
});

// 2. Interceptor (Người can thiệp) cho Yêu cầu (Request)
api.interceptors.request.use(
  (config) => {
    // Lấy accessToken từ localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Gắn token vào header Authorization
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Interceptor (Người can thiệp) cho Phản hồi (Response)
// Đây là nơi xử lý logic Refresh Token
api.interceptors.response.use(
  (response) => {
    // Nếu phản hồi thành công, trả về
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Kiểm tra xem lỗi có phải là 401 (Token hết hạn) và chưa thử lại (retry)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true; // Đánh dấu đã thử lại

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            // Nếu không có refresh token, đá người dùng ra (xử lý ở AuthContext)
            window.location.href = '/login'; 
            return Promise.reject(error);
        }

        // Gọi API /refresh để lấy accessToken mới
        const rs = await axios.post(`${API_BASE_URL}/api/users/refresh`, {
          refreshToken: refreshToken,
        });

        const { accessToken } = rs.data;

        // Lưu token mới và cập nhật header
        localStorage.setItem('accessToken', accessToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

        // Gọi lại yêu cầu ban đầu (đã bị lỗi 401)
        return api(originalRequest);

      } catch (_error) {
        // Nếu refresh token thất bại (hết hạn, không hợp lệ)
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login'; // Đá về trang login
        return Promise.reject(_error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;