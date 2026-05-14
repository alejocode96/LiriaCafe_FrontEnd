// ==========================================================
// CONFIGURACIÓN CENTRALIZADA DE AXIOS
// ==========================================================
//
// Este archivo crea y configura una instancia personalizada
// de Axios para manejar todas las peticiones HTTP del frontend.
//
// Objetivos principales:
// - Centralizar la URL base de la API
// - Configurar tiempos de espera
// - Agregar automáticamente el token JWT
// - Manejar errores globales de autenticación
// - Evitar repetir lógica en cada request
//
// Porque claro, repetir código en 27 archivos distintos
// siempre termina siendo una “excelente” idea... hasta que
// toca mantener el proyecto y todo explota un viernes a las 6 PM.
//
// ==========================================================

import axios from "axios";


// ==========================================================
// CREACIÓN DE LA INSTANCIA AXIOS
// ==========================================================
//
// axios.create() permite generar una instancia independiente
// con configuración propia.
//
// Esto evita tener que escribir:
// - baseURL
// - headers
// - timeout
//
// en cada llamada HTTP.
//
// Ejemplo:
// api.get("/users")
// api.post("/login")
//
// En lugar de:
// axios.get("http://localhost:3000/api/users", {...})
//
// Mucho más limpio y mantenible.
// Una rareza evolutiva en proyectos humanos.
// ==========================================================

const api = axios.create({

  // --------------------------------------------------------
  // URL BASE DE LA API
  // --------------------------------------------------------
  //
  // Se obtiene desde las variables de entorno de Vite.
  //
  // Ejemplo en .env:
  // VITE_API_URL=http://localhost:3000/api
  //
  // import.meta.env es la forma en que Vite expone variables
  // de entorno al frontend.
  //
  // Esto permite:
  // - Cambiar entre desarrollo y producción
  // - Evitar hardcodear URLs
  // - Mantener configuración flexible
  //
  // Ejemplos:
  //
  // Desarrollo:
  // http://localhost:3000/api
  //
  // Producción:
  // https://api.midominio.com/api
  // --------------------------------------------------------

  baseURL: import.meta.env.VITE_API_URL,


  // --------------------------------------------------------
  // TIEMPO MÁXIMO DE ESPERA
  // --------------------------------------------------------
  //
  // timeout: 10000
  //
  // Define el tiempo máximo (en milisegundos)
  // que Axios esperará por una respuesta del servidor.
  //
  // 10000 ms = 10 segundos
  //
  // Si el servidor tarda más:
  // - Axios cancela la petición
  // - Se genera un error de timeout
  //
  // Esto evita:
  // - Requests infinitas
  // - UI congelada
  // - Mala experiencia de usuario
  //
  // Porque quedarse viendo un spinner eterno mientras
  // el backend entra en crisis existencial no es ideal.
  // --------------------------------------------------------

  timeout: 10000,


  // --------------------------------------------------------
  // HEADERS POR DEFECTO
  // --------------------------------------------------------
  //
  // Define encabezados HTTP comunes para todas las requests.
  //
  // Content-Type: application/json
  //
  // Indica que el frontend enviará datos en formato JSON.
  //
  // Esto es necesario especialmente en:
  // - POST
  // - PUT
  // - PATCH
  // --------------------------------------------------------

  headers: {
    "Content-Type": "application/json",
  },
});



// ==========================================================
// INTERCEPTOR DE REQUESTS
// ==========================================================
//
// Los interceptors permiten ejecutar lógica antes
// de enviar una petición.
//
// En este caso:
// - Obtener el token JWT del localStorage
// - Agregarlo automáticamente al header Authorization
//
// Así evitamos hacer esto manualmente en cada request.
//
// ==========================================================

