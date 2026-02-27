import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const TenantDetailPage = () => {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const { data } = await api.get(`/super-admin/tenants/${id}`);
        setTenant(data);
      } catch (error) {
        console.error('Failed to fetch tenant details:', error);
      }
    };
    fetchTenant();
  }, [id]);

  if (!tenant) {
    return <div className="min-h-screen bg-gray-900 text-white p-8">Loading tenant details...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <Link to="/super-admin/tenants" className="text-blue-400 hover:underline mb-4 block">&larr; Back to Tenant Management</Link>
          <h1 className="text-4xl font-bold tracking-tighter">{tenant.name}</h1>
          <p className="text-gray-400 mt-2">Detailed view of the tenant and their resources.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-gray-800 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6">Tenant Information</h2>
            <div className="space-y-4">
              <p><strong>ID:</strong> <span className="font-mono text-sm">{tenant.id}</span></p>
              <p><strong>Subscription Status:</strong> {tenant.subscriptionStatus}</p>
              <p><strong>Stripe Customer ID:</strong> <span className="font-mono text-sm">{tenant.stripeCustomerId || 'N/A'}</span></p>
              {/* Add more tenant details here as needed */}
            </div>
          </div>

          <div className="bg-gray-800 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6">Actions</h2>
            <div className="space-y-4">
              <button className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors">
                Impersonate Admin
              </button>
              <button className="w-full bg-yellow-500 text-black py-3 rounded-lg font-semibold hover:bg-yellow-600 transition-colors">
                Manage Subscription
              </button>
              <button className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors">
                Deactivate Tenant
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDetailPage;
