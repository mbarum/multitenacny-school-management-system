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
    { icon: <ShieldAlert size={20} />, label: 'Admissions', path: '/admissions', roles: [UserRole.ADMIN] },
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
        fixed lg:static inset-y-0 left-0 z-[100] w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 pb-12">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
               <GraduationCap className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">EduStream</span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-2 custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4 italic">Management</div>
          {filteredItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3.5 rounded-xl text-sm font-bold transition-all group ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <span className={`mr-4 transition-colors ${isActive ? 'text-primary' : 'text-slate-400 group-hover:text-slate-600'}`}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}

          {isSuperAdmin && (
            <div className="mt-8 pt-8 border-t border-slate-100">
               <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-4 italic">Platform</div>
               <Link
                to="/super-admin/tenants"
                className={`flex items-center px-4 py-3.5 rounded-xl text-sm font-bold transition-all group ${
                  location.pathname.includes('/super-admin/tenants') 
                    ? 'bg-slate-900 text-white shadow-xl' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <ShieldAlert size={20} className="mr-4 text-slate-400" />
                Institutions
               </Link>
            </div>
          )}
        </nav>

        <div className="p-6 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 shadow-inner">
             <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-900 font-bold text-lg shadow-sm">
                   {user?.username?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-xs font-bold text-slate-900 truncate">{user?.username}</p>
                   <p className="text-[10px] text-slate-400 font-medium truncate lowercase italic">{user?.email}</p>
                </div>
             </div>
             <button 
              onClick={logout} 
              className="flex items-center w-full px-4 py-2.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl text-xs font-bold transition-all group"
             >
                <LogOut size={16} className="mr-3" />
                Sign Out
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center flex-1">
            <button 
               onClick={() => setIsSidebarOpen(true)}
               className="lg:hidden p-2 rounded-xl bg-slate-50 text-slate-600 mr-4 border border-slate-200 shadow-sm"
            >
               <Menu size={20} />
            </button>
            
            <div className="relative max-w-md w-full hidden md:block">
               <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
               <input 
                type="text" 
                placeholder="Search students, staff, reports..." 
                className="w-full pl-12 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary transition-all shadow-inner"
               />
            </div>
          </div>

          <div className="flex items-center space-x-6">
             <button 
               onClick={toggleTheme}
               className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm"
             >
               {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
             </button>

             <button className="relative p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-primary transition-all shadow-sm">
                <Bell size={18} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
             </button>
             
             <div className="h-8 w-[1px] bg-slate-200 mx-2" />
             
             <div className="flex items-center space-x-3 cursor-pointer group">
                <div className="hidden sm:block text-right">
                   <p className="text-xs font-bold text-slate-900 leading-none mb-1 group-hover:text-primary transition-colors">{user?.username}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{user?.role}</p>
                </div>
                <div className="w-10 h-10 rounded-xl border-2 border-slate-100 group-hover:border-primary transition-all p-0.5">
                   <div className="w-full h-full bg-slate-200 rounded-lg flex items-center justify-center text-slate-500 font-bold shadow-inner">
                      {user?.username?.charAt(0).toUpperCase()}
                   </div>
                </div>
             </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
