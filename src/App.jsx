// ==========================================================
// APP PRINCIPAL DE LA APLICACION
// ==========================================================
//
// Este archivo configura la estructura global del frontend
//
//Responsabilidades principales:
//
// ✅ Configuración de React Query
// ✅ Configuración de rutas
// ✅ Protección de rutas privadas
// ✅ Manejo global de notificaciones
// ✅ Control de autenticación
//
// Básicamente:
// el centro neurálgico de la aplicación.
//
// Aquí se conectan:
// - Router
// - Estado global
// - Cache de requests
// - Seguridad de navegación
// - Sistema de toasts
//
// Todo muy elegante hasta que alguien mete rutas duplicadas
// a las 2 AM y rompe producción por “un cambio pequeño”.
//
// ==========================================================

// ==========================================================
// IMPORTACIONES
// ==========================================================


// ----------------------------------------------------------
// React Router DOM
// ----------------------------------------------------------
//
// BrowserRouter:
// Maneja navegación SPA usando History API.
//
// Routes:
// Contenedor de rutas.
//
// Route:
// Define una ruta individual.
//
// Navigate:
// Permite redireccionar programáticamente.
//
// ----------------------------------------------------------

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// ----------------------------------------------------------
// React Query
// ----------------------------------------------------------
//
// QueryClient:
// Cliente principal de React Query.
//
// QueryClientProvider:
// Proveedor global para acceso a cache y queries.
//
// React Query se encarga de:
//
// ✅ Fetching
// ✅ Cache
// ✅ Reintentos
// ✅ Sincronización
// ✅ Estados loading/error
// ✅ Optimización automática
//
// O sea:
// hace el trabajo sucio que normalmente termina
// convertido en 400 useEffects traumáticos.
// ----------------------------------------------------------

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

// ----------------------------------------------------------
// React Hot Toast
// ----------------------------------------------------------
//
// Librería para notificaciones visuales.
//
// Ejemplos:
// - Login exitoso
// - Error de autenticación
// - Producto guardado
// - Operación completada
//
// Porque los usuarios necesitan pequeños mensajes
// luminosos confirmando que el sistema sigue vivo.
// ----------------------------------------------------------

import { Toaster } from "react-hot-toast";

// ----------------------------------------------------------
// Store global de autenticación
// ----------------------------------------------------------
//
// Zustand auth store.
//
// Permite acceder al estado global:
//
// - usuario
// - token
// - autenticación
//
// ----------------------------------------------------------

import { useAuthStore } from "./store/auth.store";

// ----------------------------------------------------------
// Páginas principales
// ----------------------------------------------------------

import LoginPage from "./pages/login/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
// import DashboardPage from "./pages/Dashboard/DashboardPage";

// ==========================================================
// CONFIGURACIÓN DE REACT QUERY
// ==========================================================
//
// QueryClient controla comportamiento global
// de todas las queries.
//
// Aquí se definen configuraciones generales
// para toda la aplicación.
//
// ==========================================================

const queryClient = new QueryClient({


  // ========================================================
  // OPCIONES POR DEFECTO
  // ========================================================
  //
  // Se aplican automáticamente a todas las queries.
  //
  // ========================================================

  defaultOptions: {


    // ======================================================
    // CONFIGURACIÓN DE QUERIES
    // ======================================================

    queries: {


      // ----------------------------------------------------
      // staleTime
      // ----------------------------------------------------
      //
      // Tiempo en milisegundos que los datos se consideran
      // "frescos".
      //
      // 30000 ms = 30 segundos
      //
      // Durante ese tiempo:
      // - React Query NO vuelve a consultar la API
      // - Usa cache local
      //
      // Beneficios:
      //
      // ✅ Menos requests
      // ✅ Mejor rendimiento
      // ✅ Menor carga backend
      // ✅ UI más rápida
      //
      // Porque golpear el backend cada 2 segundos
      // como mono hiperactivo no suele escalar bien.
      // ----------------------------------------------------

      staleTime: 30000,


      // ----------------------------------------------------
      // retry
      // ----------------------------------------------------
      //
      // Cantidad de reintentos automáticos
      // si una request falla.
      //
      // retry: 1
      //
      // Significa:
      // - intenta 1 vez más
      // - si vuelve a fallar → error final
      //
      // Ayuda con:
      // - microcortes
      // - problemas temporales
      // - fallos intermitentes
      //
      // Sin convertir el frontend en un atacante DDoS.
      // ----------------------------------------------------

      retry: 1,
    },
  },
});



// ==========================================================
// COMPONENTE PRIVATE ROUTE
// ==========================================================
//
// Protege rutas privadas.
//
// Objetivo:
// impedir acceso a páginas protegidas
// si el usuario NO está autenticado.
//
// Ejemplo:
// - Dashboard
// - Productos
// - Ventas
// - Administración
//
// ==========================================================

