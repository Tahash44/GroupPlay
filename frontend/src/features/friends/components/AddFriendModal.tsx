import { useState } from 'react';
import type { Friend } from '../types/friend.types';
import { friendsService } from '../services/friendsService';
import './FriendModal.css';

interface AddFriendModalProps {
  onClose: () => void;
  onAdded: (friend: Friend) => void;
}

export default function AddFriendModal({ onClose, onAdded }: AddFriendModalProps) {
  const [name, setName] = useState('');
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
      const friend = await friendsService.addFriend({ name: trimmed });
      onAdded(friend);
      onClose();
    } catch (err: any) {
      // پیام‌های اعتبارسنجی بک‌اند فعلاً انگلیسی‌ان (کانفیگ زبان جنگو)،
      // پس به‌جای نمایش متن خام، خودمون پیام فارسی می‌سازیم.
      if (err?.response?.status === 400) {
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
        <h2 className="friend-modal-title">افزودن دوست جدید</h2>

        <div className="friend-modal-field-wrap">
          <span className="material-symbols-outlined friend-modal-field-icon" aria-hidden="true">person_add</span>
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
            {saving ? 'در حال افزودن...' : 'افزودن'}
          </button>
        </div>
      </div>
    </div>
  );
}