import api from '../../../shared/api/api';
import type { LoginPayload, RegisterPayload, TokenResponse, User } from '../types/auth.types';

/*
  همه درخواست‌های مربوط به احراز هویت اینجان.
  هر تابع با بک‌اند صحبت می‌کنه.
*/

export const authService = {

  /* ثبت‌نام */
  async register(payload: RegisterPayload): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/register/', payload);
    return data;
  },

  /* ورود */
  async login(payload: LoginPayload): Promise<TokenResponse> {
    const { data } = await api.post<TokenResponse>('/auth/login/', payload);
    return data;
  },

  /* خروج */
  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout/', { refresh_token: refreshToken });
  },

  /* اطلاعات پروفایل */
  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/auth/profile/');
    return data;
  },

  /* ذخیره توکن‌ها در مرورگر */
  saveTokens(tokens: TokenResponse) {
    localStorage.setItem('access_token', tokens.access_token);
    localStorage.setItem('refresh_token', tokens.refresh_token);
  },

  /* پاک کردن توکن‌ها (لاگ‌اوت) */
  clearTokens() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },

  /* آیا کاربر لاگین هست؟ */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  },
};

