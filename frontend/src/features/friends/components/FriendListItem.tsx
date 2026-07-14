import type { Friend } from '../types/friend.types';
import './FriendListItem.css';

interface FriendListItemProps {
  friend: Friend;
  index: number;
  onEdit: (friend: Friend) => void;
  onDelete: (friend: Friend) => void;
}


const AVATAR_VARIANTS = ['friend-avatar--pink', 'friend-avatar--green', 'friend-avatar--yellow'];

export default function FriendListItem({ friend, index, onEdit, onDelete }: FriendListItemProps) {
  const initial = friend.name.charAt(0).toUpperCase() || '؟';
  const avatarClass = AVATAR_VARIANTS[index % AVATAR_VARIANTS.length];

  return (
    <li className="friend-item sketch-border sketch-shadow">
      <div className={`friend-item-avatar ${avatarClass}`}>{initial}</div>

      <span className="friend-item-name">{friend.name}</span>

      <div className="friend-item-actions">
        <button
          type="button"
          className="friend-item-action-btn sketch-border"
          aria-label={`حذف ${friend.name}`}
          onClick={() => onDelete(friend)}
        >
          <span className="material-symbols-outlined">delete</span>
        </button>
        <button
          type="button"
          className="friend-item-action-btn sketch-border"
          aria-label={`ویرایش ${friend.name}`}
          onClick={() => onEdit(friend)}
        >
          <span className="material-symbols-outlined">edit</span>
        </button>
      </div>
    </li>
  );
}