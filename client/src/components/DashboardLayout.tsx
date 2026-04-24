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
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: isSuperAdmin ? '/super-admin' : (isTeacher ? '/teacher' : (isParent ? '/parent' : '/dashboard')), roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER, UserRole.PARENT] },
    { icon: <Users size={20} />, label: 'Students', path: '/students', roles: [UserRole.ADMIN] },
    { icon: <GraduationCap size={20} />, label: 'Academics', path: '/academics/classes', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <UserCheck size={20} />, label: 'Staff', path: '/staff', roles: [UserRole.ADMIN] },
    { icon: <Wallet size={20} />, label: 'Payroll', path: '/payroll', roles: [UserRole.ADMIN] },
    { icon: <ShieldAlert size={20} />, label: 'Admissions', path: '/admissions', roles: [UserRole.ADMIN] },
    { icon: <DollarSign size={20} />, label: 'Finance', path: '/finance', roles: [UserRole.ADMIN] },
    { icon: <Library size={20} />, label: 'Library', path: '/library', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <Globe size={20} />, label: 'LMS Connect', path: '/lms', roles: [UserRole.ADMIN] },
    { icon: <Calendar size={20} />, label: 'Attendance', path: isTeacher ? '/teacher/attendance' : '/attendance', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <FileText size={20} />, label: 'Reports', path: '/reports', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <CreditCard size={20} />, label: 'Payments', path: '/payments', roles: [UserRole.ADMIN, UserRole.PARENT] },
    { icon: <Settings size={20} />, label: 'Settings', path: '/settings', roles: [UserRole.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role as UserRole));

  const isRootPath = ['/dashboard', '/super-admin', '/teacher', '/parent'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex font-sans text-[#111827]">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[100] w-72 bg-white border-r border-gray-200/60 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 flex items-center space-x-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
            <GraduationCap className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-display font-black tracking-tight text-gray-900 leading-none">SAASLINK</h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Institutional OS</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar pt-4">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-4 mb-4">Core Management</div>
          {filteredItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center px-4 py-3 rounded-xl font-semibold text-[13px] transition-all duration-200 group ${
                location.pathname === item.path 
                  ? 'bg-indigo-50 text-indigo-700' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span className={`mr-4 transition-colors duration-200 ${location.pathname === item.path ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-900'}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          ))}

          {isSuperAdmin && (
            <div className="mt-8 pt-8 border-t border-gray-100">
               <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] px-4 mb-4">Platform Control</div>
               <Link
                to="/super-admin/tenants"
                className={`flex items-center px-4 py-3.5 rounded-2xl font-bold text-[13px] transition-all duration-200 group ${
                  location.pathname.includes('/super-admin/tenants') 
                    ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/10' 
                    : 'text-gray-500 hover:bg-purple-50 hover:text-purple-600'
                }`}
              >
                <ShieldAlert size={20} className="mr-4" />
                Schools Mapping
              </Link>
            </div>
          )}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-gray-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center space-x-3 mb-1">
              <div className="w-8 h-8 rounded-full bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xs">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 truncate">{user?.username}</p>
                <p className="text-[10px] text-gray-400 font-medium truncate">{user?.email}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center w-full px-5 py-4 text-red-500 hover:bg-red-50 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95"
          >
            <LogOut size={18} className="mr-3" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center">
            <button 
               onClick={() => setIsSidebarOpen(true)}
               className="lg:hidden p-2 rounded-xl bg-gray-50 text-gray-600 mr-4"
            >
               <Menu size={20} />
            </button>
            
            {!isRootPath && (
              <button 
                onClick={() => navigate(-1)}
                className="flex items-center text-sm font-bold text-gray-500 hover:text-brand-green transition-colors group mr-6"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center mr-2 group-hover:bg-brand-green/10 transition-colors">
                   <ChevronLeft size={18} />
                </div>
                <span>Back</span>
              </button>
            )}
            
            <div className="h-6 w-[1px] bg-gray-200 mr-6 hidden sm:block" />
            
            <h1 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 hidden sm:block">
              {location.pathname.split('/').filter(Boolean).pop()?.replace('-', ' ') || 'Overview'}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
             {isAdmin && (
               <Link to="/pricing" className="hidden md:flex items-center space-x-2 px-4 py-2 bg-brand-sand/10 rounded-full border border-brand-sand/20 group">
                  <Zap size={14} className="text-brand-sand animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-sand">Upgrade Tier</span>
               </Link>
             )}
             <div className="w-10 h-10 rounded-xl bg-gray-100 border border-gray-200" />
          </div>
        </header>

        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
