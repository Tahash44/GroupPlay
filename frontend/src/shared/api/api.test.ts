import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import api from './api';

// api.ts uses two separate axios objects:
// - `api` (created via axios.create) for normal requests
// - the raw `axios` package singleton for the token refresh call
// So each one needs its own mock adapter.
let apiMock: MockAdapter;
let rawAxiosMock: MockAdapter;

beforeEach(() => {
  apiMock = new MockAdapter(api);
  rawAxiosMock = new MockAdapter(axios);
  localStorage.clear();

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: '' },
  });
});

afterEach(() => {
  apiMock.reset();
  rawAxiosMock.reset();
  vi.restoreAllMocks();
});

describe('api interceptors - request (token attachment)', () => {
  it('attaches the Authorization header when access_token exists', async () => {
    localStorage.setItem('access_token', 'abc123');

    apiMock.onGet('/auth/profile/').reply((config) => {
      expect(config.headers?.Authorization).toBe('Bearer abc123');
      return [200, { id: 1 }];
    });

    const res = await api.get('/auth/profile/');
    expect(res.status).toBe(200);
  });

  it('does not attach an Authorization header when no token is stored', async () => {
    apiMock.onGet('/auth/profile/').reply((config) => {
      expect(config.headers?.Authorization).toBeUndefined();
      return [200, {}];
    });

    await api.get('/auth/profile/');
  });
});

describe('api interceptors - response (refresh on 401)', () => {
  it('refreshes the token on 401 and retries the original request', async () => {
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'refresh-token');

    let callCount = 0;
    apiMock.onGet('/auth/profile/').reply((config) => {
      callCount += 1;
      if (config.headers?.Authorization === 'Bearer expired-token') {
        return [401, { detail: 'token expired' }];
      }
      if (config.headers?.Authorization === 'Bearer new-access-token') {
        return [200, { id: 1, username: 'arshia' }];
      }
      return [401];
    });

    rawAxiosMock.onPost(/\/auth\/token\/refresh\/$/).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ refresh_token: 'refresh-token' });
      return [200, { access_token: 'new-access-token' }];
    });

    const { data } = await api.get('/auth/profile/');

    expect(callCount).toBe(2);
    expect(data).toEqual({ id: 1, username: 'arshia' });
    expect(localStorage.getItem('access_token')).toBe('new-access-token');
  });

  it('logs the user out and redirects to /auth/login when the refresh request also fails', async () => {
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'bad-refresh-token');

    apiMock.onGet('/auth/profile/').reply(401);
    rawAxiosMock.onPost(/\/auth\/token\/refresh\/$/).reply(401);

    await expect(api.get('/auth/profile/')).rejects.toBeTruthy();

    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
    expect(window.location.href).toBe('/auth/login');
  });

  it('logs the user out immediately when there is no refresh token to try', async () => {
    localStorage.setItem('access_token', 'expired-token');
    // refresh_token intentionally not set

    apiMock.onGet('/auth/profile/').reply(401);

    await expect(api.get('/auth/profile/')).rejects.toBeTruthy();

    expect(rawAxiosMock.history.post.length).toBe(0); // no refresh attempt was made
    expect(window.location.href).toBe('/auth/login');
  });

  it('refreshes the token once for concurrent 401s and resolves all queued requests', async () => {
    localStorage.setItem('access_token', 'expired-token');
    localStorage.setItem('refresh_token', 'refresh-token');

    let refreshCallCount = 0;
    rawAxiosMock.onPost(/\/auth\/token\/refresh\/$/).reply(() => {
      refreshCallCount += 1;
      return [200, { access_token: 'new-access-token' }];
    });

    apiMock.onGet('/auth/profile/').reply((config) => {
      if (config.headers?.Authorization === 'Bearer expired-token') return [401];
      if (config.headers?.Authorization === 'Bearer new-access-token') return [200, { id: 1 }];
      return [401];
    });
    apiMock.onGet('/auth/games/').reply((config) => {
      if (config.headers?.Authorization === 'Bearer expired-token') return [401];
      if (config.headers?.Authorization === 'Bearer new-access-token') return [200, { games: [] }];
      return [401];
    });

    const [profileRes, gamesRes] = await Promise.all([
      api.get('/auth/profile/'),
      api.get('/auth/games/'),
    ]);

    // Both requests hit 401 "at the same time" but only ONE refresh call should fire;
    // the second request should be queued and retried with the new token once refresh resolves.
    expect(refreshCallCount).toBe(1);
    expect(profileRes.data).toEqual({ id: 1 });
    expect(gamesRes.data).toEqual({ games: [] });
  });

  it('does not attempt a refresh for auth endpoints (login/register/refresh)', async () => {
    localStorage.setItem('access_token', 'some-token');
    localStorage.setItem('refresh_token', 'some-refresh');

    apiMock.onPost('/auth/login/').reply(401, { detail: 'invalid credentials' });

    await expect(api.post('/auth/login/', { username: 'x', password: 'y' })).rejects.toBeTruthy();
    expect(rawAxiosMock.history.post.length).toBe(0);
  });
});