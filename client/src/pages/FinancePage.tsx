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
import DashboardLayout from '../components/DashboardLayout';

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

const FinancePage: React.FC = () => {
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
      toast.error('Could not sync finance data');
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
     return (
       <DashboardLayout>
         <div className="h-full flex items-center justify-center">
            <RefreshCw className="animate-spin text-indigo-600" size={32} />
         </div>
       </DashboardLayout>
     );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto pb-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div>
            <div className="flex items-center space-x-2 text-indigo-600 mb-2">
              <Building2 size={16} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Fiscal Intelligence</span>
            </div>
            <h1 className="text-4xl font-display font-black text-gray-900 tracking-tight leading-none uppercase italic">
              FINANCE <span className="text-indigo-600">COMMAND</span>
            </h1>
          </div>
          
          <div className="flex bg-white p-1.5 rounded-2xl border border-gray-200/60 shadow-sm">
             {['overview', 'invoices', 'revenue', 'expenses'].map(tab => (
               <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-gray-900 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
               >
                 {tab}
               </button>
             ))}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white border border-gray-200/60 rounded-[2rem] p-10 shadow-sm relative overflow-hidden group">
                   <div className="flex items-center justify-between mb-8">
                      <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center border border-indigo-100">
                         <Wallet size={20} />
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global Balance</span>
                   </div>
                   <h2 className="text-4xl font-display font-black text-gray-900 tracking-tighter tabular-nums leading-none">
                     <span className="text-lg text-gray-400 font-medium mr-2">KES</span>
                     {Number(metrics?.cashBalance || 0).toLocaleString()}
                   </h2>
                   <div className="mt-8 flex items-center text-emerald-600 space-x-1">
                      <ArrowUpRight size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">+12.4% THIS QUARTER</span>
                   </div>
                </div>

                <div className="bg-white border border-gray-200/60 rounded-[2rem] p-10 shadow-sm relative overflow-hidden">
                   <div className="flex items-center justify-between mb-8">
                      <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center border border-rose-100">
                         <Clock size={20} />
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Uncollected Fees</span>
                   </div>
                   <h2 className="text-4xl font-display font-black text-gray-900 tracking-tighter tabular-nums leading-none">
                     <span className="text-lg text-gray-400 font-medium mr-2">KES</span>
                     {Number(metrics?.receivables || 0).toLocaleString()}
                   </h2>
                   <div className="mt-8 flex items-center text-rose-600 space-x-1">
                      <AlertTriangle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Requires Attention</span>
                   </div>
                </div>

                <div className="bg-gray-900 rounded-[2rem] p-10 text-white shadow-xl shadow-indigo-900/10 flex flex-col justify-between">
                   <div className="flex items-center space-x-3 mb-6">
                      <Zap className="text-indigo-400" size={20} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Ledger Actions</span>
                   </div>
                   <div className="space-y-3">
                      <button onClick={() => setIsCreatingInvoice(true)} className="w-full bg-white/10 hover:bg-white/20 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center">
                        Generate Billing
                      </button>
                      <button onClick={() => setIsRecordingPayment(true)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all text-center">
                        Post Settlement
                      </button>
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
                <div className="lg:col-span-3 bg-white border border-gray-200/60 rounded-[2.5rem] p-10 shadow-sm">
                   <div className="flex items-center justify-between mb-12">
                      <h3 className="text-xl font-display font-black tracking-tight uppercase italic">Recent <span className="text-indigo-600">Reconciliations</span></h3>
                      <div className="flex space-x-2">
                         <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-gray-900 transition-all"><Printer size={18} /></button>
                         <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-gray-900 transition-all"><Download size={18} /></button>
                      </div>
                   </div>
                   <div className="space-y-8">
                      {expenses.slice(0, 5).map(exp => (
                        <div key={exp.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-6">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                              <ArrowDownRight size={18} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{exp.category}</p>
                               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{exp.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-[14px] font-black text-gray-900 tabular-nums italic">KES {Number(exp.amount).toLocaleString()}</p>
                             <p className="text-[9px] font-black text-rose-500 uppercase mt-1 tracking-widest">DEBIT</p>
                          </div>
                        </div>
                      ))}
                      {expenses.length === 0 && (
                        <div className="text-center py-12">
                          <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">No recent transactions recorded</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-gray-50 rounded-[2.5rem] p-10">
                        <PieChart className="text-indigo-600 mb-6" size={24} />
                        <h4 className="text-lg font-display font-black italic tracking-tighter mb-4 uppercase text-gray-900 leading-none">ALLOCATION <br/><span className="text-indigo-600">STATISTICS</span></h4>
                        <div className="space-y-6 mt-10">
                            {[
                              { label: 'Academic Supplies', value: 45, color: 'bg-indigo-600' },
                              { label: 'Staff Payroll', value: 30, color: 'bg-gray-900' },
                              { label: 'Infrastructure', value: 25, color: 'bg-indigo-200' }
                            ].map(item => (
                              <div key={item.label}>
                                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-3">
                                    <span className="text-gray-400">{item.label}</span>
                                    <span className="text-gray-900">{item.value}%</span>
                                  </div>
                                  <div className="w-full h-1.5 bg-gray-200/60 rounded-full overflow-hidden">
                                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                                  </div>
                              </div>
                            ))}
                        </div>
                    </div>
                </div>
             </div>
          </div>
        )}

        {activeTab !== 'overview' && (
          <div className="bg-white border border-gray-200/60 rounded-[2.5rem] overflow-hidden shadow-sm">
             <div className="p-10 border-b border-gray-50 flex justify-between items-center">
                <h3 className="text-xl font-display font-black uppercase italic tracking-tight">{activeTab} <span className="text-indigo-600">Ledger</span></h3>
                <div className="flex space-x-3">
                   <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input type="text" placeholder="Search entries..." className="pl-10 pr-4 py-3 bg-gray-50 border-none rounded-xl text-xs font-bold w-64 focus:ring-2 focus:ring-indigo-600" />
                   </div>
                </div>
             </div>
             
             {activeTab === 'invoices' && (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-gray-50/50">
                       <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Identifier</th>
                       <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Beneficiary</th>
                       <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Audit Status</th>
                       <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Value</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-50">
                     {invoices.map(inv => (
                       <tr key={inv.id} className="hover:bg-gray-50/30 transition-all font-medium">
                         <td className="px-10 py-6 font-mono font-bold text-gray-400 text-xs tracking-tight">{inv.invoiceNumber}</td>
                         <td className="px-10 py-6 font-bold text-gray-900 text-sm uppercase">{inv.student?.firstName} {inv.student?.lastName}</td>
                         <td className="px-10 py-6">
                           <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                             inv.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                           }`}>{inv.status}</span>
                         </td>
                         <td className="px-10 py-6 text-right font-black italic tracking-tighter text-gray-900 tabular-nums text-lg">
                           <span className="text-xs text-gray-300 font-medium mr-2">KES</span>
                           {Number(inv.amount).toLocaleString()}
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
             
             {activeTab === 'expenses' && (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50/50">
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Sector</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Technical Description</th>
                        <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-widest">Outflow Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {expenses.map(exp => (
                        <tr key={exp.id}>
                          <td className="px-10 py-6 text-[10px] font-bold uppercase text-gray-400 tracking-widest">{exp.category}</td>
                          <td className="px-10 py-6 text-sm font-bold text-gray-900 uppercase tracking-tight">{exp.description}</td>
                          <td className="px-10 py-6 text-right font-black italic text-rose-600 text-lg tabular-nums">
                            <span className="text-xs text-gray-300 font-medium mr-2">KES</span>
                            {Number(exp.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
             )}
          </div>
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
    </DashboardLayout>
  );
};

export default FinancePage;
