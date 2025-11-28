import React from 'react';
import type { NavItem } from '../../constants';
import type { Role, SchoolInfo } from '../../types';
import { useData } from '../../contexts/DataContext';

const SaaslinkLogo: React.FC<{ schoolName: string; logoUrl?: string; isCollapsed: boolean; }> = ({ schoolName, logoUrl, isCollapsed }) => (
    <div className="flex items-center justify-center py-5 px-4 border-b border-slate-200 h-16">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : ''} w-full`}>
            {logoUrl ? (
                <img src={logoUrl} alt="School Logo" className="h-10 w-10 rounded-full object-cover flex-shrink-0" />
            ) : (
                <svg className="h-10 w-10 text-primary-600 flex-shrink-0" viewBox="0 0 100 100" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path d="M50 0C22.38 0 0 22.38 0 50C0 77.62 22.38 100 50 100C77.62 100 100 77.62 100 50C100 22.38 77.62 0 50 0ZM65.82 68.32C60.36 74.5 50 71.18 50 71.18C50 71.18 39.64 74.5 34.18 68.32C28.32 61.66 31.46 50 31.46 50C31.46 50 28.32 38.34 34.18 31.68C39.64 25.5 50 28.82 50 28.82C50 28.82 60.36 25.5 65.82 31.68C71.68 38.34 68.54 50 68.54 50C68.54 50 71.68 61.66 65.82 68.32Z"/>
                </svg>
            )}
            <span className={`ml-3 text-xl font-bold text-primary-800 transition-opacity duration-300 ease-in-out ${isCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{schoolName}</span>
        </div>
    </div>
);

const Sidebar: React.FC = () => {
    const {
        activeView,
        setActiveView,
        currentUser,
        schoolInfo,
        getNavigationItems,
        isSidebarCollapsed,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen
    } = useData();

    if (!currentUser || !schoolInfo) return null;

    const navigationItems = getNavigationItems();

    const isAllowed = (navItem: NavItem) => navItem.allowedRoles.includes(currentUser.role);

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
                <SaaslinkLogo schoolName={schoolInfo.name} logoUrl={schoolInfo.logoUrl} isCollapsed={isSidebarCollapsed} />
                <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
                    {navigationItems.filter(isAllowed).map(item => (
                        <a
                            key={item.view}
                            href="#"
                            onClick={(e) => {
                                e.preventDefault();
                                setActiveView(item.view);
                                setIsMobileSidebarOpen(false);
                            }}
                            className={`flex items-center px-4 py-3 text-base font-medium rounded-lg transition-all duration-200 group relative ${
                                isSidebarCollapsed ? 'justify-center' : ''} ${
                                activeView === item.view
                                    ? 'bg-primary-600 text-[#D1D8D5] shadow-md'
                                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                        >
                            <div className="flex-shrink-0">{item.icon}</div>
                            <span className={`ml-4 whitespace-nowrap transition-opacity duration-300 ease-in-out ${isSidebarCollapsed ? 'opacity-0 w-0' : 'opacity-100'}`}>{item.label}</span>
                             {isSidebarCollapsed && (
                                <span className="absolute left-full ml-4 w-auto p-2 min-w-max rounded-md shadow-md text-white bg-slate-800 text-xs font-bold transition-all duration-100 scale-0 group-hover:scale-100 origin-left">
                                    {item.label}
                                </span>
                            )}
                        </a>
                    ))}
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