import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../../features/auth/services/authService';
import type { User } from '../../features/auth/types/auth.types';

/*
  این فایل یه "انبار اطلاعات مشترک" می‌سازه.
  هر صفحه‌ای بخواد بدونه آیا کاربر لاگین هست یا نه،
  از اینجا می‌پرسه — بدون نیاز به درخواست مجدد.
*/

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /* وقتی اپ باز میشه، اگه توکن داشتیم پروفایل رو بگیر */
  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService
        .getProfile()
        .then(setUser)
        .catch(() => authService.clearTokens())
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const logout = async () => {
    const refresh = localStorage.getItem('refresh_token') ?? '';
    try { await authService.logout(refresh); } catch { /* ignore */ }
    authService.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

/* این hook رو در هر کامپوننت استفاده کن تا به اطلاعات user دسترسی داشته باشی */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
