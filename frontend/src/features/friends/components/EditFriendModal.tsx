import { useState } from 'react';
import type { Friend } from '../types/friend.types';
import { friendsService } from '../services/friendsService';
import './FriendModal.css';

interface EditFriendModalProps {
  friend: Friend;
  onClose: () => void;
  onUpdated: (friend: Friend) => void;
}

export default function EditFriendModal({ friend, onClose, onUpdated }: EditFriendModalProps) {
  const [name, setName] = useState(friend.name);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('نام دوست را وارد کنید');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const updated = await friendsService.updateFriend(friend.id, { name: trimmed });
      onUpdated(updated);
      onClose();
    } catch (err: any) {
      // پیام‌های بک‌اند انگلیسی‌ان، پس همیشه پیام فارسی خودمون رو نشون می‌دیم
      if (err?.response?.status === 404) {
        setError('این دوست دیگر وجود ندارد (شاید حذف شده)');
      } else if (err?.response?.status === 400) {
        setError('نام واردشده معتبر نیست، دوباره تلاش کنید');
      } else {
        setError('خطایی رخ داد، دوباره تلاش کنید');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="friend-modal-overlay" onClick={onClose}>
      <div className="friend-modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="friend-modal-handle" />
        <h2 className="friend-modal-title">ویرایش دوست</h2>

        <div className="friend-modal-field-wrap">
          <span className="material-symbols-outlined friend-modal-field-icon" aria-hidden="true">edit</span>
          <input
            className="friend-modal-input"
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="نام دوست..."
          />
        </div>
        {error && <p className="friend-modal-error">{error}</p>}

        <div className="friend-modal-actions">
          <button type="button" className="friend-modal-btn friend-modal-btn--cancel" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="friend-modal-btn friend-modal-btn--primary"
            onClick={handleSubmit}
            disabled={saving}
          >
            <span className="material-symbols-outlined" aria-hidden="true">check</span>
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </button>
        </div>
      </div>
    </div>
  );
}