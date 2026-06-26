import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Estado de autenticación global.
 *
 * Persiste en localStorage:
 *   - access_token  (clave separada para el interceptor de axios)
 *   - refresh_token
 *   - usuario
 *
 * El interceptor de axios lee directamente de localStorage
 * ("access_token") para evitar dependencia circular con el store.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      usuario: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      /** Llamado tras login exitoso con la respuesta del backend */
      login: (data) => {
        const { accessToken, refreshToken, usuario } = data;

        // El interceptor de axios lee de aquí
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);

        set({
          usuario,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      /** Actualiza solo el access token (después de refresh) */
      setAccessToken: (token) => {
        localStorage.setItem("access_token", token);
        set({ accessToken: token });
      },

      /** Cierra sesión y limpia todo */
      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        set({
          usuario: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "pos-auth",
      // Solo persistimos lo esencial; los tokens también van a localStorage
      // directamente para el interceptor
      partialize: (state) => ({
        usuario: state.usuario,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);