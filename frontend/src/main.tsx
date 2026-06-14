import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import './shared/styles/globals.css';
import { AuthProvider } from './shared/context/AuthContext';
import AppRouter from './router/index';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
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
