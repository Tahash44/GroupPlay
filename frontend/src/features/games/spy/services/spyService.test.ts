import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from '../../../../shared/api/api';
import { spyService } from './spyService';
import type { CreateSpySessionPayload } from '../types/spy.types';

describe('spyService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.reset();
    mock.restore();
  });

  describe('createSession', () => {
    const payload: CreateSpySessionPayload = {
      game_type: 'spy',
      timer_duration: 480,
      spy_count: 1,
      players: [{ friend_id: 1 }, { name: 'مهمان' }, { friend_id: 2 }, { friend_id: 3 }],
    };

    it('sends POST /games/spy/sessions/ with the exact payload as the body', async () => {
      const response = { session_id: 42, status: 'CREATED' as const };

      mock.onPost('/games/spy/sessions/').reply((config) => {
        expect(JSON.parse(config.data)).toEqual(payload);
        return [201, response];
      });

      const result = await spyService.createSession(payload);

      expect(result).toEqual(response);
    });

    it('returns the session_id and status from the response', async () => {
      mock.onPost('/games/spy/sessions/').reply(201, { session_id: 7, status: 'CREATED' });

      const result = await spyService.createSession(payload);

      expect(result.session_id).toBe(7);
      expect(result.status).toBe('CREATED');
    });

    it('propagates 400 validation errors (e.g. too few players)', async () => {
      mock.onPost('/games/spy/sessions/').reply(400, { players: ['At least 4 players are required.'] });

      await expect(spyService.createSession(payload)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('propagates 400 validation errors for spy_count exceeding the limit', async () => {
      mock.onPost('/games/spy/sessions/').reply(400, { spy_count: ['Too many spies for this many players.'] });

      await expect(spyService.createSession(payload)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('propagates 400 validation errors for an invalid timer duration', async () => {
      mock.onPost('/games/spy/sessions/').reply(400, { timer_duration: ['Ensure this value is between 60 and 3600.'] });

      await expect(spyService.createSession(payload)).rejects.toMatchObject({
        response: { status: 400 },
      });
    });

    it('propagates server errors', async () => {
      mock.onPost('/games/spy/sessions/').reply(500);

      await expect(spyService.createSession(payload)).rejects.toMatchObject({
        response: { status: 500 },
      });
    });
  });
});