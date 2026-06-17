import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import AuthPage from '../features/auth/pages/AuthPage';
import LogoutButton from '../features/auth/components/LogoutButton';
/*
  این فایل تعیین می‌کنه هر آدرس (URL) کدوم صفحه رو نشون بده.
  مثلاً /auth/login → صفحه ورود
        /auth/register → صفحه ثبت‌نام
        /dashboard → داشبورد (فقط اگه لاگین باشی)
*/

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>...</div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth/login" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* صفحه auth — هم login هم register */}
        <Route path="/auth/:mode" element={<AuthPage />} />
        <Route path="/auth" element={<Navigate to="/auth/login" replace />} />

        {/* داشبورد — فقط برای لاگین‌شده‌ها (بعداً پر میشه) */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
                <div style={{ padding: 40, fontFamily: 'Vazirmatn, sans-serif' }}>
                    داشبورد — به زودی 🎮
                    <br/>
                <LogoutButton />
                </div>
            </PrivateRoute>
          }
        />

        {/* هر آدرس دیگه‌ای → برو صفحه ورود */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
