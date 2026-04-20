import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building, Wallet, Bell, GraduationCap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import api from '../services/api';

const StatCard = ({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) => (
  <motion.div
    className="bg-gray-800 p-6 rounded-2xl flex items-center space-x-4 border border-gray-700"
    whileHover={{ y: -5, scale: 1.02 }}
  >
    <div className={`p-3 rounded-xl bg-${color}-500/20 text-${color}-400`}>{icon}</div>
    <div>
      <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{label}</p>
      <p className="text-3xl font-bold text-white mt-1">{value}</p>
    </div>
  </motion.div>
);

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];

const SuperAdminPage = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/super-admin/analytics');
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tighter">Mission Control</h1>
            <p className="text-gray-400 mt-2">System-wide overview and management dashboard.</p>
          </div>
          <div className="flex space-x-4">
            <Link to="/super-admin/tenants" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700">
              Manage Tenants
            </Link>
            <Link to="/super-admin/settings" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors border border-gray-700">
              Gateway Configs
            </Link>
            <Link to="/super-admin/financials" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition-colors">
              Financial Command
            </Link>
          </div>
        </header>

        {analytics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
              <StatCard icon={<Building size={24} />} label="Total Schools" value={analytics.totalTenants} color="blue" />
              <StatCard icon={<Building size={24} />} label="Active Subs" value={analytics.activeSubscriptions} color="green" />
              <StatCard icon={<GraduationCap size={24} />} label="Total Students" value={analytics.totalStudents} color="purple" />
              <StatCard icon={<Users size={24} />} label="Avg Attendance" value={`${analytics.averageAttendance}%`} color="indigo" />
              <StatCard icon={<Wallet size={24} />} label="Revenue (KES)" value={analytics.totalRevenue.toLocaleString()} color="emerald" />
              <StatCard icon={<Bell size={24} />} label="Pending Approvals" value={analytics.pendingApprovals} color="yellow" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              {/* Revenue Chart */}
              <div className="lg:col-span-2 bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-lg font-bold mb-6">Revenue Over Time</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={analytics.revenueOverTime}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="month" stroke="#9ca3af" axisLine={false} tickLine={false} />
                      <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} tickFormatter={(value) => `KES ${value}`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#10b981' }}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tenants by Plan */}
              <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
                <h3 className="text-lg font-bold mb-6">Schools by Plan</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={analytics.tenantsByPlan}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {analytics.tenantsByPlan.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Recent Payments Table */}
            <div className="bg-gray-800 rounded-2xl border border-gray-700 overflow-hidden">
              <div className="p-6 border-b border-gray-700 flex justify-between items-center">
                <h3 className="text-lg font-bold">Recent Payments</h3>
                <Link to="/super-admin/financials" className="text-sm text-blue-400 hover:text-blue-300 flex items-center">
                  View All <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-900/50 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">School</th>
                      <th className="p-4 font-medium">Amount</th>
                      <th className="p-4 font-medium">Method</th>
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {analytics.recentPayments.map((payment: any) => (
                      <tr key={payment.id} className="hover:bg-gray-750 transition-colors">
                        <td className="p-4 font-medium">{payment.tenantName}</td>
                        <td className="p-4">KES {payment.amount.toLocaleString()}</td>
                        <td className="p-4 capitalize">{payment.method}</td>
                        <td className="p-4 text-gray-400">{new Date(payment.date).toLocaleDateString()}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            payment.status === 'Approved' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {payment.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {analytics.recentPayments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-500">No recent payments found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center p-12 bg-gray-800 rounded-2xl border border-gray-700">
            <p className="text-gray-400">Failed to load analytics data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminPage;

