import type { Game } from '../types/games.types';
import './GameCard.css';

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
}

const SIZE_CLASS: Record<Game['size'], string> = {
  large: 'game-card--large',
  tall: 'game-card--tall',
  wide: 'game-card--wide',
  small: 'game-card--small',
};

export default function GameCard({ game, onSelect }: GameCardProps) {
  return (
    <button
      type="button"
      className={`game-card sketch-border sketch-shadow sketch-hover ${SIZE_CLASS[game.size]}`}
      onClick={() => onSelect(game)}
    >
      {game.badge && <span className="game-card-badge">{game.badge}</span>}

      <span className="game-card-icon material-symbols-outlined" aria-hidden="true">
        {game.icon}
      </span>

      <div className="game-card-text">
        <h2 className="game-card-title">{game.title}</h2>
        <p className="game-card-desc">{game.description}</p>
      </div>
    </button>
  );
}
