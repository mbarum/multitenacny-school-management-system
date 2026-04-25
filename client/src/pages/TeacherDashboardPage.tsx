import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Users, BookOpen, Calendar, CheckSquare, Clock, LogOut, Bell, MessageSquare, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TeacherStats {
  totalStudents: number;
  totalClasses: number;
  todaysSchedule: {
    id: number;
    time: string;
    subject: string;
    class: string;
    room: string;
  }[];
  pendingTasks: {
    id: number;
    title: string;
    due: string;
    type: string;
  }[];
}

const TeacherDashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/reporting/teacher-dashboard-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch teacher dashboard stats', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-[#F5F5F5]">
        <div className="flex flex-col items-center">
            <Activity className="animate-pulse text-gray-400 mb-4" size={40} />
            <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">Hydrating Faculty Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-12">
      <header className="flex justify-between items-end mb-16 border-b border-gray-200 pb-8">
        <div>
          <nav className="flex mb-4 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
            <span>Faculty</span>
            <span className="mx-2">/</span>
            <span className="text-gray-900 font-bold">Session_Overview</span>
          </nav>
          <h1 className="text-5xl font-serif italic text-gray-900 leading-none tracking-tight">
            Academic <span className="opacity-40">Command</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-1">Session Identity</p>
          <p className="text-sm font-bold text-gray-900 uppercase italic tracking-tight">{user?.username}</p>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-gray-200 mb-12">
        <div className="bg-white p-8 border-r border-gray-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-10">
            <div className="w-10 h-10 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
              <Users size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Total Registry</h3>
            <p className="text-5xl font-serif italic text-gray-900 leading-none tracking-tighter">
              {stats?.totalStudents || 0}
            </p>
            <p className="text-[10px] font-bold text-gray-300 uppercase mt-2 tracking-widest italic">Assigned Students</p>
          </div>
        </div>

        <div className="bg-white p-8 border-r border-gray-200 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-10">
            <div className="w-10 h-10 bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
              <BookOpen size={18} />
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Curriculum Load</h3>
            <p className="text-5xl font-serif italic text-gray-900 leading-none tracking-tighter">
              {stats?.totalClasses || 0}
            </p>
            <p className="text-[10px] font-bold text-gray-300 uppercase mt-2 tracking-widest italic">Active Classes</p>
          </div>
        </div>

        <div className="bg-gray-950 p-8 text-white flex flex-col justify-between">
          <div className="flex justify-between items-start mb-10">
            <div className="w-10 h-10 bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <CheckSquare size={18} />
            </div>
            <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest">Urgent</span>
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Pending Tasks</h3>
            <p className="text-5xl font-serif italic text-white leading-none tracking-tighter">
              {stats?.pendingTasks?.length || 0}
            </p>
            <p className="text-[10px] font-bold text-white/20 uppercase mt-2 tracking-widest italic">Action Required</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Today's Schedule */}
        <div className="lg:col-span-2 bg-white border border-gray-200 rounded-sm">
          <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center italic">
              <Clock className="w-4 h-4 mr-3 text-gray-400" />
              Temporal Schedule
            </h2>
            <span className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest">
              {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </span>
          </div>
          <div className="p-8">
            <div className="space-y-6">
              {stats?.todaysSchedule?.map((session, index) => (
                <div key={session.id} className="flex group">
                  <div className="mr-8 flex flex-col items-center">
                    <div className="text-[10px] font-mono font-bold text-gray-300 group-hover:text-gray-900 transition-colors uppercase tracking-tighter">
                      {String(index + 1).padStart(2, '0')}
                    </div>
                    <div className="w-[1px] flex-1 bg-gray-100 my-2 group-hover:bg-gray-900 transition-colors"></div>
                  </div>
                  
                  <div className="flex-1 bg-[#F9F9F9] border border-gray-200 p-6 rounded-sm hover:border-gray-900 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 uppercase italic tracking-tight">{session.subject}</h3>
                        <p className="text-[9px] font-mono text-gray-400 uppercase tracking-widest mt-1">{session.time}</p>
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-gray-900 transition-colors uppercase tracking-widest italic">{session.room}</span>
                    </div>
                    <div className="flex items-center text-[10px] font-bold text-gray-500 uppercase tracking-widest space-x-4">
                      <span className="flex items-center">
                        <Users className="w-3 h-3 mr-2 text-gray-300" />
                        {session.class}
                      </span>
                    </div>
                    <div className="mt-6 flex space-x-3">
                      <button className="text-[9px] font-bold px-4 py-2 bg-gray-900 text-white rounded-sm uppercase tracking-widest hover:bg-gray-800 transition-all">
                        Registry
                      </button>
                      <button className="text-[9px] font-bold px-4 py-2 bg-white border border-gray-200 rounded-sm uppercase tracking-widest hover:border-gray-900 transition-all">
                        Lesson_Notes
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {(!stats?.todaysSchedule || stats.todaysSchedule.length === 0) && (
                <div className="text-center py-20 border-2 border-dashed border-gray-50">
                  <p className="text-[10px] font-mono font-bold text-gray-300 uppercase tracking-widest italic">Awaiting Signal...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Tasks */}
        <div className="bg-white border border-gray-200 rounded-sm">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center italic">
              <CheckSquare className="w-4 h-4 mr-3 text-gray-400" />
              Action Ledger
            </h2>
          </div>
          <div className="p-0">
            <ul className="divide-y divide-gray-100">
              {stats?.pendingTasks?.map((task) => (
                <li key={task.id} className="p-6 hover:bg-gray-50 transition-all cursor-pointer group">
                  <div className="flex items-start">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-3 h-3 border border-gray-300 rounded-sm group-hover:border-gray-900 transition-colors" />
                    </div>
                    <div className="ml-4 flex-1">
                      <p className="text-xs font-bold text-gray-900 uppercase italic leading-none mb-2">{task.title}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${
                          task.due === 'Today' ? 'text-red-500' : 'text-gray-400'
                        }`}>
                          Due: {task.due}
                        </span>
                        <span className="text-[8px] font-mono font-bold text-gray-300 uppercase tracking-widest">{task.type}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
              {(!stats?.pendingTasks || stats.pendingTasks.length === 0) && (
                <li className="p-20 text-center text-gray-300 font-mono text-[10px] uppercase tracking-widest italic">
                  All systems clear.
                </li>
              )}
            </ul>
            <div className="p-6 border-t border-gray-100 bg-[#FAFAFA]">
              <button className="w-full text-[10px] font-bold text-gray-400 hover:text-gray-900 transition-colors uppercase tracking-widest flex items-center justify-center gap-2">
                + Append Task
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboardPage;
