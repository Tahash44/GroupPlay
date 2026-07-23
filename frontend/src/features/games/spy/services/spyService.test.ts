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
      const response = { id: 42, status: 'CREATED' as const, created_at: '2026-07-23T10:00:00Z' };

      mock.onPost('/games/spy/sessions/').reply((config) => {
        expect(JSON.parse(config.data)).toEqual(payload);
        return [201, response];
      });

      const result = await spyService.createSession(payload);

      expect(result).toEqual(response);
    });

    it('returns the session_id and status from the response', async () => {
      mock.onPost('/games/spy/sessions/').reply(201, { id: 7, status: 'CREATED', created_at: '2026-07-23T10:00:00Z' });

      const result = await spyService.createSession(payload);

      expect(result.id).toBe(7);
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

describe('spyService — timer & voting methods', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  describe('getTimer', () => {
    it('hits GET /games/spy/sessions/{id}/timer/ and returns parsed data', async () => {
      const responseData = {
        timer_duration: 300,
        timer_elapsed: 45,
        timer_started_at: '2026-07-23T10:00:00Z',
        remaining_time: 255,
        is_running: true,
      };
      mock.onGet('/games/spy/sessions/1/timer/').reply(200, responseData);

      const result = await spyService.getTimer(1);

      expect(result).toEqual(responseData);
    });
  });

  describe('pauseTimer', () => {
    it('hits POST /games/spy/sessions/{id}/timer/pause/', async () => {
      const responseData = {
        message: 'Timer paused',
        timer_duration: 300,
        timer_elapsed: 45,
        timer_started_at: null,
        remaining_time: 255,
        is_running: false,
      };
      mock.onPost('/games/spy/sessions/1/timer/pause/').reply(200, responseData);

      const result = await spyService.pauseTimer(1);

      expect(result).toEqual(responseData);
      expect(result.is_running).toBe(false);
    });
  });

  describe('resumeTimer', () => {
    it('hits POST /games/spy/sessions/{id}/timer/resume/', async () => {
      const responseData = {
        message: 'Timer resumed',
        timer_duration: 300,
        timer_elapsed: 45,
        timer_started_at: '2026-07-23T10:05:00Z',
        remaining_time: 255,
        is_running: true,
      };
      mock.onPost('/games/spy/sessions/1/timer/resume/').reply(200, responseData);

      const result = await spyService.resumeTimer(1);

      expect(result.is_running).toBe(true);
    });
  });

  describe('stopTimer', () => {
    it('hits POST /games/spy/sessions/{id}/timer/stop/ and returns VOTING status', async () => {
      const responseData = {
        message: 'Status changed to voting',
        status: 'VOTING',
        timer_duration: 300,
        timer_elapsed: 300,
        is_running: false,
      };
      mock.onPost('/games/spy/sessions/1/timer/stop/').reply(200, responseData);

      const result = await spyService.stopTimer(1);

      expect(result.status).toBe('VOTING');
    });
  });

  describe('getSessionDetail', () => {
    it('hits GET /games/spy/sessions/{id}/ and returns session detail', async () => {
      const responseData = {
        id: 1,
        game_type: 'spy',
        status: 'VOTING',
        location: null,
        winner: null,
        players: [
          { id: 1, name: 'علی', role: null },
          { id: 2, name: 'سارا', role: null },
        ],
      };
      mock.onGet('/games/spy/sessions/1/').reply(200, responseData);

      const result = await spyService.getSessionDetail(1);

      expect(result.players).toHaveLength(2);
      expect(result.status).toBe('VOTING');
    });
  });

  describe('submitVote', () => {
    it('sends voted_player_id and returns spy_caught result', async () => {
      const responseData = {
        result: 'spy_caught',
        spy_can_guess: true,
        voted_player: 'بردیا',
        status: 'SPY_GUESS',
        winner: [],
      };
      mock.onPost('/games/spy/sessions/1/vote/').reply((config) => {
        expect(JSON.parse(config.data)).toEqual({ voted_player_id: 5 });
        return [200, responseData];
      });

      const result = await spyService.submitVote(1, 5);

      expect(result.result).toBe('spy_caught');
      expect(result.spy_can_guess).toBe(true);
    });

    it('returns wrong_vote result with winner ids when wrong player is voted', async () => {
      const responseData = {
        result: 'wrong_vote',
        spy_can_guess: false,
        voted_player: 'سارا',
        status: 'FINISHED',
        winner: [7],
      };
      mock.onPost('/games/spy/sessions/1/vote/').reply(200, responseData);

      const result = await spyService.submitVote(1, 2);

      expect(result.result).toBe('wrong_vote');
      expect(result.winner).toEqual([7]);
    });
  });

  describe('submitSpyGuess', () => {
    it('sends is_correct: true and returns correct=true with spy as winner', async () => {
      const responseData = {
        correct: true,
        location: 'Hospital',
        winner: [5],
        status: 'FINISHED',
      };
      mock.onPost('/games/spy/sessions/1/spy-guess/').reply((config) => {
        expect(JSON.parse(config.data)).toEqual({ is_correct: true });
        return [200, responseData];
      });

      const result = await spyService.submitSpyGuess(1, true);

      expect(result.correct).toBe(true);
      expect(result.winner).toEqual([5]);
    });

    it('sends is_correct: false and returns correct=false with civilians as winner', async () => {
      const responseData = {
        correct: false,
        location: 'Hospital',
        winner: [1, 2, 3],
        status: 'FINISHED',
      };
      mock.onPost('/games/spy/sessions/1/spy-guess/').reply(200, responseData);

      const result = await spyService.submitSpyGuess(1, false);

      expect(result.correct).toBe(false);
      expect(result.winner).toEqual([1, 2, 3]);
    });

    it('propagates 409 error when session is not in SPY_GUESS state', async () => {
      mock.onPost('/games/spy/sessions/1/spy-guess/').reply(409, {
        detail: 'Session is not in SPY_GUESS state.',
      });

      await expect(spyService.submitSpyGuess(1, true)).rejects.toMatchObject({
        response: { status: 409 },
      });
    });
  });
});