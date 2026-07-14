import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import axios from 'axios';
import api from '../../../shared/api/api';
import { friendsService } from './friendsService';

/**
 * این فایل مخصوص تأیید رفتار interceptor های api.ts روی درخواست‌های /friends/ هست.
 * منطق کلی interceptor از قبل جای دیگه (api.test.ts) تست شده؛ اینجا فقط مطمئن می‌شیم
 * که درخواست‌های واقعی friendsService هم از همون مسیر رد می‌شن.
 */
describe('api interceptors on /friends/ requests', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    localStorage.clear();
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.reset();
    mock.restore();
    vi.restoreAllMocks();
  });

  it('attaches the access token as a Bearer header', async () => {
    localStorage.setItem('access_token', 'test-access-token');

    mock.onGet('/friends/').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer test-access-token');
      return [200, []];
    });

    await friendsService.getFriends();
  });

  it('does not send an Authorization header when no token is stored', async () => {
    mock.onGet('/friends/').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, []];
    });

    await friendsService.getFriends();
  });

  it('refreshes the access token on a 401 and retries the original /friends/ request', async () => {
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');

    let attempts = 0;
    mock.onGet('/friends/').reply((config) => {
      attempts += 1;
      if (config.headers?.Authorization === 'Bearer expired-token') {
        return [401, { detail: 'Token is invalid or expired.' }];
      }
      return [200, [{ id: 1, name: 'Hassan' }]];
    });

    const refreshSpy = vi.spyOn(axios, 'post').mockResolvedValue({
      data: { access_token: 'new-access-token' },
    });

    const result = await friendsService.getFriends();

    expect(refreshSpy).toHaveBeenCalledWith(
      expect.stringContaining('/auth/token/refresh/'),
      { refresh_token: 'valid-refresh-token' },
    );
    expect(attempts).toBe(2); // اول با توکن منقضی، بعد retry با توکن جدید
    expect(localStorage.getItem('access_token')).toBe('new-access-token');
    expect(result).toEqual([{ id: 1, name: 'Hassan' }]);
  });

  it('logs the user out when there is no refresh token to use on a 401', async () => {
    localStorage.setItem('access_token', 'expired-token');
    // عمداً refresh_token ست نشده

    mock.onGet('/friends/').reply(401, { detail: 'Token is invalid or expired.' });

    await expect(friendsService.getFriends()).rejects.toBeTruthy();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});