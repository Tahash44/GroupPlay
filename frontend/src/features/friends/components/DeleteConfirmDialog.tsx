import { useState } from 'react';
import type { Friend } from '../types/friend.types';
import { friendsService } from '../services/friendsService';
import Icon from '../../../shared/components/Icon/Icon';
import { Button, Dialog } from '../../../shared/components/ui';
import { getHttpStatus } from '../../../shared/api/errors';

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
    } catch (err: unknown) {
      if (getHttpStatus(err) === 404) {
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
    <Dialog
      title="حذف دوست"
      description=""
      onClose={onClose}
      closeOnBackdrop={!deleting}
      actions={
        <>
          <Button variant="secondary" onClick={onClose} disabled={deleting}>انصراف</Button>
          <Button variant="danger" icon={<Icon name="delete" />} loading={deleting} onClick={handleDelete}>
            {deleting ? 'در حال حذف...' : 'حذف کن'}
          </Button>
        </>
      }
    >
        <p className="friend-delete-message">
          مطمئنی می‌خوای
          {' '}
          <bdi className="friend-modal-delete-name" dir="auto">{friend.name}</bdi>
          {' '}
          رو از لیست دوستانت حذف کنی؟
        </p>
        {error && <p className="ui-field__error" role="alert">{error}</p>}
    </Dialog>
  );
}
