
import React, { lazy, Suspense, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Spinner from './components/common/Spinner';
import Login from './components/auth/Login';
import LandingPage from './components/landing/LandingPage';
import { useData } from './contexts/DataContext';
import { Notification } from './types';

// Lazily load view components
const Dashboard = lazy(() => import('./views/Dashboard'));
const Reporting = lazy(() => import('./views/Reporting'));
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
const LibraryView = lazy(() => import('./components/views/LibraryView'));

// Teacher Portal
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard'));
const MyClassView = lazy(() => import('./components/teacher/MyClassView'));
const TeacherAttendanceView = lazy(() => import('./components/teacher/TeacherAttendanceView'));
const TeacherExaminationsView = lazy(() => import('./components/teacher/TeacherExaminationsView'));
const TeacherCommunicationView = lazy(() => import('./components/teacher/TeacherCommunicationView'));

// Parent Portal
const ParentDashboard = lazy(() => import('./components/parent/ParentDashboard'));
const ParentChildDetails = lazy(() => import('./components/parent/ParentChildDetails'));
const ParentFinances = lazy(() => import('./components/parent/ParentFinances'));
const ParentAnnouncementsView = lazy(() => import('./components/parent/ParentAnnouncementsView'));

// Super Admin
const SuperAdminDashboard = lazy(() => import('./components/super-admin/SuperAdminDashboard'));
const RegisterSchool = lazy(() => import('./components/auth/RegisterSchool'));

const App: React.FC = () => {
    const {
        isLoading,
        currentUser,
        activeView,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        notifications,
    } = useData();

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarCollapsed(true);
            } else {
                setIsSidebarCollapsed(false);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); 
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsSidebarCollapsed]);

    // Handle Route Navigation manually since we aren't using React Router (yet) for simplicity of the prompt's architecture
    const path = window.location.pathname;

    const navigate = (path: string, state?: any) => {
        window.history.pushState(state, '', path);
        // Force re-render is handled by reloading in this simple architecture, 
        // or we could use a state variable for currentPath.
        // For smoother UX, we update the URL and force the component to re-evaluate.
        window.dispatchEvent(new PopStateEvent('popstate'));
    };
    
    // Simple router logic using state
    const [currentPath, setCurrentPath] = React.useState(window.location.pathname);
    const [routeState, setRouteState] = React.useState<any>(window.history.state);

    useEffect(() => {
        const onLocationChange = () => {
            setCurrentPath(window.location.pathname);
            setRouteState(window.history.state);
        };
        window.addEventListener('popstate', onLocationChange);
        return () => window.removeEventListener('popstate', onLocationChange);
    }, []);


    if (isLoading) {
        return <div className="h-screen w-screen flex justify-center items-center"><Spinner /></div>;
    }

    // Public Routes
    if (!currentUser) {
        if (currentPath === '/register') {
            return (
                <Suspense fallback={<Spinner />}>
                    <RegisterSchool initialState={routeState} />
                </Suspense>
            );
        }
        if (currentPath === '/login') {
             return <Login />;
        }
        // Default to Landing Page for root
        return <LandingPage onNavigate={navigate} />;
    }

    // Authenticated App Structure
    const renderView = () => {
        switch (activeView) {
            case 'super_admin_dashboard': return <SuperAdminDashboard />;
            case 'dashboard': return <Dashboard />;
            case 'students': return <StudentsView />;
            case 'fees': return <FeeManagementView />;
            case 'expenses': return <ExpensesView />;
            case 'staff_payroll': return <StaffAndPayrollView />;
            case 'academics': return <AcademicsView />;
            case 'timetable': return <TimetableView />;
            case 'attendance': return <AttendanceView />;
            case 'calendar': return <CalendarView />;
            case 'examinations': return <ExaminationsView />;
            case 'report_cards': return <ReportCardsView />;
            case 'communication': return <CommunicationView />;
            case 'reporting': return <Reporting />;
            case 'library': return <LibraryView />;
            case 'settings': return <SettingsView />;
            case 'teacher_dashboard': return <TeacherDashboard />;
            case 'my_class': return <MyClassView />;
            case 'teacher_attendance': return <TeacherAttendanceView />;
            case 'teacher_examinations': return <TeacherExaminationsView />;
            case 'teacher_communication': return <TeacherCommunicationView />;
            case 'parent_dashboard': return <ParentDashboard />;
            case 'parent_child_details': return <ParentChildDetails />;
            case 'parent_finances': return <ParentFinances />;
            case 'parent_announcements': return <ParentAnnouncementsView />;
            default: return <Dashboard />;
        }
    };

    const NotificationContainer: React.FC<{ notifications: Notification[] }> = ({ notifications }) => (
        <div className="fixed top-5 right-5 z-50 space-y-3 w-full max-w-sm pointer-events-none">
            {notifications.map(n => {
                const colors = {
                    success: 'bg-primary-100 border-primary-500 text-primary-700',
                    error: 'bg-red-100 border-red-500 text-red-700',
                    info: 'bg-blue-100 border-blue-500 text-blue-700',
                };
                return (
                    <div key={n.id} className={`p-4 border-l-4 rounded-r-lg shadow-lg ${colors[n.type]} pointer-events-auto`} role="alert" style={{ animation: 'fadeInRight 0.5s' }}>
                        <p className="font-bold">{n.type.charAt(0).toUpperCase() + n.type.slice(1)}</p>
                        <p>{n.message}</p>
                    </div>
                );
            })}
             <style>{`@keyframes fadeInRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }`}</style>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-100">
            <NotificationContainer notifications={notifications} />
            <Sidebar />
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
                <Header />
                <main className="flex-1 overflow-y-auto">
                    <Suspense fallback={<div className="h-full w-full flex items-center justify-center"><Spinner /></div>}>
                        {renderView()}
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default App;
