import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Building2, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  PieChart,
  Target,
  ArrowRight,
  Printer,
  Download,
  CreditCard,
  User,
  Zap,
  TrendingUp,
  BarChart3,
  RefreshCw,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  student?: {
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
  items: { description: string; amount: number }[];
}

interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

interface DashboardMetrics {
  cashBalance: number;
  receivables: number;
  revenue: number;
  expenses: number;
}

const TreasuryPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'revenue' | 'expenses'>('overview');
  
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);

  const [invoiceForm, setInvoiceForm] = useState({
    studentId: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ description: '', amount: '' }]
  });

  const [paymentForm, setPaymentForm] = useState({
    invoiceId: '',
    amount: '',
    method: 'cash',
    reference: ''
  });

  const [expenseForm, setExpenseForm] = useState({
    category: 'Operations',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchFinancials();
  }, []);

  const fetchFinancials = async () => {
    setLoading(true);
    try {
      const [metricsRes, invoicesRes, expensesRes] = await Promise.all([
        api.get('/finance/dashboard'),
        api.get('/finance/invoices'),
        api.get('/expenses')
      ]);
      setMetrics(metricsRes.data);
      setInvoices(invoicesRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Failed to fetch financials', error);
      toast.error('Could not sync treasury data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        studentId: invoiceForm.studentId,
        dueDate: new Date(invoiceForm.dueDate),
        items: invoiceForm.items.map(i => ({ description: i.description, amount: Number(i.amount) }))
      };
      await api.post('/finance/invoices', payload);
      toast.success('Invoice generated & posted to ledger');
      setIsCreatingInvoice(false);
      setInvoiceForm({ studentId: '', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], items: [{ description: '', amount: '' }] });
      fetchFinancials();
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/finance/payments', {
        invoiceId: paymentForm.invoiceId,
        amount: Number(paymentForm.amount),
        method: paymentForm.method,
        reference: paymentForm.reference
      });
      toast.success('Payment recorded & ledger updated');
      setIsRecordingPayment(false);
      setPaymentForm({ invoiceId: '', amount: '', method: 'cash', reference: '' });
      fetchFinancials();
    } catch (error) {
      toast.error('Failed to post payment');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/expenses', {
        ...expenseForm,
        amount: Number(expenseForm.amount)
      });
      toast.success('Expense recorded');
      setIsAddingExpense(false);
      setExpenseForm({ category: 'Operations', amount: '', description: '', date: new Date().toISOString().split('T')[0] });
      fetchFinancials();
    } catch (error) {
      toast.error('Failed to record expense');
    }
  };

  const addInvoiceItem = () => {
    setInvoiceForm({
      ...invoiceForm,
      items: [...invoiceForm.items, { description: '', amount: '' }]
    });
  };

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center bg-white"><RefreshCw className="animate-spin text-emerald-500" size={48} /></div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 mb-3">
              <Building2 size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Treasury Command</span>
            </div>
            <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
              Fiscal <span className="text-emerald-500">Ops</span>
            </h1>
          </div>
          
          <div className="flex items-center bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
             {['overview', 'invoices', 'revenue', 'expenses'].map(tab => (
               <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white text-gray-900 shadow-xl shadow-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 {tab}
               </button>
             ))}
          </div>
        </header>

        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div className="bg-emerald-500 rounded-[3rem] p-8 text-white shadow-2xl shadow-emerald-200 group overflow-hidden relative">
                   <Wallet className="mb-6 opacity-40 group-hover:scale-110 transition-transform" size={32} />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Net Liquidity</p>
                   <h2 className="text-4xl font-black tabular-nums tracking-tighter italic">
                     KES {Number(metrics?.cashBalance || 0).toLocaleString()}
                   </h2>
                </div>

                <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                      <TrendingUp size={24} />
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Revenue</p>
                   <h2 className="text-4xl font-black tabular-nums tracking-tighter text-gray-900 italic">
                     KES {Number(metrics?.revenue || 0).toLocaleString()}
                   </h2>
                </div>

                <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm">
                   <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                      <ArrowDownRight size={24} />
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Receivables</p>
                   <h2 className="text-4xl font-black tabular-nums tracking-tighter text-gray-900 italic">
                     KES {Number(metrics?.receivables || 0).toLocaleString()}
                   </h2>
                </div>

                <div className="bg-gray-900 rounded-[3rem] p-8 text-white shadow-2xl shadow-gray-200 flex flex-col justify-between">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Fiscal Status</p>
                     <h3 className="text-xl font-bold italic tracking-tighter">Healthy</h3>
                   </div>
                   <button className="flex items-center justify-between w-full bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl transition-all group">
                      <span className="text-[10px] font-black uppercase tracking-widest">Compliance Audit</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[3.5rem] p-10 shadow-sm">
                   <div className="flex items-center justify-between mb-12">
                      <h3 className="text-2xl font-black tracking-tighter uppercase italic">Recent <span className="text-rose-500">Expenditure</span></h3>
                      <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-gray-900 transition-all"><Download size={18} /></button>
                   </div>
                   <div className="space-y-8">
                      {expenses.slice(0, 5).map(exp => (
                        <div key={exp.id} className="flex items-center justify-between group">
                          <div className="flex items-center space-x-6">
                            <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-rose-500 group-hover:text-white transition-all">
                              <ArrowDownRight size={20} />
                            </div>
                            <div>
                               <p className="text-sm font-black uppercase tracking-tight text-gray-900">{exp.category}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{exp.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[13px] font-black text-rose-600 italic tabular-nums">-KES {Number(exp.amount).toLocaleString()}</p>
                             <p className="text-[9px] font-bold text-gray-300 uppercase mt-1">{new Date(exp.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="bg-gray-50 rounded-[3rem] p-10 flex flex-col justify-center">
                    <PieChart className="text-emerald-500 mb-6" size={32} />
                    <h4 className="text-xl font-black italic tracking-tighter mb-4 uppercase text-gray-900">Capital <span className="text-emerald-500">Distribution</span></h4>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-8">
                      High-level breakdown of institutional asset allocation and liquidity ratios.
                    </p>
                    <div className="space-y-4">
                        {[
                          { label: 'Operational Funds', value: 45, color: 'bg-emerald-500' },
                          { label: 'Strategic Reserve', value: 30, color: 'bg-blue-500' },
                          { label: 'Short-term Debt', value: 25, color: 'bg-rose-500' }
                        ].map(item => (
                          <div key={item.label}>
                              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                <span className="text-gray-400">{item.label}</span>
                                <span className="text-gray-900">{item.value}%</span>
                              </div>
                              <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                              </div>
                          </div>
                        ))}
                    </div>
                </div>
             </div>
          </motion.div>
        )}

        {activeTab === 'invoices' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex justify-between items-center bg-gray-900 text-white p-12 rounded-[4rem] shadow-2xl">
              <div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">Billing <span className="text-blue-500">Engine</span></h2>
                <p className="text-gray-400 text-sm max-w-md uppercase tracking-wider opacity-60">
                   Post-ledger invoicing system for institutional student billing and reconciliation.
                </p>
              </div>
              <button onClick={() => setIsCreatingInvoice(true)} className="bg-white text-gray-900 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all">
                Generate Invoice
              </button>
            </div>
            <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead><tr className="bg-gray-50/50">
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Invoice #</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Student</th>
                  <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                  <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total KES</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50/30 transition-all group">
                      <td className="px-10 py-6 font-mono font-bold text-gray-400 text-xs">{inv.invoiceNumber}</td>
                      <td className="px-10 py-6">
                        <span className="text-sm font-black uppercase tracking-tight text-gray-900">{inv.student?.firstName} {inv.student?.lastName}</span>
                      </td>
                      <td className="px-10 py-6">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                        }`}>{inv.status}</span>
                      </td>
                      <td className="px-10 py-6 text-right font-black italic tracking-tighter text-gray-900 tabular-nums">{Number(inv.amount).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'revenue' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
            <div className="flex justify-between items-center bg-emerald-500 text-white p-12 rounded-[4rem] shadow-2xl">
              <div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">Revenue <span className="text-emerald-200">Centre</span></h2>
                <p className="text-emerald-100 text-sm max-w-md uppercase tracking-wider opacity-80">
                  Real-time reporting of settlements across all institutional channels.
                </p>
              </div>
              <button 
                onClick={() => setIsRecordingPayment(true)}
                className="bg-white text-emerald-600 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl active:scale-95"
              >
                Post Payment
              </button>
            </div>
          </motion.div>
        )}

        {activeTab === 'expenses' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
            <div className="flex justify-between items-center bg-rose-500 text-white p-12 rounded-[4rem] shadow-2xl">
              <div>
                <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">Expenditure <span className="text-rose-200">Log</span></h2>
                <p className="text-rose-100 text-sm max-w-md uppercase tracking-wider opacity-80">
                  Detailed operational outlays for institutional maintenance and enhancement.
                </p>
              </div>
              <button 
                onClick={() => setIsAddingExpense(true)}
                className="bg-white text-rose-500 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl active:scale-95"
              >
                Log Outflow
              </button>
            </div>
            <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead><tr className="bg-gray-50/50">
                    <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Category</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Description</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount KES</th>
                  </tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {expenses.map(exp => (
                      <tr key={exp.id}>
                        <td className="px-10 py-6 text-[10px] font-black uppercase text-gray-400">{exp.category}</td>
                        <td className="px-10 py-6 text-sm font-bold text-gray-900">{exp.description}</td>
                        <td className="px-10 py-6 text-right font-black italic text-rose-600">{Number(exp.amount).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {isCreatingInvoice && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl"
              >
                 <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-blue-50/30">
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase">Create <span className="text-blue-600">Billing</span></h3>
                    <button onClick={() => setIsCreatingInvoice(false)} className="p-4 hover:bg-white text-gray-400 rounded-2xl transition-all"><X size={20} /></button>
                 </div>
                 <form onSubmit={handleCreateInvoice} className="p-10 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Student ID</label>
                          <input required type="text" value={invoiceForm.studentId} onChange={(e) => setInvoiceForm({...invoiceForm, studentId: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" />
                       </div>
                       <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Due Date</label>
                          <input required type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" />
                       </div>
                    </div>
                    <div className="space-y-4">
                      <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest">Line Items</label>
                      {invoiceForm.items.map((item, index) => (
                        <div key={index} className="flex gap-4">
                          <input required type="text" placeholder="Description" value={item.description} onChange={(e) => {
                              const newItems = [...invoiceForm.items];
                              newItems[index].description = e.target.value;
                              setInvoiceForm({...invoiceForm, items: newItems});
                          }} className="flex-grow bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" />
                          <input required type="number" placeholder="KES" value={item.amount} onChange={(e) => {
                              const newItems = [...invoiceForm.items];
                              newItems[index].amount = e.target.value;
                              setInvoiceForm({...invoiceForm, items: newItems});
                          }} className="w-32 bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" />
                        </div>
                      ))}
                      <button type="button" onClick={addInvoiceItem} className="text-[10px] font-black uppercase text-blue-600 tracking-widest flex items-center gap-2"><Plus size={14} /> Add Line</button>
                    </div>
                    <button type="submit" className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all">Submit Billing</button>
                 </form>
              </motion.div>
          </div>
        )}

        {isRecordingPayment && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"
              >
                 <div className="p-10 border-b border-gray-50 flex justify-between items-center text-emerald-600 bg-emerald-50/30">
                    <h3 className="text-3xl font-black italic uppercase">Collect <span className="text-gray-900">Funds</span></h3>
                    <button onClick={() => setIsRecordingPayment(false)} className="p-4 hover:bg-white text-emerald-400 rounded-2xl transition-all"><X size={20} /></button>
                 </div>
                 <form onSubmit={handleRecordPayment} className="p-10 space-y-6">
                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Invoice Selection (Target Invoice ID)</label>
                        <input required type="text" value={paymentForm.invoiceId} onChange={(e) => setPaymentForm({...paymentForm, invoiceId: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Amount (KES)</label>
                          <input required type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" />
                       </div>
                       <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Channel</label>
                          <select value={paymentForm.method} onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value as any})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold uppercase text-xs">
                             <option value="cash">Cash</option><option value="bank">Bank</option><option value="mpesa">M-Pesa</option>
                          </select>
                       </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Reference Ref</label>
                        <input required type="text" value={paymentForm.reference} onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" />
                    </div>
                    <button type="submit" className="w-full bg-emerald-500 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-gray-900 transition-all">Execute Settlement</button>
                 </form>
              </motion.div>
          </div>
        )}

        {isAddingExpense && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"
              >
                 <div className="p-10 border-b border-gray-100 flex justify-between items-center text-rose-600 bg-rose-50/30">
                    <h3 className="text-3xl font-black italic uppercase italic">Log <span className="text-gray-900">Outflow</span></h3>
                    <button onClick={() => setIsAddingExpense(false)} className="p-4 hover:bg-white text-rose-400 rounded-2xl transition-all"><X size={20} /></button>
                 </div>
                 <form onSubmit={handleAddExpense} className="p-10 space-y-6">
                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                        <select value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold uppercase text-xs">
                          <option>Utilities</option><option>Salaries</option><option>Supplies</option><option>Academics</option><option>Emergency</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Amount</label>
                          <input required type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" />
                       </div>
                       <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Date</label>
                          <input required type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" />
                       </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Reason</label>
                        <input required type="text" value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold" />
                    </div>
                    <button type="submit" className="w-full bg-gray-900 text-white py-6 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-rose-500 transition-all">Process Outflow</button>
                 </form>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TreasuryPage;
