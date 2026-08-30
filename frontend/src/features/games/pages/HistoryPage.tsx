import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { spyService } from '../spy/services/spyService';
import type { SpySessionHistoryItem } from '../spy/types/spy.types';
import Icon from '../../../shared/components/Icon/Icon';
import { Button, PageHeader, StatePanel } from '../../../shared/components/ui';
import './HistoryPage.css';
import { useAuth } from '../../../shared/context/AuthContext';

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
  const { isAuthenticated } = useAuth();
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

  const loadInitialPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPage(1);
    try {
      await loadPage(1, false);
    } catch {
      setError('گرفتن تاریخچهٔ بازی‌ها با خطا مواجه شد');
    } finally {
      setLoading(false);
    }
  }, [loadPage]);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let active = true;
    spyService.getFinishedSessions(1)
      .then(data => {
        if (!active) return;
        setItems(data.results);
        setHasMore(data.next !== null);
      })
      .catch(() => {
        if (active) setError('گرفتن تاریخچهٔ بازی‌ها با خطا مواجه شد');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

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
      <PageHeader title="تاریخچه" subtitle="نتیجه و جزئیات بازی‌های تمام‌شده را مرور کن" />

      {loading && <StatePanel title="در حال دریافت تاریخچه" loading />}
      {error && !loading && (
        <StatePanel
          title={error}
          tone="error"
          action={<Button onClick={loadInitialPage}>تلاش دوباره</Button>}
        />
      )}

      {!loading && !error && items.length === 0 && (
        <StatePanel
          icon={<Icon name="history_edu" />}
          title={isAuthenticated ? 'هنوز هیچ بازی‌ای ثبت نشده' : 'برای دیدن تاریخچه وارد حساب شو'}
          description={!isAuthenticated ? 'بازی مهمان در تاریخچهٔ حساب ذخیره نمی‌شود' : undefined}
          action={<Button onClick={() => navigate(isAuthenticated ? '/dashboard' : '/auth/login')}>{isAuthenticated ? 'شروع اولین بازی' : 'ورود یا ثبت‌نام'}</Button>}
        />
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
                    <span className="history-card-label">بازی</span>
                    <h2 className="history-card-title">جاسوس</h2>
                  </div>
                  <div className="history-card-icon">
                    <Icon name="visibility_off" />
                  </div>
                </div>

                <div className="history-card-meta">
                  <span className="history-card-meta-row">
                    <Icon name="calendar_month" />
                    {formatPlayedAt(item.played_at)}
                  </span>
                  <span className="history-card-meta-row">
                    <Icon name="groups" />
                    {item.player_count} بازیکن
                  </span>
                </div>

                <div className="history-card-footer">
                  <div>
                    <span className="history-card-winner-label">برندهٔ بازی</span>
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
                  <Icon className="history-card-chevron" name="chevron_left" />
                </div>
              </button>
            ))}
          </div>

          {hasMore && (
            <Button variant="ghost" block loading={loadingMore} onClick={handleLoadMore}>
              {loadingMore ? 'در حال بارگذاری...' : 'نمایش بیشتر'}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
