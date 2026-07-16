import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/routes/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

import LoginPage          from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPassword/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPassword/ResetPasswordPage';
import MainLayout         from './layouts/MainLayout';
import WelcomePage        from './pages/WelcomePage/WelcomePage';
import UsersPage          from './pages/Users/UsersPage';
import RolesPage          from './pages/Roles/RolesPage';
import ConfiguracionPage  from './pages/Configuracion/ConfiguracionPage';
import CategoriasPage       from './pages/Categorias/CategoriasPage';
import InventarioPage       from './pages/Inventario/InventarioPage';
import ProductosPage        from './pages/Productos/ProductosPage';
import ProductoDetailPage   from './pages/Productos/ProductoDetailPage';
import CajaPage             from './pages/Caja/CajaPage';
import CajaHistorialPage    from './pages/Caja/CajaHistorialPage';
import POSPage              from './pages/POS/POSPage';
import VentasPage             from './pages/Ventas/VentasPage';
import FlujoCajaPage          from './pages/FlujoCaja/FlujoCajaPage';
import FlujoCajaResumenPage   from './pages/FlujoCaja/FlujoCajaResumenPage';
import ReportesVentasPage        from './pages/Reportes/ReportesVentasPage';
import ReportesRentabilidadPage  from './pages/Reportes/ReportesRentabilidadPage';
import ReportesInventarioPage    from './pages/Reportes/ReportesInventarioPage';
import ReportesCajaPage          from './pages/Reportes/ReportesCajaPage';


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{ success: { duration: 4000 }, error: { duration: 6000 } }}
        />
        <Routes>
          {/* Rutas públicas */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />

          {/* Protegidas dentro del layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* Redirige / → /dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Página de bienvenida / dashboard temporal */}
            <Route path="dashboard" element={<WelcomePage />} />

            {/* Administración */}
            <Route path="admin/usuarios"       element={<UsersPage />} />
            <Route path="admin/roles"          element={<RolesPage />} />
            <Route path="admin/configuracion"  element={<ConfiguracionPage />} />

            {/* Productos */}
            <Route path="categorias"           element={<CategoriasPage />} />
            <Route path="inventario"           element={<InventarioPage />} />
            <Route path="productos"            element={<ProductosPage />} />
            <Route path="productos/:id"        element={<ProductoDetailPage />} />

            {/* Caja */}
            <Route path="caja"                 element={<CajaPage />} />
            <Route path="caja/historial"       element={<CajaHistorialPage />} />

            {/* Punto de Venta */}
            <Route path="ventas/nueva"         element={<POSPage />} />
            <Route path="ventas"               element={<VentasPage />} />

            {/* Flujo de Caja */}
            <Route path="flujo-caja"           element={<FlujoCajaPage />} />
            <Route path="flujo-caja/nuevo"     element={<FlujoCajaPage autoOpenRegister />} />
            <Route path="flujo-caja/resumen"   element={<FlujoCajaResumenPage />} />

            {/* Reportes */}
            <Route path="reportes/ventas"         element={<ReportesVentasPage />} />
            <Route path="reportes/rentabilidad"   element={<ReportesRentabilidadPage />} />
            <Route path="reportes/inventario"     element={<ReportesInventarioPage />} />
            <Route path="reportes/caja"           element={<ReportesCajaPage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}