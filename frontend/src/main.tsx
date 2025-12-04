import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext.tsx';
import { Toaster } from 'react-hot-toast';
import ThemeWrapper from './components/ThemeWrapper';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ThemeWrapper>
          <Toaster 
            position="top-center"
            reverseOrder={false}
            toastOptions={{
              duration: 3000, // Thời gian hiển thị mặc định
              style: {
                // Style cơ bản để khớp với giao diện
                fontSize: '16px',
              },
              success: {
                duration: 2000, // Thành công hiển thị 2 giây
              },
              error: {
                duration: 4000, // Lỗi hiển thị 4 giây
              },
            }}
          />
          <App />
        </ThemeWrapper>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);