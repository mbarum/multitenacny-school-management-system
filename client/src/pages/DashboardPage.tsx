import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { UserRole } from '../../../src/common/user-role.enum';
import { Users, UserCheck, DollarSign, Activity, LogOut, Settings, GraduationCap, Calendar, FileText, CreditCard } from 'lucide-react';

interface DashboardStats {
  totalStudents: number;
  totalStaff: number;
  revenueThisMonth: number;
  recentStudents: { id: string; name: string; email: string }[];
}

const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-blue-600">SaaSLink</h2>
          <p className="text-sm text-gray-500 mt-1">School Management</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <a href="/dashboard" className="flex items-center px-4 py-3 text-blue-600 bg-blue-50 rounded-lg font-medium">
            <Activity className="w-5 h-5 mr-3" />
            Dashboard
          </a>
          <a href="/students" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Users className="w-5 h-5 mr-3" />
            Students
          </a>
          <a href="/academics/classes" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <GraduationCap className="w-5 h-5 mr-3" />
            Academics
          </a>
          <a href="/staff" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <UserCheck className="w-5 h-5 mr-3" />
            Staff
          </a>
          <a href="/attendance" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <Calendar className="w-5 h-5 mr-3" />
            Attendance
          </a>
          <a href="/reports" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <FileText className="w-5 h-5 mr-3" />
            Reports
          </a>
          <a href="/payments" className="flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg font-medium transition-colors">
            <CreditCard className="w-5 h-5 mr-3" />
            Payments
          </a>
          {user?.role === UserRole.SUPER_ADMIN && (
            <a href="/super-admin" className="flex items-center px-4 py-3 text-purple-600 hover:bg-purple-50 rounded-lg font-medium transition-colors mt-4 border border-purple-100">
              <Settings className="w-5 h-5 mr-3" />
              Super Admin
            </a>
          )}
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
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user?.username}</h1>
              <p className="text-gray-500 mt-1">Here's what's happening at your school today.</p>
            </div>
            <div className="md:hidden">
              <button onClick={logout} className="text-red-600 font-medium">Logout</button>
            </div>
          </header>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-4 bg-blue-50 rounded-lg mr-4">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Students</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalStudents || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-4 bg-green-50 rounded-lg mr-4">
                <UserCheck className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Total Staff</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.totalStaff || 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
              <div className="p-4 bg-purple-50 rounded-lg mr-4">
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Revenue (This Month)</p>
                <p className="text-3xl font-bold text-gray-900">${stats?.revenueThisMonth?.toLocaleString() || 0}</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Recently Added Students</h2>
              <a href="/students" className="text-sm font-medium text-blue-600 hover:text-blue-700">View all</a>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm">
                    <th className="px-6 py-4 font-medium">Name</th>
                    <th className="px-6 py-4 font-medium">Email</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {stats?.recentStudents && stats.recentStudents.length > 0 ? (
                    stats.recentStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 font-medium text-gray-900">{student.name}</td>
                        <td className="px-6 py-4 text-gray-500">{student.email}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">View</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                        No students found. Add some students to see them here.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DashboardPage;
