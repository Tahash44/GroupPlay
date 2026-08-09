import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock path must exactly match the specifier profileService.ts uses to import `api`
vi.mock('../../../shared/api/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

import api from '../../../shared/api/api';
import { profileService } from './profileService';

const mockedApi = api as unknown as {
  get: ReturnType<typeof vi.fn>;
  patch: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getProfile', () => {
    it('sends GET /auth/profile/ and returns the response data', async () => {
      const fakeUser = { id: 1, username: 'arshia', email: 'a@a.com', name: 'آرشیا' };
      mockedApi.get.mockResolvedValueOnce({ data: fakeUser });

      const result = await profileService.getProfile();

      expect(mockedApi.get).toHaveBeenCalledTimes(1);
      expect(mockedApi.get).toHaveBeenCalledWith('/auth/profile/');
      expect(result).toEqual(fakeUser);
    });
  });

  describe('updateProfile', () => {
    it('sends PATCH /auth/profile/ with the correct body', async () => {
      const payload = { name: 'آرشیا جدید', username: 'arshia_dev', email: 'new@a.com' };
      const fakeResponse = { id: 1, ...payload };
      mockedApi.patch.mockResolvedValueOnce({ data: fakeResponse });

      const result = await profileService.updateProfile(payload);

      expect(mockedApi.patch).toHaveBeenCalledTimes(1);
      expect(mockedApi.patch).toHaveBeenCalledWith('/auth/profile/', payload);
      expect(result).toEqual(fakeResponse);
    });

    it('passes a partial payload (single field) through unchanged', async () => {
      const payload = { username: 'only_username_changed' };
      mockedApi.patch.mockResolvedValueOnce({ data: { id: 1, ...payload } });

      await profileService.updateProfile(payload);

      expect(mockedApi.patch).toHaveBeenCalledWith('/auth/profile/', payload);
    });
  });

  describe('changePassword', () => {
    it('sends POST /auth/change-password/ with the correct body and resolves with no value', async () => {
      mockedApi.post.mockResolvedValueOnce({ data: undefined });
      const payload = { old_password: 'old123', new_password: 'new123' };

      const result = await profileService.changePassword(payload);

      expect(mockedApi.post).toHaveBeenCalledTimes(1);
      expect(mockedApi.post).toHaveBeenCalledWith('/auth/change-password/', payload);
      expect(result).toBeUndefined();
    });

    it('propagates the backend error (e.g. wrong current password)', async () => {
      const backendError = {
        response: { status: 400, data: { detail: 'رمز عبور فعلی نادرست است' } },
      };
      mockedApi.post.mockRejectedValueOnce(backendError);

      await expect(
        profileService.changePassword({ old_password: 'wrong', new_password: 'new123' })
      ).rejects.toEqual(backendError);
    });
  });
});