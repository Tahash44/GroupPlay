import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import AuthPage from '../features/auth/pages/AuthPage';
import AppLayout from '../shared/components/AppLayout/Applayout';
import GamesListPage from '../features/games/pages/GamesListPage';
import GameDetailPage from '../features/games/pages/GameDetailPage';
import ProfilePage from '../features/profile/pages/ProfilePage';

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
        <Route path="/auth/:mode" element={<AuthPage />} />
        <Route path="/auth" element={<Navigate to="/auth/login" replace />} />

        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <GamesListPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/games/:id"
          element={
            <PrivateRoute>
              <GameDetailPage />
            </PrivateRoute>
          }
        />

        {/* صفحه پروفایل */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          }
        />

        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}