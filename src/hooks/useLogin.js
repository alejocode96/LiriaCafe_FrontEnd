import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { loginRequest } from "../api/auth.service";
import { useAuthStore } from "../store/auth.store";

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

 const handleLogin = async (identificador, contrasena) => {
  setLoading(true);
  try {
    const res = await loginRequest(identificador, contrasena);
    const payload = res.data?.data ?? res.data;
    login(payload);
    toast.success(`Bienvenido, ${payload.usuario?.nombreCompleto ?? payload.usuario?.nombreUsuario ?? "usuario"}`, {
  duration: 5000,
});
    navigate("/", { replace: true });
  } catch (err) {
    const msg = err.message ?? "Credenciales inválidas";
    const code = err.code;

    if (code === "ACCOUNT_LOCKED") {
      toast.error(msg, { duration: 6000, icon: "🔒" });
    } else {
      toast.error(msg);
    }
    throw err; // ← AGREGAR ESTO para que LoginForm pueda marcar campos
  } finally {
    setLoading(false);
  }
};

  return { handleLogin, loading };
}