import api from '../../../../shared/api/api';
import type {
  CreateSpySessionPayload,
  CreateSpySessionResponse,
  PendingPlayer,
  RevealRoleResponse,
    TimerStatus,
  TimerActionResponse,
  TimerStopResponse,
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
    async getTimer(sessionId: string | number): Promise<TimerStatus> {
    const { data } = await api.get<TimerStatus>(`/games/spy/sessions/${sessionId}/timer/`);
    return data;
  },

  async pauseTimer(sessionId: string | number): Promise<TimerActionResponse> {
    const { data } = await api.post<TimerActionResponse>(
      `/games/spy/sessions/${sessionId}/timer/pause/`
    );
    return data;
  },

  async resumeTimer(sessionId: string | number): Promise<TimerActionResponse> {
    const { data } = await api.post<TimerActionResponse>(
      `/games/spy/sessions/${sessionId}/timer/resume/`
    );
    return data;
  },

  async stopTimer(sessionId: string | number): Promise<TimerStopResponse> {
    const { data } = await api.post<TimerStopResponse>(
      `/games/spy/sessions/${sessionId}/timer/stop/`
    );
    return data;
  },
};