import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/600.css';
import '@fontsource/vazirmatn/700.css';
import './shared/styles/globals.css';
import { AuthProvider } from './shared/context/AuthContext';
import { GuestProvider } from './shared/context/GuestContext';
import { ThemeProvider } from './shared/context/ThemeContext';
import AppRouter from './router/index';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <GuestProvider>
        <ThemeProvider>
          <AppRouter />
        </ThemeProvider>
      </GuestProvider>
      {/* نمایش پیام‌های موفقیت/خطا */}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: 'Vazirmatn, sans-serif',
            direction: 'rtl',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#CB78AC', secondary: '#fff' } },
        }}
      />
    </AuthProvider>
  </StrictMode>
);
