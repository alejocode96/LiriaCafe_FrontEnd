// ==========================================================
// STORE GLOBAL DE AUTENTICACIÓN CON ZUSTAND
// ==========================================================
//
// Este archivo maneja el estado global de autenticación
// de la aplicación utilizando Zustand.
//
// Funcionalidades principales:
// - Guardar usuario autenticado
// - Guardar token JWT
// - Saber si el usuario inició sesión
// - Persistir sesión incluso al recargar la página
// - Centralizar login y logout
//
// Básicamente:
// el cerebro pequeño pero eficiente del sistema de auth.
//
// Porque depender de props drilling infinito o Context API
// convertido en espagueti emocional era claramente el sueño
// húmedo de muchos proyectos React.
//
// ==========================================================



// ==========================================================
// IMPORTACIONES
// ==========================================================

import { create } from "zustand";


// ----------------------------------------------------------
// persist
// ----------------------------------------------------------
//
// Middleware oficial de Zustand.
//
// Permite guardar automáticamente el estado
// en localStorage.
//
// Gracias a esto:
// - La sesión sobrevive al refrescar el navegador
// - El usuario no debe loguearse constantemente
//
// Milagro moderno:
// el frontend recuerda cosas.
// A diferencia de muchos equipos de desarrollo.
// ----------------------------------------------------------

import { persist } from "zustand/middleware";



// ==========================================================
// CREACIÓN DEL STORE DE AUTENTICACIÓN
// ==========================================================
//
// create() genera un store global reactivo.
//
// El store podrá utilizarse desde cualquier componente:
//
// const { user, login, logout } = useAuthStore();
//
// Sin providers gigantes.
// Sin reducers kilométricos.
// Sin rituales místicos de Redux.
//
// ==========================================================

export const useAuthStore = create(


  // ========================================================
  // MIDDLEWARE PERSIST
  // ========================================================
  //
  // persist() envuelve el store y guarda automáticamente
  // el estado en localStorage.
  //
  // Sintaxis:
  //
  // persist(store, configuración)
  //
  // ========================================================

  persist(


    // ======================================================
    // DEFINICIÓN DEL STORE
    // ======================================================
    //
    // set:
    // función utilizada para actualizar el estado.
    //
    // El store contiene:
    //
    // ESTADO:
    // - user
    // - token
    // - isAuthenticated
    //
    // ACCIONES:
    // - login()
    // - logout()
    //
    // ======================================================

    (set) => ({


      // ====================================================
      // ESTADOS INICIALES
      // ====================================================


      // ----------------------------------------------------
      // user
      // ----------------------------------------------------
      //
      // Información del usuario autenticado.
      //
      // Ejemplo:
      //
      // {
      //   id: 1,
      //   name: "Diego",
      //   role: "admin"
      // }
      //
      // Inicialmente null porque no existe sesión activa.
      // ----------------------------------------------------

      user: null,


      // ----------------------------------------------------
      // token
      // ----------------------------------------------------
      //
      // JWT de autenticación.
      //
      // Se utiliza para:
      // - autenticar requests
      // - validar sesiones
      // - proteger endpoints
      //
      // Inicialmente null.
      // ----------------------------------------------------

      token: null,


      // ----------------------------------------------------
      // isAuthenticated
      // ----------------------------------------------------
      //
      // Bandera booleana para saber si el usuario
      // tiene sesión activa.
      //
      // true  = autenticado
      // false = no autenticado
      //
      // Facilita validaciones rápidas:
      //
      // if(isAuthenticated)
      //
      // Porque revisar tokens manualmente por toda la app
      // sería otra magnífica forma de fabricar bugs.
      // ----------------------------------------------------

      isAuthenticated: false,



      // ====================================================
      // LOGIN
      // ====================================================
      //
      // Función para iniciar sesión.
      //
      // Recibe:
      //
      // data = {
      //   user,
      //   token
      // }
      //
      // ====================================================

      login: (data) => {


        // --------------------------------------------------
        // GUARDAR TOKEN EN LOCALSTORAGE
        // --------------------------------------------------
        //
        // Persistencia manual adicional.
        //
        // Esto permite que Axios pueda acceder
        // fácilmente al token desde cualquier request.
        //
        // localStorage:
        // almacenamiento persistente del navegador.
        //
        // El token permanece incluso si:
        // - se recarga la página
        // - se cierra el navegador
        //
        // hasta que se elimine manualmente.
        // --------------------------------------------------

        localStorage.setItem("token", data.token);


        // --------------------------------------------------
        // ACTUALIZAR ESTADO GLOBAL
        // --------------------------------------------------
        //
        // set() actualiza el store.
        //
        // Nuevos valores:
        //
        // - user
        // - token
        // - isAuthenticated = true
        //
        // Todos los componentes conectados al store
        // reaccionarán automáticamente.
        //
        // Reactividad:
        // esa cosa mágica que funciona...
        // hasta que alguien mete mutaciones directas.
        // --------------------------------------------------

        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
        });
      },



      // ====================================================
      // LOGOUT
      // ====================================================
      //
      // Función para cerrar sesión.
      //
      // Elimina:
      // - token almacenado
      // - datos del usuario
      // - estado de autenticación
      //
      // ====================================================

      logout: () => {


        // --------------------------------------------------
        // ELIMINAR TOKEN
        // --------------------------------------------------
        //
        // removeItem elimina el token del localStorage.
        //
        // Esto invalida la sesión en el frontend.
        // --------------------------------------------------

        localStorage.removeItem("token");


        // --------------------------------------------------
        // LIMPIAR ESTADO GLOBAL
        // --------------------------------------------------
        //
        // Reinicia completamente el store.
        //
        // Resultado:
        //
        // user = null
        // token = null
        // isAuthenticated = false
        //
        // Estado limpio.
        // Como si nada hubiera pasado.
        // Igual que muchos deployments fallidos.
        // --------------------------------------------------

        set({
          user: null,
          token: null,
          isAuthenticated: false,
        });
      },
    }),



    // ======================================================
    // CONFIGURACIÓN DEL PERSIST
    // ======================================================
    //
    // name:
    // nombre utilizado en localStorage.
    //
    // Se almacenará así:
    //
    // localStorage["liriacafe-auth"]
    //
    // Aquí Zustand guardará automáticamente:
    // - user
    // - token
    // - isAuthenticated
    //
    // ======================================================

    {
      name: "liriacafe-auth",
    },
  ),
);



// ==========================================================
// EJEMPLO DE USO
// ==========================================================
//
// IMPORTAR STORE
//
// import { useAuthStore } from "@/store/authStore";
//
// ----------------------------------------------------------
// OBTENER DATOS
// ----------------------------------------------------------
//
// const user = useAuthStore((state) => state.user);
//
// ----------------------------------------------------------
// LOGIN
// ----------------------------------------------------------
//
// const login = useAuthStore((state) => state.login);
//
// login({
//   user: userData,
//   token: jwtToken
// });
//
// ----------------------------------------------------------
// LOGOUT
// ----------------------------------------------------------
//
// const logout = useAuthStore((state) => state.logout);
//
// logout();
//
// ==========================================================



// ==========================================================
// VENTAJAS DE ESTA IMPLEMENTACIÓN
// ==========================================================
//
// ✅ Estado global simple
// ✅ Persistencia automática
// ✅ Menos boilerplate
// ✅ Fácil mantenimiento
// ✅ Reactividad inmediata
// ✅ Excelente rendimiento
// ✅ Integración sencilla con React
//
// Zustand termina siendo absurdamente cómodo.
// Lo cual irrita un poco después de sobrevivir Redux clásico.
//
// ==========================================================