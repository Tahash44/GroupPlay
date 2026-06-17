import type { Game } from '../types/games.types';

/*
  فعلاً API بازی‌ها آماده نیست، پس لیست رو موقتاً به صورت mock نگه می‌داریم.
  وقتی بک‌اند آماده شد، فقط همین دو تابع رو با درخواست واقعی عوض کن — کامپوننت‌ها
  (GamesListPage و GameDetailPage) بدون تغییر کار می‌کنن چون فقط با gamesService صحبت می‌کنن.

  نمونه‌ی نسخه‌ی واقعی:
  import api from '../../../shared/api/api';
  async getGames(): Promise<Game[]> {
    const { data } = await api.get<Game[]>('/games/');
    return data;
  }
*/

const MOCK_GAMES: Game[] = [
  { id: 'mafia', title: 'مافیا', description: 'بازی نقش مخفی و استدلال گروهی', icon: 'theater_comedy', badge: 'محبوب',imageUrl: "/images/games/mafia.png" , size: 'large' },
  { id: 'spy', title: 'اسپای', description: 'پیدا کردن جاسوس در مکان', icon: 'visibility', size: 'tall' },
  { id: 'charades', title: 'پانتومیم', description: 'حدس کلمه با اجرای نمایش', icon: 'emoji_people', size: 'small' },
  { id: 'name-family', title: 'اسم فامیل', description: 'کلاسیک و نوستالژیک', icon: 'abc', size: 'small' },
  { id: 'truth-or-dare', title: 'حقیقت یا جرات', description: 'چالش‌های جسورانه یا اعترافات', icon: 'local_fire_department', size: 'wide' },
  { id: 'pictionary', title: 'پیکشنری', description: 'نقاشی بکش تا حدس بزنن', icon: 'draw', size: 'tall' },
];

export const gamesService = {
  async getGames(): Promise<Game[]> {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_GAMES), 300));
  },

  async getGameById(id: string): Promise<Game | undefined> {
    const games = await gamesService.getGames();
    return games.find(g => g.id === id);
  },
};