import type { Game } from '../types/game.types';

const MOCK_GAMES: Game[] = [
  { id: 'spy', title: 'جاسوس', description: 'جاسوس را در میان بازیکنان پیدا کنید', icon: 'visibility', badge: 'آمادهٔ بازی', imageUrl: '/images/games/card/mobile/spy.webp', desktopImageUrl: '/images/games/card/desktop/spy.webp', available: true, size: 'wide' },
  { id: 'mafia', title: 'مافیا', description: 'بازی نقش مخفی و استدلال گروهی', icon: 'theater_comedy', badge: 'به‌زودی', imageUrl: '/images/games/card/mobile/mafia.webp', desktopImageUrl: '/images/games/card/desktop/mafia.webp', available: false, size: 'wide' },
  { id: 'charades', title: 'پانتومیم', description: 'حدس کلمه با اجرای نمایش', icon: 'emoji_people', imageUrl: '/images/games/card/mobile/charades.webp', desktopImageUrl: '/images/games/card/desktop/charades.webp', available: false, size: 'small' },
  { id: 'truth-or-dare', title: 'جرئت و حقیقت', description: 'چالش‌های جسورانه یا اعترافات', icon: 'local_fire_department', imageUrl: '/images/games/card/mobile/truth-or-dare.webp', desktopImageUrl: '/images/games/card/desktop/truth-or-dare.webp', available: false, size: 'small' },
];

export const gamesService = {
  async getGames(): Promise<Game[]> {
    return new Promise(resolve => {
      setTimeout(() => resolve(MOCK_GAMES.map(game => ({
        ...game,
        imageUrl: game.imageUrl,
      }))), 300);
    });
  },

  async getGameById(id: string): Promise<Game | undefined> {
    const games = await gamesService.getGames();
    return games.find(game => game.id === id);
  },
};
