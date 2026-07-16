import { useParams, useNavigate } from 'react-router-dom';
import './SpyRoleRevealPage.css';

export default function SpyRoleRevealPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="spy-reveal-placeholder">
      <span className="material-symbols-outlined spy-reveal-placeholder-icon" aria-hidden="true">
        visibility
      </span>
      <h1>بازی با موفقیت ساخته شد 🎉</h1>
      <p>شماره‌ی بازی: {id}</p>
      <p className="spy-reveal-placeholder-note">صفحه‌ی نمایش نقش‌ها به‌زودی اضافه می‌شه.</p>
      <button type="button" onClick={() => navigate('/dashboard')}>
        برگشت به داشبورد
      </button>
    </div>
  );
}