import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';

const FinancialManagementPage = () => {
  const [pendingPayments, setPendingPayments] = useState([]);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const { data } = await api.get('/super-admin/payments/pending');
      setPendingPayments(data);
    } catch (error) {
      console.error('Failed to fetch pending payments:', error);
    }
  };

  const handleApprove = async (paymentId) => {
    if (window.confirm('Are you sure you want to approve this payment?')) {
      try {
        await api.post(`/payments/${paymentId}/approve`);
        fetchPendingPayments(); // Refresh the list
      } catch (error) {
        console.error('Failed to approve payment:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tighter">Financial Command</h1>
          <p className="text-gray-400 mt-2">Review and manage all financial activity on the platform.</p>
        </header>

        <div className="bg-gray-800 rounded-2xl p-8">
          <h2 className="text-2xl font-bold mb-6">Pending Bank Transfers</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-700/50">
                <tr>
                  <th className="p-4">Tenant</th>
                  <th className="p-4">Amount (KES)</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingPayments.map(payment => (
                  <motion.tr layout key={payment.id} className="border-b border-gray-700">
                    <td className="p-4">{payment.tenant.name}</td>
                    <td className="p-4">{payment.amount.toLocaleString()}</td>
                    <td className="p-4 font-mono text-sm">{payment.reference}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleApprove(payment.id)}
                        className="bg-green-500 text-white py-2 px-4 rounded-lg font-semibold hover:bg-green-600 transition-colors"
                      >
                        Approve
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {pendingPayments.length === 0 && (
            <p className="text-center text-gray-400 py-8">No pending payments.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialManagementPage;
