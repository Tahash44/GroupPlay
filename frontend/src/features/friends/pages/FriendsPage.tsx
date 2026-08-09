import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import FriendListItem from '../components/FriendListItem';
import Icon from '../../../shared/components/Icon/Icon';
import { Button, PageHeader, StatePanel, TextField } from '../../../shared/components/ui';
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
      <PageHeader
        title="دوستان"
        actions={
          <Button size="sm" icon={<Icon name="add" />} onClick={() => setShowAddModal(true)}>
            افزودن
          </Button>
        }
      />

        <TextField
          label="جستجوی دوستان"
          hideLabel
          icon={<Icon name="search" />}
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          placeholder="جستجوی دوستان..."
        />

      <div className="friends-divider" aria-hidden="true">× × ×</div>

      {loading ? (
        <StatePanel title="در حال دریافت دوستان" loading />
      ) : loadError ? (
        <StatePanel title={loadError} tone="error" />
      ) : filteredFriends.length === 0 ? (
        <StatePanel
          icon={<Icon name="group_off" />}
          title={searchInput ? 'دوستی با این نام پیدا نشد' : 'هنوز دوستی اضافه نکردی'}
          description={!searchInput ? 'با دکمهٔ افزودن اولین دوستت را اضافه کن' : undefined}
        />
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
