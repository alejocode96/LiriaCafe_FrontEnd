import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/auth.store";
/**
 * Protege rutas privadas.
 * Si no hay sesión redirige a /login guardando el destino original
 * para redirigir de vuelta tras el login.
 */
export default function ProtectedRoute({ children }) {
    const { isAuthenticated } = useAuthStore();
    const location = useLocation();

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}