import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import TeacherClassesPage from './pages/TeacherClassesPage';
import TeacherAttendancePage from './pages/TeacherAttendancePage';
import TeacherGradingPage from './pages/TeacherGradingPage';
import ParentDashboardPage from './pages/ParentDashboardPage';
import LandingPage from './pages/LandingPage';
import PricingPage from './pages/PricingPage';
import SuperAdminPage from './pages/SuperAdminPage';
import SuperAdminSettingsPage from './pages/SuperAdminSettingsPage';
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
import StudentsPage from './pages/StudentsPage';
import PayrollPage from './pages/PayrollPage';
import LibraryPage from './pages/LibraryPage';
import LmsPage from './pages/LmsPage';
import TreasuryPage from './pages/TreasuryPage';
import SchoolSettingsPage from './pages/SchoolSettingsPage';
import { UserRole } from '../../src/common/user-role.enum';

import DashboardLayout from './components/DashboardLayout';

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user } = useAuth();

  const renderProtectedRoute = (element: React.ReactNode, role?: UserRole) => {
    if (!isAuthenticated) return <Navigate to="/login" />;
    if (role && user?.role !== role) return <Navigate to="/" />;
    return <DashboardLayout>{element}</DashboardLayout>;
  };

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route 
        path="/"
        element={
          !isAuthenticated ? <LandingPage /> : 
          user?.role === UserRole.SUPER_ADMIN ? <Navigate to="/super-admin" /> : 
          user?.role === UserRole.TEACHER ? <Navigate to="/teacher" /> :
          user?.role === UserRole.PARENT ? <Navigate to="/parent" /> :
          <Navigate to="/dashboard" />
        }
      />
      <Route
        path="/dashboard"
        element={renderProtectedRoute(<DashboardPage />, UserRole.ADMIN)}
      />
      <Route
        path="/settings"
        element={renderProtectedRoute(<SchoolSettingsPage />, UserRole.ADMIN)}
      />
      <Route
        path="/students"
        element={renderProtectedRoute(<StudentsPage />, UserRole.ADMIN)}
      />
      <Route
        path="/super-admin"
        element={renderProtectedRoute(<SuperAdminPage />, UserRole.SUPER_ADMIN)}
      />
      <Route
        path="/super-admin/tenants"
        element={renderProtectedRoute(<TenantManagementPage />, UserRole.SUPER_ADMIN)}
      />
      <Route
        path="/super-admin/tenants/:id"
        element={renderProtectedRoute(<TenantDetailPage />, UserRole.SUPER_ADMIN)}
      />
      <Route
        path="/super-admin/settings"
        element={renderProtectedRoute(<SuperAdminSettingsPage />, UserRole.SUPER_ADMIN)}
      />
      <Route
        path="/super-admin/financials"
        element={renderProtectedRoute(<FinancialManagementPage />, UserRole.SUPER_ADMIN)}
      />
      <Route
        path="/teacher"
        element={renderProtectedRoute(<TeacherDashboardPage />, UserRole.TEACHER)}
      />
      <Route
        path="/teacher/classes"
        element={renderProtectedRoute(<TeacherClassesPage />, UserRole.TEACHER)}
      />
      <Route
        path="/teacher/attendance"
        element={renderProtectedRoute(<TeacherAttendancePage />, UserRole.TEACHER)}
      />
      <Route
        path="/teacher/grading"
        element={renderProtectedRoute(<TeacherGradingPage />, UserRole.TEACHER)}
      />
      <Route
        path="/parent"
        element={renderProtectedRoute(<ParentDashboardPage />, UserRole.PARENT)}
      />
      <Route
        path="/payments"
        element={renderProtectedRoute(<PaymentsPage />)}
      />
      <Route
        path="/academics/classes"
        element={renderProtectedRoute(<ClassManagementPage />)}
      />
      <Route
        path="/staff"
        element={renderProtectedRoute(<StaffManagementPage />)}
      />
      <Route
        path="/payroll"
        element={renderProtectedRoute(<PayrollPage />, UserRole.ADMIN)}
      />
      <Route
        path="/library"
        element={renderProtectedRoute(<LibraryPage />)}
      />
      <Route
        path="/lms"
        element={renderProtectedRoute(<LmsPage />, UserRole.ADMIN)}
      />
      <Route
        path="/treasury"
        element={renderProtectedRoute(<TreasuryPage />, UserRole.ADMIN)}
      />
      <Route
        path="/attendance"
        element={renderProtectedRoute(<AttendancePage />)}
      />
      <Route
        path="/timetable"
        element={renderProtectedRoute(<TimetablePage />)}
      />
      <Route
        path="/reports"
        element={renderProtectedRoute(<ReportingPage />)}
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
      <Toaster position="top-right" expand={true} richColors />
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
};

export default App;

