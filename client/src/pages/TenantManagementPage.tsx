import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const TenantManagementPage = () => {
  const [tenants, setTenants] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchTenants = async () => {
      try {
        const { data } = await api.get('/super-admin/tenants');
        setTenants(data);
      } catch (error) {
        console.error('Failed to fetch tenants:', error);
      }
    };
    fetchTenants();
  }, []);

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tighter">Tenant Management</h1>
          <p className="text-gray-400 mt-2">Search, view, and manage all tenants on the platform.</p>
        </header>

        <div className="mb-8">
          <input
            type="text"
            placeholder="Search tenants..."
            className="w-full bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <motion.div layout className="bg-gray-800 rounded-2xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Subscription Status</th>
                <th className="p-4">Stripe Customer ID</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map(tenant => (
                <motion.tr layout key={tenant.id} className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors">
                  <td className="p-4">{tenant.name}</td>
                  <td className="p-4">{tenant.subscriptionStatus}</td>
                  <td className="p-4 font-mono text-sm">{tenant.stripeCustomerId || 'N/A'}</td>
                  <td className="p-4">
                    <Link to={`/super-admin/tenants/${tenant.id}`} className="text-blue-400 hover:underline">View Details</Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </div>
  );
};

export default TenantManagementPage;
