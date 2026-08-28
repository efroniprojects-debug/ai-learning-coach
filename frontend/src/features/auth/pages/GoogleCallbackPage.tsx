import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '@/services/auth.store';

export function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleGoogleCallback, error } = useAuthStore();
  // Guard against React 18 StrictMode double-invocation and component remounts
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      console.error('Google OAuth error:', errorParam);
      navigate('/login', { replace: true });
      return;
    }

    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    const processCallback = async () => {
      try {
        await handleGoogleCallback(code);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Callback processing error:', err);
        navigate('/login', { replace: true });
      }
    };

    processCallback();
  }, [searchParams, navigate, handleGoogleCallback]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-gray-600">Logging you in...</p>
        {error && <p className="mt-2 text-red-600">{error}</p>}
      </div>
    </div>
  );
}
