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
      // Fallback to mock data if endpoint fails
      setStats({
        children: [
          { id: '1', name: 'Alice Johnson', grade: 'Grade 10A', attendance: '98%', nextPaymentDue: 'Oct 1, 2026', nextPaymentAmount: 500 },
          { id: '2', name: 'Tommy Johnson', grade: 'Grade 8B', attendance: '95%', nextPaymentDue: 'Oct 1, 2026', nextPaymentAmount: 450 }
        ],
        recentGrades: [
          { id: 1, childName: 'Alice Johnson', subject: 'Mathematics', grade: 'A', date: 'Yesterday' },
          { id: 2, childName: 'Tommy Johnson', subject: 'Science', grade: 'B+', date: '2 days ago' },
          { id: 3, childName: 'Alice Johnson', subject: 'History', grade: 'A-', date: 'Last week' }
        ],
        upcomingEvents: [
          { id: 1, title: 'Parent-Teacher Conference', date: 'Oct 15, 2026', time: '14:00 - 16:00' },
          { id: 2, title: 'Science Fair', date: 'Oct 20, 2026', time: '09:00 - 12:00' }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-teal-600">SaaSLink</h2>
          <p className="text-sm text-gray-500 mt-1">Parent Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/parent" className="flex items-center px-4 py-3 text-teal-600 bg-teal-50 rounded-lg font-medium">
            <Activity className="w-5 h-5 mr-3" />
            Overview
          </Link>
          <a href="#" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Users className="w-5 h-5 mr-3" />
            My Children
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Award className="w-5 h-5 mr-3" />
            Academics
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <CheckSquare className="w-5 h-5 mr-3" />
            Attendance
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <CreditCard className="w-5 h-5 mr-3" />
            Fees & Payments
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <MessageSquare className="w-5 h-5 mr-3" />
            Messages
          </a>
        </nav>
        <div className="p-4 border-t border-gray-200">
          <button onClick={logout} className="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.username}</h1>
              <p className="text-gray-500 mt-1">Here is an overview of your children's progress.</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-teal-600 transition-colors relative">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-50"></span>
              </button>
              <div className="md:hidden">
                <button onClick={logout} className="text-red-600 font-medium">Logout</button>
              </div>
            </div>
          </header>

          {/* Children Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {stats?.children.map(child => (
              <div key={child.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center font-bold text-lg mr-4">
                      {child.name.split(' ').map((n: string) => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{child.name}</h3>
                      <p className="text-teal-600 font-medium">{child.grade}</p>
                    </div>
                  </div>
                  <button className="text-sm font-medium text-teal-600 hover:text-teal-800 flex items-center">
                    Profile <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Attendance</p>
                    <p className="text-2xl font-bold text-gray-900">{child.attendance}</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Next Payment</p>
                    <p className="text-2xl font-bold text-gray-900">${child.nextPaymentAmount}</p>
                    <p className="text-xs text-red-500 mt-1 font-medium">Due {child.nextPaymentDue}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Grades */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-teal-500" />
                  Recent Grades & Assessments
                </h2>
                <a href="#" className="text-sm font-medium text-teal-600 hover:text-teal-700">View all</a>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-gray-100">
                  {stats?.recentGrades.map((grade) => (
                    <li key={grade.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 mr-4">
                            <BookOpen className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{grade.subject}</p>
                            <p className="text-xs text-gray-500">{grade.childName} • {grade.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-teal-50 text-teal-700 font-bold text-sm">
                            {grade.grade}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                  {(!stats?.recentGrades || stats.recentGrades.length === 0) && (
                    <li className="p-6 text-center text-gray-500 text-sm">
                      No recent grades available.
                    </li>
                  )}
                </ul>
              </div>
            </div>

            {/* Upcoming Events */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-amber-500" />
                  Upcoming Events
                </h2>
              </div>
              <div className="p-0">
                <ul className="divide-y divide-gray-100">
                  {stats?.upcomingEvents.map((event) => (
                    <li key={event.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mr-4 text-center">
                          <div className="text-xs font-bold text-red-500 uppercase">{event.date.split(' ')[0]}</div>
                          <div className="text-xl font-bold text-gray-900">{event.date.split(' ')[1].replace(',', '')}</div>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-1 flex items-center">
                            <Clock className="w-3 h-3 mr-1" /> {event.time}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                  {(!stats?.upcomingEvents || stats.upcomingEvents.length === 0) && (
                    <li className="p-6 text-center text-gray-500 text-sm">
                      No upcoming events.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentDashboardPage;