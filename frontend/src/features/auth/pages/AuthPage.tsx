import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService } from '../services/authService';
import { useAuth } from '../../../shared/context/AuthContext';
import './AuthPage.css';

/* ── آیکون‌ها (SVG داخلی، بدون نیاز به پکیج اضافه) ── */
const IconUser = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);
const IconMail = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
  </svg>
);
const IconLock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
const IconEye = ({ off }: { off?: boolean }) => off ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconName = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
  </svg>
);

/* ── کمک‌رسان: خطاهای بک‌اند رو تبدیل به فارسی کن ── */
function parseError(err: unknown): Record<string, string> {
  const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data ?? {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(data)) {
    out[k] = Array.isArray(v) ? (v[0] as string) : String(v);
  }
  if (!Object.keys(out).length) out.general = 'خطایی رخ داد. دوباره تلاش کنید.';
  return out;
}

/* ── کامپوننت اصلی ── */
export default function AuthPage() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useAuth();

  const isLogin = mode !== 'register';

  const [form, setForm] = useState({ username: '', email: '', password: '', name: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  /* اگه از قبل لاگین هست، برو داشبورد */
  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  /* وقتی بین login/register سوئیچ میشه، فرم رو پاک کن */
  useEffect(() => {
    setForm({ username: '', email: '', password: '', name: '' });
    setErrors({});
    setShowPass(false);
  }, [isLogin]);

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => { const n = { ...er }; delete n[field]; delete n.general; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = 'نام کاربری الزامیه';
    if (!form.password) e.password = 'رمز عبور الزامیه';
    if (!isLogin) {
      if (!form.email.trim()) e.email = 'ایمیل الزامیه';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'ایمیل معتبر نیست';
      if (form.password && form.password.length < 8) e.password = 'رمز عبور حداقل ۸ کاراکتر باشه';
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    try {
      let tokens;
      if (isLogin) {
        tokens = await authService.login({ username: form.username, password: form.password });
      } else {
        tokens = await authService.register({
          username: form.username,
          email: form.email,
          password: form.password,
          name: form.name || undefined,
        });
      }
      authService.saveTokens(tokens);
      const user = await authService.getProfile();
      setUser(user);
      toast.success(isLogin ? `خوش اومدی ${user.name || user.username}! 🎮` : 'حساب ساخته شد! 🎉');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const parsed = parseError(err);
      setErrors(parsed);
      if (parsed.general) toast.error(parsed.general);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-root">

      {/* ─── بخش بالایی: برند + بازی‌ها ─── */}
      <div className="auth-top">
        <div className="auth-brand">
          <div className="auth-logo-wrap">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="9" fill="#CB78AC"/>
              <circle cx="16" cy="12" r="4.5" fill="white" fillOpacity="0.92"/>
              <path d="M6 26c0-5.523 4.477-10 10-10s10 4.477 10 10" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.92"/>
            </svg>
          </div>
          <span className="auth-brand-name">BaziGardan</span>
        </div>

        <div className="auth-game-chips">
          <span className="chip">🕵️ جاسوس</span>
          <span className="chip">🎭 مافیا</span>
          <span className="chip">🎪 پانتومیم</span>
        </div>

        <p className="auth-tagline">گرداننده هوشمند بازی‌های گروهی حضوری</p>
      </div>

      {/* ─── کارت فرم ─── */}
      <div className="auth-card">

        {/* تب‌های login / register */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? 'auth-tab--active' : ''}`}
            onClick={() => navigate('/auth/login')}
            type="button"
          >
            ورود
          </button>
          <button
            className={`auth-tab ${!isLogin ? 'auth-tab--active' : ''}`}
            onClick={() => navigate('/auth/register')}
            type="button"
          >
            ثبت‌نام
          </button>
        </div>

        <h2 className="auth-title">
          {isLogin ? 'خوش برگشتی 👋' : 'بیا شروع کنیم ✨'}
        </h2>
        <p className="auth-sub">
          {isLogin ? 'وارد حسابت بشو' : 'یه حساب رایگان بساز'}
        </p>

        {/* خطای کلی */}
        {errors.general && (
          <div className="auth-error-banner">
            ⚠️ {errors.general}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* نام کاربری */}
          <div className="field">
            <label className="field-label">نام کاربری</label>
            <div className={`field-wrap ${errors.username ? 'field-wrap--err' : ''}`}>
              <span className="field-icon"><IconUser /></span>
              <input
                className="field-input"
                type="text"
                placeholder="مثلاً: ali_game"
                autoComplete="username"
                value={form.username}
                onChange={update('username')}
                dir="ltr"
              />
            </div>
            {errors.username && <p className="field-err">{errors.username}</p>}
          </div>

          {/* ایمیل — فقط ثبت‌نام */}
          {!isLogin && (
            <div className="field">
              <label className="field-label">ایمیل</label>
              <div className={`field-wrap ${errors.email ? 'field-wrap--err' : ''}`}>
                <span className="field-icon"><IconMail /></span>
                <input
                  className="field-input"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={form.email}
                  onChange={update('email')}
                  dir="ltr"
                />
              </div>
              {errors.email && <p className="field-err">{errors.email}</p>}
            </div>
          )}

          {/* نام نمایشی — فقط ثبت‌نام */}
          {!isLogin && (
            <div className="field">
              <label className="field-label">نام نمایشی <span className="optional">(اختیاری)</span></label>
              <div className={`field-wrap ${errors.name ? 'field-wrap--err' : ''}`}>
                <span className="field-icon"><IconName /></span>
                <input
                  className="field-input"
                  type="text"
                  placeholder="اسمی که بقیه می‌بینن"
                  value={form.name}
                  onChange={update('name')}
                />
              </div>
            </div>
          )}

          {/* رمز عبور */}
          <div className="field">
            <label className="field-label">رمز عبور</label>
            <div className={`field-wrap ${errors.password ? 'field-wrap--err' : ''}`}>
              <span className="field-icon"><IconLock /></span>
              <input
                className="field-input field-input--pass"
                type={showPass ? 'text' : 'password'}
                placeholder={isLogin ? 'رمز عبورت' : 'حداقل ۸ کاراکتر'}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={form.password}
                onChange={update('password')}
                dir="ltr"
              />
              <button
                type="button"
                className="field-eye"
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                <IconEye off={showPass} />
              </button>
            </div>
            {errors.password && <p className="field-err">{errors.password}</p>}
          </div>

          {/* دکمه ارسال */}
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading
              ? <span className="spinner" />
              : (isLogin ? 'ورود به حساب' : 'ساختن حساب')
            }
          </button>

        </form>

        <p className="auth-switch-text">
          {isLogin ? 'هنوز حساب نداری؟' : 'قبلاً ثبت‌نام کردی؟'}
          {' '}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={() => navigate(isLogin ? '/auth/register' : '/auth/login')}
          >
            {isLogin ? 'ثبت‌نام کن' : 'وارد شو'}
          </button>
        </p>

      </div>

      {/* ─── پایین صفحه ─── */}
      <p className="auth-footer">بدون نصب اپ · گروهی · حضوری</p>

    </div>
  );
}
