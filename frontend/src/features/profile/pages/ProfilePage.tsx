import { useState } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { profileService } from '../services/profileService';
import LogoutButton from '../../../features/auth/components/LogoutButton';
import './ProfilePage.css';

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  const [nameValue, setNameValue] = useState(user?.name || '');
  const [usernameValue, setUsernameValue] = useState(user?.username || '');
  const [emailValue, setEmailValue] = useState(user?.email || '');

  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const initial = (user?.name || user?.username || '؟').charAt(0).toUpperCase();

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const updated = await profileService.updateProfile({
        name: nameValue,
        username: usernameValue,
        email: emailValue,
      });
      setUser(updated);

      if (showPasswordFields && newPassword) {
        if (!oldPassword) {
          setError('برای تغییر رمز، رمز فعلی را هم وارد کنید');
          setSaving(false);
          return;
        }
        await profileService.changePassword({
          old_password: oldPassword,
          new_password: newPassword,
        });
        setOldPassword('');
        setNewPassword('');
        setShowPasswordFields(false);
      }

      setSuccess('تغییرات با موفقیت ذخیره شد');
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
        'خطایی رخ داد، دوباره تلاش کنید'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">

      {/* ── آواتار ── */}
      <div className="profile-avatar-section">
        <div className="profile-avatar-frame">
          <div className="profile-avatar">{initial}</div>
        </div>
        <p className="profile-avatar-hint">تغییر تصویر نمایه به‌زودی</p>
      </div>

      {/* ── فیلدها ── */}
      <div className="profile-fields">

        <div className="profile-field">
          <label className="profile-field-label">نام و نام خانوادگی</label>
          <div className="profile-field-input-wrap">
            <span className="material-symbols-outlined profile-field-icon">person</span>
            <input
              className="profile-field-input"
              value={nameValue}
              onChange={e => setNameValue(e.target.value)}
              placeholder="نام خود را وارد کنید..."
            />
          </div>
        </div>

        <div className="profile-field">
          <label className="profile-field-label">نام کاربری</label>
          <div className="profile-field-input-wrap">
            <span className="material-symbols-outlined profile-field-icon">alternate_email</span>
            <input
              className="profile-field-input"
              value={usernameValue}
              onChange={e => setUsernameValue(e.target.value)}
              placeholder="نام کاربری..."
            />
          </div>
        </div>

        <div className="profile-field">
          <label className="profile-field-label">ایمیل</label>
          <div className="profile-field-input-wrap">
            <span className="material-symbols-outlined profile-field-icon">mail</span>
            <input
              className="profile-field-input"
              type="email"
              value={emailValue}
              onChange={e => setEmailValue(e.target.value)}
              placeholder="ایمیل..."
            />
          </div>
        </div>

        {!showPasswordFields ? (
          <button
            type="button"
            className="profile-change-password-link"
            onClick={() => setShowPasswordFields(true)}
          >
            <span className="material-symbols-outlined">lock</span>
            تغییر رمز عبور
          </button>
        ) : (
          <>
            <div className="profile-field">
              <label className="profile-field-label">رمز عبور فعلی</label>
              <div className="profile-field-input-wrap">
                <span className="material-symbols-outlined profile-field-icon">lock</span>
                <input
                  className="profile-field-input"
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="رمز فعلی..."
                />
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-field-label">رمز عبور جدید</label>
              <div className="profile-field-input-wrap">
                <span className="material-symbols-outlined profile-field-icon">lock</span>
                <input
                  className="profile-field-input"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="رمز جدید..."
                />
                <button
                  type="button"
                  className="profile-field-toggle-visibility"
                  onClick={() => setShowNewPassword(v => !v)}
                >
                  <span className="material-symbols-outlined">
                    {showNewPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {error && <p className="profile-message profile-message--error">{error}</p>}
      {success && <p className="profile-message profile-message--success">{success}</p>}

      {/* ── دکمه‌های اقدام ── */}
      <div className="profile-actions">
        <button
          type="button"
          className="profile-save-btn"
          onClick={handleSave}
          disabled={saving}
        >
          <span className="material-symbols-outlined">save</span>
          <span>{saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}</span>
        </button>

        <div className="profile-logout-wrap">
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}