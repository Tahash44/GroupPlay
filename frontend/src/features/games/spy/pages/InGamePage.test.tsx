import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MockAdapter from 'axios-mock-adapter';
import api from '../../../../shared/api/api';
import InGamePage from './InGamePage';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('InGamePage', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
    mockNavigate.mockClear();
  });

  afterEach(() => {
    mock.restore();
  });

  it('stops the server timer before navigating to voting when time is up', async () => {
    mock.onGet('/games/spy/sessions/1/timer/').reply(200, {
      timer_duration: 300,
      timer_elapsed: 300,
      timer_started_at: null,
      remaining_time: 0,
      is_running: false,
    });
    mock.onPost('/games/spy/sessions/1/timer/stop/').reply(200, {
      message: 'Status changed to voting',
      status: 'VOTING',
      timer_duration: 300,
      timer_elapsed: 300,
      is_running: false,
    });

    render(
      <MemoryRouter initialEntries={['/games/spy/sessions/1/play']}>
        <Routes>
          <Route path="/games/spy/sessions/:id/play" element={<InGamePage />} />
        </Routes>
      </MemoryRouter>
    );

    const user = userEvent.setup();
    await user.click(await screen.findByRole('button', { name: 'بریم برای رأی‌گیری' }));

    await waitFor(() => {
      expect(mock.history.post).toHaveLength(1);
      expect(mockNavigate).toHaveBeenCalledWith('/games/spy/sessions/1/vote');
    });
  });
});
