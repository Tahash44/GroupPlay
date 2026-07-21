export type SessionStatus =
  | 'CREATED'
  | 'ROLE_REVEAL'
  | 'IN_PROGRESS'
  | 'VOTING'
  | 'SPY_GUESS'
  | 'FINISHED';

/* دقیقاً مطابق PlayerInput توی OpenAPI: یا friend_id یا name، نه هر دو */
export type PlayerInput = { friend_id: number; name?: never } | { name: string; friend_id?: never };

export interface CreateSpySessionPayload {
  game_type: 'spy';
  timer_duration: number; // ثانیه — بین ۶۰ تا ۳۶۰۰
  spy_count: number;
  players: PlayerInput[];
}

export interface CreateSpySessionResponse {
  session_id: number;
  status: SessionStatus;
}

/*
  بازیکن انتخاب‌شده توی فرم — یا از لیست دوستانه (friendId داره)
  یا مهمانِ دستی‌تایپ‌شده (فقط label داره).
  key فقط برای رندر لیست و حذف‌کردنه، به بک‌اند فرستاده نمی‌شه.
*/
export interface SelectedPlayer {
  key: string;
  label: string;
  friendId?: number;
}

export const MIN_PLAYERS = 4;
export const TIMER_MIN_MINUTES = 1;
export const TIMER_MAX_MINUTES = 15;

/* ───────── Role reveal ───────── */

/* مطابق PendingPlayerSerializer: بازیکن‌هایی که هنوز نقششون رو ندیدن */
export interface PendingPlayer {
  id: number;
  name: string;
}

/*
  مطابق SpyRoleResponseSerializer / CivilianRoleResponseSerializer.
  location برای جاسوس می‌تونه null باشه، برای شهروند همیشه مقدار داره.
*/
export interface RevealRoleResponse {
  role: string;
  location: string | null;
}