// Auth removed — redirect straight to dashboard
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function LoginPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/dashboard', { replace: true }); }, [navigate]);
  return null;
}
