import { useState } from 'react';
import { PageHeader } from '../../../shared/components/ui';
import Icon from '../../../shared/components/Icon/Icon';
import './HelpPage.css';

const GUIDE_ITEMS = [
  { icon: 'dashboard', title: 'شروع یک بازی جدید', text: 'از صفحهٔ بازی‌ها، کارت بازی موردنظر را انتخاب کن و مراحل آماده‌سازی را ادامه بده.' },
  { icon: 'person_add', title: 'اضافه کردن بازیکن‌ها', text: 'نام بازیکن‌ها را وارد کن تا همه برای شروع دورهمی آماده باشند.' },
  { icon: 'history', title: 'مشاهدهٔ تاریخچه', text: 'نتیجهٔ بازی‌های تمام‌شده را از بخش تاریخچه مرور کن.' },
];

const FAQ_ITEMS = [
  { question: 'چرا بازی شروع نمی‌شود؟', answer: 'اطمینان پیدا کن که تعداد بازیکن‌ها کامل شده و همهٔ اطلاعات لازم وارد شده است.' },
  { question: 'چرا نام دوست ذخیره نمی‌شود؟', answer: 'نام دوست نباید خالی یا تکراری باشد. در صورت ادامهٔ مشکل، دوباره صفحه را باز کن.' },
  { question: 'اطلاعات بازی‌ها کجا ذخیره می‌شوند؟', answer: 'بازی‌های تمام‌شده در بخش تاریخچهٔ حساب کاربری نمایش داده می‌شوند.' },
  { question: 'آیا امکان تغییر مدت بازی وجود دارد؟', answer: 'این قابلیت در حال آماده‌سازی است و در نسخهٔ بعدی به تنظیمات بازی اضافه می‌شود.' },
];

export default function HelpPage() {
  const [openGuide, setOpenGuide] = useState<string | null>(null);

  return (
    <div className="help-page" aria-label="راهنما و پشتیبانی">
      <PageHeader title="راهنما و پشتیبانی" subtitle="پاسخ پرسش‌های رایج و راهنمای شروع بازی" />

      <section className="help-section" aria-labelledby="help-guide-title">
        <h2 id="help-guide-title" className="help-section__title">راهنمای شروع</h2>
        <div className="help-guide-grid">
          {GUIDE_ITEMS.map((item, index) => (
            <div
              key={item.title}
              className="help-guide-card"
            >
              <button
                type="button"
                className="help-guide-card__trigger"
                aria-expanded={openGuide === item.title}
                aria-controls={`help-guide-${index}`}
                onClick={() => setOpenGuide(current => current === item.title ? null : item.title)}
              >
                <span className="help-guide-card__icon"><Icon name={item.icon} size={22} /></span>
                <span className="help-guide-card__title">{item.title}</span>
                <Icon name="chevron_left" size={18} className={`help-guide-card__chevron${openGuide === item.title ? ' help-guide-card__chevron--open' : ''}`} />
              </button>
              {openGuide === item.title && <p id={`help-guide-${index}`}>{item.text}</p>}
            </div>
          ))}
        </div>
      </section>

      <section className="help-section" aria-labelledby="help-faq-title">
        <h2 id="help-faq-title" className="help-section__title">پرسش‌های متداول</h2>
        <div className="help-faq-card">
          {FAQ_ITEMS.map(item => (
            <details key={item.question} className="help-faq-item">
              <summary>
                <span>{item.question}</span>
                <Icon name="chevron_left" size={18} />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="help-support-card" aria-labelledby="help-support-title">
        <span className="help-support-card__icon"><Icon name="help" size={26} /></span>
        <div>
          <h2 id="help-support-title">پشتیبانی</h2>
          <p>اگر پاسخ پرسشت را پیدا نکردی، بخش پشتیبانی در نسخهٔ بعدی برای ثبت مشکل و پیشنهاد در دسترس خواهد بود.</p>
        </div>
      </section>
    </div>
  );
}
