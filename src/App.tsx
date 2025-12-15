
import React, { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Spinner from './components/common/Spinner';
import Login from './components/auth/Login';
import LandingPage from './components/landing/LandingPage';
import RegisterSchool from './components/auth/RegisterSchool';
import { useData } from './contexts/DataContext';
import { Notification } from './types';

// Admin Views
// Updated to use the refactored views in src/views
const Dashboard = lazy(() => import('./views/Dashboard'));
const StudentsView = lazy(() => import('./views/StudentsView'));
const FeeManagementView = lazy(() => import('./views/FeeManagementView'));
const ExpensesView = lazy(() => import('./views/ExpensesView'));
const StaffAndPayrollView = lazy(() => import('./views/StaffAndPayrollView'));
const SettingsView = lazy(() => import('./views/SettingsView'));
const AcademicsView = lazy(() => import('./views/AcademicsView'));
const TimetableView = lazy(() => import('./views/TimetableView'));
const AttendanceView = lazy(() => import('./views/AttendanceView'));
const CalendarView = lazy(() => import('./views/CalendarView'));
const ExaminationsView = lazy(() => import('./views/ExaminationsView'));
const ReportCardsView = lazy(() => import('./views/ReportCardsView'));
const CommunicationView = lazy(() => import('./views/CommunicationView'));
const Reporting = lazy(() => import('./views/Reporting'));
const LibraryView = lazy(() => import('./views/LibraryView'));

// Role-Specific Views
const SuperAdminDashboard = lazy(() => import('./views/super-admin/SuperAdminDashboard'));
const TeacherDashboard = lazy(() => import('./views/teacher/TeacherDashboard'));
const MyClassView = lazy(() => import('./views/teacher/MyClassView'));
const TeacherAttendanceView = lazy(() => import('./views/teacher/TeacherAttendanceView'));
const TeacherExaminationsView = lazy(() => import('./views/teacher/TeacherExaminationsView'));
const TeacherCommunicationView = lazy(() => import('./views/teacher/TeacherCommunicationView'));

const ParentDashboard = lazy(() => import('./views/parent/ParentDashboard'));
const ParentChildDetails = lazy(() => import('./views/parent/ParentChildDetails'));
const ParentFinances = lazy(() => import('./views/parent/ParentFinances'));
const ParentAnnouncementsView = lazy(() => import('./views/parent/ParentAnnouncementsView'));

const App: React.FC = () => {
    const {
        isLoading,
        currentUser,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        notifications,
    } = useData();

    useEffect(() => {
        const handleResize = () => {
            setIsSidebarCollapsed(window.innerWidth < 1024);
        };
        window.addEventListener('resize', handleResize);
        handleResize(); 
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsSidebarCollapsed]);

    const NotificationContainer: React.FC<{ notifications: Notification[] }> = ({ notifications }) => (
        <div className="fixed top-5 right-5 z-50 space-y-3 w-full max-w-sm pointer-events-none">
            {notifications.map(n => {
                const colors = {
                    success: 'bg-primary-100 border-primary-500 text-primary-700',
                    error: 'bg-red-100 border-red-500 text-red-700',
                    info: 'bg-blue-100 border-blue-500 text-blue-700',
                };
                return (
                    <div key={n.id} className={`p-4 border-l-4 rounded-r-lg shadow-lg ${colors[n.type]} pointer-events-auto animate-fade-in-right`} role="alert">
                        <p className="font-bold">{n.type.charAt(0).toUpperCase() + n.type.slice(1)}</p>
                        <p>{n.message}</p>
                    </div>
                );
            })}
        </div>
    );

    if (isLoading) {
        return <div className="h-screen w-screen flex justify-center items-center"><Spinner /></div>;
    }

    // Unauthenticated Routes
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-slate-50">
                <NotificationContainer notifications={notifications} />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Suspense fallback={<Spinner />}><RegisterSchool /></Suspense>} />
                    <Route path="/" element={<LandingPage onNavigate={(path) => window.location.href = path} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        );
    }

    // Authenticated Layout
    return (
        <div className="flex h-screen bg-slate-100">
            <NotificationContainer notifications={notifications} />
            <Sidebar />
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <Header />
                <main className="flex-1 overflow-y-auto overflow-x-hidden">
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Spinner /></div>}>
                        <Routes>
                            {/* Super Admin */}
                            <Route path="/super-admin" element={<SuperAdminDashboard />} />

                            {/* Main Admin / Accountant Routes */}
                            <Route path="/" element={<Dashboard />} />
                            <Route path="/students" element={<StudentsView />} />
                            <Route path="/fees" element={<FeeManagementView />} />
                            <Route path="/expenses" element={<ExpensesView />} />
                            <Route path="/staff" element={<StaffAndPayrollView />} />
                            <Route path="/academics" element={<AcademicsView />} />
                            <Route path="/timetable" element={<TimetableView />} />
                            <Route path="/attendance" element={<AttendanceView />} />
                            <Route path="/calendar" element={<CalendarView />} />
                            <Route path="/examinations" element={<ExaminationsView />} />
                            <Route path="/report-cards" element={<ReportCardsView />} />
                            <Route path="/communication" element={<CommunicationView />} />
                            <Route path="/reporting" element={<Reporting />} />
                            <Route path="/library" element={<LibraryView />} />
                            <Route path="/settings" element={<SettingsView />} />

                            {/* Teacher Routes */}
                            <Route path="/teacher" element={<TeacherDashboard />} />
                            <Route path="/teacher-my-class" element={<MyClassView />} />
                            <Route path="/teacher-attendance" element={<TeacherAttendanceView />} />
                            <Route path="/teacher-examinations" element={<TeacherExaminationsView />} />
                            <Route path="/teacher-communication" element={<TeacherCommunicationView />} />
                            
                            {/* Parent Routes */}
                            <Route path="/parent" element={<ParentDashboard />} />
                            <Route path="/parent-child-details" element={<ParentChildDetails />} />
                            <Route path="/parent-finances" element={<ParentFinances />} />
                            <Route path="/parent-announcements" element={<ParentAnnouncementsView />} />

                            {/* Fallback */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default App;
