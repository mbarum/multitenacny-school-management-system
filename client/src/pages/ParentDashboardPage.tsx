import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Users, BookOpen, Calendar, CheckSquare, LogOut, Bell, MessageSquare, Award, CreditCard, ChevronRight, Activity, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

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
  const { user, logout } = useAuth();
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
      <div className="h-full flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center">
            <Activity className="animate-pulse text-gray-400 mb-4" size={40} />
            <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Retrieving Family Records...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-transparent p-12 max-w-6xl mx-auto">
      <header className="flex justify-between items-end mb-16 border-b border-gray-200 pb-8">
        <div>
          <nav className="flex mb-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            <span>Terminal</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-bold">Parent_Portal_Access</span>
          </nav>
          <h1 className="text-5xl font-serif italic text-gray-900 leading-none tracking-tight">
            Family <span className="opacity-40">Intelligence</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Guardian Identity</p>
          <p className="text-sm font-bold text-gray-900 uppercase italic tracking-tight">{user?.username}</p>
        </div>
      </header>

      {/* Children Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-gray-200 mb-12">
        {stats?.children?.map(child => (
          <div key={child.id} className="bg-white p-10 border-r border-b border-gray-200 group hover:bg-[#FAFAFA] transition-all">
            <div className="flex justify-between items-start mb-12">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-900 text-white flex items-center justify-center font-serif italic text-lg mr-6 border border-gray-800">
                  {child.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-lg font-serif italic text-gray-900 tracking-tight leading-none mb-2">{child.name}</h3>
                  <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">{child.grade}</p>
                </div>
              </div>
              <button className="text-[9px] font-bold text-gray-400 hover:text-gray-900 uppercase tracking-widest flex items-center gap-1 transition-all">
                Full_Audit <ChevronRight size={12} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-[9px] font-mono font-bold text-gray-300 uppercase tracking-widest mb-2">Attendance_Index</p>
                <p className="text-3xl font-mono text-gray-900 tabular-nums">{child.attendance}</p>
              </div>
              <div>
                <p className="text-[9px] font-mono font-bold text-gray-300 uppercase tracking-widest mb-2">Fiscal_Obligation</p>
                <p className="text-3xl font-mono text-gray-900 tabular-nums leading-none tracking-tighter">
                  <span className="text-xs mr-1 opacity-30">KES</span>
                  {child.nextPaymentAmount}
                </p>
                <p className="text-[8px] text-red-500 mt-2 font-bold uppercase tracking-widest italic">Deadline: {child.nextPaymentDue}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Grades */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center italic">
              <Award className="w-4 h-4 mr-3 text-gray-400" />
              Academic Performance Stream
            </h2>
            <button className="text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest">Inquire</button>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-gray-100">
              {stats?.recentGrades?.map((grade) => (
                <li key={grade.id} className="p-8 hover:bg-gray-50 transition-all cursor-pointer group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-sm bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-400 mr-6 group-hover:bg-gray-900 group-hover:text-white transition-all">
                        <BookOpen size={14} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 uppercase italic leading-none mb-2">{grade.subject}</p>
                        <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest">{grade.childName} • {grade.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-mono text-gray-900 tabular-nums font-bold">
                        {grade.grade}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
              {(!stats?.recentGrades || stats.recentGrades.length === 0) && (
                <li className="p-20 text-center text-gray-300 font-mono text-[10px] uppercase tracking-widest italic">
                  Awaiting Evaluation Cycle...
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center italic">
              <Calendar className="w-4 h-4 mr-3 text-gray-400" />
              Event Index
            </h2>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-gray-100">
              {stats?.upcomingEvents?.map((event) => (
                <li key={event.id} className="p-8 hover:bg-gray-50 transition-all cursor-pointer group">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mr-6 text-center border-r border-gray-100 pr-6">
                      <div className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">{event.date.split(' ')[0]}</div>
                      <div className="text-2xl font-serif italic text-gray-900 leading-none">{event.date.split(' ')[1].replace(',', '')}</div>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 uppercase italic leading-tight mb-2">{event.title}</p>
                      <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest flex items-center gap-1">
                        <Clock size={10} /> {event.time}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
              {(!stats?.upcomingEvents || stats.upcomingEvents.length === 0) && (
                <li className="p-20 text-center text-gray-300 font-mono text-[10px] uppercase tracking-widest italic">
                  No upcoming signals.
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboardPage;