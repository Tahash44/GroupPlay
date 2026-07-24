import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spyService } from '../spy/services/spyService';
import type { SpySessionHistoryItem } from '../spy/types/spy.types';
import './HistoryPage.css';

/*
  فعلاً فقط بازی «جاسوس» پیاده‌سازی شده، پس این صفحه مستقیم spyService رو صدا می‌زنه.
  وقتی بازی‌های دیگه (مافیا، پانتومیم) اضافه شدن، این باید به یک historyService
  عمومی تغییر کنه که چند نوع بازی رو ترکیب کنه.
*/

const WINNER_LABEL: Record<'spy' | 'civilians', string> = {
  spy: 'جاسوس',
  civilians: 'شهروندان',
};

function formatPlayedAt(iso: string): string {
  try {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HistoryPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState<SpySessionHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    const data = await spyService.getFinishedSessions(pageNum);
    setItems(prev => (append ? [...prev, ...data.results] : data.results));
    setHasMore(data.next !== null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadPage(1, false)
      .catch(() => {
        if (!cancelled) setError('گرفتن تاریخچه‌ی بازی‌ها با خطا مواجه شد.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      await loadPage(nextPage, true);
      setPage(nextPage);
    } catch {
      setError('گرفتن بازی‌های بیشتر با خطا مواجه شد.');
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="history-page">
      <header className="history-header">
        <h2 className="history-title">تاریخچه</h2>
        <p className="history-subtitle">لیست بازی‌های تموم‌شده</p>
      </header>

      <div className="history-tabs">
        <button type="button" className="history-tab history-tab-active">
          همه
        </button>
        <button type="button" className="history-tab" disabled>
          جاسوس
        </button>
      </div>

      {loading && <p className="history-status">در حال بارگذاری...</p>}
      {error && !loading && <p className="history-status history-status-error">{error}</p>}

      {!loading && !error && items.length === 0 && (
        <div className="history-empty">
          <span className="material-symbols-outlined history-empty-icon" aria-hidden="true">
            history_edu
          </span>
          <h3 className="history-empty-title">هنوز هیچ بازی‌ای ثبت نشده</h3>
          <button type="button" className="history-empty-btn sketch-border" onClick={() => navigate('/dashboard')}>
            شروع اولین بازی
          </button>
        </div>
      )}

      {!loading && !error && items.length > 0 && (
        <>
          <div className="history-list">
            {items.map(item => (
              <button
                key={item.id}
                type="button"
                className="history-card sketch-border sketch-hover"
                onClick={() => navigate(`/history/${item.id}`)}
              >
                <div className="history-card-top">
                  <div>
                    <span className="history-card-label">نوع بازی</span>
                    <h3 className="history-card-title">جاسوس (Spy)</h3>
                  </div>
                  <div className="history-card-icon">
                    <span className="material-symbols-outlined">visibility_off</span>
                  </div>
                </div>

                <div className="history-card-meta">
                  <span className="history-card-meta-row">
                    <span className="material-symbols-outlined">calendar_month</span>
                    {formatPlayedAt(item.played_at)}
                  </span>
                  <span className="history-card-meta-row">
                    <span className="material-symbols-outlined">groups</span>
                    {item.player_count} بازیکن
                  </span>
                </div>

                <div className="history-card-footer">
                  <div>
                    <span className="history-card-winner-label">برنده نبرد:</span>
                    <div className="history-card-winner">
                      <span
                        className={`history-card-winner-dot ${
                          item.winner_side === 'spy'
                            ? 'history-card-winner-dot-spy'
                            : 'history-card-winner-dot-civilians'
                        }`}
                      />
                      <span
                        className={
                          item.winner_side === 'spy'
                            ? 'history-card-winner-text-spy'
                            : 'history-card-winner-text-civilians'
                        }
                      >
                        {item.winner_side ? WINNER_LABEL[item.winner_side] : 'نامشخص'}
                      </span>
                    </div>
                  </div>
                  <span className="history-card-chevron material-symbols-outlined">chevron_left</span>
                </div>
              </button>
            ))}
          </div>

          {hasMore && (
            <button type="button" className="history-load-more" onClick={handleLoadMore} disabled={loadingMore}>
              {loadingMore ? 'در حال بارگذاری...' : 'نمایش بیشتر'}
            </button>
          )}
        </>
      )}
    </div>
  );
}