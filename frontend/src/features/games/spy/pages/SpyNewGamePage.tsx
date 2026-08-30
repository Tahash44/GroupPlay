import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerSelector from '../components/PlayerSelector';
import SpyCountStepper from '../components/SpyCountStepper';
import TimerSlider from '../components/TimerSlider';
import { spyService } from '../services/spyService';
import { MIN_PLAYERS } from '../types/spy.types';
import type { PlayerInput, SelectedPlayer } from '../types/spy.types';
import { useAuth } from '../../../../shared/context/AuthContext';
import { useGuest } from '../../../../shared/context/GuestContext';
import Icon from '../../../../shared/components/Icon/Icon';
import { ActionBar, Button } from '../../../../shared/components/ui';
import './SpyNewGamePage.css';
import AuthPromptModal from '../../../../shared/components/auth/AuthPromptModal';

const SETUP_TTL_MS = 8 * 60 * 60 * 1000;

interface SavedSetup {
  savedAt: number;
  players: SelectedPlayer[];
  spyCount: number;
  timerMinutes: number;
}

function setupStorageKey(userId?: number): string {
  return `spy-last-setup-${userId ?? 'guest'}`;
}

function readSavedSetup(userId?: number): SavedSetup | null {
  try {
    const raw = sessionStorage.getItem(setupStorageKey(userId));
    if (!raw) return null;
    const saved = JSON.parse(raw) as SavedSetup;
    if (Date.now() - saved.savedAt > SETUP_TTL_MS) {
      sessionStorage.removeItem(setupStorageKey(userId));
      return null;
    }
    return saved;
  } catch {
    return null;
  }
}

function saveSetup(userId: number | undefined, setup: Omit<SavedSetup, 'savedAt'>) {
  try {
    sessionStorage.setItem(setupStorageKey(userId), JSON.stringify({ ...setup, savedAt: Date.now() }));
  } catch {
    // نبود فضای ذخیره‌سازی نباید مانع ساخت بازی شود
  }
}

export default function SpyNewGamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { ensureGuest, setActiveGameId } = useGuest();
  const savedSetup = useMemo(() => readSavedSetup(user?.id), [user?.id]);
  const [players, setPlayers] = useState<SelectedPlayer[]>(() => savedSetup?.players ?? []);
  const [spyCount, setSpyCount] = useState(() => savedSetup?.spyCount ?? 1);
  const [timerMinutes, setTimerMinutes] = useState(() => savedSetup?.timerMinutes ?? 8);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  useEffect(() => {
    if (!user) setShowAuthPrompt(true);
  }, [user]);

  // The signed-in host is optional: they appear in the add-player menu and are
  // only included in the request after explicitly selecting them.
  const hostName = user?.name || user?.username || '';
  const totalPlayers = players.length;
  const maxSpyCount = Math.max(1, Math.floor(totalPlayers / 3));
  const effectiveSpyCount = Math.min(spyCount, maxSpyCount);
  const canSubmit = useMemo(
    () => totalPlayers >= MIN_PLAYERS && !submitting,
    [totalPlayers, submitting]
  );

  const handleSubmit = async () => {
    setError(null);

    if (totalPlayers < MIN_PLAYERS) {
      setError(`برای شروع بازی حداقل به ${MIN_PLAYERS} بازیکن نیاز داری.`);
      return;
    }

    const playerInputs: PlayerInput[] = players.map(p =>
      p.friendId != null ? { friend_id: p.friendId } : { name: p.label }
    );

    setSubmitting(true);
    try {
      if (!user) await ensureGuest();
      const { id } = await spyService.createSession({
        game_type: 'spy',
        timer_duration: timerMinutes * 60,
        spy_count: effectiveSpyCount,
        players: playerInputs,
      });
      if (!user) setActiveGameId(String(id));
      saveSetup(user?.id, { players, spyCount: effectiveSpyCount, timerMinutes });
      navigate(`/games/spy/sessions/${id}/reveal`);
    } catch {
      setError('ساخت بازی با خطا مواجه شد. دوباره تلاش کن.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spy-new-game">
      <header className="spy-new-game-header">
        <div className="spy-new-game-header-brand">
          <button
            type="button"
            className="spy-new-game-back"
            onClick={() => navigate('/dashboard')}
            aria-label="بازگشت به فهرست بازی‌ها"
          >
            <Icon name="arrow_forward" />
          </button>
          <strong>بازی‌گردان</strong>
        </div>

        <details className="spy-new-game-help">
          <summary aria-label="راهنمای ساخت بازی"><Icon name="help" /></summary>
          <div className="spy-new-game-help__popover">
            بازیکن‌ها را از میان دوستان، میزبان یا مهمان‌ها اضافه کن، سپس تعداد جاسوس و زمان بازی را مشخص کن و بازی را شروع کن
          </div>
        </details>
      </header>

      <main className="spy-new-game-main">
        <PlayerSelector players={players} onChange={setPlayers} hostName={hostName} hostId={user?.id} />
        <SpyCountStepper value={effectiveSpyCount} onChange={setSpyCount} max={maxSpyCount} />
        <TimerSlider minutes={timerMinutes} onChange={setTimerMinutes} />

        {error && <p className="spy-new-game-error" role="alert">{error}</p>}
      </main>

      <ActionBar className="spy-new-game-action-bar">
        <Button
          size="lg"
          block
          loading={submitting}
          icon={<Icon name="play_arrow" />}
          onClick={handleSubmit}
          disabled={!canSubmit}
        >
          {submitting ? 'در حال ساخت بازی...' : 'شروع بازی'}
        </Button>
      </ActionBar>
      {showAuthPrompt && <AuthPromptModal variant="pre-game" onClose={() => setShowAuthPrompt(false)} />}
    </div>
  );
}
