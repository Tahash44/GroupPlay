import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCard from '../components/GameCard';
import { gamesService } from '../services/gamesService';
// @ts-ignore
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

const openGame = (game: Game) => {
  if (game.id === 'spy') {
    navigate('/games/spy/new');
    return;
  }
  navigate(`/games/${game.id}`); // بقیه‌ی بازی‌ها فعلاً placeholder
};
  return (
    <div className="games-page">
      {loading ? (
        <div className="games-loading">
          <span className="games-spinner" aria-label="در حال بارگذاری" />
        </div>
      ) : (
        <div className="games-grid">
          {games.map(game => (
            <GameCard key={game.id} game={game} onSelect={openGame} />
          ))}
        </div>
      )}
    </div>
  );
}