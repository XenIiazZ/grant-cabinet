import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { toast } from 'sonner';

interface ProtectedRouteProps {
  children: ReactNode;
  isAllowed: boolean;
  redirectPath?: string;
  requiredRole?: 'user' | 'admin' | 'expert';
  userRole?: string;
  message?: string;
}

export const ProtectedRoute = ({
  children,
  isAllowed,
  redirectPath = '/',
  requiredRole,
  userRole,
  message = 'У вас нет прав для доступа к этой странице'
}: ProtectedRouteProps) => {
  if (!isAllowed) {
    toast.error(message);
    return <Navigate to={redirectPath} replace />;
  }
  if (requiredRole && userRole !== requiredRole && userRole !== 'admin') {
    toast.error(`Недостаточно прав. Требуется роль: ${requiredRole}`);
    return <Navigate to="/unauthorized" replace />;
  }
  return <>{children}</>;
};