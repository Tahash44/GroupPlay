import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import LogoutButton from '../../../features/auth/components/LogoutButton';
import './AppLayout.css';

interface NavItem {
  label: string;
  icon: string;
  path: string | null;
}

const NAV_ITEMS: NavItem[] = [
  { label: 'پیش‌خوان', icon: 'dashboard', path: '/dashboard' },
  { label: 'دوستان', icon: 'group', path: '/friends' },
  { label: 'تنظیمات بازی', icon: 'sports_esports', path: null },
  { label: 'تاریخچه', icon: 'history', path: null },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();

  const initial = (user?.name || user?.username || '؟').charAt(0);

  return (
    <div className="app-layout paper-texture">

      {/* ───── نوار بالا — موبایل ───── */}
      <header className="app-topbar">
        <div className="app-brand">بازی‌گردان</div>
        <div className="app-topbar-actions">
          <Link to="/profile" className="app-avatar" aria-label="پروفایل">
            {initial}
          </Link>
        </div>
      </header>

      {/* ───── نوار کناری — دسکتاپ ───── */}
      <nav className="app-sidenav">
        <div className="app-host-info">
          <Link to="/profile" className="app-avatar app-avatar--lg" aria-label="پروفایل">
            {initial}
          </Link>
          <div>
            <div className="app-host-name">{user?.name || user?.username || 'میزبان بازی'}</div>
            <div className="app-host-sub">مدیریت دورهمی</div>
          </div>
        </div>

        <div className="app-nav-links">
          {NAV_ITEMS.map(item => {
            const isActive = item.path === location.pathname;
            const content = (
              <>
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </>
            );
            return item.path ? (
              <Link
                key={item.label}
                to={item.path}
                className={`app-nav-link ${isActive ? 'app-nav-link--active' : ''}`}
              >
                {content}
              </Link>
            ) : (
              <span key={item.label} className="app-nav-link app-nav-link--soon" title="به زودی">
                {content}
              </span>
            );
          })}
        </div>

        <button type="button" className="app-new-game-btn" title="به زودی">
          شروع بازی جدید
        </button>

        <div className="app-logout-wrap">
          <LogoutButton />
        </div>
      </nav>

      {/* ───── نوار پایین — موبایل ───── */}
      <nav className="app-bottomnav">
        <Link
          to="/dashboard"
          className={`app-bottomnav-link ${location.pathname === '/dashboard' ? 'app-bottomnav-link--active' : ''}`}
        >
          <span className="material-symbols-outlined">sports_esports</span>
          بازی‌ها
        </Link>

        <Link
          to="/friends"
          className={`app-bottomnav-link ${location.pathname === '/friends' ? 'app-bottomnav-link--active' : ''}`}
        >
          <span className="material-symbols-outlined">group</span>
          دوستان
        </Link>

        <Link
          to="/profile"
          className={`app-bottomnav-link ${location.pathname === '/profile' ? 'app-bottomnav-link--active' : ''}`}
        >
          <span className="material-symbols-outlined">person</span>
          پروفایل
        </Link>
      </nav>

      <main className="app-content">{children}</main>
    </div>
  );
}