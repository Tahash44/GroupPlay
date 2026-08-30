import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import SpyNewGamePage from './SpyNewGamePage';
import { friendsService } from '../../../friends/services/friendsService';
import { spyService } from '../services/spyService';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../../friends/services/friendsService', () => ({
  friendsService: {
    getFriends: vi.fn(),
  },
}));

vi.mock('../services/spyService', () => ({
  spyService: {
    createSession: vi.fn(),
  },
}));

vi.mock('../../../../shared/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 99, username: 'host', email: 'host@example.com', name: 'Host Player' },
    isAuthenticated: true,
  }),
}));

const mockFriends = [
  { id: 1, name: 'حسن' },
  { id: 2, name: 'رضا' },
];

async function ensureAddPanelOpen(user: ReturnType<typeof userEvent.setup>) {
  if (screen.queryByPlaceholderText('اسم مهمان...')) return;
  await user.click(screen.getByRole('button', { name: /افزودن/ }));
}

async function addGuest(user: ReturnType<typeof userEvent.setup>, name: string) {
  await ensureAddPanelOpen(user);
  const input = screen.getByPlaceholderText('اسم مهمان...');
  await user.clear(input);
  await user.type(input, name);
  await user.click(screen.getByRole('button', { name: 'افزودن' }));
  const onlyInGameButton = await screen.findByRole('button', { name: 'فقط به بازی اضافه کن' });
  await user.click(onlyInGameButton);
}

async function renderPage() {
  render(<SpyNewGamePage />);
  await act(async () => {
    await Promise.resolve();
  });
}

describe('SpyNewGamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    (friendsService.getFriends as ReturnType<typeof vi.fn>).mockResolvedValue(mockFriends);
  });

  it('returns directly to the dashboard without confirmation from setup', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    await renderPage();

    await userEvent.setup().click(document.querySelector('.spy-new-game-back') as HTMLElement);

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('restores the latest setup during the same browser session', async () => {
    sessionStorage.setItem('spy-last-setup-99', JSON.stringify({
      savedAt: Date.now(),
      players: [
        { key: 'guest-one', label: 'مهمان ذخیره‌شده' },
        { key: 'friend-1', label: 'حسن', friendId: 1 },
      ],
      spyCount: 1,
      timerMinutes: 12,
    }));

    await renderPage();

    expect(screen.getByText('مهمان ذخیره‌شده')).toBeInTheDocument();
    expect(screen.getByText('۱۲ دقیقه')).toBeInTheDocument();
  });

  it('offers the authenticated host as an optional player', async () => {
    const user = userEvent.setup();
    await renderPage();

    await ensureAddPanelOpen(user);
    await user.click(screen.getByRole('button', { name: /Host Player/ }));

    expect(screen.getByText('Host Player')).toBeInTheDocument();
  });

  it('keeps the submit button disabled while fewer than 4 players are added', async () => {
    const user = userEvent.setup();
    await renderPage();

    await addGuest(user, 'مهمان یک');
    await addGuest(user, 'مهمان دو');
    await addGuest(user, 'مهمان سه');

    expect(screen.getByRole('button', { name: /شروع بازی/ })).toBeDisabled();
  });

  it('enables the submit button once 4 or more players are added', async () => {
    const user = userEvent.setup();
    await renderPage();

    for (const name of ['یک', 'دو', 'سه', 'چهار']) {
      await addGuest(user, name);
    }

    expect(screen.getByRole('button', { name: /شروع بازی/ })).toBeEnabled();
  });

  it('caps the max spy count at floor(players / 3) and clamps down when players are removed', async () => {
    const user = userEvent.setup();
    await renderPage();

    for (const name of ['یک', 'دو', 'سه', 'چهار']) {
      await addGuest(user, name);
    }

    // ۴ بازیکن → floor(4/3) = 1 → دکمه‌ی افزایش باید غیرفعال بمونه
    const incrementBtn = screen.getByRole('button', { name: 'افزایش تعداد جاسوس' });
    expect(incrementBtn).toBeDisabled();

    // ۲ نفر دیگه اضافه کن → ۶ بازیکن → floor(6/3) = 2
    await addGuest(user, 'پنج');
    await addGuest(user, 'شش');

    expect(incrementBtn).toBeEnabled();
    await user.click(incrementBtn);
    expect(screen.getByText('۲')).toBeInTheDocument();

    // دو نفر رو حذف کن (برگرد به ۴) → باید spyCount خودکار به ۱ برگرده
    const removeButtons = screen.getAllByRole('button', { name: /^حذف / });
    await user.click(removeButtons[0]);
    await user.click(screen.getAllByRole('button', { name: /^حذف / })[0]);

    await waitFor(() => {
      expect(document.querySelector('.spy-count-value')).toHaveTextContent('۱');
    });
  });

  it('supports both picking an existing friend and typing a new guest name', async () => {
    const user = userEvent.setup();
    await renderPage();

    await ensureAddPanelOpen(user);
    await screen.findByText('حسن'); // صبر برای لود شدن لیست دوستان

    await user.click(screen.getByRole('button', { name: /حسن/ }));
    expect(screen.getByText('حسن')).toBeInTheDocument();

    await addGuest(user, 'مهمان ویژه');
    expect(screen.getByText('مهمان ویژه')).toBeInTheDocument();
  });

  it('submits the correct payload (including timer in seconds) and redirects to the reveal page', async () => {
    const user = userEvent.setup();
    (spyService.createSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: 99,
      status: 'CREATED',
      created_at: '2026-07-22T21:50:00Z',
    });
    await renderPage();

    await ensureAddPanelOpen(user);
    await screen.findByText('حسن');
    await user.click(screen.getByRole('button', { name: /حسن/ }));
    await addGuest(user, 'مهمان یک');
    await addGuest(user, 'مهمان دو');
    await addGuest(user, 'مهمان سه');

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '12' } });

    await user.click(screen.getByRole('button', { name: /شروع بازی/ }));

    await waitFor(() => {
      expect(spyService.createSession).toHaveBeenCalledWith(
        expect.objectContaining({
          game_type: 'spy',
          timer_duration: 12 * 60,
          spy_count: 1,
          players: expect.arrayContaining([
            { friend_id: 1 },
            expect.objectContaining({ name: 'مهمان یک' }),
          ]),
        })
      );
    });

    expect(mockNavigate).toHaveBeenCalledWith('/games/spy/sessions/99/reveal');
  });

  it('shows a generic error message when session creation fails', async () => {
    const user = userEvent.setup();
    (spyService.createSession as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network error'));

    await renderPage();

    for (const name of ['یک', 'دو', 'سه', 'چهار']) {
      await addGuest(user, name);
    }

    await user.click(screen.getByRole('button', { name: /شروع بازی/ }));

    expect(
      await screen.findByText('ساخت بازی با خطا مواجه شد. دوباره تلاش کن.')
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
