import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { spyService } from '../spy/services/spyService';
import type { SpySessionDetail } from '../spy/types/spy.types';
import Icon from '../../../shared/components/Icon/Icon';
import { Button, PageHeader, StatePanel } from '../../../shared/components/ui';
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
  const [session, setSession] = useState<SpySessionDetail | null>(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(id ? null : 'این بازی پیدا نشد');

  const loadSession = async () => {
    if (!id) {
      setError('این بازی پیدا نشد');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setSession(await spyService.getSessionDetail(id));
    } catch {
      setError('گرفتن جزئیات بازی با خطا مواجه شد');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    let active = true;
    spyService.getSessionDetail(id)
      .then(detail => {
        if (active) setSession(detail);
      })
      .catch(() => {
        if (active) setError('گرفتن جزئیات بازی با خطا مواجه شد');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return <StatePanel title="در حال دریافت جزئیات بازی" loading />;
  }

  if (error || !session) {
    return (
      <StatePanel
        title={error ?? 'این بازی پیدا نشد'}
        tone="error"
        action={<Button onClick={loadSession}>تلاش دوباره</Button>}
      />
    );
  }

  const winnerLabel = session.winner_side === 'spy' ? 'جاسوس' : 'شهروندان';

  return (
    <div className="history-detail-page">
      <PageHeader title="جزئیات بازی" subtitle="نتیجه و نقش بازیکنان این دور" />

      <section className="history-detail-summary sketch-border">
        <div className="history-detail-summary-top">
          <div>
            <h3 className="history-detail-game-title">بازی جاسوس</h3>
            <p className="history-detail-date">{formatPlayedAt(session.played_at)}</p>
          </div>
          {session.location && <div className="history-detail-location-chip">{session.location}</div>}
        </div>
        <div className="history-detail-result-row">
          <Icon className="history-detail-result-icon" name="check_circle" />
          <div>
            <p className="history-detail-result-label">نتیجه نهایی</p>
            <p className="history-detail-result-value">برندهٔ بازی {winnerLabel}</p>
          </div>
        </div>
      </section>

      <div className="history-detail-stats">
        <div className="history-detail-stat-card sketch-border">
          <Icon name="timer" />
          <p className="history-detail-stat-label">مدت بازی</p>
          <p className="history-detail-stat-value">{formatDuration(session.duration_seconds)}</p>
        </div>
        <div className="history-detail-stat-card sketch-border">
          <Icon name="group" />
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
                  <Icon name={isSpy ? 'visibility_off' : 'person'} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

    </div>
  );
}
