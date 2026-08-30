// Auth removed
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/dashboard', { replace: true }); }, [navigate]);
  return null;
}
