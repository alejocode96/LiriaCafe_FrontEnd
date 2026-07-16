import api from "./client";

/** POST /auth/login */
export const loginRequest = (identificador, contrasena) =>
  api.post("/auth/login", { identificador, contrasena });

/** POST /auth/refresh */
export const refreshTokenRequest = (refreshToken) =>
  api.post("/auth/refresh", { refreshToken });

/** POST /auth/logout  */
export const logoutRequest = () => api.post("/auth/logout");

/** POST /auth/change-password — cambio obligatorio o voluntario */
export const changePasswordRequest = (data) =>
  api.post("/auth/change-password", data);

/** POST /auth/forgot-password — solicitud de recuperación */
export const forgotPasswordRequest = (correo) =>
  api.post("/auth/forgot-password", { correo });

/** POST /auth/reset_password — restablecer con token */
export const resetPasswordRequest = (data) =>
  api.post("/auth/reset_password", data);