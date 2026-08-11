import { PageHeader } from '../../../shared/components/ui';
import { useTheme, type ThemeMode } from '../../../shared/context/ThemeContext';
import './SettingsPage.css';

const SETTINGS_OPTIONS = [
  'تنظیم صدا',
  'تنظیم لرزش',
];

const THEME_OPTIONS = [
  'حالت روشن',
  'حالت تیره',
  'استفاده از حالت دستگاه',
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="settings-page" aria-label="تنظیمات">
      <PageHeader title="تنظیمات" subtitle="برنامه را مطابق سلیقهٔ خودت تنظیم کن" />

      <section className="settings-section" aria-labelledby="settings-preferences-title">
        <h2 id="settings-preferences-title" className="settings-section__title">تنظیمات برنامه</h2>
        <div className="settings-card">
          {SETTINGS_OPTIONS.map(option => (
            <button key={option} type="button" className="settings-option" disabled>
              <span>{option}</span>
              <span className="settings-option__switch" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section" aria-labelledby="settings-theme-title">
        <h2 id="settings-theme-title" className="settings-section__title">ظاهر برنامه</h2>
        <div className="settings-card settings-card--theme">
          {THEME_OPTIONS.map((option, index) => {
            const optionTheme: ThemeMode = index === 0 ? 'light' : index === 1 ? 'dark' : 'system';
            return (
            <button key={option} type="button" className={`settings-option settings-option--theme${theme === optionTheme ? ' settings-option--selected' : ''}`} aria-pressed={theme === optionTheme} onClick={() => setTheme(optionTheme)}>
              {option}
            </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
