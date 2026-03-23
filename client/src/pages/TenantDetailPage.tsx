import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../services/api';

const TenantDetailPage = () => {
  const { id } = useParams();
  const [tenant, setTenant] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTenant();
  }, [id]);

  const fetchTenant = async () => {
    try {
      const { data } = await api.get(`/super-admin/tenants/${id}`);
      setTenant(data);
    } catch (error) {
      console.error('Failed to fetch tenant details:', error);
    }
  };

  const toggleTenantStatus = async () => {
    if (!tenant) return;
    const newStatus = tenant.subscriptionStatus === 'active' ? 'inactive' : 'active';
    if (!window.confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this tenant?`)) return;
    
    setLoading(true);
    try {
      await api.patch(`/super-admin/tenants/${id}/status`, { status: newStatus });
      await fetchTenant();
    } catch (error) {
      console.error('Failed to update tenant status:', error);
      alert('Failed to update tenant status');
    } finally {
      setLoading(false);
    }
  };

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
              <p><strong>Domain:</strong> {tenant.domain}</p>
              <p><strong>Plan:</strong> <span className="capitalize">{tenant.plan}</span></p>
              <p>
                <strong>Status:</strong> 
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${tenant.subscriptionStatus === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {tenant.subscriptionStatus.toUpperCase()}
                </span>
              </p>
              <p><strong>Stripe Customer ID:</strong> <span className="font-mono text-sm">{tenant.stripeCustomerId || 'N/A'}</span></p>
            </div>
          </div>

          <div className="bg-gray-800 p-8 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6">Actions</h2>
            <div className="space-y-4">
              <button 
                onClick={toggleTenantStatus}
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                  tenant.subscriptionStatus === 'active' 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                } disabled:opacity-50`}
              >
                {loading ? 'Processing...' : tenant.subscriptionStatus === 'active' ? 'Deactivate Tenant' : 'Activate Tenant'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDetailPage;
