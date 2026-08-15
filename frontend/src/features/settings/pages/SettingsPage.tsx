import { useState } from 'react';
import { PageHeader } from '../../../shared/components/ui';
import { useTheme, type ThemeMode } from '../../../shared/context/ThemeContext';
import { getAudioSettings, saveAudioSettings } from '../audioSettings';
import './SettingsPage.css';

const THEME_OPTIONS = [
  'حالت روشن',
  'حالت تیره',
  'استفاده از حالت دستگاه',
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [audioSettings, setAudioSettings] = useState(getAudioSettings);

  const updateAudio = (patch: Partial<typeof audioSettings>) => {
    const next = { ...audioSettings, ...patch };
    setAudioSettings(next);
    saveAudioSettings(next);
  };

  return (
    <div className="settings-page" aria-label="تنظیمات">
      <PageHeader title="تنظیمات" subtitle="برنامه را مطابق سلیقهٔ خودت تنظیم کن" />

      <section className="settings-section" aria-labelledby="settings-preferences-title">
        <h2 id="settings-preferences-title" className="settings-section__title">تنظیمات برنامه</h2>
        <div className="settings-card">
          <button type="button" className="settings-option" aria-pressed={audioSettings.muted} onClick={() => updateAudio({ muted: !audioSettings.muted })}>
            <span>صدا</span>
            <span className="settings-option__state">{audioSettings.muted ? 'خاموش' : 'روشن'}</span>
            <span className={`settings-option__switch${audioSettings.muted ? '' : ' settings-option__switch--on'}`} aria-hidden="true" />
          </button>
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
