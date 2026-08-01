import { useState } from 'react';
import type { Friend } from '../types/friend.types';
import { friendsService } from '../services/friendsService';
import Icon from '../../../shared/components/Icon/Icon';
import { Button, Dialog, TextField } from '../../../shared/components/ui';
import { getHttpStatus } from '../../../shared/api/errors';

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
    } catch (err: unknown) {
      // پیام‌های اعتبارسنجی بک‌اند فعلاً انگلیسی‌ان (کانفیگ زبان جنگو)،
      // پس به‌جای نمایش متن خام، خودمون پیام فارسی می‌سازیم.
      if (getHttpStatus(err) === 400) {
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
      title="افزودن دوست جدید"
      onClose={onClose}
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>انصراف</Button>
          <Button icon={<Icon name="check" />} loading={saving} onClick={handleSubmit}>
            {saving ? 'در حال افزودن...' : 'افزودن'}
          </Button>
        </>
      }
    >
          <TextField
            label="نام دوست"
            icon={<Icon name="person_add" />}
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
