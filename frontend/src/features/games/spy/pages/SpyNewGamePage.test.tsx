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
    (friendsService.getFriends as ReturnType<typeof vi.fn>).mockResolvedValue(mockFriends);
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
    const incrementBtn = screen.getByRole('button', { name: 'add' });
    expect(incrementBtn).toBeDisabled();

    // ۲ نفر دیگه اضافه کن → ۶ بازیکن → floor(6/3) = 2
    await addGuest(user, 'پنج');
    await addGuest(user, 'شش');

    expect(incrementBtn).toBeEnabled();
    await user.click(incrementBtn);
    expect(screen.getByText('۲')).toBeInTheDocument();

    // دو نفر رو حذف کن (برگرد به ۴) → باید spyCount خودکار به ۱ برگرده
    const removeIcons = screen.getAllByText('close');
    await user.click(removeIcons[0]);
    await user.click(removeIcons[0]);

    await waitFor(() => {
      expect(screen.getByText('۱')).toBeInTheDocument();
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
      session_id: 99,
      status: 'CREATED',
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