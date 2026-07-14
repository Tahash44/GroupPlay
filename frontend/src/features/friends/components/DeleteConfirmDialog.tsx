import { useState } from 'react';
import type { Friend } from '../types/friend.types';
import { friendsService } from '../services/friendsService';
import './FriendModal.css';

interface DeleteConfirmDialogProps {
  friend: Friend;
  onClose: () => void;
  onDeleted: (id: number) => void;
}

export default function DeleteConfirmDialog({ friend, onClose, onDeleted }: DeleteConfirmDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      await friendsService.deleteFriend(friend.id);
      onDeleted(friend.id);
      onClose();
    } catch (err: any) {
      if (err?.response?.status === 404) {
        // از قبل حذف شده — از نظر کاربر یعنی موفق
        onDeleted(friend.id);
        onClose();
        return;
      }
      setError('حذف انجام نشد، دوباره تلاش کنید');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="friend-modal-overlay" onClick={onClose}>
      <div className="friend-modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="friend-modal-handle" />
        <h2 className="friend-modal-title">حذف دوست</h2>

        <p className="friend-modal-delete-text">
          مطمئنی می‌خوای <span className="friend-modal-delete-name">{friend.name}</span> رو از لیست دوستانت حذف کنی؟
          این کار قابل بازگشت نیست.
        </p>
        {error && <p className="friend-modal-error">{error}</p>}

        <div className="friend-modal-actions">
          <button type="button" className="friend-modal-btn friend-modal-btn--cancel" onClick={onClose}>
            انصراف
          </button>
          <button
            type="button"
            className="friend-modal-btn friend-modal-btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            <span className="material-symbols-outlined" aria-hidden="true">delete</span>
            {deleting ? 'در حال حذف...' : 'حذف کن'}
          </button>
        </div>
      </div>
    </div>
  );
}