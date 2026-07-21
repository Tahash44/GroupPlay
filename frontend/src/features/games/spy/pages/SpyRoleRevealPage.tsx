import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { spyService } from '../services/spyService';
import type { PendingPlayer, RevealRoleResponse } from '../types/spy.types';
import './SpyRoleRevealPage.css';

export default function SpyRoleRevealPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [players, setPlayers] = useState<PendingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [revealingPlayer, setRevealingPlayer] = useState<PendingPlayer | null>(null);
  const [revealResult, setRevealResult] = useState<RevealRoleResponse | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [revealLoading, setRevealLoading] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const pending = await spyService.getPendingPlayers(id);
        if (!cancelled) setPlayers(pending);
      } catch {
        if (!cancelled) setError('گرفتن لیست بازیکن‌ها با خطا مواجه شد. صفحه رو رفرش کن.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleCardClick = async (player: PendingPlayer) => {
    if (!id || revealLoading) return;

    setRevealingPlayer(player);
    setRevealError(null);
    setRevealLoading(true);

    try {
      const result = await spyService.revealRole(id, player.id);
      setRevealResult(result);
    } catch {
      setRevealError('نمایش نقش با خطا مواجه شد. دوباره تلاش کن.');
    } finally {
      setRevealLoading(false);
    }
  };

  const handleCloseReveal = () => {
    if (revealingPlayer && revealResult) {
      setPlayers(prev => prev.filter(p => p.id !== revealingPlayer.id));
    }
    setRevealingPlayer(null);
    setRevealResult(null);
    setRevealError(null);
  };

  const handleStartGame = () => {
    navigate(`/games/spy/sessions/${id}/play`);
  };

  const allRevealed = !loading && !error && players.length === 0;

  return (
    <div className="spy-reveal-page">
      <header className="spy-reveal-header">
        <div className="spy-reveal-header-right">
          <button type="button" className="spy-reveal-back" onClick={() => navigate('/dashboard')}>
            <span className="material-symbols-outlined">arrow_forward</span>
          </button>
          <h1 className="spy-reveal-brand">بازی‌گردان</h1>
        </div>
        <div className="spy-reveal-header-left">
          <span className="material-symbols-outlined">help</span>
        </div>
      </header>

      <main className="spy-reveal-main">
        <section className="spy-reveal-title-section">
          <div className="spy-reveal-title-wrap">
            <h2 className="spy-reveal-title">نقش‌های مخفی</h2>
            <span className="spy-reveal-title-highlight" aria-hidden="true" />
          </div>
          <p className="spy-reveal-subtitle">برای دیدن نقش روی اسم خودت کلیک کن</p>
        </section>

        {loading && <p className="spy-reveal-status">در حال بارگذاری بازیکن‌ها...</p>}
        {error && <p className="spy-reveal-status spy-reveal-status-error">{error}</p>}

        {!loading && !error && (
          <div className="spy-reveal-grid">
            {players.map(player => (
              <button
                key={player.id}
                type="button"
                className="spy-reveal-card sketch-hover"
                onClick={() => handleCardClick(player)}
                disabled={revealLoading}
              >
                <span className="spy-reveal-card-tape" aria-hidden="true" />
                <span className="spy-reveal-card-name">{player.name}</span>
              </button>
            ))}
          </div>
        )}

        {allRevealed && (
          <p className="spy-reveal-status spy-reveal-status-done">
            همه‌ی نقش‌ها دیده شد. حالا می‌تونید بازی رو شروع کنید.
          </p>
        )}
      </main>

      {allRevealed && (
        <div className="spy-reveal-action-bar">
          <button type="button" className="spy-reveal-start-btn sketch-border" onClick={handleStartGame}>
            <span>شروع بازی</span>
            <span className="material-symbols-outlined">play_arrow</span>
          </button>
        </div>
      )}

      {revealingPlayer && (
        <div className="spy-reveal-overlay" role="dialog" aria-modal="true">
          <div className="spy-reveal-modal sketch-border">
            <p className="spy-reveal-modal-name">{revealingPlayer.name}</p>

            {revealLoading && <p className="spy-reveal-status">در حال آماده‌سازی نقش...</p>}

            {revealError && (
              <>
                <p className="spy-reveal-status spy-reveal-status-error">{revealError}</p>
                <button
                  type="button"
                  className="spy-reveal-modal-close"
                  onClick={() => handleCardClick(revealingPlayer)}
                >
                  تلاش دوباره
                </button>
              </>
            )}

            {revealResult && (
              <>
                <p className="spy-reveal-modal-role">{revealResult.role}</p>
                {revealResult.location && (
                  <p className="spy-reveal-modal-location">مکان: {revealResult.location}</p>
                )}
                <button type="button" className="spy-reveal-modal-close" onClick={handleCloseReveal}>
                  فهمیدم
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}