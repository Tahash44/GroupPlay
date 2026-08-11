import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { spyService } from '../services/spyService';
import type { PendingPlayer, RevealRoleResponse } from '../types/spy.types';
import Icon from '../../../../shared/components/Icon/Icon';
import { ActionBar, Button, Dialog, StatePanel } from '../../../../shared/components/ui';
import './SpyRoleRevealPage.css';

export default function SpyRoleRevealPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<PendingPlayer[]>([]);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : 'این بازی پیدا نشد');
  const [revealingPlayer, setRevealingPlayer] = useState<PendingPlayer | null>(null);
  const [revealResult, setRevealResult] = useState<RevealRoleResponse | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);
  const [startLoading, setStartLoading] = useState(false);
  const confirmExit = () => {
    if (window.confirm('مطمئنی می‌خواهی از بازی خارج شوی؟ روند فعلی بازی متوقف می‌شود.')) navigate('/dashboard');
  };

  const loadPlayers = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      setPlayers(await spyService.getPendingPlayers(id));
    } catch {
      setError('گرفتن فهرست بازیکنان با خطا مواجه شد');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let active = true;
    spyService.getPendingPlayers(id)
      .then(pending => {
        if (active) setPlayers(pending);
      })
      .catch(() => {
        if (active) setError('گرفتن فهرست بازیکنان با خطا مواجه شد');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const handleCardClick = async (player: PendingPlayer) => {
    if (!id || revealLoading) return;
    setRevealingPlayer(player);
    setRevealResult(null);
    setRevealError(null);
    setRevealLoading(true);
    try {
      setRevealResult(await spyService.revealRole(id, player.id));
    } catch {
      setRevealError('نمایش نقش با خطا مواجه شد');
    } finally {
      setRevealLoading(false);
    }
  };

  const handleCloseReveal = () => {
    if (revealingPlayer && revealResult) {
      setPlayers(current => current.filter(player => player.id !== revealingPlayer.id));
    }
    setRevealingPlayer(null);
    setRevealResult(null);
    setRevealError(null);
  };

  const allRevealed = !loading && !error && players.length === 0;

  const handleStartGame = async () => {
    if (!id || startLoading) return;
    setStartLoading(true);
    try {
      await spyService.resumeTimer(id);
      navigate(`/games/spy/sessions/${id}/play`);
    } catch {
      toast.error('شروع زمان‌سنج با خطا مواجه شد');
      setStartLoading(false);
    }
  };

  return (
    <div className="spy-reveal-page">
      <header className="spy-reveal-header">
        <div className="spy-reveal-header-brand">
          <button type="button" className="spy-reveal-back" onClick={confirmExit} aria-label="بازگشت به فهرست بازی‌ها">
            <Icon name="arrow_forward" />
          </button>
          <strong>بازی‌گردان</strong>
        </div>
        <details className="spy-reveal-help">
          <summary aria-label="راهنمای نمایش نقش"><Icon name="help" /></summary>
          <div className="spy-reveal-help__popover">
            گوشی را به هر بازیکن بده و فقط همان بازیکن روی نام خودش بزند، نقشش را ببیند و سپس پنجره را ببندد
          </div>
        </details>
      </header>

      <main className="spy-reveal-main">
        <section className="spy-reveal-title-section">
          <h1 className="spy-reveal-title">نقش‌های مخفی</h1>
          <p className="spy-reveal-subtitle">هر بازیکن فقط روی نام خودش بزند و نقش را مخفی نگه دارد</p>
        </section>

        {loading && <StatePanel title="در حال دریافت بازیکنان" loading />}
        {error && !loading && <StatePanel title={error} tone="error" action={<Button onClick={loadPlayers}>تلاش دوباره</Button>} />}

        {!loading && !error && players.length > 0 && (
          <div className="spy-reveal-grid" aria-label="بازیکنانی که هنوز نقش خود را ندیده‌اند">
            {players.map(player => (
              <button
                key={player.id}
                type="button"
                className="spy-reveal-card"
                onClick={() => handleCardClick(player)}
                disabled={revealLoading}
                aria-label={`نمایش نقش ${player.name}`}
              >
                <Icon name="visibility" />
                <span className="spy-reveal-card-name" dir="auto">{player.name}</span>
                <small>دیدن نقش</small>
              </button>
            ))}
          </div>
        )}

        {allRevealed && (
          <StatePanel icon={<Icon name="check_circle" />} title="همهٔ نقش‌ها دیده شدند" description="اکنون می‌توانید بازی را شروع کنید" />
        )}
      </main>

      {allRevealed && (
        <ActionBar>
          <Button size="lg" block loading={startLoading} icon={<Icon name="play_arrow" />} onClick={handleStartGame}>
            {startLoading ? 'در حال شروع بازی' : 'شروع بازی'}
          </Button>
        </ActionBar>
      )}

      {revealingPlayer && (
        <Dialog
          title={revealingPlayer.name}
          description="مطمئن شو فرد دیگری صفحه را نمی‌بیند"
          onClose={handleCloseReveal}
          closeOnBackdrop={false}
          actions={revealResult ? <Button block onClick={handleCloseReveal}>دیدم، مخفی کن</Button> : undefined}
        >
          <div className="spy-reveal-secret">
            {revealLoading && <StatePanel title="در حال آماده‌سازی نقش" loading />}
            {revealError && !revealLoading && (
              <StatePanel title={revealError} tone="error" action={<Button onClick={() => handleCardClick(revealingPlayer)}>تلاش دوباره</Button>} />
            )}
            {revealResult && (
              revealResult.location ? (
                <div className="spy-reveal-role spy-reveal-role--location">
                  <Icon name="person" />
                  <strong dir="auto">{revealResult.location}</strong>
                </div>
              ) : (
                <div className="spy-reveal-role spy-reveal-role--spy">
                  <Icon name="visibility_off" />
                  <strong>شما جاسوس هستید</strong>
                </div>
              )
            )}
          </div>
        </Dialog>
      )}
    </div>
  );
}
