import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Users, BookOpen, Calendar, CheckSquare, LogOut, Bell, MessageSquare, Award, ChevronRight, Search, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const TeacherClassesPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mocking the classes fetch for now. In a real app, this would be an API call.
    setTimeout(() => {
      setClasses([
        { id: 1, name: 'Grade 10A', subject: 'Mathematics', students: 28, nextClass: 'Today, 08:00 AM', room: 'Room 101' },
        { id: 2, name: 'Grade 11B', subject: 'Physics', students: 24, nextClass: 'Today, 10:00 AM', room: 'Lab 2' },
        { id: 3, name: 'Grade 12A', subject: 'Computer Science', students: 20, nextClass: 'Today, 12:30 PM', room: 'Computer Lab' },
        { id: 4, name: 'Grade 10B', subject: 'Mathematics', students: 30, nextClass: 'Tomorrow, 09:00 AM', room: 'Room 102' },
      ]);
      setLoading(false);
    }, 500);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-indigo-600">SaaSLink</h2>
          <p className="text-sm text-gray-500 mt-1">Teacher Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link to="/teacher" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <BookOpen className="w-5 h-5 mr-3" />
            My Dashboard
          </Link>
          <Link to="/teacher/classes" className="flex items-center px-4 py-3 text-indigo-600 bg-indigo-50 rounded-lg font-medium">
            <Users className="w-5 h-5 mr-3" />
            My Classes
          </Link>
          <a href="#" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <CheckSquare className="w-5 h-5 mr-3" />
            Attendance
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Award className="w-5 h-5 mr-3" />
            Grading
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Calendar className="w-5 h-5 mr-3" />
            Schedule
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
              <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
              <p className="text-gray-500 mt-1">Manage your assigned classes and student rosters.</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative hidden md:block">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search classes..." 
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
              <button className="p-2 text-gray-400 hover:text-indigo-600 transition-colors relative">
                <Bell className="w-6 h-6" />
              </button>
            </div>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-6 border-b border-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{cls.name}</h3>
                      <p className="text-indigo-600 font-medium">{cls.subject}</p>
                    </div>
                    <span className="bg-indigo-50 text-indigo-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {cls.students} Students
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      Next: {cls.nextClass}
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="w-4 h-4 mr-2 text-gray-400" />
                      Room: {cls.room}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-6 py-4 flex justify-between items-center">
                  <div className="flex -space-x-2 overflow-hidden">
                    {/* Mock student avatars */}
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-500">
                        S{i}
                      </div>
                    ))}
                    <div className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-600">
                      +{cls.students - 4}
                    </div>
                  </div>
                  <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center">
                    View Roster <ChevronRight className="w-4 h-4 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TeacherClassesPage;
