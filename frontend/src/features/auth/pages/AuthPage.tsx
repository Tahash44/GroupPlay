import {useState, useEffect} from 'react';
import {useParams, useNavigate} from 'react-router-dom';
import toast from 'react-hot-toast';
import {authService} from '../services/authService';
import {useAuth} from '../../../shared/context/AuthContext';
import './AuthPage.css';

/* ── آیکون‌ها (Material Symbols از طریق span) ── */
const Icon = ({name}: { name: string }) => (
    <span className="field-icon material-symbols-outlined" aria-hidden="true">{name}</span>
);

const IconEye = ({off}: { off?: boolean }) => (
    <span className="material-symbols-outlined" aria-hidden="true" style={{fontSize: 20}}>
    {off ? 'visibility_off' : 'visibility'}
  </span>
);

/* ── المان‌های تزئینی پس‌زمینه ── */
const DecoTL = () => (
    <svg className="auth-deco auth-deco--tl" width="100" height="100" viewBox="0 0 100 100" fill="none"
         xmlns="http://www.w3.org/2000/svg">
        <path d="M10,50 Q30,10 50,50 T90,50" stroke="#262626" strokeWidth="2" strokeLinecap="round"
              strokeDasharray="5,5" fill="none"/>
    </svg>
);

const DecoBR = () => (
    <svg className="auth-deco auth-deco--br" width="80" height="80" viewBox="0 0 80 80" fill="none"
         xmlns="http://www.w3.org/2000/svg">
        <circle cx="40" cy="40" r="30" stroke="#a9171e" strokeWidth="3" strokeDasharray="10,5" fill="none"
                style={{transform: 'rotate(-10deg)', transformOrigin: 'center'}}/>
        <circle cx="42" cy="38" r="30" stroke="#262626" strokeWidth="1" fill="none"/>
    </svg>
);

/* ── کمک‌رسان: خطاهای بک‌اند رو به فارسی تبدیل کن ── */
function parseError(err: unknown): Record<string, string> {
    const data = (err as { response?: { data?: Record<string, unknown> } })?.response?.data ?? {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
        out[k] = Array.isArray(v) ? (v[0] as string) : String(v);
    }
    if (out.detail) {
        out.general = out.detail;
        delete out.detail;
    }
    if (!Object.keys(out).length) out.general = 'خطایی رخ داد. دوباره تلاش کنید.';
    return out;
}

/* ── کامپوننت اصلی ── */
export default function AuthPage() {
    const {mode} = useParams<{ mode: string }>();
    const navigate = useNavigate();
    const {setUser, isAuthenticated} = useAuth();

    const isLogin = mode !== 'register';

    const [form, setForm] = useState({username: '', email: '', password: '', name: ''});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [showPass, setShowPass] = useState(false);

    /* اگه از قبل لاگین هست، برو داشبورد */
    useEffect(() => {
        if (isAuthenticated) navigate('/dashboard', {replace: true});
    }, [isAuthenticated, navigate]);

    /* وقتی بین login/register سوئیچ میشه، فرم رو پاک کن */
    useEffect(() => {
        setForm({username: '', email: '', password: '', name: ''});
        setErrors({});
        setShowPass(false);
    }, [isLogin]);

    const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
        const value =
            field === 'username'
                ? e.target.value.replace(/\s+/g, ' ')
                : e.target.value;

        setForm(f => ({
            ...f,
            [field]: value,
        }));
        setErrors(er => {
            const n = {...er};
            delete n[field];
            delete n.general;
            return n;
        });
    };

    const validate = () => {
        const e: Record<string, string> = {};

        // Username
        if (!form.username.trim()) {
            e.username = 'نام کاربری الزامیه';
        } else if (form.username.trim().length < 3) {
            e.username = 'نام کاربری باید حداقل ۳ کاراکتر باشد';
        } else if (form.username.trim().length > 30) {
            e.username = 'نام کاربری نباید بیشتر از ۳۰ کاراکتر باشد';
        } else if (!/^[a-zA-Z0-9_]+$/.test(form.username.trim())) {
            e.username = 'نام کاربری فقط می‌تواند شامل حروف، اعداد و _ باشد';
        }

        // Password
        if (!form.password) {
            e.password = 'رمز عبور الزامیه';
        } else if (form.password.length < 8) {
            e.password = 'رمز عبور باید حداقل ۸ کاراکتر باشد';
        }

        // Register Only
        if (!isLogin) {
            if (!form.email.trim()) {
                e.email = 'ایمیل الزامیه';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
                e.email = 'ایمیل معتبر نیست';
            }

            if (form.name.trim().length > 50) {
                e.name = 'نام نمایشی نباید بیشتر از ۵۰ کاراکتر باشد';
            }
        }

        return e;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) {
            setErrors(errs);
            return;
        }

        setLoading(true);

        const username = form.username.trim();
        const email = form.email.trim();
        const name = form.name.trim();

        try {
            let tokens;
            if (isLogin) {
                tokens = await authService.login({
                    username,
                    password: form.password,
                });
            } else {
                tokens = await authService.register({
                    username,
                    email,
                    password: form.password,
                    name: name || undefined,
                });
            }
            authService.saveTokens(tokens);
            const user = await authService.getProfile();
            setUser(user);
            toast.success(isLogin ? `خوش اومدی ${user.name || user.username}! 🎮` : 'حساب ساخته شد! 🎉');
            navigate('/dashboard', {replace: true});
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

            {/* ─── تزئینات پس‌زمینه ─── */}
            <DecoTL/>
            <DecoBR/>


            {/* ─── کارت فرم ─── */}
            <div className="auth-card">


                <h2 className="auth-title">بازی‌گردان</h2>
                <p className="auth-sub">ورود به دنیای بازی‌ها!</p>

                {/* خطای کلی */}
                {errors.general && (
                    <div className="auth-error-banner" role="alert">
                        ⚠️ {errors.general}
                    </div>
                )}

                <form onSubmit={handleSubmit} noValidate>

                    {/* نام کاربری */}
                    <div className="field">
                        <label className="field-label" htmlFor="username">نام کاربری</label>
                        <div className={`field-wrap ${errors.username ? 'field-wrap--err' : ''}`}>
                            <Icon name="alternate_email"/>
                            <input
                                id="username"
                                className="field-input"
                                type="text"
                                placeholder={isLogin ? 'نام کاربریت چیه؟' : 'یه نام مستعار جدید بساز'}
                                autoComplete="username"
                                value={form.username}
                                onChange={update('username')}
                                dir="rtl"
                            />
                        </div>
                        {errors.username && <p className="field-err">{errors.username}</p>}
                    </div>

                    {/* ایمیل — فقط ثبت‌نام */}
                    {!isLogin && (
                        <div className="field">
                            <label className="field-label" htmlFor="email">ایمیل</label>
                            <div className={`field-wrap ${errors.email ? 'field-wrap--err' : ''}`}>
                                <Icon name="mail"/>
                                <input
                                    id="email"
                                    className="field-input"
                                    type="email"
                                    placeholder="ایمیلت رو وارد کن"
                                    autoComplete="email"
                                    value={form.email}
                                    onChange={update('email')}
                                    dir="rtl"
                                />
                            </div>
                            {errors.email && <p className="field-err">{errors.email}</p>}
                        </div>
                    )}

                    {/* نام نمایشی — فقط ثبت‌نام */}
                    {!isLogin && (
                        <div className="field">
                            <label className="field-label" htmlFor="displayname">
                                نام نمایشی <span className="optional">(اختیاری)</span>
                            </label>
                            <div className="field-wrap">
                                <Icon name="person"/>
                                <input
                                    id="displayname"
                                    className="field-input"
                                    type="text"
                                    placeholder="مثلاً علی"
                                    value={form.name}
                                    onChange={update('name')}
                                />
                            </div>
                            {errors.name && <p className="field-err">{errors.name}</p>}
                        </div>
                    )}

                    {/* رمز عبور */}
                    <div className="field">
                        <label className="field-label" htmlFor="password">رمز عبور</label>
                        <div className={`field-wrap ${errors.password ? 'field-wrap--err' : ''}`}>
                            <Icon name="lock"/>
                            <input
                                id="password"
                                className="field-input"
                                type={showPass ? 'text' : 'password'}
                                placeholder={isLogin ? 'رمز عبورت چیه؟' : 'حداقل ۸ کاراکتر، هر چی سخت‌تر بهتر'}
                                autoComplete={isLogin ? 'current-password' : 'new-password'}
                                value={form.password}
                                onChange={update('password')}
                                dir="rtl"
                            />
                            <button
                                type="button"
                                className="field-eye"
                                onClick={() => setShowPass(v => !v)}
                                tabIndex={-1}
                                aria-label={showPass ? 'مخفی کردن رمز' : 'نمایش رمز'}
                            >
                                <IconEye off={showPass}/>
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
                            ? <span className="spinner" aria-label="در حال بارگذاری"/>
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