const PrivateRoute = ({ children }) => {


  // ========================================================
  // OBTENER ESTADO DE AUTENTICACIÓN
  // ========================================================
  //
  // Se obtiene desde Zustand.
  //
  // isAuthenticated:
  //
  // true  -> usuario autenticado
  // false -> usuario no autenticado
  //
  // ========================================================

  const { isAuthenticated } = useAuthStore();



  // ========================================================
  // VALIDACIÓN DE ACCESO
  // ========================================================
  //
  // Si el usuario está autenticado:
  //
  // → renderiza children
  //
  // Si NO:
  //
  // → redirecciona al login
  //
  // replace:
  // evita que el usuario pueda volver atrás
  // con el botón del navegador.
  //
  // Seguridad básica SPA.
  // Sorprendentemente muchos proyectos ni eso tienen.
  //
  // ========================================================

  return isAuthenticated
    ? children
    : <Navigate to="/login" replace />;
};



// ==========================================================
// COMPONENTE PRINCIPAL APP
// ==========================================================
//
// Punto de entrada principal del frontend.
//
// Aquí se monta:
//
// ✅ React Query
// ✅ Router
// ✅ Rutas
// ✅ Toasts
//
// ==========================================================

export default function App() {

  return (


    // ======================================================
    // PROVIDER DE REACT QUERY
    // ======================================================
    //
    // Hace disponible queryClient
    // en toda la aplicación.
    //
    // Todas las páginas y componentes
    // podrán usar:
    //
    // useQuery()
    // useMutation()
    //
    // ======================================================

    <QueryClientProvider client={queryClient}>


      {/* ===================================================
          ROUTER PRINCIPAL
         =================================================== */}

      <BrowserRouter>


        {/* =================================================
            CONTENEDOR DE RUTAS
           ================================================= */}

        <Routes>


          {/* ===============================================
              RUTA LOGIN
             ===============================================
             
             Ruta pública.
             
             Acceso:
             /login
             
             Renderiza:
             LoginPage
             
             =============================================== */}

          <Route
            path="/login"
            element={<LoginPage />}
          />



          {/* ===============================================
              RUTAS PRIVADAS
             ===============================================
             
             path="/*"
             
             Captura cualquier ruta restante.
             
             Está protegida con:
             <PrivateRoute>
             
             Si usuario autenticado:
             → DashboardPage
             
             Si NO:
             → redirección login
             
             =============================================== */}

          <Route
            path="/*"
            element={

              <PrivateRoute>

                <DashboardPage />

              </PrivateRoute>
            }
          />



          {/* ===============================================
              RUTA FALLBACK
             ===============================================
             
             Captura rutas inexistentes.
             
             Ejemplo:
             /asdfasdf
             
             Redirecciona:
             /
             
             replace:
             reemplaza historial navegador.
             
             =============================================== */}

          <Route
            path="*"
            element={<Navigate to="/" replace />}
          />

        </Routes>

      </BrowserRouter>



      {/* ===================================================
          SISTEMA GLOBAL DE TOASTS
         ===================================================
         
         Toaster renderiza todas las notificaciones
         toast de la aplicación.
         
         Ejemplo:
         
         toast.success("Venta registrada");
         toast.error("Error al iniciar sesión");
         
         =================================================== */}

      <Toaster


        // -------------------------------------------------
        // Posición de los toasts
        // -------------------------------------------------
        //
        // top-right:
        // esquina superior derecha.
        //
        // -------------------------------------------------

        position="top-right"


        // -------------------------------------------------
        // Configuración global
        // -------------------------------------------------
        //
        // duration: 3000
        //
        // Duración visible:
        // 3 segundos
        //
        // -------------------------------------------------

        toastOptions={{
          duration: 3000,
        }}
      />

    </QueryClientProvider>
  );
}



// ==========================================================
// FLUJO GENERAL DE LA APP
// ==========================================================
//
// 1. App inicia
//
// 2. QueryClientProvider habilita React Query
//
// 3. BrowserRouter controla navegación SPA
//
// 4. Usuario entra:
//
//    /login
//      ↓
//    LoginPage
//
// 5. Usuario autenticado:
//
//    isAuthenticated = true
//
// 6. Puede acceder:
//
//    /*
//      ↓
//    DashboardPage
//
// 7. Usuario NO autenticado:
//
//    Navigate("/login")
//
// ==========================================================



// ==========================================================
// ARQUITECTURA IMPLEMENTADA
// ==========================================================
//
// ✅ SPA moderna
// ✅ Routing protegido
// ✅ Cache inteligente
// ✅ Estado global limpio
// ✅ Persistencia auth
// ✅ Manejo global UI
// ✅ Navegación segura
// ✅ Escalable
//
// Bastante sólida realmente.
// Lo preocupante es que ahora tendrás que mantenerla.
// Esa parte nadie la pone en los tutoriales.
//
// ==========================================================