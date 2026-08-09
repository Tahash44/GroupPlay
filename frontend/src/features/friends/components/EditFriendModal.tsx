import { useState } from 'react';
import type { Friend } from '../types/friend.types';
import { friendsService } from '../services/friendsService';
import Icon from '../../../shared/components/Icon/Icon';
import { Button, Dialog, TextField } from '../../../shared/components/ui';
import { getHttpStatus } from '../../../shared/api/errors';

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
    } catch (err: unknown) {
      // پیام‌های بک‌اند انگلیسی‌ان، پس همیشه پیام فارسی خودمون رو نشون می‌دیم
      if (getHttpStatus(err) === 404) {
        setError('این دوست دیگر وجود ندارد (شاید حذف شده)');
      } else if (getHttpStatus(err) === 400) {
        setError('نام واردشده معتبر نیست، دوباره تلاش کنید');
      } else {
        setError('خطایی رخ داد، دوباره تلاش کنید');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      title="ویرایش دوست"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>انصراف</Button>
          <Button icon={<Icon name="check" />} loading={saving} onClick={handleSubmit}>
            {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
          </Button>
        </>
      }
    >
          <TextField
            label="نام دوست"
            icon={<Icon name="edit" />}
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="نام دوست را وارد کنید"
            error={error}
          />
    </Dialog>
  );
}
