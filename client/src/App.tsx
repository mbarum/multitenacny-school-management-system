import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import SuperAdminPage from './pages/SuperAdminPage';
import PaymentsPage from './pages/PaymentsPage';
import { UserRole } from '../../src/common/user-role.enum';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route 
        path="/"
        element={isAuthenticated ? <DashboardPage /> : <LandingPage />}
      />
      <Route
        path="/super-admin"
        element={isAuthenticated && user?.role === UserRole.SUPER_ADMIN ? <SuperAdminPage /> : <Navigate to="/" />}
      />
      <Route
        path="/payments"
        element={isAuthenticated ? <PaymentsPage /> : <Navigate to="/login" />}
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;

