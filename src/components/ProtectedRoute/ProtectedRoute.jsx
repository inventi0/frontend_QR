import { Navigate, useLocation } from 'react-router-dom';
import { getSession } from '../../utils/session';

/**
 * ProtectedRoute - компонент для защиты маршрутов
 * 
 * Проверяет наличие JWT токена в localStorage.
 * Если токена нет — редиректит на главную страницу.
 * 
 * Использование:
 * <Route 
 *   path="/profile" 
 *   element={
 *     <ProtectedRoute>
 *       <ProfilePage />
 *     </ProtectedRoute>
 *   } 
 * />
 */
export const ProtectedRoute = ({ children }) => {
  const session = getSession();
  const location = useLocation();

  if (!session?.accessToken) {
    // Сохраняем текущий путь для редиректа после логина
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
};
