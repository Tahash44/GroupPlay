import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import api from '../../../../shared/api/api';
import VotingPage from './VotingPage';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

function renderPage(sessionId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/games/spy/sessions/${sessionId}/vote`]}>
      <Routes>
        <Route path="/games/spy/sessions/:id/vote" element={<VotingPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const basePlayers = [
  { id: 1, name: 'علی', role: null },
  { id: 2, name: 'سارا', role: null },
  { id: 3, name: 'بردیا', role: null },
  { id: 4, name: 'مهسا', role: null },
];

describe('VotingPage', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
    mockNavigate.mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  it('shows voting form with player list when status is VOTING', async () => {
    mock.onGet('/games/spy/sessions/1/').reply(200, {
      id: 1,
      game_type: 'spy',
      status: 'VOTING',
      location: null,
      winner: null,
      players: basePlayers,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('رأی‌گیری')).toBeInTheDocument();
    });

    expect(screen.getByText('علی')).toBeInTheDocument();
    expect(screen.getByText('بردیا')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ثبت رأی/ })).toBeDisabled();
  });

  it('submits vote and moves to spy_guess phase when spy is caught', async () => {
    mock.onGet('/games/spy/sessions/1/').reply(200, {
      id: 1,
      game_type: 'spy',
      status: 'VOTING',
      location: null,
      winner: null,
      players: basePlayers,
    });
    mock.onPost('/games/spy/sessions/1/vote/').reply(200, {
      result: 'spy_caught',
      spy_can_guess: true,
      voted_player: 'بردیا',
      status: 'SPY_GUESS',
      winner: [],
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => screen.getByText('بردیا'));
    await user.click(screen.getByText('بردیا'));
    await user.click(screen.getByRole('button', { name: /ثبت رأی/ }));

    await waitFor(() => {
      expect(screen.getByText('جاسوس شناسایی شد!')).toBeInTheDocument();
    });
    expect(screen.getByText(/جاسوس: بردیا/)).toBeInTheDocument();
  });

  it('submits vote and shows civilians-lose result when wrong player is voted', async () => {
    mock.onGet('/games/spy/sessions/1/').reply(200, {
      id: 1,
      game_type: 'spy',
      status: 'VOTING',
      location: null,
      winner: null,
      players: [
        { id: 1, name: 'علی', role: null },
        { id: 2, name: 'سارا', role: null },
        { id: 3, name: 'بردیا', role: 'جاسوس' }, // نقش واقعی فقط بعد اتمام بازی استفاده میشه
        { id: 4, name: 'مهسا', role: null },
      ],
    });
    mock.onPost('/games/spy/sessions/1/vote/').reply(200, {
      result: 'wrong_vote',
      spy_can_guess: false,
      voted_player: 'علی',
      status: 'FINISHED',
      winner: [3],
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => screen.getByText('علی'));
    await user.click(screen.getByText('علی'));
    await user.click(screen.getByRole('button', { name: /ثبت رأی/ }));

    await waitFor(() => {
      expect(screen.getByText('جاسوس پیروز شد!')).toBeInTheDocument();
    });
  });

  it('shows spy_guess phase directly when status is already SPY_GUESS (e.g. after refresh)', async () => {
    mock.onGet('/games/spy/sessions/1/').reply(200, {
      id: 1,
      game_type: 'spy',
      status: 'SPY_GUESS',
      location: null,
      winner: null,
      players: basePlayers,
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('جاسوس شناسایی شد!')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /حدس درست بود/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /حدس اشتباه بود/ })).toBeInTheDocument();
  });

  it('submits correct guess and shows spy-wins result', async () => {
    mock.onGet('/games/spy/sessions/1/').reply(200, {
      id: 1,
      game_type: 'spy',
      status: 'SPY_GUESS',
      location: null,
      winner: null,
      players: [
        { id: 1, name: 'علی', role: null },
        { id: 2, name: 'بردیا', role: 'جاسوس' },
      ],
    });
    mock.onPost('/games/spy/sessions/1/spy-guess/').reply(200, {
      correct: true,
      location: 'Hospital',
      winner: [2],
      status: 'FINISHED',
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => screen.getByRole('button', { name: /حدس درست بود/ }));
    await user.click(screen.getByRole('button', { name: /حدس درست بود/ }));

    await waitFor(() => {
      expect(screen.getByText('جاسوس پیروز شد!')).toBeInTheDocument();
    });
  });

  it('submits wrong guess and shows civilians-win result', async () => {
    mock.onGet('/games/spy/sessions/1/').reply(200, {
      id: 1,
      game_type: 'spy',
      status: 'SPY_GUESS',
      location: null,
      winner: null,
      players: [
        { id: 1, name: 'علی', role: null },
        { id: 2, name: 'بردیا', role: 'جاسوس' },
      ],
    });
    mock.onPost('/games/spy/sessions/1/spy-guess/').reply(200, {
      correct: false,
      location: 'Hospital',
      winner: [1],
      status: 'FINISHED',
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => screen.getByRole('button', { name: /حدس اشتباه بود/ }));
    await user.click(screen.getByRole('button', { name: /حدس اشتباه بود/ }));

    await waitFor(() => {
      expect(screen.getByText('شهروندان پیروز شدند!')).toBeInTheDocument();
    });
  });

  it('shows result directly when status is already FINISHED (e.g. after refresh)', async () => {
    mock.onGet('/games/spy/sessions/1/').reply(200, {
      id: 1,
      game_type: 'spy',
      status: 'FINISHED',
      location: 'Hospital',
      winner: [1, 2],
      players: [
        { id: 1, name: 'علی', role: 'Hospital' },
        { id: 2, name: 'سارا', role: 'Hospital' },
        { id: 3, name: 'بردیا', role: 'جاسوس' },
      ],
    });

    renderPage();

    await waitFor(() => {
      expect(screen.getByText('شهروندان پیروز شدند!')).toBeInTheDocument();
    });
  });

  it('shows 409 error toast and stays on spy_guess phase when guess fails with conflict', async () => {
    mock.onGet('/games/spy/sessions/1/').reply(200, {
      id: 1,
      game_type: 'spy',
      status: 'SPY_GUESS',
      location: null,
      winner: null,
      players: basePlayers,
    });
    mock.onPost('/games/spy/sessions/1/spy-guess/').reply(409, {
      detail: 'Session is not in SPY_GUESS state.',
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => screen.getByRole('button', { name: /حدس درست بود/ }));
    await user.click(screen.getByRole('button', { name: /حدس درست بود/ }));

    // صفحه باید همچنان روی فاز spy_guess بمونه، نه نتیجه
    await waitFor(() => {
      expect(screen.getByText('جاسوس شناسایی شد!')).toBeInTheDocument();
    });
  });

  it('navigates to /dashboard when back button is clicked in voting phase', async () => {
    mock.onGet('/games/spy/sessions/1/').reply(200, {
      id: 1,
      game_type: 'spy',
      status: 'VOTING',
      location: null,
      winner: null,
      players: basePlayers,
    });

    const user = userEvent.setup();
    renderPage();

    await waitFor(() => screen.getByText('رأی‌گیری'));
    await user.click(screen.getByLabelText('برگشت'));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });
});