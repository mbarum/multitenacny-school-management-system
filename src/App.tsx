
import React, { lazy, Suspense, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Spinner from './components/common/Spinner';
import Login from './components/auth/Login';
import RegisterSchool from './components/auth/RegisterSchool';
import type { Notification } from './types';
import { useData } from './contexts/DataContext';

// Lazily load view components for code-splitting
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
const LibraryView = lazy(() => import('./components/views/LibraryView')); // Added Library View

// Teacher Portal components
const TeacherDashboard = lazy(() => import('./components/teacher/TeacherDashboard'));
const MyClassView = lazy(() => import('./components/teacher/MyClassView'));
const TeacherAttendanceView = lazy(() => import('./components/teacher/TeacherAttendanceView'));
const TeacherExaminationsView = lazy(() => import('./components/teacher/TeacherExaminationsView'));
const TeacherCommunicationView = lazy(() => import('./components/teacher/TeacherCommunicationView'));

// Parent Portal components
const ParentDashboard = lazy(() => import('./components/parent/ParentDashboard'));
const ParentChildDetails = lazy(() => import('./components/parent/ParentChildDetails'));
const ParentFinances = lazy(() => import('./components/parent/ParentFinances'));
const ParentAnnouncementsView = lazy(() => import('./components/parent/ParentAnnouncementsView'));


const App: React.FC = () => {
    const {
        isLoading,
        schoolInfo,
        currentUser,
        activeView,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        notifications,
    } = useData();

    // Simple routing check for registration
    const isRegisterPage = window.location.pathname === '/register';

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

    const renderView = () => {
        if (!currentUser) return null;

        switch (activeView) {
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
            case 'settings': return <SettingsView />;
            case 'library': return <LibraryView />;
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

    if (isRegisterPage) {
        return <RegisterSchool />;
    }

    if (isLoading || !schoolInfo) {
        return (
            <div className="h-screen w-screen flex justify-center items-center">
                <Spinner />
            </div>
        );
    }
    
    if (!currentUser) {
        return <Login />;
    }

    const NotificationContainer: React.FC<{ notifications: any[] }> = ({ notifications }) => (
        <div className="fixed top-5 right-5 z-50 space-y-3 w-full max-w-sm">
            {notifications.map(n => {
                const colors = {
                    success: 'bg-primary-100 border-primary-500 text-primary-700',
                    error: 'bg-red-100 border-red-500 text-red-700',
                    info: 'bg-blue-100 border-blue-500 text-blue-700',
                };
                return (
                    <div key={n.id} className={`p-4 border-l-4 rounded-r-lg shadow-lg ${colors[n.type as 'success'|'error'|'info']}`} role="alert" style={{ animation: 'fadeInRight 0.5s' }}>
                        <p className="font-bold">{n.type.charAt(0).toUpperCase() + n.type.slice(1)}</p>
                        <p>{n.message}</p>
                    </div>
                );
            })}
             <style>
                {`@keyframes fadeInRight { from { opacity: 0; transform: translateX(100%); } to { opacity: 1; transform: translateX(0); } }`}
            </style>
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
