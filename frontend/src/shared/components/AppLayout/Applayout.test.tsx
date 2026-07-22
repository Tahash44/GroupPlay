import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppLayout from './Applayout';

const mockUseAuth = vi.fn();
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

function renderLayout(initialPath = '/dashboard') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppLayout>
        <div>Page Content</div>
      </AppLayout>
    </MemoryRouter>
  );
}

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: { id: 1, username: 'arshia', name: 'آرشیا' },
      logout: vi.fn(),
    });
  });

  it('renders the page content passed as children', () => {
    renderLayout();
    expect(screen.getByText('Page Content')).toBeInTheDocument();
  });

  it('renders navigation links to the dashboard, pointing to /dashboard', () => {
    renderLayout();
    // Sidenav and bottomnav use different labels ("پیش‌خوان" vs "بازی‌ها") for the
    // same route, and icon ligature text concatenates into the accessible name,
    // so we match loosely and check the href directly.
    const dashboardLinks = screen.getAllByRole('link', { name: /(پیش‌خوان|بازی‌ها)/ });
    expect(dashboardLinks.length).toBeGreaterThan(0);
    dashboardLinks.forEach(link => expect(link).toHaveAttribute('href', '/dashboard'));
  });

  it('renders navigation links to Friends, pointing to /friends', () => {
    renderLayout();
    const friendsLinks = screen.getAllByRole('link', { name: /دوستان/ });
    expect(friendsLinks.length).toBeGreaterThan(0);
    friendsLinks.forEach(link => expect(link).toHaveAttribute('href', '/friends'));
  });

  it('renders navigation links to Profile, pointing to /profile', () => {
    renderLayout();
    const profileLinks = screen.getAllByRole('link', { name: /پروفایل/ });
    expect(profileLinks.length).toBeGreaterThan(0);
    profileLinks.forEach(link => expect(link).toHaveAttribute('href', '/profile'));
  });

  it('renders not-yet-available nav items ("game settings", "history") as non-navigable, not as links', () => {
    renderLayout();
    // History isn't built on the frontend yet, and "game settings" has no route either,
    // so both must render as plain, non-clickable elements rather than links.
    expect(screen.queryByRole('link', { name: /تنظیمات بازی/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /تاریخچه/ })).not.toBeInTheDocument();
    expect(screen.getByText('تنظیمات بازی')).toBeInTheDocument();
    expect(screen.getByText('تاریخچه')).toBeInTheDocument();
  });

  it('shows the logout control', () => {
    renderLayout();
    expect(screen.getByRole('button', { name: /خروج/ })).toBeInTheDocument();
  });

  it('displays the first letter of the user name as the avatar initial', () => {
    renderLayout();
    const avatars = screen.getAllByLabelText('پروفایل');
    avatars.forEach(avatar => expect(avatar).toHaveTextContent('آ'));
  });

  it('falls back to a placeholder initial when there is no user yet', () => {
    mockUseAuth.mockReturnValue({ user: null, logout: vi.fn() });
    renderLayout();

    const avatars = screen.getAllByLabelText('پروفایل');
    avatars.forEach(avatar => expect(avatar).toHaveTextContent('؟'));
  });
});