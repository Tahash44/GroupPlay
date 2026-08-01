import { useState } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import Icon from '../../../shared/components/Icon/Icon';
import { Button, PageHeader, TextField } from '../../../shared/components/ui';
import { profileService } from '../services/profileService';
import LogoutButton from '../../../features/auth/components/LogoutButton';
import './ProfilePage.css';

function getErrorMessage(error: unknown): string {
  if (typeof error !== 'object' || error === null || !('response' in error)) {
    return 'خطایی رخ داد، دوباره تلاش کنید';
  }
  const response = error.response;
  if (typeof response !== 'object' || response === null || !('data' in response)) {
    return 'خطایی رخ داد، دوباره تلاش کنید';
  }
  const data = response.data;
  if (typeof data !== 'object' || data === null || !('detail' in data)) {
    return 'خطایی رخ داد، دوباره تلاش کنید';
  }
  return typeof data.detail === 'string' ? data.detail : 'خطایی رخ داد، دوباره تلاش کنید';
}

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

  const closePasswordFields = () => {
    setShowPasswordFields(false);
    setOldPassword('');
    setNewPassword('');
    setShowNewPassword(false);
  };

  const handleSave = async () => {
    setError(null);
    setSuccess(null);

    if (showPasswordFields && newPassword && !oldPassword) {
      setError('برای تغییر رمز، رمز فعلی را هم وارد کنید');
      return;
    }

    setSaving(true);
    try {
      const updated = await profileService.updateProfile({
        name: nameValue.trim(),
        username: usernameValue.trim(),
        email: emailValue.trim(),
      });
      setUser(updated);

      if (showPasswordFields && newPassword) {
        await profileService.changePassword({
          old_password: oldPassword,
          new_password: newPassword,
        });
        closePasswordFields();
      }

      setSuccess('تغییرات با موفقیت ذخیره شد');
    } catch (caughtError: unknown) {
      setError(getErrorMessage(caughtError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <PageHeader title="پروفایل" subtitle="اطلاعات حساب و رمز عبور خود را مدیریت کن" />

      <div className="profile-layout">
        <section className="profile-form" aria-label="ویرایش اطلاعات پروفایل">
          <TextField
            label="نام و نام خانوادگی"
            value={nameValue}
            onChange={event => setNameValue(event.target.value)}
            placeholder={'نام خود را وارد کنید' + '...'}
            autoComplete="name"
            icon={<Icon name="person" />}
          />
          <TextField
            label="نام کاربری"
            value={usernameValue}
            onChange={event => setUsernameValue(event.target.value)}
            placeholder={'نام کاربری' + '...'}
            autoComplete="username"
            spellCheck={false}
            icon={<Icon name="alternate_email" />}
          />
          <TextField
            label="ایمیل"
            type="email"
            value={emailValue}
            onChange={event => setEmailValue(event.target.value)}
            placeholder={'ایمیل' + '...'}
            autoComplete="email"
            inputMode="email"
            spellCheck={false}
            icon={<Icon name="mail" />}
          />

          {!showPasswordFields ? (
            <Button variant="ghost" className="profile-password-toggle" onClick={() => setShowPasswordFields(true)}>
              <Icon name="lock" />
              تغییر رمز عبور
            </Button>
          ) : (
            <fieldset className="profile-password-panel">
              <legend>تغییر رمز عبور</legend>
              <TextField
                label="رمز عبور فعلی"
                type="password"
                value={oldPassword}
                onChange={event => setOldPassword(event.target.value)}
                placeholder={'رمز فعلی' + '...'}
                autoComplete="current-password"
                icon={<Icon name="lock" />}
              />
              <TextField
                label="رمز عبور جدید"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={event => setNewPassword(event.target.value)}
                placeholder={'رمز جدید' + '...'}
                autoComplete="new-password"
                icon={<Icon name="lock" />}
                endAdornment={(
                  <button
                    type="button"
                    className="profile-password-visibility"
                    onClick={() => setShowNewPassword(value => !value)}
                    aria-label={showNewPassword ? 'پنهان کردن رمز جدید' : 'نمایش رمز جدید'}
                  >
                    <Icon name={showNewPassword ? 'visibility_off' : 'visibility'} />
                  </button>
                )}
              />
              <Button variant="ghost" onClick={closePasswordFields}>انصراف از تغییر رمز</Button>
            </fieldset>
          )}

          <div className="profile-feedback" aria-live="polite">
            {error && <p className="profile-message profile-message--error">{error}</p>}
            {success && <p className="profile-message profile-message--success">{success}</p>}
          </div>

          <div className="profile-actions">
            <Button block loading={saving} onClick={handleSave} icon={<Icon name="save" />}>
              {saving ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
            </Button>
            <div className="profile-logout-wrap"><LogoutButton /></div>
          </div>
        </section>
      </div>
    </div>
  );
}
