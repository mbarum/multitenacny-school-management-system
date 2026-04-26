import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Users, 
  BookOpen, 
  Calendar, 
  CheckSquare, 
  Clock, 
  Activity, 
  Plus, 
  Bell, 
  MessageSquare, 
  Award,
  ChevronRight,
  MapPin,
  FileText
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

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
  const { user } = useAuth();
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
      <div className="h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center">
            <Activity className="animate-spin text-primary mb-4" size={48} />
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest italic">Preparing your classroom...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <header className="bg-white border-b border-slate-200 px-8 py-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Teacher Workspace</h1>
            <p className="text-slate-500 font-medium italic">Welcome back, {user?.username}. Here is your academic overview for today.</p>
          </div>
          <div className="flex items-center space-x-4">
             <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-primary transition-colors shadow-sm relative">
                <Bell size={20} />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
             </button>
             <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg flex items-center transition-transform active:scale-95">
                <Plus size={18} className="mr-2" />
                New Lesson
             </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 pt-12">
        {/* Stats Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <Link to="/students">
            <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-6 cursor-pointer">
              <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                <Users size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">My Students</p>
                <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{stats?.totalStudents || 0}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 italic">Active Learners</p>
              </div>
            </motion.div>
          </Link>

          <Link to="/academics/classes">
            <motion.div whileHover={{ y: -5 }} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex items-center space-x-6 cursor-pointer">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <BookOpen size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Classes</p>
                <h3 className="text-4xl font-extrabold text-slate-900 tracking-tight">{stats?.totalClasses || 0}</h3>
                <p className="text-[10px] text-slate-400 font-bold mt-1 italic">Assigned Subjects</p>
              </div>
            </motion.div>
          </Link>

          <Link to="/reports">
            <motion.div whileHover={{ y: -5 }} className="bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200 flex items-center space-x-6 cursor-pointer">
              <div className="w-16 h-16 bg-white/10 text-white rounded-2xl flex items-center justify-center">
                <CheckSquare size={32} />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Assignments to Grade</p>
                <h3 className="text-4xl font-extrabold text-white tracking-tight">{stats?.pendingTasks?.length || 0}</h3>
                <p className="text-[10px] text-red-400 font-bold mt-1 uppercase tracking-widest">Action Needed</p>
              </div>
            </motion.div>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Schedule */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center">
                <Calendar className="mr-3 text-primary" size={24} />
                Today's Schedule
              </h2>
              <span className="px-4 py-1.5 bg-slate-900 text-white rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
              </span>
            </div>

            <div className="space-y-6">
              {stats?.todaysSchedule?.map((session, i) => (
                <div key={session.id} className="group relative flex items-start space-x-8">
                  <div className="flex flex-col items-center pt-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-200 group-hover:bg-primary transition-colors ring-4 ring-white shadow-sm" />
                    <div className="w-0.5 h-32 bg-slate-100 group-hover:bg-primary/20 transition-colors mt-2" />
                  </div>

                  <div className="flex-1 bg-white border border-slate-100 p-8 rounded-3xl shadow-sm hover:shadow-xl transition-all group-hover:-translate-y-1">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                      <div>
                        <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md mb-2 inline-block">
                           {session.time}
                        </span>
                        <h4 className="text-xl font-bold text-slate-900">{session.subject}</h4>
                      </div>
                      <div className="flex items-center text-slate-400 text-xs font-bold uppercase tracking-widest italic">
                        <MapPin size={14} className="mr-2" />
                        Room {session.room}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                      <div className="flex items-center space-x-2 text-slate-500 font-bold text-xs uppercase tracking-tight">
                        <Users size={16} className="text-slate-300" />
                        <span>Class {session.class}</span>
                      </div>
                      <div className="flex space-x-2">
                        <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-slate-100 transition-colors">
                          Attendance
                        </button>
                        <button className="px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-primary/20 transition-colors">
                          Lesson Plan
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {!stats?.todaysSchedule?.length && (
                <div className="py-24 bg-white border border-slate-100 rounded-3xl flex flex-col items-center shadow-sm">
                   <Clock className="text-slate-100 mb-4" size={64} />
                   <p className="text-sm font-bold text-slate-300 uppercase tracking-widest italic">No classes scheduled for today.</p>
                </div>
              )}
            </div>
          </div>

          {/* Pending Tasks */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-8">Grading Queue</h2>
            <div className="bg-white border border-slate-100 rounded-3xl shadow-sm overflow-hidden">
               <div className="divide-y divide-slate-50">
                  {stats?.pendingTasks?.map((task) => (
                    <div key={task.id} className="p-6 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                       <div className="flex items-start justify-between mb-2">
                          <h5 className="text-sm font-bold text-slate-900 flex items-center group-hover:text-primary transition-colors">
                             {task.title}
                             <ChevronRight size={14} className="ml-1 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                          </h5>
                       </div>
                       <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                             <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${
                               task.due === 'Today' ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'
                             }`}>
                                Due {task.due}
                             </span>
                          </div>
                          <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tight">{task.type}</span>
                       </div>
                    </div>
                  ))}
                  {!stats?.pendingTasks?.length && (
                    <div className="p-20 text-center">
                       <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">All clear!</p>
                    </div>
                  )}
               </div>
               <button className="w-full py-5 bg-slate-50 text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all text-[10px] font-bold uppercase tracking-widest flex items-center justify-center space-x-2 border-t border-slate-50">
                  <Plus size={14} />
                  <span>Manual Task</span>
               </button>
            </div>

            {/* Quick Tips or Insights */}
            <div className="mt-12 bg-indigo-900 p-8 rounded-3xl text-white relative overflow-hidden">
               <Award className="absolute -right-4 -bottom-4 text-white/5" size={100} />
               <h4 className="text-sm font-bold mb-4 relative z-10">Class Performance</h4>
               <p className="text-3xl font-extrabold tracking-tight mb-2 relative z-10">88%</p>
               <p className="text-xs text-white/60 font-medium italic relative z-10">Average quiz score for Grade 10-A</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboardPage;
