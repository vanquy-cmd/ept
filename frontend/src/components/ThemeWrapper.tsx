import React, { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, type PaletteMode } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ColorModeContext } from '../contexts/ColorModeContext';

interface ThemeWrapperProps {
  children: React.ReactNode;
}

// --- ĐỊNH NGHĨA MÀU "TỐI NHẸ" CỦA BẠN ---
const getDesignTokens = (mode: PaletteMode) => ({
  palette: mode === 'light'
      ? {
          mode,
          primary: { main: '#2b6cb0' },
          secondary: { main: '#ed8936' },
          background: {
            default: '#f7fafc',
            paper: '#ffffff',
          },
          text: {
            primary: '#1a202c',
            secondary: '#4a5568',
          },
        }
      : {
          mode,
          primary: { main: '#63b3ed' },
          secondary: { main: '#f6ad55' },
          background: {
            default: '#1e1e2f',
            paper: '#2d2d3f',
          },
          text: {
            primary: '#f7fafc',
            secondary: '#a0aec0',
          },
        },
  });
// ------------------------------------------

const ThemeWrapper: React.FC<ThemeWrapperProps> = ({ children }) => {
  const [mode, setMode] = useState<'light' | 'dark'>(() => {
    try {
      const storedMode = localStorage.getItem('themeMode') as 'light' | 'dark';
      return storedMode || 'light';
    } catch (error) {
      return 'light';
    }
  });

  const colorMode = useMemo(
    () => ({
      toggleColorMode: () => {
        setMode((prevMode) => {
          const newMode = prevMode === 'light' ? 'dark' : 'light';
          localStorage.setItem('themeMode', newMode);
          return newMode;
        });
      },
    }),
    [],
  );

  // SỬA: Tạo theme dựa trên 'mode' và 'getDesignTokens'
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};

export default ThemeWrapper;