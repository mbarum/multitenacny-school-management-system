import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { UserRole } from '../../../src/common/user-role.enum';
import { SubscriptionPlan } from '../../../src/common/subscription.enums';
import { Users, UserCheck, DollarSign, Activity, GraduationCap, FileText, Book, ShieldAlert, ArrowRight, TrendingUp, BarChart3, ArrowUpRight } from 'lucide-react';
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

  const modules = [
    { title: 'Registry', description: 'Student lifecycle and index management.', icon: <Users size={20} />, path: '/students', color: 'bg-white' },
    { title: 'Financials', description: 'Revenue streams, fiscal ledgers, and billing.', icon: <DollarSign size={20} />, path: '/finance', color: 'bg-white' },
    { title: 'Academics', description: 'Curriculum delivery and classroom control.', icon: <GraduationCap size={20} />, path: '/academics/classes', color: 'bg-white' },
    { title: 'Analytics', description: 'Data aggregation and performance reporting.', icon: <FileText size={20} />, path: '/reports', color: 'bg-white' },
    { title: 'Library', description: 'Document repository and asset tracking.', icon: <Book size={20} />, path: '/library', color: 'bg-white' },
    { title: 'Intake', description: 'Candidate acquisition and admissions pipeline.', icon: <ShieldAlert size={20} />, path: '/admissions', color: 'bg-white' },
  ];

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center">
            <Activity className="animate-pulse text-gray-400 mb-4" size={40} />
            <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Initializing Core...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-transparent">
      {/* Top Banner / Hero */}
      <section className="p-12 border-b border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div>
                    <nav className="flex mb-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
                        <span>Terminal</span>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900 font-bold">Standard_Node_01</span>
                    </nav>
                    <h1 className="text-6xl font-serif italic text-gray-900 leading-[0.9] tracking-tighter mb-4">
                        Matrix <span className="opacity-40">Operations</span>
                    </h1>
                    <p className="text-gray-500 font-sans max-w-md text-sm leading-relaxed">
                        Centrally managing institutional intelligence, student registry, and fiscal health in real-time.
                    </p>
                </div>
                <div className="flex flex-col items-end">
                    <div className="text-right">
                        <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Local Time</p>
                        <p className="text-2xl font-mono text-gray-900 tabular-nums">
                            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Main Command Grid (Bento) */}
      <section className="p-12 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-0 border border-gray-200 bg-gray-200">
            {/* Primary Stat: Students */}
            <div className="md:col-span-2 bg-white p-10 flex flex-col justify-between border-r border-b border-gray-200">
                <div className="flex justify-between items-start mb-12">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                        <Users size={18} />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-sm flex items-center gap-1">
                        <TrendingUp size={10} /> Active
                    </span>
                </div>
                <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Registry Density</h3>
                    <p className="text-6xl font-serif italic text-gray-900 tabular-nums leading-none tracking-tighter">
                        {stats?.totalStudents || 0}
                    </p>
                    <p className="text-[10px] font-bold text-gray-300 uppercase mt-2 tracking-widest italic">Enrolled Candidates</p>
                </div>
            </div>

            {/* Primary Stat: Staff */}
            <div className="md:col-span-2 bg-white p-10 flex flex-col justify-between border-r border-b border-gray-200">
                <div className="flex justify-between items-start mb-12">
                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                        <UserCheck size={18} />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">Compliance Ready</span>
                </div>
                <div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Faculty Count</h3>
                    <p className="text-6xl font-serif italic text-gray-900 tabular-nums leading-none tracking-tighter">
                        {stats?.totalStaff || 0}
                    </p>
                    <p className="text-[10px] font-bold text-gray-300 uppercase mt-2 tracking-widest italic">Teaching Personnel</p>
                </div>
            </div>

            {/* Fiscal Metric */}
            <div className="md:col-span-2 lg:col-span-2 bg-gray-950 p-10 border-b border-gray-200 text-white flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:bg-gray-900 transition-colors">
                <BarChart3 className="absolute -right-4 -bottom-4 text-white/[0.03] group-hover:scale-110 transition-transform duration-500" size={140} />
                <div className="flex justify-between items-start">
                    <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                        <DollarSign size={18} />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest">30D Cycles</span>
                </div>
                <div className="relative z-10">
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Fiscal Inflow</h3>
                    <p className="text-4xl font-serif italic text-white tabular-nums leading-none tracking-tight">
                        <span className="text-xs font-sans not-italic mr-1 opacity-40 uppercase tracking-tighter">Kes</span>
                        {stats?.revenueThisMonth?.toLocaleString() || 0}
                    </p>
                    <div className="flex items-center gap-2 mt-4 text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                        <ArrowUpRight size={12} /> Positive Flow
                    </div>
                </div>
            </div>

            {/* Module Deep Links Map */}
            {modules.map((m, idx) => (
                <Link 
                    key={m.path}
                    to={m.path}
                    className={`md:col-span-2 p-10 bg-white border-r ${idx >= 4 ? '' : 'border-b'} border-gray-200 group relative hover:z-20 transition-all duration-300`}
                >
                    <div className="flex items-center justify-between mb-8">
                        <div className="w-8 h-8 rounded-sm bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-gray-950 group-hover:text-white transition-all duration-300">
                            {m.icon}
                        </div>
                        <ArrowRight className="text-gray-200 group-hover:text-gray-950 group-hover:translate-x-1 transition-all" size={16} />
                    </div>
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-2 italic">
                        {m.title}
                    </h4>
                    <p className="text-[10px] text-gray-400 leading-relaxed max-w-[180px]">
                        {m.description}
                    </p>
                    <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[8px] font-mono text-gray-300 uppercase tracking-widest">Access_Index_0{idx+1}</span>
                    </div>
                </Link>
            ))}

            {/* Recent Registry Activity - Spans Bottom */}
            <div className="md:col-span-4 lg:col-span-6 bg-white p-12 border-t border-gray-200">
                <div className="flex items-end justify-between mb-12 border-b border-gray-100 pb-8">
                    <div>
                        <h3 className="text-2xl font-serif italic text-gray-900 tracking-tight mb-2">Real-time Stream</h3>
                        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Monitoring immediate registry injections.</p>
                    </div>
                    <Link to="/students" className="text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest flex items-center gap-2">
                        View Full History <ArrowRight size={14} />
                    </Link>
                </div>

                <div className="space-y-6">
                    {stats?.recentStudents?.slice(0, 3).map(student => (
                        <div key={student.id} className="flex items-center justify-between p-6 bg-[#F9F9F9] border border-gray-200 rounded-sm hover:border-gray-900 transition-all cursor-pointer group">
                            <div className="flex items-center gap-6">
                                <div className="text-[10px] font-mono text-gray-300 group-hover:text-gray-900 transition-colors">01</div>
                                <div>
                                    <h5 className="text-sm font-bold text-gray-900 uppercase italic leading-none mb-1 group-hover:translate-x-1 transition-transform">{student.name}</h5>
                                    <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{student.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-12">
                                <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest hidden md:block">Registry_Success</span>
                                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.4)]" />
                            </div>
                        </div>
                    ))}
                    {!stats?.recentStudents?.length && (
                        <div className="py-20 text-center border-2 border-dashed border-gray-100">
                            <p className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest italic">Awaiting Signal...</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </section>

      {/* Footer / Status Rail */}
      <footer className="p-8 border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-[9px] font-mono font-bold text-gray-400 uppercase tracking-[0.3em]">
            <div className="flex gap-8 mb-4 md:mb-0">
                <span className="flex items-center gap-2"><div className="w-1 h-1 bg-emerald-400 rounded-full" /> System Online</span>
                <span className="flex items-center gap-2"><div className="w-1 h-1 bg-gray-300 rounded-full" /> Latency 24ms</span>
            </div>
            <div className="italic">
                © Saaslink Institutional Intelligence // 2026
            </div>
        </div>
      </footer>
    </div>
  );
};

export default DashboardPage;
