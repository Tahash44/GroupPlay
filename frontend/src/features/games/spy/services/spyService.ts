import api from '../../../../shared/api/api';
import type { CreateSpySessionPayload, CreateSpySessionResponse } from '../types/spy.types';

export const spyService = {
  async createSession(payload: CreateSpySessionPayload): Promise<CreateSpySessionResponse> {
    const { data } = await api.post<CreateSpySessionResponse>('/games/spy/sessions/', payload);
    return data;
  },
};