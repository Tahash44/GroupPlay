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

/*
  دقیقاً مطابق SpySessionResponseSerializer:
  fields = ["id", "status", "created_at"] — نه session_id.
*/
export interface CreateSpySessionResponse {
  id: number;
  status: SessionStatus;
  created_at: string;
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

export interface TimerStatus {
  timer_duration: number;
  timer_elapsed: number;
  timer_started_at: string | null;
  remaining_time: number;
  is_running: boolean;
}

/* پاسخ pause/resume: همون TimerStatus + پیام */
export interface TimerActionResponse extends TimerStatus {
  message: string;
}

/* پاسخ stop: طبق TimerStopResponseSerializer، remaining_time و timer_started_at نداره */
export interface TimerStopResponse {
  message: string;
  status: SessionStatus;
  timer_duration: number;
  timer_elapsed: number;
  is_running: boolean;
}