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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-[32px] font-black tracking-tight text-gray-900 leading-none mb-3 uppercase">
            Educator <span className="text-brand-green">Hub</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            Welcome back, {user?.username} • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <button className="w-12 h-12 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-brand-green transition-all relative group">
            <Bell size={20} />
            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
        </div>
      </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-4 bg-indigo-50 rounded-lg mr-4">
                <Users className="w-8 h-8 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-4 bg-emerald-50 rounded-lg mr-4">
                <BookOpen className="w-8 h-8 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Classes Taught</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalClasses || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-4 bg-amber-50 rounded-lg mr-4">
                <CheckSquare className="w-8 h-8 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Pending Tasks</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.pendingTasks?.length || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Today's Schedule */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-indigo-500" />
                  Today's Schedule
                </h2>
                <span className="text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {stats?.todaysSchedule?.map((session, index) => (
                    <div key={session.id} className="flex relative">
                      {/* Timeline line */}
                      {index !== (stats?.todaysSchedule?.length || 0) - 1 && (
                        <div className="absolute top-8 bottom-[-24px] left-[11px] w-0.5 bg-gray-100"></div>
                      )}
                      
                      <div className="mr-6 flex flex-col items-center">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 border-4 border-white shadow-sm flex items-center justify-center z-10">
                          <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                        </div>
                      </div>
                      
                      <div className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900">{session.subject}</h3>
                          <span className="text-sm font-medium text-gray-500">{session.time}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1 text-gray-400" />
                            {session.class}
                          </span>
                          <span className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1 text-gray-400" />
                            {session.room}
                          </span>
                        </div>
                        <div className="mt-4 flex space-x-3">
                          <button className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
                            Take Attendance
                          </button>
                          <button className="text-xs font-medium px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors">
                            Lesson Plan
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!stats?.todaysSchedule || stats.todaysSchedule.length === 0) && (
                    <div className="text-center py-8 text-gray-500">
                      No classes scheduled for today.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pending Tasks */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <CheckSquare className="w-5 h-5 mr-2 text-amber-500" />
                  Tasks & Reminders
                </h2>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-gray-100">
                  {stats?.pendingTasks?.map((task) => (
                    <li key={task.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <input type="checkbox" className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" />
                        </div>
                        <div className="ml-3 flex-1">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <div className="mt-1 flex items-center justify-between">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              task.due === 'Today' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              Due {task.due}
                            </span>
                            <span className="text-xs text-gray-500 capitalize">{task.type}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                  {(!stats?.pendingTasks || stats.pendingTasks.length === 0) && (
                    <li className="p-6 text-center text-gray-500 text-sm">
                      All caught up! No pending tasks.
                    </li>
                  )}
                </ul>
                <div className="p-4 border-t border-gray-100 bg-gray-50">
                  <button className="w-full text-sm font-medium text-indigo-600 hover:text-indigo-700">
                    + Add New Task
                  </button>
                </div>
              </div>
            </div>
          </div>
    </div>
  );
};

export default TeacherDashboardPage;
