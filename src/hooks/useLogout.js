import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { logoutRequest } from "../api/auth.service";
import { useAuthStore } from "../store/auth.store";

export function useLogout() {
  const { logout, usuario } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Registrar en auditoría del backend (best-effort)
      await logoutRequest();
    } catch {
      // Si falla la petición igual cerramos la sesión local
    } finally {
      logout();
      toast.success("Sesión cerrada");
      navigate("/login", { replace: true });
    }
  };

  return { handleLogout, usuario };
}