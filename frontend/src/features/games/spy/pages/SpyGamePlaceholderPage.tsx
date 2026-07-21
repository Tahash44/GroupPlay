import { useParams, useNavigate } from 'react-router-dom';
import './SpyGamePlaceholderPage.css';

export default function SpyGamePlaceholderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="spy-play-placeholder">
      <span className="material-symbols-outlined spy-play-placeholder-icon" aria-hidden="true">
        sports_esports
      </span>
      <h1>بازی شروع شد 🎮</h1>
      <p>شماره‌ی بازی: {id}</p>
      <p className="spy-play-placeholder-note">صفحه‌ی گیم‌پلی (تایمر، رأی‌گیری و حدس مکان) به‌زودی اضافه می‌شه.</p>
      <button type="button" onClick={() => navigate('/dashboard')}>
        برگشت به داشبورد
      </button>
    </div>
  );
}
