import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import GamesListPage from './GamesListPage';
import { gamesService } from '../services/gamesService';
import type { Game } from '../types/game.types';

vi.mock('../services/gamesService', () => ({
  gamesService: {
    getGames: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockedGamesService = gamesService as unknown as {
  getGames: ReturnType<typeof vi.fn>;
};

const MOCK_GAMES: Game[] = [
  {
    id: 'mafia',
    title: 'مافیا',
    description: 'بازی نقش مخفی و استدلال گروهی',
    icon: 'theater_comedy',
    imageUrl: '/images/games/card/mafia.png',
    size: 'large',
  },
  {
    id: 'spy',
    title: 'اسپای',
    description: 'پیدا کردن جاسوس در مکان',
    icon: 'visibility',
    imageUrl: '/images/games/card/spy.png',
    size: 'tall',
  },
];

async function renderPage() {
  const utils = render(
    <MemoryRouter>
      <GamesListPage />
    </MemoryRouter>
  );
  await act(async () => {
    await Promise.resolve();
  });
  return utils;
}

describe('GamesListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows a loading indicator while games are being fetched', () => {
    mockedGamesService.getGames.mockReturnValue(new Promise(() => {})); // never resolves
    render(
      <MemoryRouter>
        <GamesListPage />
      </MemoryRouter>
    );

    expect(screen.getByLabelText('در حال بارگذاری')).toBeInTheDocument();
  });

  it('renders a card for every game returned by gamesService, with the correct title and image', async () => {
    mockedGamesService.getGames.mockResolvedValue(MOCK_GAMES);
    await renderPage();

    expect(mockedGamesService.getGames).toHaveBeenCalledTimes(1);
    expect(screen.getByText('مافیا')).toBeInTheDocument();
    expect(screen.getByText('اسپای')).toBeInTheDocument();

    const spyImage = screen.getByAltText('اسپای') as HTMLImageElement;
    expect(spyImage.src).toContain('/images/games/card/spy.png');
  });

  it('navigates to the Spy New Game Setup route when the Spy card is clicked', async () => {
    mockedGamesService.getGames.mockResolvedValue(MOCK_GAMES);
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByText('اسپای'));

    expect(mockNavigate).toHaveBeenCalledWith('/games/spy/new');
  });

  it('navigates to the generic game detail route for non-Spy games', async () => {
    mockedGamesService.getGames.mockResolvedValue(MOCK_GAMES);
    const user = userEvent.setup();
    await renderPage();

    await user.click(screen.getByText('مافیا'));

    expect(mockNavigate).toHaveBeenCalledWith('/games/mafia');
  });
});