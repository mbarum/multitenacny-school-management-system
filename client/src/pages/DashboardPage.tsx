import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Users, 
  UserCheck, 
  DollarSign, 
  Activity, 
  GraduationCap, 
  FileText, 
  Book, 
  ShieldAlert, 
  ArrowRight, 
  BarChart3, 
  ArrowUpRight,
  Plus,
  Clock,
  Calendar,
  Settings,
  Bell,
  TrendingUp
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  revenueThisMonth: number;
  recentStudents: { id: string; name: string; email: string }[];
  revenueProjection?: { month: string; amount: number }[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  category: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchAnnouncements();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('reporting/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('communication/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      console.error('Failed to fetch announcements', error);
    }
  };

  const menuItems = [
    { title: 'Students', description: 'Manage records and enrollment.', icon: <Users size={18} />, path: '/students', color: 'text-indigo-500 bg-indigo-50/50 dark:bg-indigo-500/10' },
    { title: 'Finance', description: 'Fee collection and invoicing.', icon: <DollarSign size={18} />, path: '/finance', color: 'text-emerald-500 bg-emerald-50/50 dark:bg-emerald-500/10' },
    { title: 'Attendance', description: 'Daily tracking and attendance.', icon: <Activity size={18} />, path: '/attendance', color: 'text-rose-500 bg-rose-50/50 dark:bg-rose-500/10' },
    { title: 'Timetable', description: 'Schedule and class routine.', icon: <Clock size={18} />, path: '/timetable', color: 'text-violet-500 bg-violet-50/50 dark:bg-violet-500/10' },
    { title: 'Calendar', description: 'School events and deadlines.', icon: <Calendar size={18} />, path: '/calendar', color: 'text-sky-500 bg-sky-50/50 dark:bg-sky-500/10' },
    { title: 'Reporting', description: 'Academic and financial reports.', icon: <BarChart3 size={18} />, path: '/reports', color: 'text-amber-500 bg-amber-50/50 dark:bg-amber-500/10' },
    { title: 'Library', description: 'Lending and catalog management.', icon: <Book size={18} />, path: '/library', color: 'text-teal-500 bg-teal-50/50 dark:bg-teal-500/10' },
    { title: 'Staff', description: 'HR and payroll management.', icon: <UserCheck size={18} />, path: '/staff', color: 'text-fuchsia-500 bg-fuchsia-50/50 dark:bg-fuchsia-500/10' },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center">
            <Activity className="animate-spin text-primary mb-6" size={40} />
            <div className="flex flex-col items-center space-y-1">
              <span className="text-sm font-semibold text-on-surface">Loading Dashboard</span>
              <span className="text-xs text-slate-400">Please wait while we prepare your data</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-page-bg pb-24 font-body selection:bg-brand-green/10 selection:text-brand-green">
      <SEO title="Admin Dashboard" />
      
      {/* Announcement Ticker */}
      {announcements.length > 0 && (
        <div className="bg-brand-green-dark text-white overflow-hidden py-1.5 relative z-[60]">
          <div className="max-w-7xl mx-auto px-4 flex items-center">
            <div className="flex items-center gap-2 mr-6 shrink-0 bg-brand-gold text-white px-2.5 py-1 rounded">
              <Bell size={11} className="animate-pulse" />
              <span className="text-[10px] font-display font-extrabold uppercase tracking-wider">Notice</span>
            </div>
            <div className="flex-1 overflow-hidden">
               <div className="whitespace-nowrap flex gap-12 animate-[ticker_30s_linear_infinite] hover:[animation-play-state:paused] cursor-default">
                  {announcements.map((a, i) => (
                    <div key={a.id} className="inline-flex items-center gap-3">
                       <span className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
                       <span className="text-[13px] font-body text-white/90">
                         <span className="font-bold text-brand-gold mr-2">{a.category}</span>
                         {a.title}: {a.content}
                       </span>
                    </div>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {announcements.map((a, i) => (
                    <div key={`${a.id}-dup`} className="inline-flex items-center gap-3">
                       <span className="w-1.5 h-1.5 bg-brand-gold rounded-full" />
                       <span className="text-[13px] font-body text-white/90">
                         <span className="font-bold text-brand-gold mr-2">{a.category}</span>
                         {a.title}: {a.content}
                       </span>
                    </div>
                  ))}
               </div>
            </div>
          </div>
          <style>{`
            @keyframes ticker {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
        </div>
      )}

      <div className="py-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center space-x-2 text-[12px] font-display font-medium text-brand-gold uppercase tracking-[0.06em] mb-3">
                 <span>PropCloud360 System</span>
              </div>
              <h1 className="text-[36px] font-display font-extrabold text-brand-green tracking-[-0.02em] leading-tight mb-2">
                School Dashboard
              </h1>
              <p className="text-brand-charcoal font-body text-[15px]">
                Welcome back, <span className="font-medium">{user?.username}</span>. Here is your overview for today.
              </p>
            </motion.div>
            <div className="flex items-center space-x-4">
               <Link 
                to="/students" 
                className="btn-prop-primary flex items-center shadow-none"
               >
                  <Plus size={18} className="mr-2" />
                  Enroll student
               </Link>
            </div>
          </div>

        {/* Core Metrics Layer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="prop-stat-card"
           >
              <div className="text-[12px] font-body font-medium text-brand-charcoal/70 uppercase tracking-[0.06em] mb-1">Enrolled students</div>
              <div className="text-[26px] font-display font-bold text-brand-green">{stats?.totalStudents || 0}</div>
           </motion.div>

           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="prop-stat-card"
           >
              <div className="text-[12px] font-body font-medium text-brand-charcoal/70 uppercase tracking-[0.06em] mb-1">Academic staff</div>
              <div className="text-[26px] font-display font-bold text-brand-green">{stats?.totalStaff || 0}</div>
           </motion.div>

           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="prop-stat-card"
           >
              <div className="text-[12px] font-body font-medium text-brand-charcoal/70 uppercase tracking-[0.06em] mb-1">Monthly revenue</div>
              <div className="text-[26px] font-display font-bold text-brand-green">KES {(stats?.revenueThisMonth || 0).toLocaleString()}</div>
           </motion.div>

           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="prop-stat-card"
           >
              <div className="text-[12px] font-body font-medium text-brand-charcoal/70 uppercase tracking-[0.06em] mb-1">System status</div>
              <div className="flex items-center text-[26px] font-display font-bold text-brand-green">
                 <div className="w-3 h-3 bg-brand-green rounded-full mr-2" />
                 Active
              </div>
           </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           {/* Module Selection */}
           <div className="lg:col-span-8">
              <h2 className="text-[22px] font-display font-bold text-brand-green tracking-[-0.01em] mb-6">Management modules</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      to={item.path}
                      className="group flex flex-col p-6 bg-white border border-brand-border rounded-[12px] hover:bg-brand-green-tint transition-all duration-300"
                    >
                      <div className="w-12 h-12 rounded-lg bg-brand-green-tint flex items-center justify-center mb-6 text-brand-green group-hover:bg-brand-green group-hover:text-white transition-all">
                        {item.icon}
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[16px] font-display font-semibold text-brand-green">{item.title}</h4>
                        <ArrowRight size={18} className="text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-brand-charcoal text-[15px] font-body">{item.description}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
           </div>

           {/* Recent Activity */}
           <div className="lg:col-span-4">
              <h2 className="text-[22px] font-display font-bold text-brand-green tracking-[-0.01em] mb-6">Recent activity</h2>
              <div className="bg-white border border-brand-border rounded-[12px] overflow-hidden">
                 <div className="bg-brand-green-tint px-5 py-3 border-b border-brand-border flex items-center justify-between">
                    <span className="text-[11px] font-body font-medium uppercase tracking-[0.06em] text-brand-charcoal">New students</span>
                    <Link to="/students" className="text-[11px] font-body font-medium uppercase tracking-[0.06em] text-brand-green hover:underline">View all</Link>
                 </div>
                 <div className="p-5 space-y-5">
                    {stats?.recentStudents.map((student, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={student.id} 
                        className="flex items-center justify-between group"
                      >
                         <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 rounded-full bg-brand-green-tint flex items-center justify-center text-brand-green-dark font-display font-bold text-[13px]">
                               {student.name.charAt(0)}
                            </div>
                            <div>
                               <p className="text-[14px] font-body font-medium text-brand-charcoal truncate max-w-[140px]">{student.name}</p>
                               <p className="text-[11px] font-body text-brand-charcoal/50">ID: {student.id.slice(0, 8)}</p>
                            </div>
                         </div>
                         <ArrowRight size={14} className="text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    ))}
                 </div>
                 <div className="p-5 pt-0">
                    <Link to="/students" className="btn-prop-outline w-full flex items-center justify-center py-2 text-[13px]">
                       <Plus size={14} className="mr-2" />
                       View all enrollments
                    </Link>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* System Status Bar */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-brand-border px-8 py-3 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[11px] font-body font-medium text-brand-charcoal/60">
           <div className="flex items-center space-x-8">
              <div className="flex items-center">
                 <div className="w-2 h-2 bg-brand-green rounded-full mr-2" />
                 <span>Secure server connection</span>
              </div>
              <div className="hidden sm:flex items-center">
                 <Activity size={12} className="mr-2 text-brand-gold" />
                 <span>PropCloud360 Data Cloud Sync</span>
              </div>
           </div>
           <div className="text-[11px] font-display font-bold text-brand-green/40 hidden md:block">
             PROPCloud360 Academic ERP
           </div>
           <div className="flex items-center space-x-2">
              <Clock size={12} className="mr-1" />
              <span>{new Date().toLocaleTimeString()}</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
