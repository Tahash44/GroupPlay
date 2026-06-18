import { useState } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import './ProfilePage.css';

type Tab = 'info' | 'stats' | 'history';

const MOCK_HISTORY = [
  { id: 1, game: 'مافیا', role: 'میزبان', players: 8, result: 'win', date: '۱۴۰۳/۰۳/۱۲' },
  { id: 2, game: 'اسپای', role: 'بازیکن', players: 6, result: 'lose', date: '۱۴۰۳/۰۳/۰۸' },
  { id: 3, game: 'پانتومیم', role: 'میزبان', players: 10, result: 'win', date: '۱۴۰۳/۰۲/۲۸' },
  { id: 4, game: 'اسم فامیل', role: 'بازیکن', players: 5, result: 'win', date: '۱۴۰۳/۰۲/۲۰' },
  { id: 5, game: 'مافیا', role: 'بازیکن', players: 9, result: 'lose', date: '۱۴۰۳/۰۲/۱۵' },
];

const STATS = [
  { label: 'بازی‌ها', value: '۲۴', icon: 'sports_esports' },
  { label: 'برد', value: '۱۶', icon: 'emoji_events' },
  { label: 'میزبانی', value: '۹', icon: 'supervisor_account' },
  { label: 'دوستان', value: '۱۲', icon: 'group' },
];

export default function ProfilePage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [editMode, setEditMode] = useState(false);
  const [nameValue, setNameValue] = useState(user?.name || '');
  const [emailValue, setEmailValue] = useState(user?.email || '');

  const initial = (user?.name || user?.username || '؟').charAt(0).toUpperCase();
  const winRate = Math.round((16 / 24) * 100);

  return (
    <div className="profile-page">

      {/* ── هدر پروفایل ── */}
      <div className="profile-hero sketch-border sketch-shadow">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar">{initial}</div>
          <div className="profile-avatar-ring" />
        </div>
        <div className="profile-hero-info">
          <h1 className="profile-name">{user?.name || user?.username || 'کاربر'}</h1>
          <span className="profile-username">@{user?.username}</span>
          <span className="profile-badge">
            <span className="material-symbols-outlined">military_tech</span>
            میزبان حرفه‌ای
          </span>
        </div>
      </div>

      {/* ── آمار سریع ── */}
      <div className="profile-stats-row">
        {STATS.map(s => (
          <div key={s.label} className="profile-stat-card sketch-border">
            <span className="material-symbols-outlined profile-stat-icon">{s.icon}</span>
            <span className="profile-stat-value">{s.value}</span>
            <span className="profile-stat-label">{s.label}</span>
          </div>
        ))}
      </div>

      {/* ── تب‌ها ── */}
      <div className="profile-tabs">
        {(['info', 'stats', 'history'] as Tab[]).map(tab => (
          <button
            key={tab}
            type="button"
            className={`profile-tab ${activeTab === tab ? 'profile-tab--active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'info' && 'اطلاعات'}
            {tab === 'stats' && 'عملکرد'}
            {tab === 'history' && 'تاریخچه'}
          </button>
        ))}
      </div>

      {/* ── محتوای تب‌ها ── */}

      {activeTab === 'info' && (
        <div className="profile-panel sketch-border">
          <div className="profile-panel-header">
            <h2 className="profile-panel-title">اطلاعات حساب</h2>
            <button
              type="button"
              className="profile-edit-btn"
              onClick={() => setEditMode(e => !e)}
            >
              <span className="material-symbols-outlined">
                {editMode ? 'close' : 'edit'}
              </span>
              {editMode ? 'انصراف' : 'ویرایش'}
            </button>
          </div>

          <div className="profile-fields">
            <div className="profile-field">
              <label className="profile-field-label">نام نمایشی</label>
              {editMode ? (
                <input
                  className="profile-field-input sketch-border"
                  value={nameValue}
                  onChange={e => setNameValue(e.target.value)}
                  placeholder="نام نمایشی"
                />
              ) : (
                <span className="profile-field-value">{user?.name || '—'}</span>
              )}
            </div>

            <div className="profile-field">
              <label className="profile-field-label">نام کاربری</label>
              <span className="profile-field-value profile-field-value--muted">
                @{user?.username}
              </span>
            </div>

            <div className="profile-field">
              <label className="profile-field-label">ایمیل</label>
              {editMode ? (
                <input
                  className="profile-field-input sketch-border"
                  value={emailValue}
                  onChange={e => setEmailValue(e.target.value)}
                  placeholder="ایمیل"
                  type="email"
                />
              ) : (
                <span className="profile-field-value">{user?.email || '—'}</span>
              )}
            </div>
          </div>

          {editMode && (
            <button type="button" className="profile-save-btn sketch-border sketch-shadow">
              <span className="material-symbols-outlined">check</span>
              ذخیره تغییرات
            </button>
          )}
        </div>
      )}

      {activeTab === 'stats' && (
        <div className="profile-panel sketch-border">
          <h2 className="profile-panel-title">عملکرد کلی</h2>

          {/* نرخ برد */}
          <div className="profile-winrate">
            <div className="profile-winrate-label">
              <span>نرخ برد</span>
              <span className="profile-winrate-value">{winRate}٪</span>
            </div>
            <div className="profile-winrate-bar">
              <div
                className="profile-winrate-fill"
                style={{ width: `${winRate}%` }}
              />
            </div>
          </div>

          {/* بازی محبوب */}
          <div className="profile-fav-game sketch-border">
            <span className="material-symbols-outlined">favorite</span>
            <div>
              <div className="profile-fav-label">بازی محبوب</div>
              <div className="profile-fav-name">مافیا</div>
            </div>
            <span className="profile-fav-count">۸ بار بازی</span>
          </div>

          {/* سری آمار */}
          <div className="profile-stat-grid">
            <div className="profile-stat-item">
              <span className="profile-stat-item-num">۳</span>
              <span className="profile-stat-item-lbl">برد متوالی</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-item-num">۱۰</span>
              <span className="profile-stat-item-lbl">بیشترین بازیکن</span>
            </div>
            <div className="profile-stat-item">
              <span className="profile-stat-item-num">۴۵</span>
              <span className="profile-stat-item-lbl">دقیقه میانگین</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="profile-panel sketch-border">
          <h2 className="profile-panel-title">آخرین بازی‌ها</h2>
          <div className="profile-history-list">
            {MOCK_HISTORY.map(item => (
              <div key={item.id} className={`profile-history-item profile-history-item--${item.result}`}>
                <div className="profile-history-result-dot" />
                <div className="profile-history-main">
                  <span className="profile-history-game">{item.game}</span>
                  <span className="profile-history-meta">
                    {item.role} · {item.players} نفر
                  </span>
                </div>
                <div className="profile-history-right">
                  <span className="profile-history-badge">
                    {item.result === 'win' ? 'برد' : 'باخت'}
                  </span>
                  <span className="profile-history-date">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}