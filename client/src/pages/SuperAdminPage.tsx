import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Building, Wallet, Bell } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../services/api';

const StatCard = ({ icon, label, value, color }) => (
  <motion.div
    className="bg-gray-800 p-6 rounded-2xl flex items-center space-x-4"
    whileHover={{ y: -5, scale: 1.03 }}
  >
    <div className={`p-3 rounded-lg bg-${color}-500/20 text-${color}-400`}>{icon}</div>
    <div>
      <p className="text-gray-400 text-sm">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  </motion.div>
);

const SuperAdminPage = () => {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/super-admin/analytics');
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tighter">Mission Control</h1>
          <p className="text-gray-400 mt-2">System-wide overview and management dashboard.</p>
        </header>

        {analytics ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <StatCard icon={<Users size={24} />} label="Total Tenants" value={analytics.totalTenants} color="blue" />
            <StatCard icon={<Building size={24} />} label="Active Subscriptions" value={analytics.activeSubscriptions} color="green" />
            <StatCard icon={<Wallet size={24} />} label="Total Revenue (KES)" value={analytics.totalRevenue.toLocaleString()} color="purple" />
            <StatCard icon={<Bell size={24} />} label="Pending Approvals" value={analytics.pendingApprovals} color="yellow" />
          </div>
        ) : (
          <p>Loading analytics...</p>
        )}

        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6">Management Sections</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Link to="/super-admin/tenants" className="bg-gray-800 p-8 rounded-2xl hover:bg-gray-700 transition-colors">
              <h3 className="text-xl font-bold">Tenant Management</h3>
              <p className="text-gray-400 mt-2">View, search, and manage all tenants.</p>
            </Link>
            <Link to="/super-admin/financials" className="bg-gray-800 p-8 rounded-2xl hover:bg-gray-700 transition-colors">
              <h3 className="text-xl font-bold">Financial Command</h3>
              <p className="text-gray-400 mt-2">Review payments and manage subscriptions.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminPage;
