/*
  مدل داده‌ی یک بازی.
  size مشخص می‌کنه کارت بازی توی گرید Bento چه اندازه‌ای باشه.
*/

export type GameCardSize = 'large' | 'tall' | 'wide' | 'small';

export interface Game {
  id: string;
  title: string;
  description: string;
  /* اسم آیکون Material Symbols — تا وقتی عکس واقعی بازی از API نیاد، جای خالی رو پر می‌کنه */
  icon: string;
  /* وقتی API وصل شد، این مقدار از بک‌اند می‌آد */
  imageUrl?: string;
  badge?: string;
  size: GameCardSize;
}