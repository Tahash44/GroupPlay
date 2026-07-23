import api from '../../../../shared/api/api';
import type {
  CreateSpySessionPayload,
  CreateSpySessionResponse,
  PendingPlayer,
  RevealRoleResponse,
    TimerStatus,
  TimerActionResponse,
  TimerStopResponse,
    VoteResult,
  SpyGuessResult,
  SpySessionDetail,
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

   async getSessionDetail(sessionId: string | number): Promise<SpySessionDetail> {
    const { data } = await api.get<SpySessionDetail>(`/games/spy/sessions/${sessionId}/`);
    return data;
  },

  async submitVote(sessionId: string | number, votedPlayerId: number): Promise<VoteResult> {
    const { data } = await api.post<VoteResult>(`/games/spy/sessions/${sessionId}/vote/`, {
      voted_player_id: votedPlayerId,
    });
    return data;
  },

  async submitSpyGuess(sessionId: string | number, isCorrect: boolean): Promise<SpyGuessResult> {
    const { data } = await api.post<SpyGuessResult>(
      `/games/spy/sessions/${sessionId}/spy-guess/`,
      { is_correct: isCorrect }
    );
    return data;
  },
  
};