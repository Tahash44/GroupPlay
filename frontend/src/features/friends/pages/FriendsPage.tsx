import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FriendListItem from '../components/FriendListItem';
import AddFriendModal from '../components/AddFriendModal';
import EditFriendModal from '../components/EditFriendModal';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { friendsService } from '../services/friendsService';
import type { Friend } from '../types/friend.types';
import './FriendsPage.css';

export default function FriendsPage() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFriend, setEditingFriend] = useState<Friend | null>(null);
  const [deletingFriend, setDeletingFriend] = useState<Friend | null>(null);

  useEffect(() => {
    let cancelled = false;
    friendsService
      .getFriends()
      .then(data => {
        if (!cancelled) setFriends(data);
      })
      .catch(() => {
        if (!cancelled) setLoadError('دریافت لیست دوستان با خطا مواجه شد');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredFriends = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return friends;
    return friends.filter(f => f.name.toLowerCase().includes(q));
  }, [friends, searchInput]);

  const handleAdded = (friend: Friend) => {
    setFriends(prev => [friend, ...prev]);
    toast.success('دوست جدید اضافه شد');
  };

  const handleUpdated = (updated: Friend) => {
    setFriends(prev => prev.map(f => (f.id === updated.id ? updated : f)));
    toast.success('تغییرات ذخیره شد');
  };

  const handleDeleted = (id: number) => {
    setFriends(prev => prev.filter(f => f.id !== id));
    toast.success('دوست حذف شد');
  };

  return (
    <div className="friends-page">
      <div className="friends-header">
        <h1 className="friends-title">دوستان</h1>
        <button
          type="button"
          className="friends-add-btn sketch-hover"
          onClick={() => setShowAddModal(true)}
        >
          <span>افزودن</span>
          <span className="material-symbols-outlined" aria-hidden="true">add</span>
        </button>
      </div>

      <div className="friends-search-wrap">
        <span className="material-symbols-outlined friends-search-icon" aria-hidden="true">search</span>
        <input
          className="friends-search-input"
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="جستجوی دوستان..."
        />
      </div>

      <div className="friends-divider" aria-hidden="true">× × ×</div>

      {loading ? (
        <div className="friends-loading">
          <span className="friends-spinner" aria-label="در حال بارگذاری" />
        </div>
      ) : loadError ? (
        <p className="friends-message friends-message--error">{loadError}</p>
      ) : filteredFriends.length === 0 ? (
        <div className="friends-empty">
          <span className="material-symbols-outlined friends-empty-icon" aria-hidden="true">group_off</span>
          <p className="friends-empty-title">
            {searchInput ? 'دوستی با این نام پیدا نشد' : 'هنوز دوستی اضافه نکردی'}
          </p>
          {!searchInput && (
            <p className="friends-empty-hint">با دکمه‌ی «افزودن» اولین دوستت رو اضافه کن</p>
          )}
        </div>
      ) : (
        <ul className="friends-list">
          {filteredFriends.map((friend, index) => (
            <FriendListItem
              key={friend.id}
              friend={friend}
              index={index}
              onEdit={setEditingFriend}
              onDelete={setDeletingFriend}
            />
          ))}
        </ul>
      )}

      {showAddModal && (
        <AddFriendModal onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
      )}

      {editingFriend && (
        <EditFriendModal
          friend={editingFriend}
          onClose={() => setEditingFriend(null)}
          onUpdated={handleUpdated}
        />
      )}

      {deletingFriend && (
        <DeleteConfirmDialog
          friend={deletingFriend}
          onClose={() => setDeletingFriend(null)}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}