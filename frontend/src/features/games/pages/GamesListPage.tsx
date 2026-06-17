import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCard from '../components/GameCard';
import { gamesService } from '../services/gamesService';
import type { Game } from '../types/games.types';
import './GamesListPage.css';

export default function GamesListPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gamesService
      .getGames()
      .then(setGames)
      .finally(() => setLoading(false));
  }, []);

  const openGame = (game: Game) => navigate(`/games/${game.id}`);

  return (
    <div className="games-page">
      <div className="games-header">
        <div>
          <h1 className="games-title">انتخاب بازی</h1>
          <p className="games-subtitle">بازی امشب چیه؟</p>
        </div>
        <button type="button" className="games-search-btn sketch-border" title="به زودی">
          <span className="material-symbols-outlined">search</span>
        </button>
      </div>

      {loading ? (
        <div className="games-loading">
          <span className="games-spinner" aria-label="در حال بارگذاری" />
        </div>
      ) : (
        <div className="games-grid">
          {games.map(game => (
            <GameCard key={game.id} game={game} onSelect={openGame} />
          ))}

          <button type="button" className="games-add-card" title="به زودی">
            <span className="material-symbols-outlined">add_circle</span>
            <span>افزودن بازی جدید</span>
          </button>
        </div>
      )}
    </div>
  );
}
