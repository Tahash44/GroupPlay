import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api from '../../../../shared/api/api';
import { spyService } from './spyService';
import type { CreateSpySessionPayload } from '../types/spy.types';

describe('api interceptors on /games/spy/sessions/ requests', () => {
  let mock: MockAdapter;
  let rawAxiosMock: MockAdapter;

  const payload: CreateSpySessionPayload = {
    game_type: 'spy',
    timer_duration: 300,
    spy_count: 1,
    players: [{ name: 'A' }, { name: 'B' }, { name: 'C' }, { name: 'D' }],
  };

  beforeEach(() => {
    mock = new MockAdapter(api);
    rawAxiosMock = new MockAdapter(axios);
    localStorage.clear();
  });

  afterEach(() => {
    mock.reset();
    mock.restore();
    rawAxiosMock.reset();
    rawAxiosMock.restore();
  });

  it('attaches the access token as a Bearer header', async () => {
    localStorage.setItem('access_token', 'valid-token');

    mock.onPost('/games/spy/sessions/').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer valid-token');
      return [201, { session_id: 1, status: 'CREATED' }];
    });

    await spyService.createSession(payload);
  });

  it('does not send an Authorization header when no token is stored', async () => {
    mock.onPost('/games/spy/sessions/').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [201, { session_id: 1, status: 'CREATED' }];
    });

    await spyService.createSession(payload);
  });

  it('refreshes the access token on a 401 and retries the original session-creation request', async () => {
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'valid-refresh-token');

    let callCount = 0;
    mock.onPost('/games/spy/sessions/').reply((config) => {
      callCount += 1;
      if (callCount === 1) {
        return [401];
      }
      expect(config.headers?.Authorization).toBe('Bearer new-access-token');
      return [201, { session_id: 5, status: 'CREATED' }];
    });

    rawAxiosMock
      .onPost(`${import.meta.env.VITE_API_BASE_URL}/auth/token/refresh/`)
      .reply(200, { access_token: 'new-access-token' });

    const result = await spyService.createSession(payload);

    expect(result).toEqual({ session_id: 5, status: 'CREATED' });
    expect(localStorage.getItem('access_token')).toBe('new-access-token');
  });

  it('logs the user out when there is no refresh token to use on a 401', async () => {
    localStorage.setItem('access_token', 'expired-token');

    mock.onPost('/games/spy/sessions/').reply(401);

    await expect(spyService.createSession(payload)).rejects.toBeTruthy();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });
});