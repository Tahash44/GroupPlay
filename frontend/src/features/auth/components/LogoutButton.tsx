import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/context/AuthContext';

export default function LogoutButton() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <button onClick={handleLogout}>
      خروج 🚪
    </button>
  );
}