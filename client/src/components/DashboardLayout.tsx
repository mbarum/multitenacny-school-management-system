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
    { icon: <UserCheck size={20} />, label: 'Staff Management', path: '/staff', roles: [UserRole.ADMIN] },
    { icon: <Wallet size={20} />, label: 'Payroll', path: '/payroll', roles: [UserRole.ADMIN] },
    { icon: <DollarSign size={20} />, label: 'Finance', path: '/finance', roles: [UserRole.ADMIN] },
    { icon: <Library size={20} />, label: 'Library', path: '/library', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <Globe size={20} />, label: 'LMS Connect', path: '/lms', roles: [UserRole.ADMIN] },
    { icon: <Calendar size={20} />, label: 'Attendance', path: isTeacher ? '/teacher/attendance' : '/attendance', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <FileText size={20} />, label: 'Reporting', path: '/reports', roles: [UserRole.ADMIN, UserRole.TEACHER] },
    { icon: <CreditCard size={20} />, label: 'Payments', path: '/payments', roles: [UserRole.ADMIN, UserRole.PARENT] },
    { icon: <Settings size={20} />, label: 'School Settings', path: '/settings', roles: [UserRole.ADMIN] },
  ];

  const filteredItems = menuItems.filter(item => item.roles.includes(user?.role as UserRole));

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 selection:bg-primary/20 transition-colors duration-200">
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[90] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-[100] w-64 bg-surface border-r border-border-muted flex flex-col transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
               <GraduationCap className="text-white" size={20} />
            </div>
            <span className="text-lg font-bold tracking-tight text-on-surface">EduStream</span>
          </Link>
        </div>

        <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-2 custom-scrollbar">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-2">Management</div>
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-500 hover:text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className={`mr-3 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                   {React.cloneElement(item.icon as React.ReactElement, { size: 18 })}
                </span>
                {item.label}
              </Link>
            );
          })}

          {isSuperAdmin && (
            <div className="mt-6 pt-6 border-t border-border-muted">
               <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest px-4 mb-2">Platform</div>
               <Link
                to="/super-admin/tenants"
                className={`flex items-center px-4 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  location.pathname.includes('/super-admin/tenants') 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-500 hover:text-on-surface hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <ShieldAlert size={18} className="mr-3" />
                Institutions
               </Link>
            </div>
          )}
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 border border-border-muted shadow-sm">
             <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-surface border border-border-muted flex items-center justify-center text-on-surface font-bold text-sm shadow-sm">
                   {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-semibold text-on-surface truncate">{user?.username}</p>
                   <p className="text-[10px] text-slate-400 font-medium truncate">{user?.email}</p>
                </div>
             </div>
             <button 
              onClick={logout} 
              className="flex items-center w-full px-3 py-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg text-[11px] font-semibold transition-all"
             >
                <LogOut size={14} className="mr-2" />
                Sign Out
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-border-muted flex items-center justify-between px-6 sticky top-0 z-40">
          <div className="flex items-center flex-1">
            <button 
               onClick={() => setIsSidebarOpen(true)}
               className="lg:hidden p-2 rounded-lg bg-slate-50 border border-border-muted text-slate-600 mr-4 shadow-sm"
            >
               <Menu size={18} />
            </button>
            
            <div className="relative max-w-sm w-full hidden md:block">
               <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
               <input 
                type="text" 
                placeholder="Search..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50/50 border border-border-muted rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
               />
            </div>
          </div>

          <div className="flex items-center space-x-4">
             <button 
               onClick={toggleTheme}
               className="p-2 rounded-lg bg-slate-50 border border-border-muted text-slate-400 hover:text-primary transition-all shadow-sm"
             >
               {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
             </button>

             <button className="relative p-2 rounded-lg bg-slate-50 border border-border-muted text-slate-400 hover:text-primary transition-all shadow-sm">
                <Bell size={16} />
                <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full border border-white" />
             </button>
             
             <div className="h-6 w-[1px] bg-border-muted mx-1" />
             
             <div className="flex items-center space-x-2.5 cursor-pointer group">
                <div className="hidden sm:block text-right">
                   <p className="text-[11px] font-semibold text-on-surface leading-none mb-0.5">{user?.username}</p>
                   <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{user?.role?.replace('_', ' ')}</p>
                </div>
                <div className="w-8 h-8 rounded-lg border border-border-muted group-hover:border-primary transition-all p-0.5 bg-white">
                   <div className="w-full h-full bg-slate-100 rounded-md flex items-center justify-center text-slate-500 font-bold text-xs">
                      {user?.username?.charAt(0).toUpperCase()}
                   </div>
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
