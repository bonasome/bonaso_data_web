import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/UserAuth';

export default function Logout() {
  const { setLoggedIn, setUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const logout = async () => {
      // Just clear tokens
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      setLoggedIn(false);
      setUser(null);
      navigate('/users/login');
    };
    logout();
  }, []);

  return <p>Logging you out now...</p>;
}