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
    <div className="max-w-full px-6 py-8">
      <header className="mb-8 border-b border-gray-200 pb-6">
        <nav className="flex mb-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
          <span>Command Center</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-bold uppercase tracking-widest italic">Operations Overview</span>
        </nav>
        <h1 className="text-3xl font-serif italic font-medium text-gray-900 leading-tight">Institutional Performance Matrix</h1>
        <p className="text-gray-500 font-sans mt-1 text-sm">Reviewing global metrics and real-time registry activity.</p>
      </header>

      {user?.role === UserRole.ADMIN && (user?.plan === SubscriptionPlan.FREE || !user?.plan) && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 bg-gray-900 border border-gray-800 p-6 text-white flex flex-col md:flex-row items-center justify-between shadow-xl"
            >
              <div className="flex items-center mb-4 md:mb-0">
                <div className="p-3 bg-white/10 rounded mr-4">
                  <Zap className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest italic text-gray-200">Limited License: Standard Tier</h3>
                  <p className="text-gray-500 text-[10px] uppercase font-mono tracking-tight mt-1">Upgrade required to unlock advanced analytics and multi-tenant capabilities.</p>
                </div>
              </div>
              <a 
                href="/pricing"
                className="px-6 py-2 bg-white text-gray-900 rounded-sm font-bold text-[10px] hover:bg-gray-100 transition-colors uppercase tracking-widest shadow-lg"
              >
                Access Upgrade
              </a>
            </motion.div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 border border-gray-100 rounded text-gray-400">
                  <Users size={16} />
                </div>
                <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">Active Registry</span>
              </div>
              <div>
                <p className="text-3xl font-serif italic text-gray-900 tabular-nums leading-none">{stats?.totalStudents || 0}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 tracking-widest">Enrolled Students</p>
              </div>
            </div>

            <div className="bg-white p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 border border-gray-100 rounded text-gray-400">
                  <UserCheck size={16} />
                </div>
                <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">Human Resources</span>
              </div>
              <div>
                <p className="text-3xl font-serif italic text-gray-900 tabular-nums leading-none">{stats?.totalStaff || 0}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 tracking-widest">Academic Faculty</p>
              </div>
            </div>

            <div className="bg-white p-8 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-50 border border-gray-100 rounded text-gray-400">
                  <DollarSign size={16} />
                </div>
                <span className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest">Temporal Revenue</span>
              </div>
              <div>
                <p className="text-3xl font-serif italic text-gray-900 tabular-nums leading-none">
                  <span className="text-sm font-sans not-italic mr-1 text-gray-300">KES</span>
                  {stats?.revenueThisMonth?.toLocaleString() || 0}
                </p>
                <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 tracking-widest">Monthly Receipts</p>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-700">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 font-serif italic">
              <h2 className="text-sm text-gray-900">Recent Registry Enrollment</h2>
              <a href="/students" className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Audit Full Index</a>
            </div>
            <div className="overflow-x-auto text-[11px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-transparent border-b border-gray-100 text-gray-400">
                    <th className="px-6 py-4 font-mono font-bold uppercase tracking-widest">Full Name</th>
                    <th className="px-6 py-4 font-mono font-bold uppercase tracking-widest">Electronic Mail</th>
                    <th className="px-6 py-4 font-mono font-bold uppercase tracking-widest text-right">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 italic-serif-headers">
                  {stats?.recentStudents && stats.recentStudents.length > 0 ? (
                    stats.recentStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4 font-serif italic text-gray-900 text-sm tracking-tight">{student.name}</td>
                        <td className="px-6 py-4 text-gray-500 font-sans tracking-tight">{student.email}</td>
                        <td className="px-6 py-4 text-right">
                          <button className="px-3 py-1 bg-gray-900 text-white rounded-sm text-[9px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors">Audit</button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-12 text-center text-gray-400 font-mono text-[9px] uppercase tracking-widest">
                        Registry empty for the current cycle.
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
