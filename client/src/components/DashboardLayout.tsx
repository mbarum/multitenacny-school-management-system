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
  LayoutDashboard,
  ShieldAlert,
  Globe,
  Wallet,
  Library,
  Moon,
  Sun,
  Bell,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserRole } from '../../../src/common/user-role.enum';
import { useTheme } from '../context/ThemeContext';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isTeacher = user?.role === UserRole.TEACHER;
  const isParent = user?.role === UserRole.PARENT;

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: isSuperAdmin ? '/super-admin' : (isTeacher ? '/teacher' : (isParent ? '/parent' : '/dashboard')), roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.TEACHER, UserRole.PARENT] },
    { icon: <Users size={20} />, label: 'Students', path: '/students', roles: [UserRole.ADMIN] },
    { icon: <GraduationCap size={20} />, label: 'Academics', path: '/academics/classes', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <Activity size={20} />, label: 'Timetable', path: '/timetable', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <Calendar size={20} />, label: 'Calendar', path: '/calendar', roles: [UserRole.ADMIN, UserRole.TEACHER, UserRole.PARENT] },
    { icon: <UserCheck size={20} />, label: 'Staff Management', path: '/staff', roles: [UserRole.ADMIN] },
    { icon: <Wallet size={20} />, label: 'Payroll', path: '/payroll', roles: [UserRole.ADMIN] },
    { icon: <DollarSign size={20} />, label: 'Finance', path: '/finance', roles: [UserRole.ADMIN] },
    { icon: <Library size={20} />, label: 'Library', path: '/library', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <Globe size={20} />, label: 'LMS Connect', path: '/lms', roles: [UserRole.ADMIN] },
    { icon: <Activity size={20} />, label: 'Attendance', path: isTeacher ? '/teacher/attendance' : '/attendance', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <FileText size={20} />, label: 'Reporting', path: '/reports', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <CreditCard size={20} />, label: 'Online Fee Portal', path: '/payments', roles: [UserRole.PARENT] },
    { icon: <Zap size={20} />, label: 'Billing & Sub', path: '/pricing', roles: [UserRole.ADMIN] },
    { icon: <Settings size={20} />, label: 'School Settings', path: '/settings', roles: [UserRole.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role as UserRole));

  return (
    <div className="min-h-screen bg-brand-page-bg flex font-body text-brand-charcoal selection:bg-brand-green/20 transition-colors duration-200">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-brand-green-dark/60 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[100] w-64 bg-brand-green-dark flex flex-col transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="h-14 flex items-center px-6 bg-brand-green">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-8 h-8 rounded bg-brand-gold flex items-center justify-center">
               <GraduationCap className="text-white" size={20} />
            </div>
            <span className="text-lg font-display font-extrabold tracking-tight text-white">SaaSLink</span>
          </Link>
        </div>

        <nav className="flex-1 px-0 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
          <div className="text-[11px] font-medium text-white/40 uppercase tracking-[0.1em] px-6 mb-3">Management</div>
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-6 py-3 text-[13px] font-medium transition-all group border-l-4 ${
                  isActive 
                    ? 'bg-white/5 text-white border-l-brand-gold' 
                    : 'text-white/60 hover:text-white hover:bg-white/5 border-l-transparent'
                }`}
              >
                <span className={`mr-3 transition-colors ${isActive ? 'text-brand-gold' : 'text-white/40 group-hover:text-white/60'}`}>
                   {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
                </span>
                {item.label}
              </Link>
            );
          })}

          {isSuperAdmin && (
            <div className="mt-6 pt-6 border-t border-white/10">
               <div className="text-[11px] font-medium text-white/40 uppercase tracking-[0.1em] px-6 mb-3">Platform</div>
               <Link
                to="/super-admin/tenants"
                className={`flex items-center px-6 py-3 text-[13px] font-medium transition-all group border-l-4 ${
                  location.pathname.includes('/super-admin/tenants') 
                    ? 'bg-white/5 text-white border-l-brand-gold' 
                    : 'text-white/60 hover:text-white hover:bg-white/5 border-l-transparent'
                }`}
              >
                <ShieldAlert size={18} className="mr-3 text-white/40 group-hover:text-white/60" />
                Institutions
               </Link>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center space-x-3 p-2">
             <div className="w-8 h-8 rounded-full bg-brand-green-tint flex items-center justify-center text-brand-green-dark font-display font-bold text-sm">
                {user?.username?.charAt(0).toUpperCase()}
             </div>
             <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">{user?.username}</p>
                <p className="text-[10px] text-white/40 truncate">{user?.email}</p>
             </div>
          </div>
          <button 
            onClick={logout} 
            className="flex items-center w-full mt-2 px-3 py-2 text-white/50 hover:text-white hover:bg-white/5 rounded-lg text-[12px] font-medium transition-all"
          >
             <LogOut size={14} className="mr-2" />
             Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-14 bg-white border-b border-brand-border flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center flex-1">
            <button 
               onClick={() => setIsSidebarOpen(true)}
               className="lg:hidden p-2 rounded-lg bg-brand-green-tint text-brand-green mr-4"
            >
               <Menu size={18} />
            </button>
            
            <div className="relative max-w-sm w-full hidden md:block">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={16} />
               <input 
                type="text" 
                placeholder="Search resources..." 
                className="h-10 w-full pl-10 pr-4 bg-brand-page-bg border border-brand-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green transition-all"
               />
            </div>
          </div>

          <div className="flex items-center space-x-6">
             <button className="relative p-2 text-brand-charcoal/60 hover:text-brand-green transition-colors">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-brand-gold rounded-full border-2 border-white" />
             </button>
             
             <div className="flex items-center space-x-3 cursor-pointer group">
                <div className="hidden sm:block text-right">
                   <p className="text-[13px] font-medium text-brand-charcoal leading-none mb-1">{user?.username}</p>
                   <p className="text-[11px] font-medium text-brand-charcoal/50 uppercase tracking-widest">{user?.role?.replace('_', ' ')}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-brand-green-tint flex items-center justify-center text-brand-green-dark font-display font-bold text-sm border border-brand-green/10">
                   {user?.username?.charAt(0).toUpperCase()}
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
