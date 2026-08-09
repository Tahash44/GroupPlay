import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCard from '../components/GameCard';
import { gamesService } from '../services/gamesService';
import type { Game } from '../types/game.types';
import { PageHeader, StatePanel } from '../../../shared/components/ui';
import './GamesListPage.css';

export default function GamesListPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    gamesService.getGames()
      .then(data => { if (!cancelled) setGames(data); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const openGame = (game: Game) => {
    if (game.available === false) return;
    navigate(game.id === 'spy' ? '/games/spy/new' : `/games/${game.id}`);
  };

  return (
    <div className="games-page">
      <PageHeader title="بازی‌ها" subtitle="یک بازی انتخاب کن و دورهمی را شروع کن" />

      {loading ? (
        <StatePanel title="در حال بارگذاری" description="بازی‌ها در حال آماده‌شدن هستند" loading />
      ) : error ? (
        <StatePanel title="دریافت بازی‌ها انجام نشد" description="اتصال را بررسی کن و صفحه را دوباره باز کن" tone="error" />
      ) : games.length === 0 ? (
        <StatePanel title="هنوز بازی‌ای اضافه نشده" description="بازی‌های تازه به‌زودی اینجا قرار می‌گیرند" />
      ) : (
        <section className="games-grid" aria-label="فهرست بازی‌ها">
          {games.map(game => <GameCard key={game.id} game={game} onSelect={openGame} />)}
        </section>
      )}
    </div>
  );
}
