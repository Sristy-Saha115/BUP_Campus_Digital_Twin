import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';

// Wrap a page so only the listed roles can open it. The backend enforces the same rule.
export default function ProtectedRoute({ roles, children }) {
  const { user, ready } = useAuth();

  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!roles.includes(user.role)) return <Navigate to="/" replace />;

  return children;
}
