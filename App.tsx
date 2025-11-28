


import React, { lazy, Suspense, useState, useEffect } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Spinner from './components/common/Spinner';
import Login from './components/auth/Login';
import type { Student, Staff, Notification } from './types';
import { useData } from './contexts/DataContext';

// Lazily load view components for code-splitting
const Dashboard = lazy(() => import('./components/Dashboard'));
const Reporting = lazy(() => import('./components/Reporting'));
const StudentsView = lazy(() => import('./components/views/StudentsView'));
const FeeManagementView = lazy(() => import('./components/views/FeeManagementView'));
const ExpensesView = lazy(() => import('./components/views/ExpensesView'));
const StaffAndPayrollView = lazy(() => import('./components/views/StaffAndPayrollView'));
const SettingsView = lazy(() => import('./components/views/SettingsView'));
const AcademicsView = lazy(() => import('./components/views/AcademicsView'));
const TimetableView = lazy(() => import('./components/views/TimetableView'));
const AttendanceView = lazy(() => import('./components/views/AttendanceView'));
const CalendarView = lazy(() => import('./components/views/CalendarView'));
const ExaminationsView = lazy(() => import('./components/views/ExaminationsView'));
const ReportCardsView = lazy(() => import('./components/views/ReportCardsView'));
const CommunicationView = lazy(() => import('./components/views/CommunicationView'));

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


// =================================================================================
// MAIN APP COMPONENT
// =================================================================================
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

    // Sidebar collapse logic based on window size
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setIsSidebarCollapsed(true);
            } else {
                setIsSidebarCollapsed(false);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize(); // Initial check
        return () => window.removeEventListener('resize', handleResize);
    }, [setIsSidebarCollapsed]);

    // The renderView function is now much cleaner, as components fetch their own data and actions.
    const renderView = () => {
        if (!currentUser) return null;

        switch (activeView) {
            // Admin/Main views
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
            // SettingsView now fetches its own props via useData hook
            case 'settings': return <SettingsView />;

            // Teacher views
            case 'teacher_dashboard': return <TeacherDashboard />;
            case 'my_class': return <MyClassView />;
            case 'teacher_attendance': return <TeacherAttendanceView />;
            case 'teacher_examinations': return <TeacherExaminationsView />;
            case 'teacher_communication': return <TeacherCommunicationView />;
            
            // Parent views
            case 'parent_dashboard': return <ParentDashboard />;
            case 'parent_child_details': return <ParentChildDetails />;
            case 'parent_finances': return <ParentFinances />;
            case 'parent_announcements': return <ParentAnnouncementsView />;
                
            default: return <Dashboard />;
        }
    };

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

    // Notification container remains here as a global UI element
    const NotificationContainer: React.FC<{ notifications: Notification[] }> = ({ notifications }) => (
        <div className="fixed top-5 right-5 z-50 space-y-3 w-full max-w-sm">
            {notifications.map(n => {
                const colors = {
                    success: 'bg-primary-100 border-primary-500 text-primary-700',
                    error: 'bg-red-100 border-red-500 text-red-700',
                    info: 'bg-blue-100 border-blue-500 text-blue-700',
                };
                return (
                    <div key={n.id} className={`p-4 border-l-4 rounded-r-lg shadow-lg ${colors[n.type]}`} role="alert" style={{ animation: 'fadeInRight 0.5s' }}>
                        <p className="font-bold">{n.type.charAt(0).toUpperCase() + n.type.slice(1)}</p>
                        <p>{n.message}</p>
                    </div>
                );
            })}
             <style>
                {`
                @keyframes fadeInRight {
                    from { opacity: 0; transform: translateX(100%); }
                    to { opacity: 1; transform: translateX(0); }
                }
                `}
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
                    <Suspense fallback={
                        <div className="h-full w-full flex items-center justify-center">
                            <Spinner />
                        </div>
                    }>
                        {renderView()}
                    </Suspense>
                </main>
            </div>
        </div>
    );
};

export default App;
