import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock path must exactly match the specifier authService.ts uses to import `api`
vi.mock('../../../shared/api/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../../shared/api/api';
import { authService } from './authService';

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('register', () => {
    it('sends POST /auth/register/ with the correct body and returns tokens', async () => {
      const payload = { username: 'arshia', email: 'a@a.com', password: 'pass1234', name: 'آرشیا' };
      const tokens = { access_token: 'access-1', refresh_token: 'refresh-1' };
      mockedApi.post.mockResolvedValueOnce({ data: tokens });

      const result = await authService.register(payload);

      expect(mockedApi.post).toHaveBeenCalledTimes(1);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/register/', payload);
      expect(result).toEqual(tokens);
    });
  });

  describe('login', () => {
    it('sends POST /auth/login/ with the correct body and returns tokens', async () => {
      const payload = { username: 'arshia', password: 'pass1234' };
      const tokens = { access_token: 'access-2', refresh_token: 'refresh-2' };
      mockedApi.post.mockResolvedValueOnce({ data: tokens });

      const result = await authService.login(payload);

      expect(mockedApi.post).toHaveBeenCalledTimes(1);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/login/', payload);
      expect(result).toEqual(tokens);
    });

    it('propagates the backend error (e.g. wrong credentials)', async () => {
      const backendError = {
        response: { status: 401, data: { detail: 'نام کاربری یا رمز عبور اشتباه است' } },
      };
      mockedApi.post.mockRejectedValueOnce(backendError);

      await expect(
        authService.login({ username: 'arshia', password: 'wrongpass' })
      ).rejects.toEqual(backendError);
    });
  });

  describe('logout', () => {
    it('sends POST /auth/logout/ with the refresh token', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: undefined });

      await authService.logout('refresh-token-123');

      expect(mockedApi.post).toHaveBeenCalledWith('/auth/logout/', {
        refresh_token: 'refresh-token-123',
      });
    });
  });

  describe('getProfile', () => {
    it('sends GET /auth/profile/ and returns the user', async () => {
      const user = { id: 1, username: 'arshia', email: 'a@a.com', name: 'آرشیا' };
      mockedApi.get.mockResolvedValueOnce({ data: user });

      const result = await authService.getProfile();

      expect(mockedApi.get).toHaveBeenCalledWith('/auth/profile/');
      expect(result).toEqual(user);
    });
  });

  describe('saveTokens', () => {
    it('stores both tokens in localStorage', () => {
      authService.saveTokens({ access_token: 'a1', refresh_token: 'r1' });

      expect(localStorage.getItem('access_token')).toBe('a1');
      expect(localStorage.getItem('refresh_token')).toBe('r1');
    });
  });

  describe('clearTokens', () => {
    it('removes both tokens from localStorage', () => {
      localStorage.setItem('access_token', 'a1');
      localStorage.setItem('refresh_token', 'r1');

      authService.clearTokens();

      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('refresh_token')).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('returns true when an access_token is stored', () => {
      localStorage.setItem('access_token', 'a1');
      expect(authService.isAuthenticated()).toBe(true);
    });

    it('returns false when no access_token is stored', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });
  });
});