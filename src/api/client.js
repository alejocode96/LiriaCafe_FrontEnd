import axios from "axios";
import { useAuthStore } from "../store/auth.store";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api/v1";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request: adjunta el access token ──────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response: maneja 401 → refresca token automáticamente ─────────────────
let isRefreshing = false;
let refreshQueue = []; // peticiones en espera mientras se refresca

const processQueue = (error, token = null) => {
  refreshQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  refreshQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Si no es 401 o ya reintentamos → propagar
    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(normalizeError(error));
    }

    // Evitar bucle en la propia ruta de refresh
    if (original.url?.includes("/auth/refresh") || original.url?.includes("/auth/login")) {
      forceLogout();
      return Promise.reject(normalizeError(error));
    }

    // Endpoints que devuelven 401 por lógica de negocio (contraseña incorrecta, token inválido),
    // no por token de sesión expirado → propagar sin intentar refresh ni hacer logout.
    const BUSINESS_401_URLS = ["/auth/change-password", "/auth/reset_password", "/auth/forgot-password"];
    if (BUSINESS_401_URLS.some((u) => original.url?.includes(u))) {
      return Promise.reject(normalizeError(error));
    }

    if (isRefreshing) {
      // Encolar mientras se refresca
      return new Promise((resolve, reject) => {
        refreshQueue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) throw new Error("Sin refresh token");

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken,
      });

      const newToken = data.data?.accessToken ?? data.accessToken;
      const newRefresh = data.data?.refreshToken ?? data.refreshToken;

      // Actualizar tokens en localStorage y en el store de Zustand
      useAuthStore.getState().setAccessToken(newToken);
      if (newRefresh) localStorage.setItem("refresh_token", newRefresh);
      api.defaults.headers.common.Authorization = `Bearer ${newToken}`;

      processQueue(null, newToken);
      original.headers.Authorization = `Bearer ${newToken}`;
      return api(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      forceLogout();
      return Promise.reject(normalizeError(refreshError));
    } finally {
      isRefreshing = false;
    }
  }
);

// ── Helpers ────────────────────────────────────────────────────────────────
function normalizeError(error) {
  const serverMsg =
    error.response?.data?.message ||
    error.response?.data?.error ||
    error.message;
  const code = error.response?.data?.code ?? null;
  const status = error.response?.status ?? null;

  const normalized = new Error(serverMsg ?? "Error de red");
  normalized.code = code;
  normalized.status = status;
  normalized.original = error;
  return normalized;
}

function forceLogout() {
  // Limpia tokens Y el estado persistido de Zustand (pos-auth en localStorage)
  try { useAuthStore.getState().logout(); } catch (_) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
  if (!window.location.pathname.includes("/login")) {
    window.location.href = "/login";
  }
}

export default api;