api.interceptors.request.use((config) => {

  // --------------------------------------------------------
  // OBTENER TOKEN DEL LOCALSTORAGE
  // --------------------------------------------------------
  //
  // localStorage guarda información persistente
  // en el navegador.
  //
  // Aquí se almacena el token JWT después del login.
  //
  // Ejemplo:
  // localStorage.setItem("token", jwt)
  // --------------------------------------------------------

  const token = localStorage.getItem("token");


  // --------------------------------------------------------
  // AGREGAR TOKEN A LA REQUEST
  // --------------------------------------------------------
  //
  // Si el token existe:
  // - Se agrega al header Authorization
  //
  // Formato estándar:
  //
  // Authorization: Bearer <token>
  //
  // Ejemplo real:
  //
  // Authorization: Bearer eyJhbGciOiJIUzI1...
  //
  // El backend utilizará este token para:
  // - Validar autenticación
  // - Identificar usuario
  // - Autorizar acceso
  // --------------------------------------------------------

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }


  // --------------------------------------------------------
  // RETORNAR CONFIGURACIÓN
  // --------------------------------------------------------
  //
  // Siempre se debe retornar el config
  // para que la request continúe.
  // --------------------------------------------------------

  return config;
});



// ==========================================================
// INTERCEPTOR DE RESPUESTAS
// ==========================================================
//
// Permite interceptar TODAS las respuestas HTTP.
//
// Tiene dos partes:
//
// 1. Respuesta exitosa
// 2. Manejo de errores
//
// Esto centraliza lógica global de autenticación
// y manejo de errores.
//
// ==========================================================

api.interceptors.response.use(

  // ========================================================
  // RESPUESTAS EXITOSAS
  // ========================================================
  //
  // Axios normalmente retorna:
  //
  // {
  //   data,
  //   status,
  //   headers,
  //   config
  // }
  //
  // Aquí simplificamos retornando únicamente:
  //
  // response.data
  //
  // Esto permite consumir respuestas más limpio:
  //
  // const users = await api.get("/users")
  //
  // En lugar de:
  //
  // const response = await api.get("/users")
  // const users = response.data
  //
  // Pequeñas cosas que salvan cientos de líneas.
  // Milagros mínimos de la ingeniería.
  // ========================================================

  (response) => response.data,


  // ========================================================
  // MANEJO GLOBAL DE ERRORES
  // ========================================================
  //
  // Este bloque captura errores HTTP globalmente.
  //
  // Especialmente útil para:
  // - 401 Unauthorized
  // - 403 Forbidden
  // - 500 Server Error
  //
  // ========================================================

  (error) => {

    // ------------------------------------------------------
    // VALIDAR ERROR 401
    // ------------------------------------------------------
    //
    // 401 = Unauthorized
    //
    // Significa que:
    // - El token expiró
    // - El token es inválido
    // - El usuario no está autenticado
    //
    // En ese caso:
    // - Se elimina el token
    // - Se redirige al login
    //
    // Esto fuerza una nueva autenticación.
    // ------------------------------------------------------

    if (error.response?.status === 401) {

      // Eliminar token inválido
      localStorage.removeItem("token");


      // Redirigir al login
      //
      // window.location.href recarga completamente
      // la aplicación y envía al usuario al login.
      //
      // Ruta:
      // /login
      //
      // Porque cuando el token muere,
      // la sesión humana también.
      // Dramático, pero eficiente.
      //
      window.location.href = "/login";
    }


    // ------------------------------------------------------
    // RETORNAR ERROR NORMALIZADO
    // ------------------------------------------------------
    //
    // Promise.reject() permite que el error
    // siga disponible para el componente
    // que realizó la petición.
    //
    // Se retorna:
    //
    // error.response?.data
    //
    // para obtener únicamente la información útil
    // enviada por el backend.
    //
    // Si no existe response.data,
    // retorna el error completo.
    //
    // Esto facilita mostrar mensajes como:
    // - "Credenciales inválidas"
    // - "Usuario no encontrado"
    // - "Error interno del servidor"
    // ------------------------------------------------------

    return Promise.reject(error.response?.data || error);
  },
);


// ==========================================================
// EXPORTACIÓN DE LA INSTANCIA
// ==========================================================
//
// Permite importar esta configuración en cualquier parte
// del frontend.
//
// Ejemplo:
//
// import api from "@/services/api";
//
// api.get("/users");
// api.post("/login", data);
//
// ==========================================================

export default api;