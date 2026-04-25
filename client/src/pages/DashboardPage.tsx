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
  Bell
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  revenueThisMonth: number;
  recentStudents: { id: string; name: string; email: string }[];
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/reporting/dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  const menuItems = [
    { title: 'Students', description: 'Manage records and enrollment.', icon: <Users size={20} />, path: '/students', color: 'bg-blue-50 text-blue-600' },
    { title: 'Finance', description: 'Fee collection and invoicing.', icon: <DollarSign size={20} />, path: '/finance', color: 'bg-emerald-50 text-emerald-600' },
    { title: 'Academics', description: 'Classes, subjects, and exams.', icon: <GraduationCap size={20} />, path: '/academics/classes', color: 'bg-purple-50 text-purple-600' },
    { title: 'Admissions', description: 'Application pipeline management.', icon: <FileText size={20} />, path: '/admissions', color: 'bg-amber-50 text-amber-600' },
    { title: 'Attendance', description: 'Staff and student tracking.', icon: <Clock size={20} />, path: '/attendance', color: 'bg-rose-50 text-rose-600' },
    { title: 'Settings', description: 'Configure school profile.', icon: <Settings size={20} />, path: '/settings', color: 'bg-slate-50 text-slate-600' },
  ];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
            <Activity className="animate-spin text-primary mb-4" size={48} />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">School Dashboard</h1>
            <p className="text-slate-500 font-medium italic">Welcome back, {user?.username}. Here's what's happening today.</p>
          </div>
          <div className="flex items-center space-x-4">
             <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary transition-colors shadow-sm">
                <Bell size={20} />
             </button>
             <Link 
              to="/students" 
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center"
             >
                <Plus size={18} className="mr-2" />
                Add Student
             </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-12">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Students Stat */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-6"
          >
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <Users size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Students</p>
              <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{stats?.totalStudents || 0}</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center">
                 <ArrowUpRight size={12} className="mr-1" /> +12% this month
              </p>
            </div>
          </motion.div>

          {/* Staff Stat */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-6"
          >
            <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center">
              <UserCheck size={32} />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Staff</p>
              <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{stats?.totalStaff || 0}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1 italic">Active Personnel</p>
            </div>
          </motion.div>

          {/* Revenue Stat */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200 flex items-center space-x-6 relative overflow-hidden"
          >
            <BarChart3 className="absolute -right-4 -bottom-4 text-white/5" size={120} />
            <div className="w-16 h-16 bg-primary/20 text-primary rounded-2xl flex items-center justify-center relative z-10">
              <DollarSign size={32} />
            </div>
            <div className="relative z-10">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Revenue (MTD)</p>
              <h3 className="text-4xl font-extrabold text-white tracking-tight flex items-baseline">
                <span className="text-xs font-bold text-white/40 mr-1 uppercase">Kes</span>
                {stats?.revenueThisMonth?.toLocaleString() || 0}
              </h3>
              <p className="text-[10px] text-emerald-400 font-bold mt-1 flex items-center">
                 <ArrowUpRight size={12} className="mr-1" /> Healthy Flow
              </p>
            </div>
          </motion.div>
        </div>

        {/* Quick Actions Grid */}
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-[0.2em] mb-8 italic">Management Console</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-16">
           {menuItems.map((item, i) => (
             <Link 
              key={i} 
              to={item.path}
              className="bg-white border border-slate-100 p-6 rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group"
             >
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-6 transition-transform group-hover:scale-110 shadow-sm`}>
                   {item.icon}
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1">{item.title}</h4>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed italic">{item.description}</p>
             </Link>
           ))}
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
           <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-8">
                 <h3 className="text-xl font-bold text-slate-900 tracking-tight">Recent Enrollments</h3>
                 <Link to="/students" className="text-xs font-bold text-primary hover:underline uppercase tracking-widest">View All Students</Link>
              </div>
              <div className="space-y-4">
                 {stats?.recentStudents?.map((student, i) => (
                   <div key={i} className="bg-white border border-slate-100 p-5 rounded-2xl flex items-center justify-between hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-4">
                         <div className="w-10 h-10 bg-slate-50 flex items-center justify-center text-slate-400 rounded-lg font-bold text-xs">
                            {student.name.charAt(0)}
                         </div>
                         <div>
                            <h5 className="text-sm font-bold text-slate-900">{student.name}</h5>
                            <p className="text-[10px] text-slate-400 font-medium italic">{student.email}</p>
                         </div>
                      </div>
                      <div className="flex items-center space-x-6">
                         <span className="hidden md:block px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-bold uppercase tracking-widest">Active</span>
                         <ArrowRight size={16} className="text-slate-200" />
                      </div>
                   </div>
                 ))}
                 {!stats?.recentStudents?.length && (
                   <div className="py-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl flex flex-col items-center">
                      <Users className="text-slate-200 mb-4" size={48} />
                      <p className="text-sm font-bold text-slate-300 uppercase tracking-widest italic">No recent registrations</p>
                   </div>
                 )}
              </div>
           </div>

           <div>
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-8">Quick Insights</h3>
              <div className="space-y-6">
                 <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                    <div className="flex items-center space-x-4 mb-4">
                       <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                          <TrendingUp size={20} />
                       </div>
                       <h4 className="text-sm font-bold text-emerald-900">Attendance Rate</h4>
                    </div>
                    <div className="flex items-end justify-between">
                       <span className="text-3xl font-extrabold text-emerald-900 tracking-tight">94%</span>
                       <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">+2% vs last wk</span>
                    </div>
                 </div>

                 <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                    <h4 className="text-sm font-bold text-slate-900 mb-6">Upcoming Events</h4>
                    <div className="space-y-6">
                       {[
                         { date: 'Oct 24', title: 'Parent Teacher Meeting', time: '02:00 PM' },
                         { date: 'Oct 26', title: 'Mid-term Exams Begin', time: '08:00 AM' }
                       ].map((event, i) => (
                         <div key={i} className="flex items-start space-x-4">
                            <div className="bg-slate-50 px-3 py-2 rounded-xl text-center min-w-[50px]">
                               <p className="text-[10px] font-bold text-slate-900 leading-none">{event.date.split(' ')[1]}</p>
                               <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter mt-1">{event.date.split(' ')[0]}</p>
                            </div>
                            <div>
                               <p className="text-xs font-bold text-slate-900">{event.title}</p>
                               <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">{event.time}</p>
                            </div>
                         </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </main>

      {/* Status Footer */}
      <footer className="fixed bottom-0 w-full bg-white border-t border-slate-100 px-8 py-3 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
           <div className="flex items-center space-x-6">
              <div className="flex items-center">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2" />
                 <span>Server Connected</span>
              </div>
              <div className="hidden sm:flex items-center">
                 <Clock size={12} className="mr-2" />
                 <span>Syncing...</span>
              </div>
           </div>
           <div className="italic">
             EduStream Management Systems v2.4.0
           </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
