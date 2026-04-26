import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  Download, 
  TrendingUp, 
  Users, 
  BarChart3, 
  DollarSign, 
  GraduationCap, 
  Calendar,
  Filter,
  FileText,
  ChevronRight,
  ArrowUpRight,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';

type ReportTab = 'financial' | 'academic' | 'attendance';

const ReportingPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ReportTab>('financial');
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    classLevelId: ''
  });
  const [classLevels, setClassLevels] = useState<{ id: string; name: string }[]>([]);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchClassLevels();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const fetchClassLevels = async () => {
    try {
      const response = await api.get('/academics/class-levels');
      setClassLevels(response.data);
    } catch (error) {
      console.error('Failed to fetch class levels', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      if (activeTab === 'financial') {
        endpoint = `/reporting/financials?startDate=${filters.startDate}&endDate=${filters.endDate}`;
      } else if (activeTab === 'academic') {
        endpoint = `/reporting/academics?classLevelId=${filters.classLevelId}`;
      } else {
        endpoint = `/reporting/attendance?classLevelId=${filters.classLevelId}`;
      }
      
      const response = await api.get(endpoint);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch report', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];

  const renderFinancialReport = () => {
    if (!data) return null;
    const chartData = [
      { name: 'Income', value: data.totalIncome },
      { name: 'Expenses', value: data.totalExpenses },
      { name: 'Net Profit', value: data.netProfit },
    ];

    return (
      <div className="space-y-10">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           {[
             { label: 'Cumulative Revenue', value: data.totalIncome, icon: <DollarSign size={20} />, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
             { label: 'Operational Costs', value: data.totalExpenses, icon: <TrendingUp size={20} />, color: 'text-rose-500', bg: 'bg-rose-500/10' },
             { label: 'Estimated Profit', value: data.netProfit, icon: <BarChart3 size={20} />, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
           ].map((stat, i) => (
             <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface border border-border-muted p-8 rounded-[2rem] shadow-sm group hover:shadow-xl transition-all duration-500"
             >
                <div className="flex items-center justify-between mb-6">
                   <div className={`w-12 h-12 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center shadow-inner group-hover:rotate-6 transition-transform`}>
                      {stat.icon}
                   </div>
                   <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">+12.4%</span>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-2">{stat.label}</p>
                <p className="text-3xl font-black text-on-surface tracking-tighter tabular-nums leading-none">
                  <span className="text-sm font-normal text-slate-300 mr-2 uppercase not-italic tracking-normal">KES</span>
                  {stat.value.toLocaleString()}
                </p>
             </motion.div>
           ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
           <div className="lg:col-span-8 bg-surface border border-border-muted rounded-[2rem] p-10 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] rounded-full" />
              <div className="flex justify-between items-center mb-10">
                 <h3 className="text-xl font-black text-on-surface uppercase italic tracking-tighter leading-none">Financial Velocity</h3>
                 <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full" /> Income
                    <span className="ml-4 w-2 h-2 bg-rose-500 rounded-full" /> Expense
                 </div>
              </div>
              <div className="h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                        dy={10}
                       />
                       <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fill: '#94a3b8' }} 
                       />
                       <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', padding: '16px' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }}
                       />
                       <Bar dataKey="value" radius={[12, 12, 0, 0]}>
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 1 ? '#f43f5e' : index === 0 ? '#6366f1' : '#1e293b'} />
                          ))}
                       </Bar>
                    </BarChart>
                 </ResponsiveContainer>
              </div>
           </div>

           <div className="lg:col-span-4 bg-slate-900 border border-white/5 rounded-[2rem] p-10 shadow-2xl relative overflow-hidden flex flex-col">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
              <div className="relative z-10 flex flex-col h-full">
                 <h4 className="text-[10px] font-black text-primary uppercase tracking-[0.4em] italic mb-8">Asset Allocation</h4>
                 <div className="flex-1 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height={250}>
                       <PieChart>
                          <Pie
                             data={chartData.filter(d => d.name !== 'Net Profit')}
                             cx="50%"
                             cy="50%"
                             innerRadius={60}
                             outerRadius={80}
                             paddingAngle={8}
                             dataKey="value"
                          >
                             {chartData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={index === 1 ? '#f43f5e' : '#6366f1'} stroke="none" />
                             ))}
                          </Pie>
                          <Tooltip />
                       </PieChart>
                    </ResponsiveContainer>
                 </div>
                 <div className="space-y-4 mt-8">
                    {chartData.filter(d => d.name !== 'Net Profit').map((stat, i) => (
                      <div key={i} className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-rose-500' : 'bg-indigo-500'}`} />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{stat.name}</span>
                         </div>
                         <span className="text-xs font-black text-white italic tracking-tight">{Math.round((stat.value / (data.totalIncome + data.totalExpenses)) * 100)}%</span>
                      </div>
                    ))}
                 </div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderAcademicReport = () => {
    if (!data) return null;

    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-1 bg-surface border border-border-muted p-8 rounded-[2rem] shadow-sm"
           >
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-500 rounded-2xl flex items-center justify-center mb-6">
                 <Users size={20} />
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic mb-2">Cohort Size</p>
              <p className="text-4xl font-black text-on-surface tracking-tighter leading-none">{data.totalStudents || 0}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-4 italic">Students included in report</p>
           </motion.div>

           <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 bg-surface border border-border-muted p-8 rounded-[2rem] shadow-sm"
           >
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] italic">Grade Distribution</h4>
                 <div className="flex gap-2">
                    {['A', 'B', 'C', 'D'].map(g => (
                      <span key={g} className="text-[8px] font-black text-slate-300 uppercase px-2 py-0.5 border border-border-muted rounded">{g}</span>
                    ))}
                 </div>
              </div>
              <div className="h-24 flex items-end gap-2">
                 {data.gradeDistribution.map((g: any, i: number) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${(g.count / data.totalStudents) * 100}%` }}
                        className="w-full bg-slate-900 group-hover:bg-primary transition-all rounded-t-lg"
                      />
                      <span className="text-[10px] font-black text-slate-400">{g.grade}</span>
                   </div>
                 ))}
              </div>
           </motion.div>
        </div>

        <div className="bg-surface border border-border-muted rounded-[2.5rem] p-10 shadow-sm">
           <h3 className="text-xl font-black text-on-surface uppercase italic tracking-tighter leading-none mb-10">Subject performance breakdown</h3>
           <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={data.subjectAverages}>
                    <defs>
                      <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="subject" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: '#94a3b8' }} 
                      domain={[0, 100]}
                    />
                    <Tooltip />
                    <Area type="monotone" dataKey="average" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorAvg)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-canvas pb-24 font-sans selection:bg-primary/10 selection:text-primary">
      <div className="max-w-7xl mx-auto px-8 pt-12">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
           <div>
              <div className="inline-flex items-center space-x-2 text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-4">
                 <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                 <span>Intelligence Terminal</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter leading-[0.9] mb-4 uppercase italic">
                Data <span className="text-slate-300 dark:text-slate-700 block md:inline font-normal">Reporting</span>
              </h1>
              <div className="flex gap-6 mt-6">
                 {(['financial', 'academic', 'attendance'] as ReportTab[]).map(tab => (
                   <button 
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`text-[10px] font-black uppercase tracking-[0.4em] pb-3 border-b-2 transition-all ${
                      activeTab === tab ? 'text-primary border-primary italic' : 'text-slate-400 border-transparent hover:text-slate-600'
                    }`}
                   >
                     {tab}
                   </button>
                 ))}
              </div>
           </div>

           <div className="flex flex-wrap gap-4 items-end bg-surface border border-border-muted p-6 rounded-[2rem] shadow-sm">
              <div className="flex flex-col gap-2">
                 <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Class Focus</label>
                 <select 
                  className="bg-canvas border border-border-muted rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-primary/20"
                  value={filters.classLevelId}
                  onChange={(e) => setFilters(prev => ({ ...prev, classLevelId: e.target.value }))}
                 >
                    <option value="">All Cohorts</option>
                    {classLevels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
              </div>
              {activeTab === 'financial' && (
                <div className="flex gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Range Start</label>
                    <input 
                      type="date" 
                      className="bg-canvas border border-border-muted rounded-xl px-4 py-2 text-[10px] font-black outline-none"
                      value={filters.startDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-slate-400">Range End</label>
                    <input 
                      type="date" 
                      className="bg-canvas border border-border-muted rounded-xl px-4 py-2 text-[10px] font-black outline-none"
                      value={filters.endDate}
                      onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                </div>
              )}
              <button 
                onClick={fetchReport}
                className="bg-slate-900 dark:bg-primary text-white h-10 px-6 rounded-xl font-black uppercase text-[9px] tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl"
              >
                <Filter size={14} />
                Filter
              </button>
           </div>
        </header>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center border border-dashed border-border-muted rounded-[3rem]">
             <BarChart3 className="animate-pulse text-slate-300 mb-6" size={48} />
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Computing Analytical Layer...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
            >
              {activeTab === 'financial' && renderFinancialReport()}
              {activeTab === 'academic' && renderAcademicReport()}
              {activeTab === 'attendance' && (
                 <div className="h-96 flex flex-col items-center justify-center border border-dashed border-border-muted rounded-[3rem]">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-3xl flex items-center justify-center text-slate-300 mb-4 shadow-inner">
                       <Calendar size={24} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic mb-1">Attendance Terminal</p>
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">Module currently under synchronization</p>
                 </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ReportingPage;
