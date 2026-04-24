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

interface Fee {
  id: string;
  studentId: string;
  amount: number;
  dueDate: string;
  status: 'paid' | 'unpaid' | 'overdue';
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

const TreasuryPage: React.FC = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'fees' | 'expenses'>('overview');
  const [isAddingExpense, setIsAddingExpense] = useState(false);
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
      const [feesRes, expensesRes] = await Promise.all([
        api.get('/fees'),
        api.get('/expenses')
      ]);
      setFees(feesRes.data);
      setExpenses(expensesRes.data);
    } catch (error) {
      console.error('Failed to fetch financials', error);
      toast.error('Could not sync treasury data');
    } finally {
      setLoading(false);
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

  const totalFeesInvoiced = fees.reduce((sum, f) => sum + Number(f.amount), 0);
  const totalFeesCollected = fees.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const cashBalance = totalFeesCollected - totalExpenses;

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="flex items-center space-x-2 text-emerald-600 mb-3">
              <Building2 size={18} />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Treasury Ops</span>
            </div>
            <h1 className="text-6xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">
              Fiscal <span className="text-emerald-500">Command</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm mt-6 max-w-xl leading-relaxed uppercase tracking-wider opacity-80">
              High-fidelity monitoring of institutional liquidity, student receivables, and operational burn rates.
            </p>
          </div>
          
          <div className="flex items-center bg-gray-100/50 p-1.5 rounded-2xl border border-gray-100">
             {['overview', 'fees', 'expenses'].map(tab => (
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
             {/* Key Metrics */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                <div className="bg-emerald-500 rounded-[3rem] p-8 text-white shadow-2xl shadow-emerald-200 group overflow-hidden relative">
                   <Wallet className="mb-6 opacity-40 group-hover:scale-110 transition-transform" size={32} />
                   <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Net Liquidity</p>
                   <h2 className="text-4xl font-black tabular-nums tracking-tighter italic">
                     KES {cashBalance.toLocaleString()}
                   </h2>
                   <div className="absolute -right-4 -bottom-4 text-white opacity-10 transform scale-150 rotate-12">
                     <TrendingUp size={140} />
                   </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm">
                   <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                      <Zap size={24} />
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Fees Collected</p>
                   <h2 className="text-4xl font-black tabular-nums tracking-tighter text-gray-900 italic">
                     KES {totalFeesCollected.toLocaleString()}
                   </h2>
                   <p className="text-[9px] font-bold text-gray-400 uppercase mt-4 tracking-widest leading-relaxed">
                     <span className="text-emerald-500">{(totalFeesCollected/totalFeesInvoiced * 100 || 0).toFixed(1)}%</span> of total invoiced
                   </p>
                </div>

                <div className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm">
                   <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mb-6">
                      <ArrowDownRight size={24} />
                   </div>
                   <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Total Expenses</p>
                   <h2 className="text-4xl font-black tabular-nums tracking-tighter text-gray-900 italic">
                     KES {totalExpenses.toLocaleString()}
                   </h2>
                   <div className="w-full h-1 bg-gray-100 rounded-full mt-6 overflow-hidden">
                      <div className="h-full bg-rose-500 w-[45%] rounded-full" />
                   </div>
                </div>

                <div className="bg-gray-900 rounded-[3rem] p-8 text-white shadow-2xl shadow-gray-200 flex flex-col justify-between">
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 mb-1">Audit Status</p>
                     <h3 className="text-xl font-bold italic tracking-tighter">Compliant</h3>
                   </div>
                   <button className="flex items-center justify-between w-full bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl transition-all group">
                      <span className="text-[10px] font-black uppercase tracking-widest">Full Report</span>
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                   </button>
                </div>
             </div>

             {/* Dynamic Cashflow Chart Placeholder / Recent Activity */}
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white border border-gray-100 rounded-[3.5rem] p-10 shadow-sm">
                   <div className="flex items-center justify-between mb-12">
                      <h3 className="text-2xl font-black tracking-tighter uppercase italic">Institutional <span className="text-emerald-500">Flux</span></h3>
                      <div className="flex space-x-2">
                        <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-gray-900 transition-all"><Printer size={18} /></button>
                        <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-gray-900 transition-all"><Download size={18} /></button>
                      </div>
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

                <div className="space-y-8">
                   <div className="bg-gray-50 rounded-[3rem] p-10">
                      <PieChart className="text-emerald-500 mb-6" size={32} />
                      <h4 className="text-xl font-black italic tracking-tighter mb-4 uppercase">Fee <span className="text-emerald-500">Distribution</span></h4>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-8">
                        Breakdown of collection status across all active academic certifications.
                      </p>
                      
                      <div className="space-y-4">
                         {[
                            { label: 'Primary', value: 82, color: 'bg-emerald-500' },
                            { label: 'Secondary', value: 65, color: 'bg-blue-500' },
                            { label: 'A-Levels', value: 94, color: 'bg-rose-500' }
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
             </div>
          </motion.div>
        )}

        {activeTab === 'expenses' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <div className="flex justify-between items-center bg-gray-900 text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                 <div className="relative z-10">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">Burn <span className="text-rose-500">Rates</span></h2>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-md uppercase tracking-wider opacity-60">
                       Track and categorize every cent prioritized for institutional excellence and operational stability.
                    </p>
                 </div>
                 <button 
                  onClick={() => setIsAddingExpense(true)}
                  className="relative z-10 bg-white text-gray-900 px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-white/5 active:scale-95"
                 >
                   Log Expenditure
                 </button>
                 <BarChart3 className="absolute right-0 bottom-0 opacity-10 text-rose-500 -mb-20 -mr-20" size={400} />
              </div>

              <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
                 <table className="w-full">
                    <thead>
                       <tr className="bg-gray-50/50">
                          <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Category</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Description</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                          <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amout (KES)</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-gray-50/30 transition-colors">
                             <td className="px-10 py-6">
                                <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
                                  {exp.category}
                                </span>
                             </td>
                             <td className="px-10 py-6 text-sm font-bold text-gray-900 uppercase tracking-tight">{exp.description}</td>
                             <td className="px-10 py-6 text-xs text-gray-400 font-bold uppercase tracking-widest">{new Date(exp.date).toLocaleDateString()}</td>
                             <td className="px-10 py-6 text-right font-black italic tracking-tighter text-rose-600">
                                {Number(exp.amount).toLocaleString()}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
          </motion.div>
        )}

        {activeTab === 'fees' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
              <div className="flex justify-between items-center bg-white p-12 rounded-[4rem] border border-gray-100 shadow-sm relative overflow-hidden">
                 <div className="relative z-10">
                    <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">Studnet <span className="text-blue-600">Receivables</span></h2>
                    <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-md uppercase tracking-wider opacity-80">
                       A fully digitized ledger tracking mandatory contributions, voluntary endowments, and scholarship balances.
                    </p>
                 </div>
                 <div className="relative z-10 flex space-x-4">
                    <div className="bg-gray-50 px-8 py-4 rounded-2xl border border-gray-100 text-right">
                       <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Awaiting Balance</p>
                       <p className="text-2xl font-black tabular-nums italic text-gray-900">KES {(totalFeesInvoiced - totalFeesCollected).toLocaleString()}</p>
                    </div>
                 </div>
              </div>

              <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
                 <table className="w-full">
                    <thead>
                       <tr className="bg-gray-50/50">
                          <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Student Name</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Admission NO</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Due Date</th>
                          <th className="px-10 py-6 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                          <th className="px-10 py-6 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Amount</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {fees.map(fee => (
                          <tr key={fee.id} className="hover:bg-gray-50/30 transition-colors group">
                             <td className="px-10 py-6">
                                <div className="flex items-center space-x-3">
                                   <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                                      {fee.student?.firstName[0]}
                                   </div>
                                   <span className="text-sm font-black uppercase tracking-tight text-gray-900 group-hover:text-emerald-600 transition-colors">
                                      {fee.student?.firstName} {fee.student?.lastName}
                                   </span>
                                </div>
                             </td>
                             <td className="px-10 py-6 font-mono text-[11px] font-bold text-gray-400">{fee.student?.registrationNumber}</td>
                             <td className="px-10 py-6 text-xs text-gray-400 font-bold uppercase tracking-widest">{new Date(fee.dueDate).toLocaleDateString()}</td>
                             <td className="px-10 py-6">
                                {fee.status === 'paid' ? (
                                   <span className="inline-flex items-center px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-100">Paid</span>
                                ) : (
                                   <span className="inline-flex items-center px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-100">Outstanding</span>
                                )}
                             </td>
                             <td className="px-10 py-6 text-right font-black italic tracking-tighter text-gray-900">
                                {Number(fee.amount).toLocaleString()}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
          </motion.div>
        )}
      </div>

      {/* Expense Modal */}
      <AnimatePresence>
        {isAddingExpense && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-[100] p-4">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl"
              >
                 <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-rose-50/30">
                    <div>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter italic uppercase underline decoration-rose-500 decoration-4">Log <span className="text-rose-500">Expenditure</span></h3>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Operational Outflow Registry</p>
                    </div>
                    <button onClick={() => setIsAddingExpense(false)} className="p-4 hover:bg-white text-gray-400 rounded-2xl transition-all">
                      <X size={20} />
                    </button>
                 </div>
                 
                 <form onSubmit={handleAddExpense} className="p-10 space-y-6">
                    <div className="grid grid-cols-1 gap-6">
                       <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Category</label>
                          <select 
                            value={expenseForm.category}
                            onChange={(e) => setExpenseForm({...expenseForm, category: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-500 font-bold text-gray-900 uppercase tracking-widest text-[11px]"
                          >
                             <option>Salaries</option>
                             <option>Utilities</option>
                             <option>Operations</option>
                             <option>Infrastructure</option>
                             <option>Academics</option>
                             <option>Emergency</option>
                          </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Amount (KES)</label>
                             <input 
                                type="number"
                                required
                                value={expenseForm.amount}
                                onChange={(e) => setExpenseForm({...expenseForm, amount: e.target.value})}
                                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-500 font-bold text-gray-900 tabular-nums"
                                placeholder="0.00"
                             />
                          </div>
                          <div>
                             <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Transaction Date</label>
                             <input 
                                type="date"
                                required
                                value={expenseForm.date}
                                onChange={(e) => setExpenseForm({...expenseForm, date: e.target.value})}
                                className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-500 font-bold text-gray-900"
                             />
                          </div>
                       </div>
                       <div>
                          <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Short Description</label>
                          <input 
                            type="text"
                            required
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm({...expenseForm, description: e.target.value})}
                            className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-rose-500 font-bold text-gray-900"
                            placeholder="e.g. Electric bill for Science Lab"
                          />
                       </div>
                    </div>
                    
                    <div className="pt-6">
                      <button type="submit" className="w-full bg-gray-900 text-white py-5 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-rose-500 transition-all shadow-xl shadow-gray-100 hover:scale-[1.02] active:scale-95">
                        Commit to Ledger
                      </button>
                    </div>
                 </form>
              </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TreasuryPage;
