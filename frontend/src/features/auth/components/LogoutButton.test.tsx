import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LogoutButton from './LogoutButton';

const mockLogout = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../../shared/context/AuthContext', () => ({
  useAuth: () => ({ logout: mockLogout }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('LogoutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls AuthContext.logout and redirects to the login page when clicked', async () => {
    mockLogout.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <LogoutButton />
      </MemoryRouter>
    );

    await user.click(screen.getByRole('button', { name: 'خروج' }));

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/auth/login', { replace: true });
  });
});