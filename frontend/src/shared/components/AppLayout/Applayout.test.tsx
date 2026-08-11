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

  it('shows the mobile navigation in the requested order without a profile item', () => {
    renderLayout();

    const mobileNav = screen.getByRole('navigation', { name: /ناوبری موبایل/ });
    const links = Array.from(mobileNav.querySelectorAll('a'));

    expect(links.map(link => link.getAttribute('href'))).toEqual(['/friends', '/dashboard', '/history']);
    expect(mobileNav).not.toHaveTextContent('پروفایل');
  });

  it('renders history as navigation and keeps unavailable game settings hidden', () => {
    renderLayout();

    const historyLinks = screen.getAllByRole('link', { name: /تاریخچه/ });
    expect(historyLinks.length).toBeGreaterThan(0);
    historyLinks.forEach(link => expect(link).toHaveAttribute('href', '/history'));

    expect(screen.queryByRole('link', { name: /تنظیمات بازی/ })).not.toBeInTheDocument();
    expect(screen.queryByText('تنظیمات بازی')).not.toBeInTheDocument();
  });

  it('shows the logout control', () => {
    renderLayout('/games/mafia');
    expect(screen.getByRole('button', { name: /خروج/ })).toBeInTheDocument();
  });

  it('hides the new game and logout controls on the main pages', () => {
    for (const path of ['/dashboard', '/profile', '/friends', '/history']) {
      const { unmount } = renderLayout(path);

      expect(screen.queryByRole('link', { name: /شروع بازی جدید/ })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /خروج/ })).not.toBeInTheDocument();
      unmount();
    }
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
