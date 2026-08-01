import { useEffect, useMemo, useState } from 'react';
import { friendsService } from '../../../friends/services/friendsService';
import type { Friend } from '../../../friends/types/friend.types';
import Icon from '../../../../shared/components/Icon/Icon';
import type { SelectedPlayer } from '../types/spy.types';
import './PlayerSelector.css';

interface PlayerSelectorProps {
  players: SelectedPlayer[];
  onChange: (players: SelectedPlayer[]) => void;
  hostName: string;
  hostId?: number;
}

const GUEST_PLACEHOLDER = '\u0627\u0633\u0645 \u0645\u0647\u0645\u0627\u0646...';

function createGuestKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function PlayerSelector({ players, onChange, hostName, hostId }: PlayerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [friendsError, setFriendsError] = useState(false);
  const [search, setSearch] = useState('');
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    friendsService
      .getFriends()
      .then(setFriends)
      .catch(() => setFriendsError(true))
      .finally(() => setFriendsLoading(false));
  }, []);

  const selectedFriendIds = useMemo(
    () => new Set(players.filter(p => p.friendId != null).map(p => p.friendId)),
    [players]
  );

  const filteredFriends = useMemo(
    () =>
      friends
        .filter(f => !selectedFriendIds.has(f.id))
        .filter(f => f.name.includes(search.trim())),
    [friends, selectedFriendIds, search]
  );

  const addFriend = (friend: Friend) => {
    onChange([...players, { key: `friend-${friend.id}`, label: friend.name, friendId: friend.id }]);
  };

  const hostKey = hostId != null ? `host-${hostId}` : '';
  const hostIsSelected = hostKey !== '' && players.some(player => player.key === hostKey);

  const addHost = () => {
    if (!hostName || !hostKey || hostIsSelected) return;
    onChange([...players, { key: hostKey, label: hostName }]);
  };

  const addGuest = () => {
    const name = guestName.trim();
    if (!name) return;
    onChange([...players, { key: `guest-${createGuestKey()}`, label: name }]);
    setGuestName('');
  };

  const removePlayer = (key: string) => {
    onChange(players.filter(p => p.key !== key));
  };

  return (
    <section className="player-selector">
      <div className="player-selector-header">
        <div>
          <h2 className="player-selector-title">انتخاب بازیکنان</h2>
          <p className="player-selector-subtitle">برای شروع، بازیکن‌های دورهمی را اضافه کن</p>
        </div>
        <div className="player-selector-add-wrap">
          <button
            type="button"
            className="player-selector-add-btn sketch-border"
            aria-label="باز کردن افزودن بازیکن"
            aria-expanded={isOpen}
            onClick={() => setIsOpen(o => !o)}
          >
            <Icon name="add" />
            <span>افزودن</span>
          </button>

          {isOpen && (
            <>
              <button className="player-selector-backdrop" onClick={() => setIsOpen(false)} aria-label="بستن افزودن بازیکن" />
              <div className="player-selector-panel" role="dialog" aria-label="افزودن بازیکن">
                <label className="player-selector-field-label" htmlFor="player-friend-search">جست‌وجوی دوستان</label>
                <input
                  id="player-friend-search"
                  type="text"
                  className="player-selector-search"
                  placeholder="نام دوست را بنویس"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  dir="auto"
                />
                <div className="player-selector-player-list">
                  {hostName && !hostIsSelected && (
                    <button type="button" className="player-selector-friend-item player-selector-host-option" onClick={addHost}>
                      <span dir="auto">{hostName}</span>
                      <small>میزبان</small>
                      <Icon name="add_circle" />
                    </button>
                  )}

                  {friendsLoading ? (
                    <p className="player-selector-hint">در حال دریافت دوستان</p>
                  ) : friendsError ? (
                    <p className="player-selector-hint player-selector-hint--error">دریافت دوستان ممکن نشد</p>
                  ) : filteredFriends.length === 0 ? (
                    <p className="player-selector-hint">دوست دیگری پیدا نشد</p>
                  ) : (
                    filteredFriends.map(friend => (
                      <button
                        key={friend.id}
                        type="button"
                        className="player-selector-friend-item"
                        onClick={() => addFriend(friend)}
                      >
                        <span dir="auto">{friend.name}</span>
                        <Icon name="add_circle" />
                      </button>
                    ))
                  )}
                </div>

                <div className="player-selector-divider">یا یک مهمان اضافه کن</div>

                <label className="player-selector-field-label" htmlFor="player-guest-name">نام مهمان</label>
                <div className="player-selector-guest-row">
                  <input
                    id="player-guest-name"
                    type="text"
                    className="player-selector-guest-input"
                    placeholder={GUEST_PLACEHOLDER}
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addGuest()}
                    dir="auto"
                  />
                  <button type="button" className="player-selector-guest-add" onClick={addGuest} disabled={!guestName.trim()}>
                    افزودن
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="player-selector-grid">
        {players.map(player => (
          <div key={player.key} className="player-selector-chip sketch-border">
            <span dir="auto">{player.label}</span>
            <button
              type="button"
              className="player-selector-chip-remove"
              aria-label={`حذف ${player.label}`}
              onClick={() => removePlayer(player.key)}
            >
              <Icon name="close" />
            </button>
          </div>
        ))}

        <div className="player-selector-empty-slot">
          <span>نفر بعدی...</span>
        </div>
      </div>
    </section>
  );
}
