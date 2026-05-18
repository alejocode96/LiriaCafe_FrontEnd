import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/auth.store';

import Layout from './components/layout/Layout';
import LoginPage from './pages/Login/LoginPage';
import IngredientsPage from './pages/Ingredients/IngredientsPage';

// Importar páginas a medida que las vayas creando
// import DashboardPage from './pages/Dashboard/DashboardPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Privadas — todas dentro del Layout */}
          <Route path="/" element={<PrivateRoute>   <Layout />  </PrivateRoute>} >

            {/* Aquí van todas las rutas internas */}
            {/* <Route index element={<DashboardPage />} /> */}
            {/* <Route path="pos" element={<POSPage />} /> */}
            {/* <Route path="tables" element={<TablesPage />} /> */}
            {/* <Route path="products" element={<ProductsPage />} /> */}
            <Route path="ingredients" element={<IngredientsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>

      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#1f2937', color: '#f9fafb', border: '1px solid #374151', }, }} />
    </QueryClientProvider>
  );
}