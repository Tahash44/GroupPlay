import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import AuthPage from '../features/auth/pages/AuthPage';
import AppLayout from '../shared/components/AppLayout/AppLayout';
import GamesListPage from '../features/games/pages/GamesListPage';
import GameDetailPage from '../features/games/pages/GameDetailPage';

/*
  این فایل تعیین می‌کنه هر آدرس (URL) کدوم صفحه رو نشون بده.
  مثلاً /auth/login   → صفحه ورود
        /auth/register → صفحه ثبت‌نام
        /dashboard     → لیست بازی‌ها (فقط اگه لاگین باشی)
        /games/:id     → صفحه‌ی داخل یک بازی (فقط اگه لاگین باشی)

  PrivateRoute علاوه بر چک کردن لاگین، صفحه رو داخل AppLayout
  (نوار کناری/بالا/پایین) می‌پیچه، تا همه‌ی صفحات بعد از لاگین
  این چیدمان مشترک رو داشته باشن.
*/

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        ...
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  return <AppLayout>{children}</AppLayout>;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* صفحه auth — هم login هم register */}
        <Route path="/auth/:mode" element={<AuthPage />} />
        <Route path="/auth" element={<Navigate to="/auth/login" replace />} />

        {/* لیست بازی‌ها */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <GamesListPage />
            </PrivateRoute>
          }
        />

        {/* صفحه‌ی داخل یک بازی */}
        <Route
          path="/games/:id"
          element={
            <PrivateRoute>
              <GameDetailPage />
            </PrivateRoute>
          }
        />

        {/* هر آدرس دیگه‌ای → برو صفحه ورود */}
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}