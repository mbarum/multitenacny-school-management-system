import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import SuperAdminPage from './pages/SuperAdminPage';
import TenantManagementPage from './pages/TenantManagementPage';
import TenantDetailPage from './pages/TenantDetailPage';
import FinancialManagementPage from './pages/FinancialManagementPage';
import PaymentsPage from './pages/PaymentsPage';
import ClassManagementPage from './pages/ClassManagementPage';
import StaffManagementPage from './pages/StaffManagementPage';
import AttendancePage from './pages/AttendancePage';
import TimetablePage from './pages/TimetablePage';
import ReportingPage from './pages/ReportingPage';
import PrivacyPage from './pages/PrivacyPage';
import TermsPage from './pages/TermsPage';
import ContactPage from './pages/ContactPage';
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
        path="/super-admin/tenants"
        element={isAuthenticated && user?.role === UserRole.SUPER_ADMIN ? <TenantManagementPage /> : <Navigate to="/" />}
      />
      <Route
        path="/super-admin/tenants/:id"
        element={isAuthenticated && user?.role === UserRole.SUPER_ADMIN ? <TenantDetailPage /> : <Navigate to="/" />}
      />
      <Route
        path="/super-admin/financials"
        element={isAuthenticated && user?.role === UserRole.SUPER_ADMIN ? <FinancialManagementPage /> : <Navigate to="/" />}
      />
      <Route
        path="/payments"
        element={isAuthenticated ? <PaymentsPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/academics/classes"
        element={isAuthenticated ? <ClassManagementPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/staff"
        element={isAuthenticated ? <StaffManagementPage /> : <Navigate to="/login" />}
      />
      <Route
        path="/attendance"
        element={isAuthenticated ? <AttendancePage /> : <Navigate to="/login" />}
      />
      <Route
        path="/timetable"
        element={isAuthenticated ? <TimetablePage /> : <Navigate to="/login" />}
      />
      <Route
        path="/reports"
        element={isAuthenticated ? <ReportingPage /> : <Navigate to="/login" />}
      />
      <Route path="/privacy" element={<PrivacyPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/contact" element={<ContactPage />} />
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

