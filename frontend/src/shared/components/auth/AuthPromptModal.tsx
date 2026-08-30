import { useLocation, useNavigate } from 'react-router-dom';
import { Button, Dialog } from '../ui';
import './AuthPromptModal.css';

export type AuthPromptVariant = 'pre-game' | 'post-result';

export default function AuthPromptModal({ variant, onClose }: { variant: AuthPromptVariant; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const preGame = variant === 'pre-game';
  const goToAuth = (mode: 'login' | 'register') => {
    navigate(`/auth/${mode}`, { state: { returnTo: `${location.pathname}${location.search}` } });
  };

  return (
    <Dialog
      title={preGame ? 'برای شروع آماده‌ای؟' : 'بازی‌ات تمام شد'}
      description={preGame ? 'با ساختن حساب، دوستانت را برای بازی‌های بعدی نگه می‌داری.' : 'با ساختن حساب، مدیریت بازی‌های بعدی و دوستانت راحت‌تر می‌شود.'}
      onClose={onClose}
      closeOnBackdrop={false}
      actions={
        <>
          <Button variant="secondary" onClick={() => goToAuth('login')}>ورود</Button>
          <Button onClick={() => goToAuth('register')}>ثبت‌نام</Button>
        </>
      }
    >
      <button type="button" className="auth-prompt-close" onClick={onClose} aria-label="بستن">×</button>
    </Dialog>
  );
}
