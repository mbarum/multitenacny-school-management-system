import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { DollarSign, User, Calendar, Check, X, FileText, Plus, Download, Printer, Filter, Settings, Calculator, Wallet, TrendingUp, TrendingDown, Clock, Search, ChevronRight, ChevronLeft, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface Payroll {
  id: string;
  staffId: string;
  salary: number;
  payDate: string;
  status: 'paid' | 'unpaid';
  staff?: {
    firstName: string;
    lastName: string;
    employeeId: string;
    role: string;
    photoUrl?: string;
  };
   month?: string;
   year?: number;
   baseSalary?: number;
   allowances?: number;
   deductions?: number;
   netPay?: number;
}

interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  employeeId: string;
  role: string;
  photoUrl?: string;
}

const PayrollPage: React.FC = () => {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [payrollsRes, staffRes] = await Promise.all([
        api.get('/payrolls'),
        api.get('/staff')
      ]);
      setPayrolls(payrollsRes.data);
      setStaffList(staffRes.data);
    } catch (error) {
      console.error('Failed to fetch payroll data', error);
      toast.error('Failed to load payroll records');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePayroll = async () => {
    setIsGenerating(true);
    try {
      // Logic to generate payroll for all staff for selected month/year
      // For now, we simulate by creating records for each staff if not exists
      for (const staff of staffList) {
        // Basic implementation: check if payroll already exists for this staff/month/year
        // Here we just send a request to the backend if there was a generate endpoint
        // Since we don't have one, we'll just create a new record for each
        await api.post('/payrolls', {
          staffId: staff.id,
          salary: 50000, // Default for demo
          payDate: new Date(selectedYear, selectedMonth - 1, 30).toISOString(),
          status: 'unpaid'
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

  const totalPayroll = payrolls.reduce((sum, p) => sum + Number(p.salary), 0);
  const paidCount = payrolls.filter(p => p.status === 'paid').length;
  const unpaidCount = payrolls.length - paidCount;

  return (
    <div className="min-h-screen bg-[#FDFDFD] p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 mb-2">
              <Calculator size={16} className="animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Treasury & Finance</span>
            </div>
            <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tighter leading-none italic">
              Payroll <span className="text-blue-600">Engine</span>
            </h1>
            <p className="text-gray-400 font-medium text-sm mt-4 max-w-md">
              Manage school-wide personnel compensation, tax compliance, and disbursement schedules.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
             <div className="bg-white border border-gray-100 rounded-2xl p-1 flex shadow-sm">
                <select 
                  value={selectedMonth} 
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-transparent border-none text-xs font-bold px-4 py-2 focus:ring-0 cursor-pointer"
                >
                  {months.map((m, i) => (
                    <option key={m} value={i + 1}>{m}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear} 
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-transparent border-none text-xs font-bold px-4 py-2 focus:ring-0 cursor-pointer border-l"
                >
                  {[2025, 2026, 2027].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
             </div>
             <button
              onClick={handleGeneratePayroll}
              disabled={isGenerating || staffList.length === 0}
              className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:grayscale flex items-center gap-2"
            >
              {isGenerating ? <Clock className="animate-spin w-3 h-3" /> : <Calculator className="w-3 h-3" />}
              Process Batch
            </button>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white border border-gray-100 p-6 rounded-[2rem] shadow-sm">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Wallet size={20} />
              </div>
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Monthly Cost</span>
            </div>
            <h3 className="text-3xl font-black text-gray-900 tracking-tighter tabular-nums">
              ${totalPayroll.toLocaleString()}
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

        {/* Filters and List */}
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
            <div className="flex items-center space-x-2">
               <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                 <Filter size={18} />
               </button>
               <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                 <Printer size={18} />
               </button>
               <button className="p-3 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                 <Download size={18} />
               </button>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-80">
              <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin mb-4" />
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Crunching Numbers...</p>
            </div>
          ) : payrolls.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[400px] text-center p-8">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                <Calculator size={40} />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2">No Records Found</h4>
              <p className="text-gray-400 text-sm max-w-xs mx-auto mb-8">No payroll has been processed for the selected period.</p>
              <button 
                onClick={handleGeneratePayroll}
                className="px-8 py-3 bg-black text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:scale-105 transition-all active:scale-95"
              >
                Start Monthly Processing
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Personnel</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Employee ID</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Gross Salary</th>
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
                          <code className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {staff?.employeeId || 'N/A'}
                          </code>
                        </td>
                        <td className="px-8 py-5">
                          <p className="text-sm font-black text-gray-900 tabular-nums">
                            ${Number(payroll.salary).toLocaleString()}
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
      </div>
    </div>
  );
};

export default PayrollPage;
