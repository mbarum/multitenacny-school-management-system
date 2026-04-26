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
    { title: 'Attendance', description: 'Daily tracking and analytics.', icon: <Activity size={18} />, path: '/attendance', color: 'text-rose-500 bg-rose-50/50 dark:bg-rose-500/10' },
    { title: 'Timetable', description: 'Schedule and class routine.', icon: <Clock size={18} />, path: '/timetable', color: 'text-violet-500 bg-violet-50/50 dark:bg-violet-500/10' },
    { title: 'Calendar', description: 'School events and deadlines.', icon: <Calendar size={18} />, path: '/calendar', color: 'text-sky-500 bg-sky-50/50 dark:bg-sky-500/10' },
    { title: 'Reporting', description: 'Academic & fiscal intelligence.', icon: <BarChart3 size={18} />, path: '/reports', color: 'text-amber-500 bg-amber-50/50 dark:bg-amber-500/10' },
    { title: 'Library', description: 'Lending and catalog core.', icon: <Book size={18} />, path: '/library', color: 'text-teal-500 bg-teal-50/50 dark:bg-teal-500/10' },
    { title: 'Staff', description: 'HR and payroll management.', icon: <UserCheck size={18} />, path: '/staff', color: 'text-fuchsia-500 bg-fuchsia-50/50 dark:bg-fuchsia-500/10' },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-canvas">
        <div className="flex flex-col items-center">
            <Activity className="animate-spin text-primary mb-8" size={48} />
            <div className="flex flex-col items-center space-y-2">
              <span className="text-[10px] font-black text-on-surface uppercase tracking-[0.4em] italic leading-none">System Loading</span>
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Preparing Resources</span>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas pb-24 font-sans selection:bg-primary/10 selection:text-primary">
      <SEO title="Admin Dashboard" />
      {/* Announcement Ticker */}
      {announcements.length > 0 && (
        <div className="bg-slate-900 text-white overflow-hidden py-3 border-b border-white/5 relative z-[60]">
          <div className="max-w-7xl mx-auto px-8 flex items-center">
            <div className="flex items-center gap-2 mr-6 shrink-0 bg-rose-600 px-3 py-1 rounded-full">
              <Bell size={12} className="animate-bounce" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Live Feed</span>
            </div>
            <div className="flex-1 overflow-hidden">
               <div className="whitespace-nowrap flex gap-12 animate-[ticker_30s_linear_infinite] hover:[animation-play-state:paused] cursor-default">
                  {announcements.map((a, i) => (
                    <div key={a.id} className="inline-flex items-center gap-3">
                       <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                         <span className="text-primary font-black mr-2">[{a.category}]</span>
                         {a.title}: {a.content}
                       </span>
                    </div>
                  ))}
                  {/* Duplicate for seamless loop */}
                  {announcements.map((a, i) => (
                    <div key={`${a.id}-dup`} className="inline-flex items-center gap-3">
                       <span className="w-1.5 h-1.5 bg-primary rounded-full" />
                       <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white">
                         <span className="text-primary font-black mr-2">[{a.category}]</span>
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

      {/* Dynamic Header */}
      <header className="bg-surface border-b border-border-muted overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-8 py-12 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center space-x-2 text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">
                 <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                 <span>System Status: Online</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter leading-[0.9] mb-4 uppercase italic">
                Administrative <span className="text-slate-300 dark:text-slate-700 block md:inline font-normal">Dashboard</span>
              </h1>
              <p className="text-slate-500 text-sm font-bold tracking-tight">
                Authenticating as <span className="text-primary italic">{user?.username}</span>. Global system health is stable.
              </p>
            </motion.div>
            <div className="flex items-center space-x-4">
               <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-3.5 bg-surface border border-border-muted rounded-2xl text-slate-400 hover:text-primary transition-all shadow-sm group relative"
               >
                  <Bell size={20} />
                  <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-surface animate-bounce" />
               </motion.button>
               <Link 
                to="/students" 
                className="bg-slate-900 dark:bg-primary text-white h-14 px-8 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-2xl flex items-center hover:scale-105 transition-all active:scale-95 group overflow-hidden relative"
               >
                  <span className="relative z-10 flex items-center">
                    <Plus size={16} className="mr-3 group-hover:rotate-90 transition-transform duration-500" />
                    New Student Registration
                  </span>
                  <div className="absolute inset-x-0 bottom-0 h-[2px] bg-white opacity-20 transform translate-y-full group-hover:translate-y-0 transition-transform" />
               </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-12">
        {/* Core Metrics Layer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
           {/* Primary Stat: Students */}
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-4 p-8 bg-surface border border-border-muted rounded-[2.5rem] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)] group hover:shadow-2xl transition-all duration-500"
           >
              <div className="flex items-center justify-between mb-8">
                 <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 shadow-inner group-hover:rotate-6">
                    <Users size={24} />
                 </div>
                 <div className="flex items-center space-x-1 text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full">
                    <TrendingUp size={12} />
                    <span>+12.5%</span>
                 </div>
              </div>
              <div className="mb-2 uppercase text-[10px] font-black tracking-[0.3em] text-slate-400 italic">Total Enrolled Students</div>
              <div className="text-5xl font-black text-on-surface tracking-tighter mb-4">{stats?.totalStudents || 0}</div>
              <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '85%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" 
                 />
              </div>
           </motion.div>

           {/* Financial Management / Projection */}
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="md:col-span-8 p-10 bg-slate-900 text-white rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5"
           >
              {/* Artistic Grid Background */}
              <div className="absolute inset-0 opacity-[0.03] select-none pointer-events-none" style={{ backgroundImage: 'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                  <div>
                    <div className="flex items-center gap-3 text-emerald-400 mb-2">
                       <DollarSign size={20} className="bg-emerald-400/20 p-1 rounded-lg" />
                       <span className="text-[10px] font-black uppercase tracking-[0.4em] italic leading-none">Fiscal Intelligence</span>
                    </div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase">Revenue <span className="text-slate-500">Forecasting</span></h2>
                  </div>
                  <div className="flex gap-4">
                     <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-2xl">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Current Balance</p>
                        <p className="text-lg font-black tracking-tight tabular-nums">KES {(stats?.revenueThisMonth || 0).toLocaleString()}</p>
                     </div>
                     <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-1">Projected Growth</p>
                        <div className="flex items-center gap-2">
                           <TrendingUp size={14} className="text-emerald-500" />
                           <p className="text-lg font-black tracking-tight text-emerald-500 tabular-nums">+24.8%</p>
                        </div>
                     </div>
                  </div>
                </div>

                <div className="flex-1 min-h-[160px] flex items-end gap-3 px-4">
                   {/* Simplified Bar Chart visualization using standard HTML/CSS for performance & design control */}
                   {[45, 62, 85, 78, 92, 100].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-3 group/bar">
                         <div className="relative w-full">
                           <motion.div 
                            initial={{ height: 0 }}
                            animate={{ height: `${h}%` }}
                            transition={{ duration: 1.5, delay: 0.3 + (i * 0.1), ease: [0.23, 1, 0.32, 1] }}
                            className={`w-full max-w-[40px] mx-auto rounded-tl-xl rounded-tr-xl transition-all duration-500 cursor-help ${i === 5 ? 'bg-primary shadow-[0_0_30px_rgba(255,50,50,0.3)] h-full' : 'bg-white/10 group-hover/bar:bg-white/20'}`} 
                           />
                           {i === 5 && (
                             <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-black px-3 py-1.5 rounded-lg shadow-xl uppercase tracking-widest whitespace-nowrap opacity-0 group-hover/bar:opacity-100 transition-opacity">
                                Q4 Forecast
                             </div>
                           )}
                         </div>
                         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'][i]}</span>
                      </div>
                   ))}
                </div>
              </div>
              
              {/* Bottom Glow */}
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-1 bg-gradient-to-r from-transparent via-primary to-transparent blur-xl" />
           </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-8 italic">
           {/* Module Selection */}
           <div className="lg:col-span-8">
              <h3 className="mb-8">Academic Modules</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Link
                      to={item.path}
                      className="group flex flex-col p-8 bg-surface border border-border-muted rounded-[2rem] hover:shadow-2xl transition-all duration-500 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 ${item.color}`}>
                        {item.icon}
                      </div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-black text-on-surface uppercase italic tracking-tighter leading-none">{item.title}</h4>
                        <ArrowUpRight size={18} className="text-slate-300 group-hover:text-primary transition-colors group-hover:translate-x-1 group-hover:-translate-y-1" />
                      </div>
                      <p className="text-slate-400 text-sm font-bold tracking-tight italic">{item.description}</p>
                    </Link>
                  </motion.div>
                ))}
              </div>
           </div>

           {/* Activity Ledger */}
           <div className="lg:col-span-4">
              <h3 className="mb-8">Recent Activity</h3>
              <div className="bg-surface border border-border-muted rounded-[2.5rem] p-8 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.05)]">
                 <div className="flex items-center justify-between mb-8 pb-6 border-b border-border-muted">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface italic">Recent Registrations</span>
                    <Link to="/students" className="text-[10px] font-black uppercase tracking-widest text-primary hover:italic transition-all">View All Records</Link>
                 </div>
                 <div className="space-y-8">
                    {stats?.recentStudents.map((student, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        key={student.id} 
                        className="flex items-center justify-between group cursor-pointer"
                      >
                         <div className="flex items-center space-x-5">
                            <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border-muted flex items-center justify-center text-slate-400 font-black uppercase italic group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-inner group-hover:rotate-6">
                               {student.name.charAt(0)}
                            </div>
                            <div>
                               <p className="text-sm font-black text-on-surface uppercase tracking-tight italic leading-none mb-1">{student.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">STD-{student.id.slice(0, 5)}</p>
                            </div>
                         </div>
                         <div className="p-2.5 rounded-xl bg-surface border border-border-muted text-slate-300 group-hover:text-primary group-hover:border-primary/20 transition-all">
                            <ArrowRight size={14} />
                         </div>
                      </motion.div>
                    ))}
                 </div>
                 <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-border-muted flex items-center justify-center">
                    <button className="flex items-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-primary transition-colors italic">
                       <Plus size={14} className="mr-3" />
                       Enroll New Student
                    </button>
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* System Status Bar */}
      <footer className="fixed bottom-0 w-full bg-surface/80 backdrop-blur-xl border-t border-border-muted px-8 py-4 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[8px] font-black uppercase tracking-[0.4em] text-slate-400">
           <div className="flex items-center space-x-12">
              <div className="flex items-center">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-3 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                 <span className="italic">Secure Session Active</span>
              </div>
              <div className="hidden sm:flex items-center">
                 <Activity size={10} className="mr-3 text-primary animate-pulse" />
                 <span>Database Synchronized</span>
              </div>
           </div>
           <div className="italic text-primary/40 hidden md:block">
             SaaSLink Enterprise ERP // V4.2.0-STABLE
           </div>
           <div className="flex items-center space-x-2 italic">
              <Clock size={10} className="mr-1" />
              <span>{new Date().toLocaleTimeString()}</span>
           </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
