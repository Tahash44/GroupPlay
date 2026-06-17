import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gamesService } from '../services/gamesService';
import type { Game } from '../types/games.types';
import './GameDetailPage.css';

export default function GameDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    gamesService
      .getGameById(id)
      .then(g => setGame(g ?? null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="game-detail-loading">در حال بارگذاری...</div>;
  }

  if (!game) {
    return (
      <div className="game-detail-empty">
        <p>این بازی پیدا نشد.</p>
        <button type="button" className="game-detail-back" onClick={() => navigate('/dashboard')}>
          برگشت به لیست بازی‌ها
        </button>
      </div>
    );
  }

  return (
    <div className="game-detail sketch-border sketch-shadow">
      <button type="button" className="game-detail-back-link" onClick={() => navigate('/dashboard')}>
        <span className="material-symbols-outlined">arrow_back</span>
        برگشت
      </button>

      <span className="game-detail-icon material-symbols-outlined" aria-hidden="true">
        {game.icon}
      </span>
      <h1 className="game-detail-title">{game.title}</h1>
      <p className="game-detail-desc">{game.description}</p>

      <div className="game-detail-soon">🚧 صفحه‌ی شروع و تنظیمات این بازی به‌زودی اضافه می‌شه.</div>
    </div>
  );
}
