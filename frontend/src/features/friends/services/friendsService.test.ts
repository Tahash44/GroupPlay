import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api from '../../../shared/api/api';
import { friendsService } from './friendsService';

describe('friendsService', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.reset();
    mock.restore();
  });

  describe('getFriends', () => {
    it('sends GET /friends/ and returns the list as-is', async () => {
      const friends = [
        { id: 1, name: 'Hassan' },
        { id: 2, name: 'Reza' },
      ];
      mock.onGet('/friends/').reply(200, friends);

      const result = await friendsService.getFriends();

      expect(result).toEqual(friends);
    });

    it('propagates server errors', async () => {
      mock.onGet('/friends/').reply(500);

      await expect(friendsService.getFriends()).rejects.toMatchObject({
        response: { status: 500 },
      });
    });
  });

  describe('addFriend', () => {
    it('sends POST /friends/ with { name } as the body', async () => {
      const payload = { name: 'Reza' };
      const created = { id: 3, name: 'Reza' };

      mock.onPost('/friends/').reply((config) => {
        expect(JSON.parse(config.data)).toEqual(payload);
        return [201, created];
      });

      const result = await friendsService.addFriend(payload);

      expect(result).toEqual(created);
    });

    it('propagates 400 validation errors (e.g. empty name)', async () => {
      mock.onPost('/friends/').reply(400, { name: ['This field may not be blank.'] });

      await expect(friendsService.addFriend({ name: '' })).rejects.toMatchObject({
        response: {
          status: 400,
          data: { name: ['This field may not be blank.'] },
        },
      });
    });
  });

  describe('updateFriend', () => {
    // بک‌اند فقط PUT رو پیاده‌سازی کرده (نه PATCH) — این تست دقیقاً همینو تضمین می‌کنه
    it('sends PUT (not PATCH) to /friends/:id/ with { name } as the body', async () => {
      const updated = { id: 1, name: 'Hassan Updated' };

      mock.onPut('/friends/1/').reply((config) => {
        expect(JSON.parse(config.data)).toEqual({ name: 'Hassan Updated' });
        return [200, updated];
      });

      const result = await friendsService.updateFriend(1, { name: 'Hassan Updated' });

      expect(result).toEqual(updated);
      expect(mock.history.patch.length).toBe(0);
      expect(mock.history.put.length).toBe(1);
    });

    it('propagates 404 when the friend does not exist or belongs to another user', async () => {
      mock.onPut('/friends/999/').reply(404, { detail: 'Friend not found.' });

      await expect(friendsService.updateFriend(999, { name: 'X' })).rejects.toMatchObject({
        response: { status: 404 },
      });
    });

    it('propagates 400 validation errors', async () => {
      mock.onPut('/friends/1/').reply(400, { name: ['This field may not be blank.'] });

      await expect(friendsService.updateFriend(1, { name: '' })).rejects.toMatchObject({
        response: { status: 400 },
      });
    });
  });

  describe('deleteFriend', () => {
    it('sends DELETE to /friends/:id/', async () => {
      mock.onDelete('/friends/1/').reply(204);

      await expect(friendsService.deleteFriend(1)).resolves.toBeUndefined();
      expect(mock.history.delete.length).toBe(1);
    });

    it('propagates 404 when the friend is already gone', async () => {
      mock.onDelete('/friends/999/').reply(404, { detail: 'Friend not found.' });

      await expect(friendsService.deleteFriend(999)).rejects.toMatchObject({
        response: { status: 404 },
      });
    });
  });
});