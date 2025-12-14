import { createContext, useContext } from 'react';

// Định nghĩa kiểu cho context
interface ColorModeContextType {
  toggleColorMode: () => void;
}

// Tạo Context
export const ColorModeContext = createContext<ColorModeContextType | undefined>(undefined);

// Tạo hook để dễ sử dụng
export const useColorMode = () => {
  const context = useContext(ColorModeContext);
  if (context === undefined) {
    throw new Error('useColorMode phải được dùng bên trong ColorModeProvider (trong ThemeWrapper)');
  }
  return context;
};