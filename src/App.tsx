
import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Spinner from './components/common/Spinner';
import Login from './components/auth/Login';
import LandingPage from './components/landing/LandingPage';
import RegisterSchool from './components/auth/RegisterSchool';
import SubscriptionLocked from './components/auth/SubscriptionLocked';
import PrivacyPolicy from './views/PrivacyPolicy';
import TermsOfService from './views/TermsOfService';
import CookiePolicy from './views/CookiePolicy';
import SessionTimeoutManager from './components/auth/SessionTimeoutManager';
import { useData } from './contexts/DataContext';
import { Notification, SubscriptionStatus, Role } from './types';
import { identifySocketUser, sendSocketHeartbeat } from './services/socket';
import { retryLazy } from './utils/retryLazy';

// Admin Views
const Dashboard = retryLazy(() => import('./views/Dashboard'));
const StudentsView = retryLazy(() => import('./views/StudentsView'));
const FeeManagementView = retryLazy(() => import('./views/FeeManagementView'));
const ExpensesView = retryLazy(() => import('./views/ExpensesView'));
const StaffAndPayrollView = retryLazy(() => import('./views/StaffAndPayrollView'));
const SettingsView = retryLazy(() => import('./views/SettingsView'));
const AcademicsView = retryLazy(() => import('./views/AcademicsView'));
const TimetableView = retryLazy(() => import('./views/TimetableView'));
const AttendanceView = retryLazy(() => import('./views/AttendanceView'));
const CalendarView = retryLazy(() => import('./views/CalendarView'));
const ExaminationsView = retryLazy(() => import('./views/ExaminationsView'));
const ReportCardsView = retryLazy(() => import('./views/ReportCardsView'));
const CommunicationView = retryLazy(() => import('./views/CommunicationView'));
const Reporting = retryLazy(() => import('./views/Reporting'));
const LibraryView = retryLazy(() => import('./views/LibraryView'));

// Role-Specific Views
const SuperAdminDashboard = retryLazy(() => import('./views/super-admin/SuperAdminDashboard'));
const TeacherDashboard = retryLazy(() => import('./views/teacher/TeacherDashboard'));
const MyClassView = retryLazy(() => import('./views/teacher/MyClassView'));
const TeacherAttendanceView = retryLazy(() => import('./views/teacher/TeacherAttendanceView'));
const TeacherExaminationsView = retryLazy(() => import('./views/teacher/TeacherExaminationsView'));
const TeacherCommunicationView = retryLazy(() => import('./views/teacher/TeacherCommunicationView'));

const ParentDashboard = retryLazy(() => import('./views/parent/ParentDashboard'));
const ParentChildDetails = retryLazy(() => import('./views/parent/ParentChildDetails'));
const ParentFinances = retryLazy(() => import('./views/parent/ParentFinances'));
const ParentAnnouncementsView = retryLazy(() => import('./views/parent/ParentAnnouncementsView'));
const ParentLmsView = retryLazy(() => import('./views/parent/ParentLmsView'));
const LmsView = retryLazy(() => import('./views/lms/LmsView'));

const App: React.FC = () => {
    const {
        isLoading,
        currentUser,
        schoolInfo,
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

    // Live Socket Presence & Heartbeat for System-Wide Monitoring
    useEffect(() => {
        if (currentUser) {
            identifySocketUser(currentUser, schoolInfo);
            const interval = setInterval(() => {
                sendSocketHeartbeat(window.location.pathname);
            }, 30000);
            return () => clearInterval(interval);
        }
    }, [currentUser, schoolInfo]);

    const NotificationContainer: React.FC<{ notifications: Notification[] }> = ({ notifications }) => (
        <div className="fixed top-5 right-5 z-[100] space-y-3 w-full max-w-sm pointer-events-none">
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

    // 1. UNAUTHENTICATED ROUTING (White-listed public pages)
    if (!currentUser) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
                <NotificationContainer notifications={notifications} />
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Suspense fallback={<Spinner />}><RegisterSchool /></Suspense>} />
                    <Route path="/privacy" element={<PrivacyPolicy />} />
                    <Route path="/terms" element={<TermsOfService />} />
                    <Route path="/cookies" element={<CookiePolicy />} />
                    <Route path="/" element={<LandingPage onNavigate={(path) => window.location.href = path} />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </div>
        );
    }

    // 2. SUBSCRIPTION LOCKOUT CHECK (Strictly blocks all dashboard access)
    const isSubscriptionExpired = schoolInfo?.subscription && 
        new Date(schoolInfo.subscription.endDate) < new Date() && 
        schoolInfo.subscription.status !== SubscriptionStatus.ACTIVE;

    if (isSubscriptionExpired && currentUser.role !== 'SuperAdmin') {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 transition-colors">
                <NotificationContainer notifications={notifications} />
                <SubscriptionLocked />
            </div>
        );
    }

    // 3. AUTHENTICATED LAYOUT
    return (
        <div className="flex h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
            <SessionTimeoutManager />
            <NotificationContainer notifications={notifications} />
            <Sidebar />
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <Header />
                <main className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar bg-slate-100 dark:bg-slate-950">
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Spinner /></div>}>
                        <Routes>
                            <Route path="/" element={
                                currentUser.role === Role.SuperAdmin ? <Navigate to="/super-admin" replace /> :
                                currentUser.role === Role.Teacher ? <Navigate to="/teacher" replace /> :
                                currentUser.role === Role.Parent ? <Navigate to="/parent" replace /> :
                                <Dashboard />
                            } />
                            <Route path="/super-admin" element={<SuperAdminDashboard />} />
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
                            <Route path="/teacher" element={<TeacherDashboard />} />
                            <Route path="/teacher-my-class" element={<MyClassView />} />
                            <Route path="/teacher-attendance" element={<TeacherAttendanceView />} />
                            <Route path="/teacher-examinations" element={<TeacherExaminationsView />} />
                            <Route path="/teacher-communication" element={<TeacherCommunicationView />} />
                            <Route path="/parent" element={<ParentDashboard />} />
                            <Route path="/parent-child-details" element={<ParentChildDetails />} />
                            <Route path="/parent-finances" element={<ParentFinances />} />
                            <Route path="/parent-announcements" element={<ParentAnnouncementsView />} />
                            <Route path="/parent-lms" element={<ParentLmsView />} />
                            <Route path="/lms" element={<LmsView />} />
                            <Route path="/privacy" element={<PrivacyPolicy />} />
                            <Route path="/terms" element={<TermsOfService />} />
                            <Route path="/cookies" element={<CookiePolicy />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default App;
