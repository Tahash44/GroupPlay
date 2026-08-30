import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import api from '../api/api';

const GUEST_TOKEN_KEY = 'guest_token';
const GUEST_EXPIRY_KEY = 'guest_expires_at';
const ACTIVE_GAME_KEY = 'guest_active_game';

interface GuestContextValue {
  guestToken: string | null;
  ensureGuest: () => Promise<string>;
  clearGuest: () => void;
  activeGameId: string | null;
  setActiveGameId: (id: string) => void;
  clearActiveGame: () => void;
}

const GuestContext = createContext<GuestContextValue | null>(null);

function readValidToken() {
  const token = localStorage.getItem(GUEST_TOKEN_KEY);
  const expiry = Number(localStorage.getItem(GUEST_EXPIRY_KEY));
  if (!token || !expiry || Date.now() >= expiry) {
    localStorage.removeItem(GUEST_TOKEN_KEY);
    localStorage.removeItem(GUEST_EXPIRY_KEY);
    localStorage.removeItem(ACTIVE_GAME_KEY);
    return null;
  }
  return token;
}

export function GuestProvider({ children }: { children: ReactNode }) {
  const [guestToken, setGuestToken] = useState(readValidToken);
  const [activeGameId, setActiveGameIdState] = useState<string | null>(() => (
    readValidToken() ? localStorage.getItem(ACTIVE_GAME_KEY) : null
  ));

  const value = useMemo<GuestContextValue>(() => ({
    guestToken,
    async ensureGuest() {
      const current = readValidToken();
      if (current) {
        setGuestToken(current);
        return current;
      }
      const { data } = await api.post<{ guest_token: string; expires_at: string }>('/games/guest/');
      localStorage.setItem(GUEST_TOKEN_KEY, data.guest_token);
      localStorage.setItem(GUEST_EXPIRY_KEY, String(new Date(data.expires_at).getTime()));
      setGuestToken(data.guest_token);
      return data.guest_token;
    },
    clearGuest() {
      localStorage.removeItem(GUEST_TOKEN_KEY);
      localStorage.removeItem(GUEST_EXPIRY_KEY);
      localStorage.removeItem(ACTIVE_GAME_KEY);
      setGuestToken(null);
      setActiveGameIdState(null);
    },
    activeGameId,
    setActiveGameId(id) {
      localStorage.setItem(ACTIVE_GAME_KEY, id);
      setActiveGameIdState(id);
    },
    clearActiveGame() {
      localStorage.removeItem(ACTIVE_GAME_KEY);
      setActiveGameIdState(null);
    },
  }), [guestToken, activeGameId]);

  return <GuestContext.Provider value={value}>{children}</GuestContext.Provider>;
}

export function useGuest() {
  const context = useContext(GuestContext);
  return context ?? {
    guestToken: null,
    ensureGuest: async () => '',
    clearGuest: () => undefined,
    activeGameId: null,
    setActiveGameId: () => undefined,
    clearActiveGame: () => undefined,
  };
}
