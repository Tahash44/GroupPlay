import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlayerSelector from '../components/PlayerSelector';
import SpyCountStepper from '../components/SpyCountStepper';
import TimerSlider from '../components/TimerSlider';
import { spyService } from '../services/spyService';
import { MIN_PLAYERS } from '../types/spy.types';
import type { PlayerInput, SelectedPlayer } from '../types/spy.types';
import { useAuth } from '../../../../shared/context/AuthContext';
import './SpyNewGamePage.css';

export default function SpyNewGamePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [players, setPlayers] = useState<SelectedPlayer[]>([]);
  const [spyCount, setSpyCount] = useState(1);
  const [timerMinutes, setTimerMinutes] = useState(8);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The signed-in host is optional: they appear in the add-player menu and are
  // only included in the request after explicitly selecting them.
  const hostName = user?.name || user?.username || '';
  const totalPlayers = players.length;
  const maxSpyCount = Math.max(1, Math.floor(totalPlayers / 3));

  // اگه با کم شدن بازیکن‌ها تعداد جاسوس از حد مجاز رد شد، خودکار اصلاحش کن
  useEffect(() => {
    setSpyCount(prev => Math.min(prev, maxSpyCount));
  }, [maxSpyCount]);

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
      const { session_id } = await spyService.createSession({
        game_type: 'spy',
        timer_duration: timerMinutes * 60,
        spy_count: spyCount,
        players: playerInputs,
      });
      navigate(`/games/spy/sessions/${session_id}/reveal`);
    } catch (err) {
      setError('ساخت بازی با خطا مواجه شد. دوباره تلاش کن.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="spy-new-game">
      <header className="spy-new-game-header">
        <div className="spy-new-game-header-right">
          <button type="button" className="spy-new-game-back" onClick={() => navigate('/dashboard')}>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <h1 className="spy-new-game-brand">بازی‌گردان</h1>
        </div>
        <div className="spy-new-game-header-left">
          <span className="material-symbols-outlined">settings</span>
          <span className="material-symbols-outlined">help</span>
        </div>
      </header>

      <main className="spy-new-game-main">
        <PlayerSelector players={players} onChange={setPlayers} hostName={hostName} hostId={user?.id} />
        <SpyCountStepper value={spyCount} onChange={setSpyCount} max={maxSpyCount} />
        <TimerSlider minutes={timerMinutes} onChange={setTimerMinutes} />

        {error && <p className="spy-new-game-error">{error}</p>}
      </main>

      <div className="spy-new-game-action-bar">
        <button type="button" className="spy-new-game-submit sketch-border" onClick={handleSubmit} disabled={!canSubmit}>
          <span>{submitting ? 'در حال ساخت بازی...' : 'شروع بازی'}</span>
          {!submitting && <span className="material-symbols-outlined">play_arrow</span>}
        </button>
      </div>
    </div>
  );
}
