import api from '../../../shared/api/api';
import type { Friend, FriendPayload } from '../types/friend.types';

export const friendsService = {
  async getFriends(): Promise<Friend[]> {
    const { data } = await api.get<Friend[]>('/friends/');
    return data;
  },

  async addFriend(payload: FriendPayload): Promise<Friend> {
    const { data } = await api.post<Friend>('/friends/', payload);
    return data;
  },


  async updateFriend(id: number, payload: FriendPayload): Promise<Friend> {
    const { data } = await api.put<Friend>(`/friends/${id}/`, payload);
    return data;
  },

  async deleteFriend(id: number): Promise<void> {
    await api.delete(`/friends/${id}/`);
  },
};