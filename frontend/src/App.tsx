import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { VaultProvider } from './context/VaultContext';
import { useAxiosInterceptor } from './hooks/useAxiosInterceptor';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import SecretsPage from './pages/SecretsPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="loading-screen"><span className="loading-spinner" /></div>;
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// AppRoutes is inside BrowserRouter so it can use useNavigate via useAxiosInterceptor
const AppRoutes = () => {
  const { isAuthenticated } = useAuth();
  // Registers the 401 interceptor using React Router (instead of window.location.href)
  useAxiosInterceptor();

  return (
    <Routes>
      <Route path="/login"    element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/secrets"   element={<ProtectedRoute><SecretsPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <VaultProvider>
          <AppRoutes />
        </VaultProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
