import { type ReactNode, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  { label: 'دوستان', icon: 'group', path: null },
  { label: 'تنظیمات بازی', icon: 'sports_esports', path: null },
  { label: 'تاریخچه', icon: 'history', path: null },
];

function UserMenu({
  name,
  username,
  onNavigate,
}: {
  name?: string;
  username?: string;
  onNavigate: (path: string) => void;
}) {
  return (
    <div className="app-user-menu">
      <div className="app-user-menu-header">
        <div className="app-user-menu-name">{name || username || 'کاربر'}</div>
      </div>
      <div className="app-user-menu-divider" />

      {/* پروفایل — فعال */}
      <button
        type="button"
        className="app-user-menu-item"
        onClick={() => onNavigate('/profile')}
      >
        <span className="material-symbols-outlined">person</span>
        پروفایل
      </button>

      {/* تنظیمات — به زودی */}
      <span className="app-user-menu-item app-user-menu-item--soon">
        <span className="material-symbols-outlined">settings</span>
        تنظیمات
      </span>

      {/* اعلان‌ها — به زودی */}
      <span className="app-user-menu-item app-user-menu-item--soon">
        <span className="material-symbols-outlined">notifications</span>
        اعلان‌ها
      </span>

      <div className="app-user-menu-divider" />
      <div className="app-user-menu-logout">
        <LogoutButton />
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);

  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

  const initial = (user?.name || user?.username || '؟').charAt(0);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
      if (desktopMenuRef.current && !desktopMenuRef.current.contains(e.target as Node)) {
        setDesktopMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleMenuNavigate(path: string) {
    setMobileMenuOpen(false);
    setDesktopMenuOpen(false);
    navigate(path);
  }

  return (
    <div className="app-layout paper-texture">

      {/* ───── نوار بالا — موبایل ───── */}
      <header className="app-topbar">
        <div className="app-brand">بازی‌گردان</div>
        <div className="app-topbar-actions">
          <div className="app-avatar-wrapper app-avatar-wrapper--mobile" ref={mobileMenuRef}>
            <button
              type="button"
              className="app-avatar"
              aria-label="منوی کاربر"
              onClick={() => setMobileMenuOpen(prev => !prev)}
            >
              {initial}
            </button>
            {mobileMenuOpen && (
              <UserMenu
                name={user?.name}
                username={user?.username}
                onNavigate={handleMenuNavigate}
              />
            )}
          </div>
        </div>
      </header>

      {/* ───── نوار کناری — دسکتاپ ───── */}
      <nav className="app-sidenav">
        <div className="app-host-info" ref={desktopMenuRef}>
          <div className="app-avatar-wrapper app-avatar-wrapper--desktop">
            <button
              type="button"
              className="app-avatar app-avatar--lg"
              aria-label="منوی کاربر"
              onClick={() => setDesktopMenuOpen(prev => !prev)}
            >
              {initial}
            </button>
            {desktopMenuOpen && (
              <UserMenu
                name={user?.name}
                username={user?.username}
                onNavigate={handleMenuNavigate}
              />
            )}
          </div>
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

        <span className="app-bottomnav-link app-bottomnav-link--soon">
          <span className="material-symbols-outlined">group</span>
          دوستان
        </span>

        {/* پروفایل — فعال */}
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