import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  Award, 
  CreditCard, 
  ChevronRight, 
  Activity, 
  Clock, 
  Wallet,
  ArrowRight,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface ChildInfo {
  id: string;
  name: string;
  grade: string;
  attendance: string;
  nextPaymentDue: string;
  nextPaymentAmount: number;
}

interface ParentStats {
  children: ChildInfo[];
  recentGrades: {
    id: number;
    childName: string;
    subject: string;
    grade: string;
    date: string;
  }[];
  upcomingEvents: {
    id: number;
    title: string;
    date: string;
    time: string;
  }[];
}

const ParentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ParentStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/reporting/parent-dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch parent dashboard stats', error);
      setStats({
        children: [],
        recentGrades: [],
        upcomingEvents: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
            <Activity className="animate-spin text-primary mb-4" size={48} />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Loading family profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white border-b border-slate-200 px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Guardian Portal</h1>
            <p className="text-slate-500 font-medium italic">Welcome, {user?.username}. Monitoring your children's academic progress.</p>
          </div>
          <div className="flex items-center space-x-4">
             <Link 
              to="/payments" 
              className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg shadow-primary/20 flex items-center transition-transform active:scale-95"
             >
                <Wallet size={18} className="mr-2" />
                Pay School Fees
             </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-12">
        {/* Children Overview */}
        <h2 className="text-base font-bold text-slate-900 uppercase tracking-[0.2em] mb-8 italic">Enrolled Students</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {stats?.children?.map(child => (
            <motion.div 
              key={child.id}
              whileHover={{ y: -5 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm transition-all"
            >
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-center space-x-5">
                  <div className="w-14 h-14 bg-slate-900 text-white flex items-center justify-center rounded-2xl font-bold text-xl shadow-lg">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-none mb-1">{child.name}</h3>
                    <p className="text-xs font-bold text-primary uppercase tracking-widest">{child.grade}</p>
                  </div>
                </div>
                <button className="text-[10px] font-bold text-slate-400 hover:text-primary uppercase tracking-widest flex items-center space-x-1 transition-colors">
                  <span>Full Report</span>
                  <ChevronRight size={14} />
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-10">
                <div className="bg-slate-50 p-5 rounded-2xl">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                    <TrendingUp size={12} className="mr-1 text-emerald-500" />
                    Attendance
                  </p>
                  <p className="text-3xl font-extrabold text-slate-900 tracking-tight italic">{child.attendance}</p>
                </div>
                <div className="bg-slate-50 p-5 rounded-2xl border border-red-50">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
                    <CreditCard size={12} className="mr-1 text-red-500" />
                    Fees Balance
                  </p>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-xs font-bold text-slate-400">Kes</span>
                    <p className="text-3xl font-extrabold text-slate-900 tracking-tight italic">{child.nextPaymentAmount?.toLocaleString()}</p>
                  </div>
                  <p className="text-[9px] text-red-500 font-bold mt-1 uppercase tracking-tighter italic">Due: {child.nextPaymentDue}</p>
                </div>
              </div>
            </motion.div>
          ))}
          {!stats?.children?.length && (
            <div className="col-span-full py-20 bg-white border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center">
               <Users className="text-slate-100 mb-4" size={64} />
               <p className="text-sm font-bold text-slate-300 uppercase tracking-widest italic">No children registered under this account.</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Recent Grades */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center italic">
                <Award className="mr-3 text-amber-500" size={24} />
                Academic Updates
              </h2>
              <button className="text-[10px] font-bold text-slate-400 hover:text-primary uppercase tracking-widest">Inquire</button>
            </div>
            
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden divide-y divide-slate-50">
              {stats?.recentGrades?.map((grade) => (
                <div key={grade.id} className="p-8 hover:bg-slate-50/50 transition-all flex items-center justify-between group">
                  <div className="flex items-center space-x-6">
                    <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-slate-900 mb-1">{grade.subject}</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{grade.childName} • {grade.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-6">
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tight group-hover:scale-110 transition-transform italic">
                      {grade.grade}
                    </div>
                    <ArrowRight className="text-slate-200 group-hover:text-slate-400 transition-colors" size={20} />
                  </div>
                </div>
              ))}
              {!stats?.recentGrades?.length && (
                <div className="p-20 text-center">
                  <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">Awaiting assessment data...</p>
                </div>
              )}
            </div>
          </div>

          {/* School Events */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-8 italic flex items-center">
               <Calendar className="mr-3 text-primary" size={24} />
               School Calendar
            </h2>
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
               <div className="divide-y divide-slate-50">
                  {stats?.upcomingEvents?.map((event) => {
                    const [month, day] = event.date.split(' ');
                    return (
                      <div key={event.id} className="p-6 hover:bg-slate-50/50 transition-all group">
                        <div className="flex items-start space-x-6">
                          <div className="flex-shrink-0 text-center min-w-[50px] bg-slate-50 rounded-xl py-2 px-3 border border-slate-100">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{month}</p>
                            <p className="text-xl font-extrabold text-slate-900 leading-none">{day.replace(',', '')}</p>
                          </div>
                          <div>
                            <h5 className="text-sm font-bold text-slate-900 mb-2 group-hover:text-primary transition-colors">{event.title}</h5>
                            <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                               <Clock size={12} className="mr-1.5" />
                               {event.time}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {!stats?.upcomingEvents?.length && (
                    <div className="p-20 text-center">
                       <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">No events scheduled.</p>
                    </div>
                  )}
               </div>
            </div>

            {/* Quick Link Card */}
            <div className="mt-12 group cursor-pointer">
               <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden transition-all group-hover:shadow-2xl group-hover:shadow-slate-200 group-hover:-translate-y-1">
                  <GraduationCap className="absolute -right-4 -bottom-4 text-white/5" size={120} />
                  <h4 className="text-sm font-bold mb-4 relative z-10 flex items-center uppercase tracking-widest italic">
                     School Contact
                  </h4>
                  <p className="text-xl font-extrabold tracking-tight mb-4 relative z-10">Need Assistance?</p>
                  <button className="bg-white text-slate-900 px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest relative z-10 hover:bg-primary hover:text-white transition-all shadow-lg">
                     Admin Support
                  </button>
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentDashboardPage;
