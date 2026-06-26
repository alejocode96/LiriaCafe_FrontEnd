import api from "./client";

/** POST /auth/login */
export const loginRequest = (identificador, contrasena) =>
  api.post("/auth/login", { identificador, contrasena });

/** POST /auth/refresh */
export const refreshTokenRequest = (refreshToken) =>
  api.post("/auth/refresh", { refreshToken });

/** POST /auth/logout  */
export const logoutRequest = () => api.post("/auth/logout");