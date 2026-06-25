import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/routes/ProtectedRoute";

import LoginPage from "./pages/LoginPage";
import MainLayout from "./layouts/MainLayout";
// import POSPage from "./pages/POSPage";
// import InventoryPage from "./pages/InventoryPage";
// import CustomersPage from "./pages/CustomersPage";
// import ReportsPage from "./pages/ReportsPage";
// import SettingsPage from "./pages/SettingsPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Pública */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protegidas — todas dentro del layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            {/* <Route index element={<Navigate to="/pos" replace />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="inventory" element={<InventoryPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} /> */}
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}