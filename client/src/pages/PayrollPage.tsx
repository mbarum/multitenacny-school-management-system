import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  DollarSign, 
  Calendar, 
  Check, 
  X, 
  FileText, 
  Plus, 
  Download, 
  Printer, 
  Filter, 
  Settings, 
  Calculator, 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  Search, 
  ChevronRight, 
  ChevronLeft, 
  CreditCard,
  Percent,
  Trash2,
  UserCheck,
  Briefcase,
  History
} from 'lucide-react';
import { toast } from 'sonner';

interface PayrollItemDefinition {
  id: string;
  name: string;
  type: 'ALLOWANCE' | 'DEDUCTION';
  computationType: 'FIXED' | 'PERCENTAGE';
  value: number;
}

interface StaffPayrollItem {
  id: string;
  staffId: string;
  itemDefinitionId: string;
  customValue?: number;
  itemDefinition: PayrollItemDefinition;
}

interface Payroll {
  id: string;
  staffId: string;
  basicSalary: number;
  grossSalary: number;
  netSalary: number;
  payDate: string;
  status: 'paid' | 'unpaid';
  details: {
    basicSalary: number;
    allowances: any[];
    deductions: any[];
  };
  staff?: {
    firstName: string;
    lastName: string;
    employeeId: string;
    role: string;
    photoUrl?: string;
  };
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  role: string;
  photoUrl?: string;
  basicSalary: number;
}

const PayrollPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'history' | 'definitions' | 'config'>('history');
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [itemDefinitions, setItemDefinitions] = useState<PayrollItemDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
  // Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const [newItem, setNewItem] = useState<Partial<PayrollItemDefinition>>({
    name: '',
    type: 'ALLOWANCE',
    computationType: 'FIXED',
    value: 0
  });

  const [selectedStaffForConfig, setSelectedStaffForConfig] = useState<Staff | null>(null);
  const [staffPayrollItems, setStaffPayrollItems] = useState<StaffPayrollItem[]>([]);

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payrollsRes, staffRes, defsRes] = await Promise.all([
        api.get('/payrolls'),
        api.get('/staff'),
        api.get('/payrolls/definitions')
      ]);
      setPayrolls(payrollsRes.data);
      setStaffList(staffRes.data);
      setItemDefinitions(defsRes.data);
    } catch (error) {
      console.error('Failed to fetch payroll data', error);
      toast.error('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setIsGenerating(true);
    try {
      const payDate = new Date(selectedYear, selectedMonth - 1, 28).toISOString();
      for (const staff of staffList) {
        await api.post('/payrolls/generate', {
          staffId: staff.id,
          payDate
        });
      }
      toast.success(`Payroll generated for ${months[selectedMonth-1]} ${selectedYear}`);
      fetchData();
    } catch (error) {
       console.error('Failed to generate payroll', error);
       toast.error('Error generating payroll');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await api.patch(`/payrolls/${id}`, { status: 'paid' });
      toast.success('Marked as paid');
      fetchData();
    } catch (error) {
       toast.error('Operation failed');
    }
  };

  const handleCreateDefinition = async () => {
    try {
      await api.post('/payrolls/definitions', newItem);
      toast.success('Payroll item created');
      setShowItemModal(false);
      fetchData();
    } catch (error) {
      toast.error('Failed to create item');
    }
  };

  const handleDeleteDefinition = async (id: string) => {
    try {
      await api.delete(`/payrolls/definitions/${id}`);
      toast.success('Item deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const loadStaffConfig = async (staffId: string) => {
    try {
      const res = await api.get(`/payrolls/staff/${staffId}/config`);
      setStaffPayrollItems(res.data);
    } catch (error) {
      toast.error('Failed to load staff config');
    }
  };

  const handleAssignItemToStaff = async (itemDefId: string) => {
    if (!selectedStaffForConfig) return;
    try {
      await api.post(`/payrolls/staff/${selectedStaffForConfig.id}/assign/${itemDefId}`, {});
      toast.success('Item assigned to staff');
      loadStaffConfig(selectedStaffForConfig.id);
    } catch (error) {
      toast.error('Failed to assign item');
    }
  };

  const handleRemoveItemFromStaff = async (itemDefId: string) => {
    if (!selectedStaffForConfig) return;
    try {
      await api.delete(`/payrolls/staff/${selectedStaffForConfig.id}/remove/${itemDefId}`);
      toast.success('Item removed from staff');
      loadStaffConfig(selectedStaffForConfig.id);
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const totalPayroll = payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0);
  const paidCount = payrolls.filter(p => p.status === 'paid').length;
  const unpaidCount = payrolls.length - paidCount;

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <Calculator size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Institutional Finance</span>
            </div>
            <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter leading-none italic">
              Payroll <span className="text-blue-600">Engine</span>
            </h1>
            <div className="flex items-center space-x-4 mt-6">
              {[
                { id: 'history', label: 'Payroll History', icon: History },
                { id: 'definitions', label: 'Payroll Items', icon: Wallet },
                { id: 'config', label: 'Staff Configuration', icon: UserCheck }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${
                    activeTab === tab.id 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <tab.icon size={14} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-white border border-gray-100 rounded-2xl p-1 flex shadow-sm">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent border-none text-xs font-bold px-4 py-3 focus:ring-0 cursor-pointer"
                >
                  {months.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent border-none text-xs font-bold px-4 py-3 focus:ring-0 cursor-pointer border-l"
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
             </div>
             {activeTab === 'history' && (
               <button
                onClick={handleGeneratePayroll}
                disabled={isGenerating || staffList.length === 0}
                className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center gap-2 h-[48px]"
              >
                {isGenerating ? <Clock className="animate-spin w-3 h-3" /> : <Calculator className="w-3 h-3" />}
                Batch Process
              </button>
             )}
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'history' && (
            <motion.div
              key="history"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
               {/* Stats Cards */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Wallet size={20} />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Net Payroll</span>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter tabular-nums">
                    KES {totalPayroll.toLocaleString()}
                  </h3>
                  <div className="flex items-center space-x-1 mt-2 text-green-500 font-bold text-[10px]">
                    <TrendingUp size={12} />
                    <span>4.2% from last month</span>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                      <Check size={20} />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disbursed</span>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter tabular-nums">
                    {paidCount}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">Completed Payments</p>
                </div>

                <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center">
                      <Clock size={20} />
                    </div>
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Pending</span>
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter tabular-nums">
                    {unpaidCount}
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-wider">Awaiting Approval</p>
                </div>

                <div className="bg-blue-600 p-6 rounded-[2rem] shadow-xl shadow-blue-100 text-white flex flex-col justify-between">
                   <div className="flex justify-between items-start">
                     <FileText className="opacity-50" size={24} />
                     <div className="text-right">
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">Fiscal Health</p>
                       <p className="text-lg font-black uppercase tracking-tighter">Stable</p>
                     </div>
                   </div>
                   <button className="flex items-center justify-center space-x-2 bg-white/20 hover:bg-white/30 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all">
                     <span>Tax Reports</span>
                     <ChevronRight size={12} />
                   </button>
                </div>
              </div>

              {/* History Table */}
              <div className="bg-white border border-gray-100 rounded-[2.5rem] shadow-sm overflow-hidden min-h-[500px]">
                <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      placeholder="Search personnel by name or ID..."
                      className="w-full pl-12 pr-4 py-3 bg-white border-none rounded-2xl text-xs font-medium focus:ring-2 focus:ring-blue-600 transition-all shadow-sm"
                    />
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center h-80">
                    <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Crunching Numbers...</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50">
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Personnel</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Basic Salary</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Net Pay</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Date</th>
                          <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                          <th className="px-8 py-5 text-right text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50">
                        {payrolls.map((payroll) => {
                          const staff = staffList.find(s => s.id === payroll.staffId);
                          return (
                            <tr key={payroll.id} className="hover:bg-gray-50/50 transition-colors group">
                              <td className="px-8 py-5">
                                <div className="flex items-center space-x-4">
                                  <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center font-bold text-gray-400">
                                    {staff?.photoUrl ? <img src={staff.photoUrl} className="w-full h-full object-cover" /> : staff?.firstName?.[0]}
                                  </div>
                                  <div>
                                    <p className="text-sm font-bold text-gray-900 uppercase tracking-tight">{staff?.firstName} {staff?.lastName}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase">{staff?.role}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-5">
                                <p className="text-sm font-medium text-gray-500 tabular-nums">
                                  KES {Number(payroll.basicSalary).toLocaleString()}
                                </p>
                              </td>
                              <td className="px-8 py-5">
                                <p className="text-sm font-black text-gray-900 tabular-nums">
                                  KES {Number(payroll.netSalary).toLocaleString()}
                                </p>
                              </td>
                              <td className="px-8 py-5">
                                 <div className="flex items-center space-x-2 text-gray-500">
                                   <Calendar size={14} />
                                   <span className="text-xs font-medium">{new Date(payroll.payDate).toLocaleDateString()}</span>
                                 </div>
                              </td>
                              <td className="px-8 py-5">
                                {payroll.status === 'paid' ? (
                                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-green-50 text-green-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    <Check size={10} />
                                    <span>Disbursed</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-orange-50 text-orange-600 rounded-full text-[10px] font-black uppercase tracking-wider">
                                    <Clock size={10} />
                                    <span>Pending</span>
                                  </span>
                                )}
                              </td>
                              <td className="px-8 py-5 text-right">
                                <div className="flex items-center justify-end space-x-2">
                                   {payroll.status === 'unpaid' && (
                                     <button 
                                      onClick={() => handleMarkAsPaid(payroll.id)}
                                      className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all shadow-md shadow-green-100"
                                     >
                                       <DollarSign size={14} />
                                     </button>
                                   )}
                                   <button className="p-2 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all">
                                     <FileText size={14} />
                                   </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'definitions' && (
            <motion.div
              key="definitions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Global Payroll Items</h2>
                <button 
                  onClick={() => setShowItemModal(true)}
                  className="flex items-center space-x-2 bg-black text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all outline-none"
                >
                  <Plus size={14} />
                  <span>Define New Item</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {itemDefinitions.map(def => (
                  <div key={def.id} className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm hover:border-blue-600 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-3 rounded-2xl ${def.type === 'ALLOWANCE' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {def.type === 'ALLOWANCE' ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <button 
                        onClick={() => handleDeleteDefinition(def.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 uppercase tracking-tight mb-1">{def.name}</h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${def.type === 'ALLOWANCE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {def.type}
                      </span>
                      <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-gray-100 text-gray-500">
                        {def.computationType}
                      </span>
                    </div>
                    <div className="pt-4 border-t border-dashed border-gray-100 flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Calculated Value</span>
                      <span className="text-xl font-black text-gray-900">
                        {def.computationType === 'PERCENTAGE' ? `${def.value}%` : `KES ${Number(def.value).toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div
              key="config"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-8"
            >
              <div className="md:col-span-1 space-y-4">
                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-4">Select Personnel</h2>
                <div className="space-y-3 bg-white border border-gray-100 p-4 rounded-[2.5rem] shadow-sm max-h-[600px] overflow-y-auto">
                  {staffList.map(staff => (
                    <button
                      key={staff.id}
                      onClick={() => {
                        setSelectedStaffForConfig(staff);
                        loadStaffConfig(staff.id);
                      }}
                      className={`w-full flex items-center space-x-4 p-3 rounded-2xl transition-all ${
                        selectedStaffForConfig?.id === staff.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden flex items-center justify-center font-bold text-gray-400 shrink-0">
                        {staff.photoUrl ? <img src={staff.photoUrl} className="w-full h-full object-cover" /> : staff.firstName[0]}
                      </div>
                      <div className="text-left overflow-hidden">
                        <p className={`text-xs font-bold uppercase truncate ${selectedStaffForConfig?.id === staff.id ? 'text-white' : 'text-gray-900'}`}>{staff.firstName} {staff.lastName}</p>
                        <p className={`text-[10px] font-black uppercase tracking-widest ${selectedStaffForConfig?.id === staff.id ? 'text-blue-200' : 'text-gray-400'}`}>{staff.role}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                {selectedStaffForConfig ? (
                  <div className="space-y-6">
                    <div className="bg-white border border-gray-100 p-8 rounded-[2.5rem] shadow-sm">
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-4">
                          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                             <Briefcase size={32} />
                          </div>
                          <div>
                            <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">{selectedStaffForConfig.firstName}'s Config</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage specific allowances and deductions</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Basic Salary</p>
                          <p className="text-2xl font-black text-gray-900">KES {Number(selectedStaffForConfig.basicSalary || 0).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="space-y-8">
                        <section>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Active Payroll Items</h4>
                          </div>
                          <div className="space-y-3">
                             {staffPayrollItems.length === 0 ? (
                               <div className="text-center py-10 bg-gray-50/50 rounded-3xl border border-dashed border-gray-200">
                                 <Plus className="mx-auto text-gray-300 mb-2" />
                                 <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">No custom items assigned</p>
                               </div>
                             ) : (
                               staffPayrollItems.map(item => (
                                 <div key={item.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                   <div className="flex items-center space-x-3">
                                      <div className={`p-2 rounded-xl ${item.itemDefinition.type === 'ALLOWANCE' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {item.itemDefinition.type === 'ALLOWANCE' ? <Plus size={14} /> : <Trash2 size={14} />}
                                      </div>
                                      <div>
                                        <p className="text-[11px] font-bold text-gray-900 uppercase">{item.itemDefinition.name}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{item.itemDefinition.type}</p>
                                      </div>
                                   </div>
                                   <div className="flex items-center space-x-4">
                                      <span className="text-xs font-black text-gray-900">
                                        {item.itemDefinition.computationType === 'PERCENTAGE' ? `${item.itemDefinition.value}% of Basic` : `KES ${Number(item.itemDefinition.value).toLocaleString()}`}
                                      </span>
                                      <button 
                                        onClick={() => handleRemoveItemFromStaff(item.itemDefinitionId)}
                                        className="p-2 text-gray-400 hover:text-red-600 transition-all"
                                      >
                                        <X size={16} />
                                      </button>
                                   </div>
                                 </div>
                               ))
                             )}
                          </div>
                        </section>

                        <section>
                          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Available Items to Add</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {itemDefinitions.filter(def => !staffPayrollItems.some(item => item.itemDefinitionId === def.id)).map(def => (
                              <button
                                key={def.id}
                                onClick={() => handleAssignItemToStaff(def.id)}
                                className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-2xl hover:border-blue-600 transition-all text-left group"
                              >
                                <div className="overflow-hidden">
                                  <p className="text-[11px] font-bold text-gray-900 uppercase truncate">{def.name}</p>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{def.type}</p>
                                </div>
                                <Plus size={14} className="text-gray-300 group-hover:text-blue-600" />
                              </button>
                            ))}
                          </div>
                        </section>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[500px] text-center bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200 p-8">
                     <div className="w-20 h-20 bg-blue-50 text-blue-300 rounded-full flex items-center justify-center mb-6">
                       <UserCheck size={40} />
                     </div>
                     <h3 className="text-xl font-black text-gray-900 uppercase tracking-tighter mb-2">Configuration Mode</h3>
                     <p className="text-gray-400 text-sm max-w-xs mx-auto">Select a staff member from the left to manage their salary structure and payroll items.</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Definition Modal */}
      {showItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-[2.5rem] shadow-2xl p-10 max-w-md w-full border border-gray-100"
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                 <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none italic">New Payroll <span className="text-blue-600">Item</span></h3>
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Define an allowance or deduction</p>
              </div>
              <button onClick={() => setShowItemModal(false)} className="p-2 text-gray-400 hover:text-gray-900 transition-all">
                <X size={24} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Display Name</label>
                <input 
                  type="text" 
                  value={newItem.name}
                  onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                  placeholder="e.g. Housing Allowance"
                  className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Item Type</label>
                  <select 
                    value={newItem.type}
                    onChange={(e) => setNewItem({...newItem, type: e.target.value as any})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all"
                  >
                    <option value="ALLOWANCE">Allowance</option>
                    <option value="DEDUCTION">Deduction</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Computation</label>
                  <select 
                    value={newItem.computationType}
                    onChange={(e) => setNewItem({...newItem, computationType: e.target.value as any})}
                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all"
                  >
                    <option value="FIXED">Fixed Amount</option>
                    <option value="PERCENTAGE">Percentage</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
                  {newItem.computationType === 'PERCENTAGE' ? 'Percentage of Basic Salary' : 'Fixed Amount (KES)'}
                </label>
                <div className="relative">
                   <div className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-black">
                      {newItem.computationType === 'PERCENTAGE' ? <Percent size={14} /> : 'KES'}
                   </div>
                   <input 
                    type="number" 
                    value={newItem.value}
                    onChange={(e) => setNewItem({...newItem, value: Number(e.target.value)})}
                    className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-5 py-4 text-sm font-bold focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                </div>
              </div>

              <button 
                onClick={handleCreateDefinition}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-100 hover:bg-blue-700 transition-all"
              >
                Assemble Item
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PayrollPage;
