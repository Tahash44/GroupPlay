import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../shared/context/AuthContext';
import AppLayout from '../shared/components/AppLayout/Applayout';

export default function PrivateRoute({
  children,
  layout = true,
}: {
  children: ReactNode;
  layout?: boolean;
}) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        ...
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/auth/login" replace />;

  return layout ? <AppLayout>{children}</AppLayout> : <>{children}</>;
}