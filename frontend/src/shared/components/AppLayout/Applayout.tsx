import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoutButton from '../../../features/auth/components/LogoutButton';
import Icon from '../Icon/Icon';
import './AppLayout.css';

interface NavItem { label: string; mobileLabel?: string; icon: string; path: string; }

const NAV_ITEMS: NavItem[] = [
  { label: 'بازی‌ها', icon: 'dashboard', path: '/dashboard' },
  { label: 'پروفایل', icon: 'person', path: '/profile' },
  { label: 'دوستان', icon: 'group', path: '/friends' },
  { label: 'تاریخچه', icon: 'history', path: '/history' },
];

const MOBILE_NAV_ITEMS: NavItem[] = [
  { label: 'پروفایل', icon: 'person', path: '/profile' },
  { label: 'بازی‌ها', icon: 'dashboard', path: '/dashboard' },
  { label: 'دوستان', icon: 'group', path: '/friends' },
  { label: 'تاریخچه', icon: 'history', path: '/history' },
];

function isPathActive(pathname: string, path: string) {
  if (path === '/dashboard') return pathname === '/dashboard' || pathname.startsWith('/games/');
  return pathname === path || pathname.startsWith(`${path}/`);
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const initial = (user?.name || user?.username || '؟').charAt(0);

  return (
    <div className="app-layout paper-texture">
      <a className="app-skip-link" href="#main-content">رفتن به محتوای اصلی</a>

      <header className="app-topbar">
        <Link to="/dashboard" className="app-brand" aria-label="بازی‌گردان، صفحهٔ بازی‌ها">
          <Icon name="sports_esports" />
          <span>بازی‌گردان</span>
        </Link>
        <Link to="/profile" className="app-avatar" aria-label="پروفایل">
          {initial}
        </Link>
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

        <Link to="/dashboard" className="app-new-game-btn">
          <Icon name="play_arrow" />
          <span>شروع بازی جدید</span>
        </Link>
        <div className="app-logout-wrap"><LogoutButton /></div>
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
