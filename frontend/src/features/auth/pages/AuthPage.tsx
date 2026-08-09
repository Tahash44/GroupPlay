import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authService, resolveAdminUrl } from '../services/authService';
import { useAuth } from '../../../shared/context/AuthContext';
import Icon from '../../../shared/components/Icon/Icon';
import { Button, TextField } from '../../../shared/components/ui';
import './AuthPage.css';

type AuthForm = { username: string; email: string; password: string; name: string };
const EMPTY_FORM: AuthForm = { username: '', email: '', password: '', name: '' };

function parseError(error: unknown): Record<string, string> {
  const data = (error as { response?: { data?: Record<string, unknown> } })?.response?.data ?? {};
  const parsed: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    parsed[key] = Array.isArray(value) ? String(value[0]) : String(value);
  }
  if (parsed.detail) {
    parsed.general = parsed.detail;
    delete parsed.detail;
  }
  if (!Object.keys(parsed).length) parsed.general = 'خطایی رخ داد. دوباره تلاش کنید.';
  return parsed;
}

export default function AuthPage() {
  const { mode } = useParams<{ mode: string }>();
  const navigate = useNavigate();
  const { setUser, isAuthenticated } = useAuth();
  const isLogin = mode !== 'register';

  const [form, setForm] = useState<AuthForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  const update = (field: keyof AuthForm) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = field === 'username' ? event.target.value.replace(/\s+/g, ' ') : event.target.value;
    setForm(current => ({ ...current, [field]: value }));
    setErrors(current => {
      const next = { ...current };
      delete next[field];
      delete next.general;
      return next;
    });
  };

  const validate = () => {
    const next: Record<string, string> = {};
    const username = form.username.trim();
    if (!username) next.username = 'نام کاربری الزامیه';
    else if (username.length < 3) next.username = 'نام کاربری باید حداقل ۳ کاراکتر باشد';
    else if (username.length > 30) next.username = 'نام کاربری نباید بیشتر از ۳۰ کاراکتر باشد';
    else if (!/^[a-zA-Z0-9_]+$/.test(username)) next.username = 'نام کاربری فقط می‌تواند شامل حروف، اعداد و _ باشد';

    if (!form.password) next.password = 'رمز عبور الزامیه';
    else if (form.password.length < 8) next.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد';

    if (!isLogin) {
      if (!form.email.trim()) next.email = 'ایمیل الزامیه';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = 'ایمیل معتبر نیست';
      if (form.name.trim().length > 50) next.name = 'نام نمایشی نباید بیشتر از ۵۰ کاراکتر باشد';
    }
    return next;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors);
      return;
    }

    setLoading(true);
    try {
      const username = form.username.trim();
      const tokens = isLogin
        ? await authService.login({ username, password: form.password })
        : await authService.register({
            username,
            email: form.email.trim(),
            password: form.password,
            name: form.name.trim() || undefined,
          });
      if (isLogin && tokens.admin_url) {
        window.location.href = resolveAdminUrl(tokens.admin_url);
        return;
      }
      authService.saveTokens(tokens);
      const user = await authService.getProfile();
      setUser(user);
      toast.success(isLogin ? `خوش آمدی ${user.name || user.username}` : 'حساب با موفقیت ساخته شد');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      const parsed = parseError(error);
      setErrors(parsed);
      if (parsed.general) toast.error(parsed.general);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setShowPassword(false);
    navigate(isLogin ? '/auth/register' : '/auth/login');
  };

  return (
    <main className="auth-root">
      <section className="auth-intro" aria-labelledby="auth-brand-title">
        <div className="auth-intro__mark" aria-hidden="true"><Icon name="sports_esports" /></div>
        <h1 id="auth-brand-title">بازی‌گردان</h1>
        <p>همه‌چیز برای یک دورهمی روان و به‌یادماندنی</p>
        <ul className="auth-benefits">
          <li><Icon name="check_circle" /> بدون نیاز به نصب</li>
          <li><Icon name="check_circle" /> مناسب بازی حضوری</li>
          <li><Icon name="check_circle" /> مدیریت آسان بازیکنان</li>
        </ul>
      </section>

      <section className="auth-card" aria-labelledby="auth-form-title">
        <div className="auth-mode" aria-label="انتخاب نوع ورود">
          <button type="button" className={isLogin ? 'auth-mode__item auth-mode__item--active' : 'auth-mode__item'} onClick={() => !isLogin && switchMode()} aria-pressed={isLogin}>ورود</button>
          <button type="button" className={!isLogin ? 'auth-mode__item auth-mode__item--active' : 'auth-mode__item'} onClick={() => isLogin && switchMode()} aria-pressed={!isLogin}>ثبت‌نام</button>
        </div>

        <header className="auth-card__header">
          <h2 id="auth-form-title">{isLogin ? 'دوباره خوش آمدی' : 'حساب تازه بساز'}</h2>
          <p>{isLogin ? 'برای ادامه وارد حساب خودت شو' : 'در چند قدم کوتاه به بازی‌ها برس'}</p>
        </header>

        {errors.general && <div className="auth-error-banner" role="alert">{errors.general}</div>}

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="username"
            label="نام کاربری"
            icon={<Icon name="alternate_email" />}
            placeholder={isLogin ? 'نام کاربری خودت را وارد کن' : 'یک نام کاربری تازه بساز'}
            autoComplete="username"
            value={form.username}
            onChange={update('username')}
            error={errors.username}
          />

          {!isLogin && <TextField id="email" label="ایمیل" icon={<Icon name="mail" />} type="email" placeholder="ایمیل خودت را وارد کن" autoComplete="email" value={form.email} onChange={update('email')} error={errors.email} />}

          {!isLogin && <TextField id="displayname" label="نام نمایشی اختیاری" icon={<Icon name="person" />} placeholder="مثلاً علی" value={form.name} onChange={update('name')} error={errors.name} />}

          <TextField
            id="password"
            label="رمز عبور"
            icon={<Icon name="lock" />}
            type={showPassword ? 'text' : 'password'}
            placeholder={isLogin ? 'رمز عبور خودت را وارد کن' : 'حداقل ۸ کاراکتر'}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
            value={form.password}
            onChange={update('password')}
            error={errors.password}
            endAdornment={
              <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(current => !current)} aria-label={showPassword ? 'مخفی کردن رمز' : 'نمایش رمز'}>
                <Icon name={showPassword ? 'visibility_off' : 'visibility'} />
              </button>
            }
          />

          <Button type="submit" size="lg" block loading={loading}>
            {isLogin ? 'ورود به حساب' : 'ساختن حساب'}
          </Button>
        </form>

      </section>

      <p className="auth-footer">گروهی و حضوری و بدون نصب برنامه</p>
    </main>
  );
}
