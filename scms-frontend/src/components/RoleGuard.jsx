// src/components/RoleGuard.jsx
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';

function RoleGuard({ children, roles }) {
  const { user } = useSelector((state) => state.auth);

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default RoleGuard;