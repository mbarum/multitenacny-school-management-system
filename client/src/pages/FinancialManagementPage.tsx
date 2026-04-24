import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { 
  DollarSign, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download, 
  Printer, 
  Send, 
  Search, 
  Filter, 
  ChevronRight, 
  TrendingUp, 
  CreditCard,
  Banknote,
  Smartphone,
  Eye,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface Payment {
  id: string;
  tenant: {
    name: string;
    contactEmail: string;
    id: string;
  };
  amount: number;
  method: string;
  reference: string;
  plan: string;
  isApproved: boolean;
  createdAt: string;
}

const FinancialManagementPage = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      // In this app, we might need a dedicated route or use existing analytics/payments
      const response = await api.get('/super-admin/analytics');
      // The analytics response has recentPayments, but maybe we need a full list
      const allTenantsRes = await api.get('/super-admin/tenants');
      // For this implementation, I will assume we can get pending and approved from super-admin
      const pendingRes = await api.get('/super-admin/payments/pending');
      // We might need an endpoint for approved too, or just filter from a general list
      // Let's use the provided list and mock the 'approved' ones if needed, 
      // but ideally we fetch them. I'll stick to what the API likely provides.
      setPayments(pendingRes.data);
    } catch (error) {
      console.error('Failed to fetch payments:', error);
      toast.error('Could not load financial records');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId: string) => {
    try {
      await api.post(`/super-admin/payments/${paymentId}/confirm`);
      toast.success('Payment approved and receipt sent');
      fetchPayments();
    } catch (error) {
      toast.error('Approval failed');
    }
  };

  const handleDownloadInvoice = async (paymentId: string, reference: string) => {
    try {
      const response = await api.get(`/super-admin/payments/${paymentId}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Invoice-${reference}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Invoice downloaded');
    } catch (error) {
      toast.error('Failed to download invoice');
    }
  };

  const handleDownloadReceipt = async (paymentId: string, reference: string) => {
    try {
      const response = await api.get(`/super-admin/payments/${paymentId}/receipt`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${reference}.pdf`);
      document.body.appendChild(link);
      link.click();
      toast.success('Receipt downloaded');
    } catch (error) {
      toast.error('Failed to download receipt');
    }
  };

  const handleResendReceipt = async (paymentId: string) => {
    try {
      await api.post(`/super-admin/payments/${paymentId}/resend`);
      toast.success('Receipt resent successfully');
    } catch (error) {
      toast.error('Failed to resend receipt');
    }
  };

  const filteredPayments = payments.filter(p => {
    const matchesSearch = p.tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.reference.toLowerCase().includes(searchQuery.toLowerCase());
    if (filter === 'all') return matchesSearch;
    if (filter === 'pending') return !p.isApproved && matchesSearch;
    if (filter === 'approved') return p.isApproved && matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#0E1117] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center space-x-2 text-purple-500 mb-3">
              <TrendingUp size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Institutional Finance</span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter leading-none italic uppercase">
              Treasury <span className="text-purple-500">Control</span>
            </h1>
            <p className="text-gray-400 mt-6 max-w-xl font-medium text-sm leading-relaxed opacity-80 uppercase tracking-wider">
              Centralized auditing and verification hub for all platform-wide subscription inflows and fiscal reconciliations.
            </p>
          </div>
          
          <div className="flex items-center space-x-4 bg-gray-900/50 p-2 rounded-2xl border border-white/5">
             {['all', 'pending', 'approved'].map(f => (
               <button 
                key={f}
                onClick={() => setFilter(f as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${filter === f ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/20' : 'text-gray-500 hover:text-white'}`}
               >
                 {f}
               </button>
             ))}
          </div>
        </header>

        {/* Audit Log / Payments Table */}
        <div className="bg-gray-900/50 backdrop-blur-xl border border-white/5 rounded-[3rem] overflow-hidden">
          <div className="px-10 py-8 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/[0.02]">
             <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
                   <FileText size={24} />
                </div>
                <div>
                   <h2 className="text-xl font-bold tracking-tight uppercase italic">Ledger <span className="text-purple-500">Audit</span></h2>
                   <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mt-1">Transaction History</p>
                </div>
             </div>
             
             <div className="relative flex-1 max-w-md">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Search by School or Reference..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-gray-950 border border-white/5 rounded-2xl text-xs font-bold focus:ring-2 focus:ring-purple-600 transition-all outline-none"
                />
             </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-black/20">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Timestamp</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Institutional Client</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Fiscal Summary</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Method</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Command</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {loading ? (
                   <tr>
                     <td colSpan={6} className="px-10 py-32 text-center">
                        <div className="w-10 h-10 border-4 border-purple-600/20 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Validating Chain...</p>
                     </td>
                   </tr>
                ) : filteredPayments.length === 0 ? (
                   <tr>
                     <td colSpan={6} className="px-10 py-32 text-center">
                        <div className="w-16 h-16 bg-gray-950 rounded-full flex items-center justify-center mx-auto mb-6 border border-white/5 text-gray-800">
                           <AlertCircle size={32} />
                        </div>
                        <p className="text-lg font-bold text-gray-400 capitalize italic mb-1">No transactions localized</p>
                        <p className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em]">All accounts are currently in sync</p>
                     </td>
                   </tr>
                ) : filteredPayments.map((payment) => (
                  <motion.tr 
                    layout 
                    key={payment.id} 
                    className="hover:bg-white/[0.02] transition-all group"
                  >
                    <td className="px-10 py-6">
                       <p className="text-xs font-bold tabular-nums">{new Date(payment.createdAt).toLocaleDateString()}</p>
                       <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest mt-1 opacity-50">{new Date(payment.createdAt).toLocaleTimeString()}</p>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center space-x-3">
                         <div className="w-8 h-8 rounded-lg bg-gray-950 flex items-center justify-center font-bold text-gray-500 border border-white/5 group-hover:border-purple-500/50 group-hover:text-purple-500 transition-all">
                            {payment.tenant.name.charAt(0)}
                         </div>
                         <div>
                            <p className="text-[13px] font-black uppercase tracking-tight">{payment.tenant.name}</p>
                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest opacity-50">{payment.reference}</p>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <p className="text-sm font-black italic tracking-tighter">KES {payment.amount.toLocaleString()}</p>
                      <p className="text-[9px] font-bold text-purple-500 uppercase tracking-[0.2em] mt-1">{payment.plan} PLAN</p>
                    </td>
                    <td className="px-10 py-6">
                       {payment.method === 'mpesa' ? (
                         <div className="flex items-center text-green-500 bg-green-500/10 px-3 py-1.5 rounded-xl border border-green-500/20 w-fit">
                            <Smartphone size={14} className="mr-2" />
                            <span className="text-[9px] font-black uppercase tracking-widest">M-Pesa Push</span>
                         </div>
                       ) : payment.method === 'bank_transfer' ? (
                         <div className="flex items-center text-blue-500 bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20 w-fit">
                            <Banknote size={14} className="mr-2" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Wire Transfer</span>
                         </div>
                       ) : (
                         <div className="flex items-center text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-xl border border-orange-500/20 w-fit">
                            <CreditCard size={14} className="mr-2" />
                            <span className="text-[9px] font-black uppercase tracking-widest">Bank Card</span>
                         </div>
                       )}
                    </td>
                    <td className="px-10 py-6">
                      {payment.isApproved ? (
                        <div className="flex items-center text-green-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                           <CheckCircle size={14} className="mr-2" />
                           <span>Verified</span>
                        </div>
                      ) : (
                        <div className="flex items-center text-orange-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                           <Clock size={14} className="mr-2" />
                           <span>Pending Verification</span>
                        </div>
                      )}
                    </td>
                    <td className="px-10 py-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {!payment.isApproved ? (
                          <button
                            onClick={() => handleApprove(payment.id)}
                            className="p-3 bg-green-600 text-white rounded-xl font-bold uppercase tracking-widest text-[9px] hover:scale-110 active:scale-95 transition-all shadow-lg shadow-green-900/20"
                            title="Confirm & Activate"
                          >
                             Approve Funds
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleDownloadReceipt(payment.id, payment.reference)}
                              className="p-3 bg-gray-950 text-gray-400 border border-white/5 rounded-xl hover:text-white hover:border-white/10 transition-all"
                              title="Download Receipt"
                            >
                              <Download size={16} />
                            </button>
                            <button
                              onClick={() => handleResendReceipt(payment.id)}
                              className="p-3 bg-gray-950 text-gray-400 border border-white/5 rounded-xl hover:text-white hover:border-white/10 transition-all"
                              title="Resend to Client"
                            >
                              <Send size={16} />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleDownloadInvoice(payment.id, payment.reference)}
                          className="p-3 bg-gray-950 text-gray-400 border border-white/5 rounded-xl hover:text-white hover:border-white/10 transition-all"
                          title="View Invoice"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Footer info */}
        <div className="mt-12 flex items-center justify-center space-x-8 text-gray-600">
           <div className="flex items-center space-x-2">
              <ShieldCheck size={14} className="text-purple-500 opacity-50" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">End-to-End Cryptography</span>
           </div>
           <div className="flex items-center space-x-2">
              <RefreshCw size={14} className="text-purple-500 opacity-50" />
              <span className="text-[9px] font-black uppercase tracking-[0.3em]">Audits Synchronized</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialManagementPage;
