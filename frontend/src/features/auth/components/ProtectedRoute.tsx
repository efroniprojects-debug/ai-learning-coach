import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/services/auth.store';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, fetchUser } = useAuthStore();
  const fetchedRef = useRef(false);

  const hasToken = !!localStorage.getItem('accessToken');

  useEffect(() => {
    if (hasToken && !isAuthenticated && !isLoading && !fetchedRef.current) {
      fetchedRef.current = true;
      fetchUser();
    }
  }, [hasToken, isAuthenticated, isLoading, fetchUser]);

  // No token at all → go to login immediately
  if (!hasToken) {
    return <Navigate to="/login" replace />;
  }

  // Has token, verifying it (or waiting for fetchUser to start)
  if (isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500 text-sm">טוען...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
