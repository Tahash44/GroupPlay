import { useState } from 'react';
import type { Game } from '../types/game.types';
import Icon from '../../../shared/components/Icon/Icon';
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
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = !!game.imageUrl && !imageFailed;
  const available = game.available !== false;

  return (
    <button
      type="button"
      className={`game-card sketch-border sketch-shadow sketch-hover ${SIZE_CLASS[game.size]} ${available ? 'game-card--available' : ''}`}
      onClick={() => onSelect(game)}
      disabled={!available}
      aria-label={`${game.title}${available ? '، شروع بازی' : '، به‌زودی'}`}
    >
      {game.badge && (
        <span className={`game-card-badge${available ? '' : ' game-card-badge--unavailable'}`}>
          {game.badge}
        </span>
      )}
      {!available && !game.badge && <span className="game-card-status">به‌زودی</span>}

      {showImage ? (
        <img
          src={game.imageUrl}
          alt={game.title}
          className="game-card-image"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon className="game-card-icon" name={game.icon} weight="duotone" />
      )}

      <div className="game-card-text">
        <h2 className="game-card-title">{game.title}</h2>
        <p className="game-card-desc">{game.description}</p>
        <span className="game-card-action">
          {available ? <><span>شروع بازی</span><Icon name="arrow_forward" /></> : <span>در حال آماده‌سازی</span>}
        </span>
      </div>
    </button>
  );
}
