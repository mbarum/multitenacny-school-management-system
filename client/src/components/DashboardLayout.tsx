import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  Activity, 
  LogOut, 
  Settings, 
  GraduationCap, 
  Calendar, 
  FileText, 
  CreditCard, 
  Zap,
  ChevronLeft,
  Menu,
  X,
  LayoutDashboard,
  ShieldAlert,
  Book,
  Globe,
  Wallet,
  Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../../../src/common/user-role.enum';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isTeacher = user?.role === UserRole.TEACHER;
  const isParent = user?.role === UserRole.PARENT;

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Overview', path: isSuperAdmin ? '/super-admin' : (isTeacher ? '/teacher' : (isParent ? '/parent' : '/dashboard')), roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER, UserRole.PARENT] },
    { icon: <Users size={18} />, label: 'Registry', path: '/students', roles: [UserRole.ADMIN] },
    { icon: <GraduationCap size={18} />, label: 'Academics', path: '/academics/classes', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <UserCheck size={18} />, label: 'Staffing', path: '/staff', roles: [UserRole.ADMIN] },
    { icon: <Wallet size={18} />, label: 'Payroll', path: '/payroll', roles: [UserRole.ADMIN] },
    { icon: <ShieldAlert size={18} />, label: 'Intake', path: '/admissions', roles: [UserRole.ADMIN] },
    { icon: <DollarSign size={18} />, label: 'Fiscal Ledger', path: '/finance', roles: [UserRole.ADMIN] },
    { icon: <Library size={18} />, label: 'Library', path: '/library', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <Globe size={18} />, label: 'LMS Connect', path: '/lms', roles: [UserRole.ADMIN] },
    { icon: <Calendar size={18} />, label: 'Attendance', path: isTeacher ? '/teacher/attendance' : '/attendance', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <FileText size={18} />, label: 'Analytics', path: '/reports', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <CreditCard size={18} />, label: 'Payments', path: '/payments', roles: [UserRole.ADMIN, UserRole.PARENT] },
    { icon: <Settings size={18} />, label: 'Configuration', path: '/settings', roles: [UserRole.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role as UserRole));

  const isRootPath = ['/dashboard', '/super-admin', '/teacher', '/parent'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#F0F0F0] flex font-sans text-gray-900 selection:bg-gray-900 selection:text-white">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-gray-900/10 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[100] w-64 bg-[#F0F0F0] border-r border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 pb-12 flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-900 rounded-sm flex items-center justify-center">
            <Activity className="text-white" size={16} />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-widest text-gray-900 leading-none uppercase italic">Saaslink</h2>
            <div className="h-[1px] w-full bg-gray-900 mt-0.5" />
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto pt-4 scrollbar-hide">
          <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest px-4 mb-6">Operations</div>
          {filteredItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-2 rounded-sm text-[11px] font-bold tracking-tight uppercase transition-all duration-150 group ${
                location.pathname === item.path 
                  ? 'bg-gray-900 text-white shadow-xl' 
                  : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200/50'
              }`}
            >
              <span className={`mr-4 transition-colors duration-200 ${location.pathname === item.path ? 'text-white' : 'text-gray-300 group-hover:text-gray-900'}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}

          {isSuperAdmin && (
            <div className="mt-8 pt-8 border-t border-gray-200">
               <div className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest px-4 mb-4">Platform</div>
               <Link
                to="/super-admin/tenants"
                className={`flex items-center px-4 py-2 rounded-sm text-[11px] font-bold tracking-tight uppercase transition-all duration-150 group ${
                  location.pathname.includes('/super-admin/tenants') 
                    ? 'bg-gray-900 text-white shadow-xl' 
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-200/50'
                }`}
              >
                <ShieldAlert size={18} className="mr-4" />
                Index Mapping
              </Link>
            </div>
          )}
        </nav>

        <div className="p-6 mt-auto">
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center space-x-3 mb-6 px-2">
              <div className="w-8 h-8 rounded-sm bg-gray-200 flex items-center justify-center text-gray-600 font-serif italic text-sm border border-gray-300">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-gray-900 truncate uppercase tracking-tight">{user?.username}</p>
                <p className="text-[9px] text-gray-400 font-mono truncate lowercase">{user?.email}</p>
              </div>
            </div>
            <button 
              onClick={logout} 
              className="flex items-center w-full px-4 py-2 text-gray-400 hover:border-gray-900 hover:text-gray-900 border border-transparent rounded-sm text-[10px] font-bold uppercase tracking-widest transition-all"
            >
              <LogOut size={14} className="mr-3" />
              Terminate
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#F5F5F5]">
        {/* Header */}
        <header className="h-16 bg-[#F5F5F5] border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center">
            <button 
               onClick={() => setIsSidebarOpen(true)}
               className="lg:hidden p-2 rounded-sm bg-gray-100 text-gray-600 mr-4"
            >
               <Menu size={18} />
            </button>
            
            {!isRootPath && (
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors group mr-6 uppercase tracking-widest"
              >
                <ChevronLeft size={14} className="mr-1" />
                <span>Return</span>
              </button>
            )}
            
            <div className="h-4 w-[1px] bg-gray-200 mr-6 hidden sm:block" />
            
            <h1 className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400 hidden sm:block">
              {location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Matrix Overview'}
            </h1>
          </div>

          <div className="flex items-center space-x-6">
             {isAdmin && (
               <Link to="/pricing" className="hidden md:flex items-center space-x-2 text-gray-400 hover:text-gray-900 transition-colors uppercase">
                  <Zap size={14} />
                  <span className="text-[9px] font-bold tracking-widest">Upgrade Index</span>
               </Link>
             )}
             <div className="w-8 h-8 rounded-sm bg-gray-50 border border-gray-200 shadow-inner" />
          </div>
        </header>

        <main className="flex-1 p-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
