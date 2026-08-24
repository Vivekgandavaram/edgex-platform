import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { hasPermission } from '../lib/permissions';

export default function ProtectedRoute({ children, permission }) {
  const { status, user } = useAuth();

  if (status === 'loading') {
    return <div className="flex h-screen items-center justify-center bg-base text-sm text-muted">Loading EdgeX…</div>;
  }
  if (status === 'unauthenticated') return <Navigate to="/login" replace />;
  if (permission && !hasPermission(user, permission)) return <Navigate to="/" replace />;
  return children;
}
