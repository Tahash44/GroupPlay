import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('../services/profileService', () => ({
  profileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

vi.mock('../../../shared/context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../../../features/auth/components/LogoutButton', () => ({
  default: () => <button type="button">خروج</button>,
}));

import ProfilePage from './ProfilePage';
import { profileService } from '../services/profileService';
import { useAuth } from '../../../shared/context/AuthContext';

const mockUser = {
  id: 1,
  username: 'arshia_dev',
  email: 'arshia@example.com',
  name: 'آرشیا',
};

const mockSetUser = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(useAuth).mockReturnValue({
    user: mockUser,
    setUser: mockSetUser,
  } as any);
});

// NOTE: ProfilePage currently does NOT use React Hook Form + Zod (that work was
// deliberately postponed) and is an always-editable form built with useState,
// not a full View/Edit toggle. The tests below cover the *current* behavior:
// - fields pre-filled from the logged-in user
// - successful submit and success message
// - backend error display (duplicate username / wrong password)
// - the password fields reveal toggle
// - manual (non-Zod) password validation

describe('ProfilePage', () => {
  it('pre-fills the fields from the logged-in user', () => {
    render(<ProfilePage />);

    expect(screen.getByDisplayValue('آرشیا')).toBeInTheDocument();
    expect(screen.getByDisplayValue('arshia_dev')).toBeInTheDocument();
    expect(screen.getByDisplayValue('arshia@example.com')).toBeInTheDocument();
  });

  it('calls updateProfile with the current field values on save and shows a success message', async () => {
    const updated = { ...mockUser, name: 'آرشیا جدید' };
    vi.mocked(profileService.updateProfile).mockResolvedValueOnce(updated);

    const user = userEvent.setup();
    render(<ProfilePage />);

    const nameInput = screen.getByPlaceholderText('نام خود را وارد کنید...');
    await user.clear(nameInput);
    await user.type(nameInput, 'آرشیا جدید');

    await user.click(screen.getByRole('button', { name: /ذخیره تغییرات/ }));

    await waitFor(() => {
      expect(profileService.updateProfile).toHaveBeenCalledWith({
        name: 'آرشیا جدید',
        username: 'arshia_dev',
        email: 'arshia@example.com',
      });
    });

    expect(mockSetUser).toHaveBeenCalledWith(updated);
    expect(await screen.findByText('تغییرات با موفقیت ذخیره شد')).toBeInTheDocument();
  });

  it('displays the backend error for a duplicate username', async () => {
    vi.mocked(profileService.updateProfile).mockRejectedValueOnce({
      response: { data: { detail: 'این نام کاربری قبلاً استفاده شده است' } },
    });

    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: /ذخیره تغییرات/ }));

    expect(
      await screen.findByText('این نام کاربری قبلاً استفاده شده است')
    ).toBeInTheDocument();
    expect(mockSetUser).not.toHaveBeenCalled();
  });

  it('hides password fields by default and reveals them on "change password" click', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    expect(screen.queryByPlaceholderText('رمز فعلی...')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /تغییر رمز عبور/ }));

    expect(screen.getByPlaceholderText('رمز فعلی...')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('رمز جدید...')).toBeInTheDocument();
  });

  it('shows a local validation error when a new password is entered without the current password, and does not call changePassword', async () => {
    vi.mocked(profileService.updateProfile).mockResolvedValueOnce(mockUser);

    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: /تغییر رمز عبور/ }));
    await user.type(screen.getByPlaceholderText('رمز جدید...'), 'newPass123');
    await user.click(screen.getByRole('button', { name: /ذخیره تغییرات/ }));

    expect(
      await screen.findByText('برای تغییر رمز، رمز فعلی را هم وارد کنید')
    ).toBeInTheDocument();
    expect(profileService.changePassword).not.toHaveBeenCalled();
  });

  it('displays the backend error for a wrong current password', async () => {
    vi.mocked(profileService.updateProfile).mockResolvedValueOnce(mockUser);
    vi.mocked(profileService.changePassword).mockRejectedValueOnce({
      response: { data: { detail: 'رمز عبور فعلی نادرست است' } },
    });

    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: /تغییر رمز عبور/ }));
    await user.type(screen.getByPlaceholderText('رمز فعلی...'), 'wrongOldPass');
    await user.type(screen.getByPlaceholderText('رمز جدید...'), 'newPass123');
    await user.click(screen.getByRole('button', { name: /ذخیره تغییرات/ }));

    await waitFor(() => {
      expect(profileService.changePassword).toHaveBeenCalledWith({
        old_password: 'wrongOldPass',
        new_password: 'newPass123',
      });
    });

    expect(await screen.findByText('رمز عبور فعلی نادرست است')).toBeInTheDocument();
  });

  it('resets and hides the password fields after a successful password change', async () => {
    vi.mocked(profileService.updateProfile).mockResolvedValueOnce(mockUser);
    vi.mocked(profileService.changePassword).mockResolvedValueOnce(undefined);

    const user = userEvent.setup();
    render(<ProfilePage />);

    await user.click(screen.getByRole('button', { name: /تغییر رمز عبور/ }));
    await user.type(screen.getByPlaceholderText('رمز فعلی...'), 'correctOldPass');
    await user.type(screen.getByPlaceholderText('رمز جدید...'), 'newPass123');
    await user.click(screen.getByRole('button', { name: /ذخیره تغییرات/ }));

    expect(await screen.findByText('تغییرات با موفقیت ذخیره شد')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('رمز فعلی...')).not.toBeInTheDocument();
  });
});