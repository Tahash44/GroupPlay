import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { spyService } from '../spy/services/spyService';
import type { SpySessionDetail } from '../spy/types/spy.types';
import './HistoryDetailPage.css';

function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds === null) return '—';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function formatPlayedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' }).format(
      new Date(iso)
    );
  } catch {
    return iso;
  }
}

export default function HistoryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<SpySessionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;

    (async () => {
      try {
        const detail = await spyService.getSessionDetail(id);
        if (!cancelled) setSession(detail);
      } catch {
        if (!cancelled) setError('گرفتن جزئیات بازی با خطا مواجه شد.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return <div className="history-detail-status">در حال بارگذاری...</div>;
  }

  if (error || !session) {
    return <div className="history-detail-status history-detail-status-error">{error ?? 'این بازی پیدا نشد.'}</div>;
  }

  const winnerLabel = session.winner_side === 'spy' ? 'جاسوس' : 'شهروندان';

  return (
    <div className="history-detail-page">
      <div className="history-detail-title-wrap">
        <h2 className="history-detail-title">جزئیات نبرد</h2>
      </div>

      <section className="history-detail-summary sketch-border">
        <div className="history-detail-summary-top">
          <div>
            <h3 className="history-detail-game-title">بازی جاسوس</h3>
            <p className="history-detail-date">{formatPlayedAt(session.played_at)}</p>
          </div>
          {session.location && <div className="history-detail-location-chip">{session.location}</div>}
        </div>
        <div className="history-detail-result-row">
          <span className="material-symbols-outlined history-detail-result-icon">check_circle</span>
          <div>
            <p className="history-detail-result-label">نتیجه نهایی</p>
            <p className="history-detail-result-value">برنده: {winnerLabel}</p>
          </div>
        </div>
      </section>

      <div className="history-detail-stats">
        <div className="history-detail-stat-card sketch-border">
          <span className="material-symbols-outlined">timer</span>
          <p className="history-detail-stat-label">مدت بازی</p>
          <p className="history-detail-stat-value">{formatDuration(session.duration_seconds)}</p>
        </div>
        <div className="history-detail-stat-card sketch-border">
          <span className="material-symbols-outlined">group</span>
          <p className="history-detail-stat-label">بازیکنان</p>
          <p className="history-detail-stat-value">{session.player_count} نفر</p>
        </div>
      </div>

      <section className="history-detail-players">
        <h3 className="history-detail-players-title">نقش بازیکنان</h3>
        <div className="history-detail-players-list">
          {session.players.map((player, index) => {
            const isSpy = player.role === 'جاسوس';
            return (
              <div
                key={player.id}
                className={`history-detail-player-card sketch-border ${
                  isSpy ? 'history-detail-player-card-spy' : ''
                }`}
              >
                <div className="history-detail-player-left">
                  <span className="history-detail-player-index">{index + 1}</span>
                  <span className="history-detail-player-name">{player.name}</span>
                </div>
                <div className="history-detail-player-role">
                  <span>{isSpy ? 'جاسوس' : 'شهروند'}</span>
                  <span className="material-symbols-outlined">{isSpy ? 'visibility_off' : 'person'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <button type="button" className="history-detail-back" onClick={() => navigate('/history')}>
        <span className="material-symbols-outlined">arrow_back</span>
        برگشت به تاریخچه
      </button>
    </div>
  );
}