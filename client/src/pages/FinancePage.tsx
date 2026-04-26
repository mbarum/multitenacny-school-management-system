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
  X,
  ChevronRight,
  Trash2,
  Settings2
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardLayout from '../components/DashboardLayout';

interface Invoice {
  id: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string;
  status: string;
  term: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
  items: { description: string; amount: number }[];
}

interface Waiver {
  id: string;
  name: string;
  amount: number;
  studentId: string;
  isActive: boolean;
  student?: {
    firstName: string;
    lastName: string;
    registrationNumber: string;
  };
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

interface FeeItem {
  id: string;
  name: string;
  frequency: string;
  description: string;
  defaultAmount: number;
}

interface FeeStructure {
  id: string;
  classLevelId: string;
  feeItemId: string;
  amount: number;
  classLevel?: { name: string };
  feeItem?: { name: string; frequency: string };
}

interface ClassLevel {
  id: string;
  name: string;
}

const FinancePage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [feeItems, setFeeItems] = useState<FeeItem[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [classLevels, setClassLevels] = useState<ClassLevel[]>([]);
  const [waivers, setWaivers] = useState<Waiver[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'revenue' | 'expenses' | 'fee-setup' | 'waivers'>('invoices');
  
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [isBatchInvoicing, setIsBatchInvoicing] = useState(false);
  const [isRecordingPayment, setIsRecordingPayment] = useState(false);
  const [isAddingFeeItem, setIsAddingFeeItem] = useState(false);
  const [isAddingFeeStructure, setIsAddingFeeStructure] = useState(false);
  const [isAddingWaiver, setIsAddingWaiver] = useState(false);

  // ... forms ...
  const [batchInvoiceForm, setBatchInvoiceForm] = useState({
    classLevelId: '',
    term: 'Term 1 2024',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const [waiverForm, setWaiverForm] = useState({
    studentId: '',
    name: '',
    amount: '',
    remarks: ''
  });

  // ... forms ...
  const [feeItemForm, setFeeItemForm] = useState({
    name: '',
    frequency: 'TERMLY',
    description: '',
    defaultAmount: ''
  });

  const [feeStructureForm, setFeeStructureForm] = useState({
    classLevelId: '',
    feeItemId: '',
    amount: ''
  });

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
      const [metricsRes, invoicesRes, expensesRes, feeItemsRes, feeStructuresRes, classLevelsRes, waiversRes] = await Promise.all([
        api.get('/finance/dashboard'),
        api.get('/fees/invoices'),
        api.get('/expenses'),
        api.get('/fees/items'),
        api.get('/fees/structures'),
        api.get('/academics/class-levels'),
        api.get('/fees/waivers')
      ]);
      setMetrics(metricsRes.data);
      setInvoices(invoicesRes.data);
      setExpenses(expensesRes.data);
      setFeeItems(feeItemsRes.data);
      setFeeStructures(feeStructuresRes.data);
      setClassLevels(classLevelsRes.data);
      setWaivers(waiversRes.data);
    } catch (error) {
      console.error('Failed to fetch financials', error);
      toast.error('Could not sync finance data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFeeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fees/items', {
        ...feeItemForm,
        defaultAmount: Number(feeItemForm.defaultAmount)
      });
      toast.success('Fee item created');
      setIsAddingFeeItem(false);
      setFeeItemForm({ name: '', frequency: 'TERMLY', description: '', defaultAmount: '' });
      fetchFinancials();
    } catch (error) {
      toast.error('Failed to create fee item');
    }
  };

  const handleDeleteFeeItem = async (id: string) => {
    if (!confirm('Are you sure? This will not affect existing invoices.')) return;
    try {
      await api.delete(`/fees/items/${id}`);
      toast.success('Fee item removed');
      fetchFinancials();
    } catch (error) {
      toast.error('Failed to remove fee item');
    }
  };

  const handleCreateFeeStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fees/structures', {
        ...feeStructureForm,
        amount: Number(feeStructureForm.amount)
      });
      toast.success('Fee structure updated');
      setIsAddingFeeStructure(false);
      setFeeStructureForm({ classLevelId: '', feeItemId: '', amount: '' });
      fetchFinancials();
    } catch (error) {
      toast.error('Failed to update fee structure');
    }
  };

  const handleDeleteFeeStructure = async (id: string) => {
    try {
      await api.delete(`/fees/structures/${id}`);
      toast.success('Structure entry removed');
      fetchFinancials();
    } catch (error) {
      toast.error('Failed to remove structure');
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

  const handleGenerateBatchInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fees/invoices/generate', batchInvoiceForm);
      toast.success('Batch invoices generated successfully');
      setIsBatchInvoicing(false);
      fetchFinancials();
    } catch (error) {
      toast.error('Failed to generate batch invoices');
    }
  };

  const handleCreateWaiver = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fees/waivers', {
        ...waiverForm,
        amount: Number(waiverForm.amount)
      });
      toast.success('Scholarship/Waiver assigned');
      setIsAddingWaiver(false);
      setWaiverForm({ studentId: '', name: '', amount: '', remarks: '' });
      fetchFinancials();
    } catch (error) {
      toast.error('Failed to assign waiver');
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/fees/payments/manual', {
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
       <div className="h-full flex items-center justify-center bg-canvas">
          <RefreshCw className="animate-spin text-gray-400" size={32} />
       </div>
     );
  }

  return (
    <>
      <div className="px-8 py-10">
        <header className="mb-10 border-b border-border-muted pb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center space-x-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              <Building2 size={12} />
              <span>Financial Management</span>
              <ChevronRight size={10} />
              <span className="text-primary">{activeTab}</span>
            </div>
            <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-1">Financial Management</h1>
            <p className="text-slate-500 text-sm font-medium">Monitor school cash flow, receivables, and operational expenses.</p>
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 border border-border-muted rounded-xl shrink-0 overflow-x-auto max-w-full">
             {['overview', 'invoices', 'revenue', 'expenses', 'fee-setup', 'waivers'].map(tab => (
               <button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200 whitespace-nowrap ${activeTab === tab ? 'bg-surface text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 {tab.replace('-', ' ')}
               </button>
             ))}
          </div>
        </header>

        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-premium">
                   <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center">
                         <Wallet size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Net liquidity</span>
                   </div>
                   <h2 className="text-3xl font-bold text-on-surface tracking-tight">
                     <span className="text-sm font-semibold text-slate-400 mr-2 uppercase">KES</span>
                     {Number(metrics?.cashBalance || 0).toLocaleString()}
                   </h2>
                   <div className="flex items-center mt-3 text-[10px] uppercase font-bold text-emerald-600 tracking-tighter">
                      <TrendingUp size={12} className="mr-1" /> Stable Flow
                   </div>
                </div>

                <div className="card-premium">
                   <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center">
                         <Clock size={24} />
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Receivables</span>
                   </div>
                   <h2 className="text-3xl font-bold text-on-surface tracking-tight">
                     <span className="text-sm font-semibold text-slate-400 mr-2 uppercase">KES</span>
                     {Number(metrics?.receivables || 0).toLocaleString()}
                   </h2>
                   <p className="text-[10px] text-slate-400 font-medium mt-3 italic">Outstanding Balances</p>
                </div>

                <div className="flex flex-col space-y-3">
                   <button 
                     onClick={() => setIsBatchInvoicing(true)} 
                     className="flex-1 btn-primary flex items-center justify-center gap-3 text-sm font-bold uppercase tracking-widest bg-indigo-600 text-white"
                   >
                     <Layers size={18} />
                     Batch Bill Class
                   </button>
                   <button 
                     onClick={() => setIsRecordingPayment(true)} 
                     className="flex-1 bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700 py-4 rounded-xl text-sm font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-3"
                   >
                     <CreditCard size={18} />
                     Post Settlement
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 card-premium">
                   <div className="flex items-center justify-between mb-8 border-b border-border-muted pb-4">
                      <h3 className="text-lg font-bold text-on-surface tracking-tight">Recent Transactions</h3>
                      <div className="flex space-x-2">
                         <button className="p-2 bg-slate-50 border border-border-muted rounded-lg text-slate-400 hover:text-primary transition-all shadow-sm"><Printer size={16} /></button>
                         <button className="p-2 bg-slate-50 border border-border-muted rounded-lg text-slate-400 hover:text-primary transition-all shadow-sm"><Download size={16} /></button>
                      </div>
                   </div>
                   <div className="space-y-4">
                      {expenses.slice(0, 5).map(exp => (
                        <div key={exp.id} className="flex items-center justify-between py-3 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-900/50 px-4 -mx-4 rounded-xl transition-colors">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-lg flex items-center justify-center text-rose-500">
                               <ArrowDownRight size={18} />
                            </div>
                            <div>
                               <p className="text-sm font-bold text-on-surface uppercase tracking-tight">{exp.category}</p>
                               <p className="text-[10px] font-medium text-slate-400 lowercase mt-0.5 truncate max-w-[200px]">{exp.description}</p>
                            </div>
                          </div>
                          <div className="text-right">
                             <p className="text-sm font-bold text-rose-600 tabular-nums">-{Number(exp.amount).toLocaleString()}</p>
                             <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5 tracking-widest">Debit Record</p>
                          </div>
                        </div>
                      ))}
                      {expenses.length === 0 && (
                        <div className="text-center py-20 flex flex-col items-center">
                          <PieChart size={40} className="text-slate-100 mb-4" />
                          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest italic">No transactions found</p>
                        </div>
                      )}
                   </div>
                </div>

                <div className="card-premium">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-8">Asset Allocation Summary</h4>
                    <div className="space-y-8">
                        {[
                          { label: 'Operations', value: 45, color: 'bg-primary' },
                          { label: 'Payroll', value: 35, color: 'bg-indigo-600' },
                          { label: 'Supplies', value: 20, color: 'bg-emerald-600' }
                        ].map(item => (
                          <div key={item.label}>
                              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-3">
                                <span className="text-slate-500">{item.label}</span>
                                <span className="text-on-surface">{item.value}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                              </div>
                          </div>
                        ))}
                    </div>
                </div>
             </div>
          </div>
        )}

        {activeTab !== 'overview' && (
          <div className="card-premium p-0 overflow-hidden animate-in fade-in duration-300">
             <div className="px-6 py-5 border-b border-border-muted flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/20">
                <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider">{activeTab} Management</h3>
                <div className="flex space-x-3">
                   <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input type="text" placeholder="Search..." className="pl-9 pr-4 py-2 bg-surface border border-border-muted rounded-xl text-xs w-56 focus:ring-1 focus:ring-primary focus:border-primary transition-all font-medium transition-all shadow-sm" />
                   </div>
                   <button className="p-2.5 bg-surface border border-border-muted rounded-xl text-slate-400 hover:text-primary shadow-sm transition-all">
                      <Filter size={14} />
                   </button>
                </div>
             </div>
             
             {activeTab === 'invoices' && (
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-slate-50 dark:bg-slate-900/50">
                       <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Invoice No.</th>
                       <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Student Name</th>
                       <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Payment Status</th>
                       <th className="px-10 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Amount</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                     {invoices.map(inv => (
                       <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all font-medium group">
                         <td className="px-10 py-5 text-xs font-bold text-slate-500 uppercase tracking-[0.05em]">{inv.invoiceNumber}</td>
                         <td className="px-10 py-5">
                            <p className="text-sm font-bold text-on-surface tracking-tight">{inv.student?.firstName} {inv.student?.lastName}</p>
                            <p className="text-[9px] text-slate-400 font-medium uppercase mt-0.5 tracking-widest">{inv.student?.registrationNumber}</p>
                         </td>
                         <td className="px-10 py-5">
                            <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                              inv.status === 'paid' 
                                ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20 shadow-sm shadow-emerald-500/5' 
                                : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20 shadow-sm shadow-amber-500/5'
                            }`}>{inv.status}</span>
                         </td>
                         <td className="px-10 py-5 text-right font-bold text-on-surface tabular-nums text-lg tracking-tight">
                           <div className="flex flex-col items-end">
                             <div>
                               <span className="text-[10px] text-slate-400 font-semibold mr-2">KES</span>
                               {Number(inv.totalAmount).toLocaleString()}
                             </div>
                             <div className="text-[9px] text-slate-400 font-medium">
                               Paid: KES {Number(inv.paidAmount).toLocaleString()}
                             </div>
                           </div>
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
                      <tr className="bg-slate-50 dark:bg-slate-900/50">
                        <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Category</th>
                        <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Description</th>
                        <th className="px-10 py-5 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em]">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                      {expenses.map(exp => (
                        <tr key={exp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-all font-medium group">
                          <td className="px-10 py-5 text-[10px] font-bold uppercase text-slate-500 tracking-widest">{exp.category}</td>
                          <td className="px-10 py-5 text-sm font-bold text-on-surface tracking-tight uppercase">{exp.description}</td>
                          <td className="px-10 py-5 text-right font-bold text-rose-600 text-lg tabular-nums tracking-tight">
                            <span className="text-[10px] text-slate-400 font-semibold mr-2 uppercase">KES</span>
                            {Number(exp.amount).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                 </table>
               </div>
             )}

              {activeTab === 'waivers' && (
                <div className="p-8 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-on-surface">Scholarships & Bursaries</h3>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage Student Discounts & Grants</p>
                    </div>
                    <button 
                      onClick={() => setIsAddingWaiver(true)}
                      className="btn-primary px-6 py-3 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Assign New Waiver
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {waivers.map(waiver => (
                      <div key={waiver.id} className="card-premium relative overflow-hidden group border-indigo-100 hover:border-indigo-400 transition-all">
                        <div className="flex justify-between items-start mb-6">
                          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                             <Target size={20} />
                          </div>
                          <span className={`px-2 py-1 rounded text-[8px] font-bold uppercase tracking-widest ${waiver.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {waiver.isActive ? 'Active' : 'Expired'}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-on-surface uppercase tracking-tight mb-1">{waiver.name}</h4>
                        <p className="text-xs font-bold text-indigo-600 mb-4">KES {Number(waiver.amount).toLocaleString()}</p>
                        <div className="pt-4 border-t border-border-muted flex items-center justify-between">
                          <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student</p>
                            <p className="text-xs font-bold text-on-surface">{waiver.student?.firstName} {waiver.student?.lastName}</p>
                          </div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{waiver.student?.registrationNumber}</p>
                        </div>
                      </div>
                    ))}
                    {waivers.length === 0 && (
                      <div className="col-span-full py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-border-muted">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest italic">No active waivers found</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

             {activeTab === 'fee-setup' && (
                <div className="p-8 space-y-12">
                  <div className="flex flex-col md:flex-row gap-12">
                    {/* Fee Items Section */}
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-on-surface">Fee Items</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Global Fee Definitions</p>
                        </div>
                        <button 
                          onClick={() => setIsAddingFeeItem(true)}
                          className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-xl transition-all"
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                      <div className="space-y-3">
                        {feeItems.map(item => (
                          <div key={item.id} className="group p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-transparent hover:border-primary/20 transition-all flex items-center justify-between">
                            <div>
                              <p className="text-sm font-bold text-on-surface uppercase tracking-tight">{item.name}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{item.frequency}</p>
                            </div>
                            <div className="flex items-center space-x-4">
                              <p className="text-sm font-bold text-on-surface tabular-nums">KES {Number(item.defaultAmount).toLocaleString()}</p>
                              <button 
                                onClick={() => handleDeleteFeeItem(item.id)}
                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fee Structure Section */}
                    <div className="flex-[1.5] space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-on-surface">Fee Structure</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class-Specific Billing</p>
                        </div>
                        <button 
                          onClick={() => setIsAddingFeeStructure(true)}
                          className="btn-primary px-4 py-2 text-[10px] font-bold uppercase tracking-widest"
                        >
                          Update Structure
                        </button>
                      </div>
                      <div className="overflow-hidden border border-border-muted rounded-2xl">
                        <table className="w-full text-left">
                          <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-border-muted">
                            <tr>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Class</th>
                              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Item</th>
                              <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                              <th className="px-6 py-4"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border-muted">
                            {feeStructures.map(structure => (
                              <tr key={structure.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4 text-xs font-bold text-on-surface">{structure.classLevel?.name}</td>
                                <td className="px-6 py-4">
                                  <p className="text-xs font-bold text-on-surface uppercase tracking-tight">{structure.feeItem?.name}</p>
                                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{structure.feeItem?.frequency}</p>
                                </td>
                                <td className="px-6 py-4 text-right text-xs font-bold tabular-nums">KES {Number(structure.amount).toLocaleString()}</td>
                                <td className="px-6 py-4 text-right">
                                  <button onClick={() => handleDeleteFeeStructure(structure.id)} className="text-slate-300 hover:text-rose-500 transition-colors">
                                    <X size={14} />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
             )}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCreatingInvoice && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-surface rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-border-muted"
              >
                 <div className="px-8 py-6 border-b border-border-muted flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary border border-primary/20">
                          <FileText size={20} />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-on-surface tracking-tight">Create Invoice</h3>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Enter Invoice Details</p>
                       </div>
                    </div>
                    <button onClick={() => setIsCreatingInvoice(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-all"><X size={18} /></button>
                 </div>
                 <form onSubmit={handleCreateInvoice} className="p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-8">
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Student ID</label>
                          <input required type="text" value={invoiceForm.studentId} onChange={(e) => setInvoiceForm({...invoiceForm, studentId: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm" placeholder="e.g. STU-001" />
                       </div>
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Due Date</label>
                          <input required type="date" value={invoiceForm.dueDate} onChange={(e) => setInvoiceForm({...invoiceForm, dueDate: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:border-primary focus:outline-none transition-all shadow-sm" />
                       </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-border-muted">
                      <div className="flex items-center justify-between mb-2">
                         <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Invoice Items</label>
                         <button type="button" onClick={addInvoiceItem} className="text-[10px] font-bold uppercase text-primary hover:text-primary-dark tracking-widest flex items-center gap-2 transition-colors"><Plus size={14} /> Add Item</button>
                      </div>
                      <div className="space-y-3">
                        {invoiceForm.items.map((item, index) => (
                          <div key={index} className="flex gap-4 animate-in slide-in-from-left-2 duration-200">
                            <input required type="text" placeholder="Item Description" value={item.description} onChange={(e) => {
                                const newItems = [...invoiceForm.items];
                                newItems[index].description = e.target.value;
                                setInvoiceForm({...invoiceForm, items: newItems});
                            }} className="flex-grow bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none shadow-sm" />
                            <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 uppercase">KES</span>
                               <input required type="number" placeholder="0" value={item.amount} onChange={(e) => {
                                   const newItems = [...invoiceForm.items];
                                   newItems[index].amount = e.target.value;
                                   setInvoiceForm({...invoiceForm, items: newItems});
                               }} className="w-36 bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl pl-12 pr-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none shadow-sm" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <button type="submit" className="w-full btn-primary h-14 font-bold uppercase tracking-[0.15em] text-xs shadow-xl shadow-primary/20">Generate Invoice</button>
                 </form>
              </motion.div>
          </div>
        )}

        {isRecordingPayment && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-border-muted"
              >
                 <div className="px-8 py-6 border-b border-border-muted flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/50">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100 dark:border-emerald-500/20">
                          <CreditCard size={20} />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-on-surface tracking-tight">Record Payment</h3>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Payment Details</p>
                       </div>
                    </div>
                    <button onClick={() => setIsRecordingPayment(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-all"><X size={18} /></button>
                 </div>
                 <form onSubmit={handleRecordPayment} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Invoice Number</label>
                        <input required type="text" value={paymentForm.invoiceId} onChange={(e) => setPaymentForm({...paymentForm, invoiceId: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" placeholder="INV-XXX" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Amount Paid</label>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">KES</span>
                             <input required type="number" value={paymentForm.amount} onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl pl-12 pr-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payment Method</label>
                          <select value={paymentForm.method} onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value as any})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-4 py-3 font-bold uppercase text-[10px] focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm">
                             <option value="cash">Direct Cash</option>
                             <option value="bank">Bank Transfer</option>
                             <option value="mpesa">M-Pesa</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Transaction Reference</label>
                        <input required type="text" value={paymentForm.reference} onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" placeholder="Receipt or Tx ID" />
                    </div>
                    <button type="submit" className="w-full h-14 bg-emerald-600 text-white rounded-xl font-bold uppercase tracking-[0.15em] text-xs hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20">Save Payment</button>
                 </form>
              </motion.div>
          </div>
        )}

        {isAddingExpense && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-border-muted"
              >
                 <div className="px-8 py-6 border-b border-border-muted flex justify-between items-center bg-rose-50/50 dark:bg-rose-900/50">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 rounded-xl flex items-center justify-center text-rose-600 border border-rose-100 dark:border-rose-500/20">
                          <Zap size={20} />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-on-surface tracking-tight">Record Expense</h3>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Expense Details</p>
                       </div>
                    </div>
                    <button onClick={() => setIsAddingExpense(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-all"><X size={18} /></button>
                 </div>
                 <form onSubmit={handleAddExpense} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                        <select value={expenseForm.category} onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-4 py-3 font-bold uppercase text-[10px] focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm">
                          <option>Operations</option>
                          <option>Utilities</option>
                          <option>Salaries</option>
                          <option>Supplies</option>
                          <option>Academics</option>
                          <option>Emergency</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Amount</label>
                          <div className="relative">
                             <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">KES</span>
                             <input required type="number" value={expenseForm.amount} onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl pl-12 pr-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" />
                          </div>
                       </div>
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Date</label>
                          <input required type="date" value={expenseForm.date} onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" />
                       </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Description</label>
                        <input required type="text" value={expenseForm.description} onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" placeholder="Reason for outflow" />
                    </div>
                    <button type="submit" className="w-full h-14 bg-slate-900 dark:bg-slate-800 text-white rounded-xl font-bold uppercase tracking-[0.15em] text-xs hover:bg-rose-600 transition-all shadow-xl">Record Expense</button>
                 </form>
              </motion.div>
          </div>
        )}

        {isAddingFeeItem && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-border-muted"
              >
                 <div className="px-8 py-6 border-b border-border-muted flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                          <Settings2 size={20} />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-on-surface tracking-tight">Fee Item Definition</h3>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">New Fee Component</p>
                       </div>
                    </div>
                    <button onClick={() => setIsAddingFeeItem(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-all"><X size={18} /></button>
                 </div>
                 <form onSubmit={handleCreateFeeItem} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Item Name</label>
                        <input required type="text" value={feeItemForm.name} onChange={(e) => setFeeItemForm({...feeItemForm, name: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" placeholder="e.g. Tuition Fee" />
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Frequency</label>
                          <select value={feeItemForm.frequency} onChange={(e) => setFeeItemForm({...feeItemForm, frequency: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-4 py-3 font-bold uppercase text-[10px] focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm">
                             <option value="ONCE">One Time</option>
                             <option value="MONTHLY">Monthly</option>
                             <option value="TERMLY">Termly</option>
                             <option value="YEARLY">Yearly</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Default Amount</label>
                          <input required type="number" value={feeItemForm.defaultAmount} onChange={(e) => setFeeItemForm({...feeItemForm, defaultAmount: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" />
                       </div>
                    </div>
                    <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</label>
                        <input type="text" value={feeItemForm.description} onChange={(e) => setFeeItemForm({...feeItemForm, description: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" />
                    </div>
                    <button type="submit" className="w-full h-14 btn-primary font-bold uppercase tracking-[0.15em] text-xs shadow-xl shadow-primary/20">Create Fee Item</button>
                 </form>
              </motion.div>
          </div>
        )}

        {isBatchInvoicing && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-border-muted"
              >
                 <div className="px-8 py-6 border-b border-border-muted flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/50">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-600 border border-indigo-100 dark:border-indigo-500/20">
                          <Layers size={20} />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-on-surface tracking-tight">Batch Invoicing</h3>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Process Class Billing</p>
                       </div>
                    </div>
                    <button onClick={() => setIsBatchInvoicing(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 rounded-lg transition-all"><X size={18} /></button>
                 </div>
                 <form onSubmit={handleGenerateBatchInvoices} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Class Level</label>
                            <select required value={batchInvoiceForm.classLevelId} onChange={(e) => setBatchInvoiceForm({...batchInvoiceForm, classLevelId: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-4 py-3 font-bold uppercase text-[10px] focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm">
                                <option value="">Select Class</option>
                                {classLevels.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Term Name</label>
                            <input required type="text" value={batchInvoiceForm.term} onChange={(e) => setBatchInvoiceForm({...batchInvoiceForm, term: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" placeholder="e.g. Term 2 2024" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Payment Due Date</label>
                            <input required type="date" value={batchInvoiceForm.dueDate} onChange={(e) => setBatchInvoiceForm({...batchInvoiceForm, dueDate: e.target.value})} className="w-full bg-slate-50/50 dark:bg-slate-900/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" />
                        </div>
                    </div>
                    <button type="submit" className="w-full h-14 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-[0.15em] text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">Process Batch Billing</button>
                 </form>
              </motion.div>
          </div>
        )}

        {isAddingWaiver && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-border-muted"
              >
                 <div className="px-8 py-6 border-b border-border-muted flex justify-between items-center bg-indigo-50/50">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <Target size={20} />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-on-surface tracking-tight">Assign Waiver</h3>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Scholarship / Bursary</p>
                       </div>
                    </div>
                    <button onClick={() => setIsAddingWaiver(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-all"><X size={18} /></button>
                 </div>
                 <form onSubmit={handleCreateWaiver} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Student ID</label>
                            <input required type="text" value={waiverForm.studentId} onChange={(e) => setWaiverForm({...waiverForm, studentId: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" placeholder="e.g. STU-001" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Waiver Name</label>
                            <input required type="text" value={waiverForm.name} onChange={(e) => setWaiverForm({...waiverForm, name: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" placeholder="e.g. Academic Scholarship" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Amount to Deduct (KES)</label>
                            <input required type="number" value={waiverForm.amount} onChange={(e) => setWaiverForm({...waiverForm, amount: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" />
                        </div>
                        <div className="space-y-2">
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Remarks</label>
                            <input type="text" value={waiverForm.remarks} onChange={(e) => setWaiverForm({...waiverForm, remarks: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" />
                        </div>
                    </div>
                    <button type="submit" className="w-full h-14 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-[0.15em] text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">Apply Waiver</button>
                 </form>
              </motion.div>
          </div>
        )}

        {isAddingFeeStructure && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-surface rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-border-muted"
              >
                 <div className="px-8 py-6 border-b border-border-muted flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center space-x-3">
                       <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <Target size={20} />
                       </div>
                       <div>
                          <h3 className="text-lg font-bold text-on-surface tracking-tight">Structured Billing</h3>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Class-Fee Assignment</p>
                       </div>
                    </div>
                    <button onClick={() => setIsAddingFeeStructure(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-all"><X size={18} /></button>
                 </div>
                 <form onSubmit={handleCreateFeeStructure} className="p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Class Level</label>
                          <select required value={feeStructureForm.classLevelId} onChange={(e) => setFeeStructureForm({...feeStructureForm, classLevelId: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-4 py-3 font-bold uppercase text-[10px] focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm">
                             <option value="">Select Class</option>
                             {classLevels.map(cl => <option key={cl.id} value={cl.id}>{cl.name}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Fee Item</label>
                          <select required value={feeStructureForm.feeItemId} onChange={(e) => setFeeStructureForm({...feeStructureForm, feeItemId: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-4 py-3 font-bold uppercase text-[10px] focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm">
                             <option value="">Select Item</option>
                             {feeItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Specific Amount</label>
                          <input required type="number" value={feeStructureForm.amount} onChange={(e) => setFeeStructureForm({...feeStructureForm, amount: e.target.value})} className="w-full bg-slate-50/50 border border-border-muted rounded-xl px-5 py-3 font-semibold text-sm focus:ring-1 focus:ring-primary focus:outline-none transition-all shadow-sm" />
                       </div>
                    </div>
                    <button type="submit" className="w-full h-14 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-[0.15em] text-xs hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">Apply to Structure</button>
                 </form>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FinancePage;
