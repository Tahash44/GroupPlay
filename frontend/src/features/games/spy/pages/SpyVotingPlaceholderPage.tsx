import { useParams, useNavigate } from 'react-router-dom';
import './SpyVotingPlaceholderPage.css';

export default function SpyVotingPlaceholderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <div className="spy-vote-placeholder">
      <span className="material-symbols-outlined spy-vote-placeholder-icon" aria-hidden="true">
        how_to_reg
      </span>
      <h1>رأی‌گیری 🗳️</h1>
      <p>شماره‌ی بازی: {id}</p>
      <p className="spy-vote-placeholder-note">
        صفحه‌ی رأی‌گیری و حدس مکان به‌زودی اضافه می‌شه.
      </p>
      <button type="button" onClick={() => navigate('/dashboard')}>
        برگشت به داشبورد
      </button>
    </div>
  );
}