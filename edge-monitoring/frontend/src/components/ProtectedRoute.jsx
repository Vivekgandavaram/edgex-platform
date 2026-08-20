import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';

export default function ProtectedRoute({ children }) {
  const { status } = useAuth();

  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center bg-base text-sm text-muted">Loading EdgeX…</div>;
  }
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  return children;
}
