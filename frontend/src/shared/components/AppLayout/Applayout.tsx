import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LogoutButton from '../../../features/auth/components/LogoutButton';
import Icon from '../Icon/Icon';
import './AppLayout.css';

interface NavItem { label: string; mobileLabel?: string; icon: string; path: string; }

const NAV_ITEMS: NavItem[] = [
  { label: 'بازی‌ها', icon: 'dashboard', path: '/dashboard' },
  { label: 'پروفایل', icon: 'person', path: '/profile' },
  { label: 'دوستان', icon: 'group', path: '/friends' },
  { label: 'تاریخچه', icon: 'history', path: '/history' },
  { label: 'تنظیمات', icon: 'settings', path: '/settings' },
  { label: 'راهنما و پشتیبانی', icon: 'help', path: '/help' },
];

const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: 'دوستان', icon: 'group', path: '/friends' },
  { label: 'بازی‌ها', icon: 'dashboard', path: '/dashboard' },
  { label: 'تاریخچه', icon: 'history', path: '/history' },
];

function isPathActive(pathname: string, path: string) {
  if (path === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/games/');
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { pathname } = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const initial = (user?.name || user?.username || '؟').charAt(0);
  const isMainPage = ['/dashboard', '/profile', '/friends', '/history', '/settings', '/help'].includes(pathname);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) setProfileMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileMenuOpen]);

  return (
    <div className="app-layout paper-texture" data-theme={theme}>
      <a className="app-skip-link" href="#main-content">رفتن به محتوای اصلی</a>

      <header className="app-topbar">
        <Link to="/dashboard" className="app-brand" aria-label="بازی‌گردان، صفحهٔ بازی‌ها">
          <Icon name="sports_esports" />
          <span>بازی‌گردان</span>
        </Link>
        <div className="app-profile-menu" ref={profileMenuRef}>
          <button
            type="button"
            className="app-avatar"
            aria-label="پروفایل"
            aria-expanded={profileMenuOpen}
            aria-haspopup="menu"
            onClick={() => setProfileMenuOpen(open => !open)}
          >
            {initial}
          </button>
          {profileMenuOpen && (
            <div className="app-profile-dropdown" role="menu">
              <Link to="/profile" role="menuitem" onClick={() => setProfileMenuOpen(false)}>
                <Icon name="person" size={20} />
                پروفایل
              </Link>
              <Link to="/settings" role="menuitem" onClick={() => setProfileMenuOpen(false)}>
                <Icon name="settings" size={20} />
                تنظیمات
              </Link>
              <Link to="/help" role="menuitem" onClick={() => setProfileMenuOpen(false)}>
                <Icon name="help" size={20} />
                راهنما و پشتیبانی
              </Link>
            </div>
          )}
        </div>
      </header>

      <aside className="app-sidenav">
        <Link to="/dashboard" className="app-sidenav-brand">
          <span className="app-sidenav-brand__mark"><Icon name="sports_esports" /></span>
          <span><strong>بازی‌گردان</strong><small>همراه دورهمی شما</small></span>
        </Link>

        <nav className="app-nav-links" aria-label="ناوبری اصلی">
          {NAV_ITEMS.map(item => {
            const active = isPathActive(pathname, item.path);
            return (
              <Link key={item.path} to={item.path} className={`app-nav-link${active ? ' app-nav-link--active' : ''}`} aria-current={active ? 'page' : undefined}>
                <Icon name={item.icon} size={22} weight={active ? 'fill' : 'regular'} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {!isMainPage && <Link to="/dashboard" className="app-new-game-btn">
          <Icon name="play_arrow" />
          <span>شروع بازی جدید</span>
        </Link>}
        {!isMainPage && <div className="app-logout-wrap"><LogoutButton /></div>}

        <div className="app-sidenav-footer">
          <p className="app-sidenav-footer__motto">هر دورهمی، یک خاطرهٔ تازه</p>
          <small className="app-sidenav-footer__version">نسخهٔ ۰.۰.۰</small>
        </div>
      </aside>

      <nav className="app-bottomnav" aria-label="ناوبری موبایل">
        {MOBILE_NAV_ITEMS.map(item => {
          const active = isPathActive(pathname, item.path);
          return (
            <Link key={item.path} to={item.path} className={`app-bottomnav-link${active ? ' app-bottomnav-link--active' : ''}`} aria-current={active ? 'page' : undefined}>
              <span className="app-bottomnav-icon"><Icon name={item.icon} size={22} weight={active ? 'fill' : 'regular'} /></span>
              <span>{item.mobileLabel || item.label}</span>
            </Link>
          );
        })}
      </nav>

      <main id="main-content" className="app-content" tabIndex={-1}>{children}</main>
    </div>
  );
}
