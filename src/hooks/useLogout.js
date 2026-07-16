import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { logoutRequest } from "../api/auth.service";
import { useAuthStore } from "../store/auth.store";

export function useLogout() {
  const { logout, usuario } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } catch {
      // Si falla la petición igual cerramos la sesión local
    } finally {
      // Limpiar todo el caché de React Query para que el próximo usuario
      // no herede los datos (permisos, rol, listas) del usuario anterior.
      queryClient.clear();
      logout();
      toast.success("Sesión cerrada");
      navigate("/login", { replace: true });
    }
  };

  return { handleLogout, usuario };
}