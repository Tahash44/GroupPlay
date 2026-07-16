import { useEffect, useMemo, useState } from 'react';
import { friendsService } from '../../../friends/services/friendsService';
import type { Friend } from '../../../friends/types/friend.types';
import type { SelectedPlayer } from '../types/spy.types';
import './PlayerSelector.css';

interface PlayerSelectorProps {
  players: SelectedPlayer[];
  onChange: (players: SelectedPlayer[]) => void;
}

export default function PlayerSelector({ players, onChange }: PlayerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsLoading, setFriendsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [guestName, setGuestName] = useState('');

  useEffect(() => {
    friendsService
      .getFriends()
      .then(setFriends)
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

  const addGuest = () => {
    const name = guestName.trim();
    if (!name) return;
    onChange([...players, { key: `guest-${crypto.randomUUID()}`, label: name }]);
    setGuestName('');
  };

  const removePlayer = (key: string) => {
    onChange(players.filter(p => p.key !== key));
  };

  return (
    <section className="player-selector">
      <div className="player-selector-header">
        <h2 className="player-selector-title">انتخاب بازیکنان</h2>
        <div className="player-selector-add-wrap">
          <button type="button" className="player-selector-add-btn sketch-border" onClick={() => setIsOpen(o => !o)}>
            <span className="material-symbols-outlined">add</span>
            <span>افزودن</span>
          </button>

          {isOpen && (
            <>
              <div className="player-selector-backdrop" onClick={() => setIsOpen(false)} />
              <div className="player-selector-panel sketch-border sketch-shadow">
                <input
                  type="text"
                  className="player-selector-search"
                  placeholder="جستجوی دوستان..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />

                <div className="player-selector-friend-list">
                  {friendsLoading ? (
                    <p className="player-selector-hint">در حال بارگذاری دوستان...</p>
                  ) : filteredFriends.length === 0 ? (
                    <p className="player-selector-hint">دوستی پیدا نشد.</p>
                  ) : (
                    filteredFriends.map(friend => (
                      <button
                        key={friend.id}
                        type="button"
                        className="player-selector-friend-item"
                        onClick={() => addFriend(friend)}
                      >
                        <span>{friend.name}</span>
                        <span className="material-symbols-outlined">add_circle</span>
                      </button>
                    ))
                  )}
                </div>

                <div className="player-selector-divider">یا یک مهمان اضافه کن</div>

                <div className="player-selector-guest-row">
                  <input
                    type="text"
                    className="player-selector-guest-input"
                    placeholder="اسم مهمان..."
                    value={guestName}
                    onChange={e => setGuestName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addGuest()}
                  />
                  <button type="button" className="player-selector-guest-add" onClick={addGuest}>
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
            <span>{player.label}</span>
            <span className="material-symbols-outlined player-selector-chip-remove" onClick={() => removePlayer(player.key)}>
              close
            </span>
          </div>
        ))}

        <div className="player-selector-empty-slot">
          <span>نفر بعدی...</span>
        </div>
      </div>
    </section>
  );
}