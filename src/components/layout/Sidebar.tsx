
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { NavItem } from '../../constants';
import { Role } from '../../types';
import { useData } from '../../contexts/DataContext';

const SaaslinkLogo: React.FC<{ schoolName: string; logoUrl?: string; isCollapsed: boolean; }> = ({ schoolName, logoUrl, isCollapsed }) => (
    <div className="flex items-center justify-center py-5 px-4 border-b border-slate-200 h-16 bg-white">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''} w-full`}>
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
            ) : (
                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full text-primary-600 bg-primary-100">
                     <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                </div>
            )}
            <div className={`ml-3 transition-opacity duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>
                <h1 className="text-lg font-bold truncate max-w-[150px] text-primary-800">
                    {schoolName}
                </h1>
            </div>
        </div>
    </div>
);

const Sidebar: React.FC = () => {
    const {
        currentUser,
        schoolInfo,
        getNavigationItems,
        isSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen
    } = useData();
    
    const location = useLocation();

    if (!currentUser) return null;

    const navigationItems = getNavigationItems();
    const isAllowed = (navItem: NavItem) => navItem.allowedRoles.includes(currentUser.role);
    
    const displayName = currentUser.role === Role.SuperAdmin ? "Saaslink Platform" : (schoolInfo?.name || "School System");

    // Mapping views (from constants) to actual Routes defined in App.tsx
    const getPath = (view: string) => {
        if (view === 'dashboard') return '/';
        
        // Admin Routes
        if (view === 'students') return '/students';
        if (view === 'fees') return '/fees';
        if (view === 'expenses') return '/expenses';
        if (view === 'staff_payroll') return '/staff';
        if (view === 'academics') return '/academics';
        if (view === 'timetable') return '/timetable';
        if (view === 'attendance') return '/attendance';
        if (view === 'calendar') return '/calendar';
        if (view === 'examinations') return '/examinations';
        if (view === 'report_cards') return '/report-cards';
        if (view === 'library') return '/library';
        if (view === 'communication') return '/communication';
        if (view === 'reporting') return '/reporting';
        if (view === 'settings') return '/settings';

        // Teacher Routes
        if (view === 'teacher_dashboard') return '/teacher';
        if (view === 'my_class') return '/teacher-my-class';
        if (view === 'teacher_attendance') return '/teacher-attendance';
        if (view === 'teacher_examinations') return '/teacher-examinations';
        if (view === 'teacher_communication') return '/teacher-communication';

        // Parent Routes
        if (view === 'parent_dashboard') return '/parent';
        if (view === 'parent_child_details') return '/parent-child-details';
        if (view === 'parent_finances') return '/parent-finances';
        if (view === 'parent_announcements') return '/parent-announcements';

        // Super Admin
        if (view === 'super_admin_dashboard') return '/super-admin';
        
        return `/${view.replace('_', '-')}`;
    };

    const isActive = (path: string) => {
        if (path === '/' && location.pathname === '/') return true;
        if (path !== '/' && location.pathname.startsWith(path)) return true;
        return false;
    };

    return (
        <>
            {/* Mobile overlay */}
            <div 
                className={`fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-200 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsMobileSidebarOpen(false)}
            ></div>

            {/* Sidebar */}
            <aside 
                className={`fixed top-0 left-0 h-full bg-white flex flex-col z-40 transition-all duration-300 ease-in-out shadow-xl
                ${isSidebarCollapsed ? 'w-20' : 'w-64'}
                lg:translate-x-0 
                ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <SaaslinkLogo 
                    schoolName={displayName} 
                    logoUrl={schoolInfo?.logoUrl} 
                    isCollapsed={isSidebarCollapsed} 
                />
                
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    {navigationItems.filter(isAllowed).map(item => {
                        const path = getPath(item.view);
                        return (
                            <Link
                                key={item.view}
                                to={path}
                                onClick={() => setIsMobileSidebarOpen(false)}
                                className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 group relative ${
                                    isSidebarCollapsed ? 'justify-center' : ''} ${
                                    isActive(path)
                                        ? 'bg-primary-600 text-[#D1D8D5] shadow-md'
                                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                <div className="flex-shrink-0">{item.icon}</div>
                                <span className={`ml-4 whitespace-nowrap transition-opacity duration-300 ease-in-out ${isSidebarCollapsed ? 'opacity-0 w-0 hidden' : 'opacity-100'}`}>{item.label}</span>
                                {isSidebarCollapsed && (
                                    <span className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md text-white bg-slate-800 text-xs font-bold transition-all duration-100 scale-0 group-hover:scale-100 origin-left z-50">
                                        {item.label}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                </nav>
                <div className={`px-4 py-4 mt-auto border-t border-slate-200 transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                    <div className="text-center text-xs text-slate-400">
                        &copy; {new Date().getFullYear()} Saaslink Tech.
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
