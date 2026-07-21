import api from '../../../../shared/api/api';
import type {
  CreateSpySessionPayload,
  CreateSpySessionResponse,
  PendingPlayer,
  RevealRoleResponse,
} from '../types/spy.types';

export const spyService = {
  async createSession(payload: CreateSpySessionPayload): Promise<CreateSpySessionResponse> {
    const { data } = await api.post<CreateSpySessionResponse>('/games/spy/sessions/', payload);
    return data;
  },

  async getPendingPlayers(sessionId: string | number): Promise<PendingPlayer[]> {
    const { data } = await api.get<{ players: PendingPlayer[] }>(
      `/games/spy/sessions/${sessionId}/reveal/`
    );
    return data.players;
  },

  async revealRole(sessionId: string | number, playerId: number): Promise<RevealRoleResponse> {
    const { data } = await api.post<RevealRoleResponse>(
      `/games/spy/sessions/${sessionId}/reveal/`,
      { player_id: playerId }
    );
    return data;
  },
};