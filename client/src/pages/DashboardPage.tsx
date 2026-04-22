import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { UserRole } from '../../../src/common/user-role.enum';
import { SubscriptionPlan } from '../../../src/common/subscription.enums';
import { Users, UserCheck, DollarSign, Activity, LogOut, Settings, GraduationCap, Calendar, FileText, CreditCard, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <div className="max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-[32px] font-black tracking-tight text-gray-900 leading-none mb-3 uppercase">
            Control <span className="text-brand-green">Nexus</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      {user?.role === UserRole.ADMIN && (user?.plan === SubscriptionPlan.FREE || !user?.plan) && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 bg-blue-600 rounded-2xl p-6 text-white flex flex-col md:flex-row items-center justify-between shadow-lg shadow-blue-200"
            >
              <div className="flex items-center mb-4 md:mb-0">
                <div className="p-3 bg-white/20 rounded-xl mr-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">You are currently on the Free Plan</h3>
                  <p className="text-blue-100 text-sm">Upgrade to Standard or Premium to unlock all features for your school.</p>
                </div>
              </div>
              <a 
                href="/pricing"
                className="px-6 py-2 bg-white text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-50 transition-colors uppercase tracking-wider"
              >
                Upgrade Now
              </a>
            </motion.div>
          )}

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
  );
};

export default DashboardPage;
