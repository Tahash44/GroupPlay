import api from '../../../shared/api/api';
import type { User } from '../../auth/types/auth.types';

export interface ProfileUpdatePayload {
  username?: string;
  email?: string;
  name?: string;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}

export const profileService = {
  async getProfile(): Promise<User> {
    const { data } = await api.get<User>('/auth/profile/');
    return data;
  },

  async updateProfile(payload: ProfileUpdatePayload): Promise<User> {
    const { data } = await api.patch<User>('/auth/profile/', payload);
    return data;
  },

  async changePassword(payload: ChangePasswordPayload): Promise<void> {
    await api.post('/auth/change-password/', payload);
  },
};