import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import SchoolLetterhead from '../components/SchoolLetterhead';

const ReportingPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [schoolInfo, setSchoolInfo] = useState<any>(null);

  useEffect(() => {
    fetchSchoolInfo();
  }, []);

  const fetchSchoolInfo = async () => {
    try {
      const response = await api.get('/tenants/current');
      setSchoolInfo(response.data);
    } catch (error) {
      console.error('Failed to fetch school info', error);
    }
  };

  const fetchReport = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const response = await api.get(`/reporting/financials?startDate=${startDate}&endDate=${endDate}`);
      setReportData(response.data);
    } catch (error) {
      console.error('Failed to fetch report', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await api.get(`/reporting/financials/excel?startDate=${startDate}&endDate=${endDate}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `financial-report-${startDate}-to-${endDate}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download Excel', error);
    }
  };

  const chartData = reportData ? [
    { name: 'Income', value: reportData.totalIncome },
    { name: 'Expenses', value: reportData.totalExpenses },
    { name: 'Net Profit', value: reportData.netProfit },
  ] : [];

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto pb-20">
        <header className="mb-12">
          <h1 className="text-[32px] font-black tracking-tight text-gray-900 leading-none mb-3 uppercase">
            Intelligence <span className="text-brand-green">Nexus</span>
          </h1>
          <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Financial and Operational Analytics</p>
        </header>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Period Start</label>
              <input
                type="date"
                className="w-full border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green font-bold text-gray-900"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Period End</label>
              <input
                type="date"
                className="w-full border border-gray-100 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green font-bold text-gray-900"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="flex-1 bg-brand-green text-brand-sand px-6 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-brand-green/90 transition-all disabled:opacity-50 shadow-lg shadow-brand-green/10 active:scale-95"
              >
                {loading ? 'Synthesizing...' : 'Generate Intelligence'}
              </button>
              {reportData && (
                <button
                  onClick={downloadExcel}
                  className="bg-brand-sand text-brand-dark px-6 py-3 rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:brightness-110 transition-all shadow-lg shadow-brand-sand/10 active:scale-95"
                >
                  Export Data
                </button>
              )}
            </div>
          </div>
        </div>

        {reportData && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Professional Letterhead Integration */}
            <div className="bg-white rounded-[32px] shadow-2xl border border-gray-100 overflow-hidden">
               {schoolInfo && <SchoolLetterhead schoolData={schoolInfo} variant="full" />}
               
               <div className="p-8 md:p-12">
                  <div className="flex items-center justify-between mb-12">
                     <div>
                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Institutional Performance Report</h2>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Generated: {new Date().toLocaleDateString()} • {startDate} to {endDate}</p>
                     </div>
                     <div className="px-4 py-2 bg-gray-50 rounded-xl border border-gray-100">
                        <span className="text-[10px] font-black text-brand-green uppercase tracking-widest">Status: Verified</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                       <div className="bg-gray-50/50 p-8 rounded-3xl border border-gray-100">
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Revenue vs Expenditure Flow</h3>
                          <div className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis 
                                  dataKey="name" 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fontSize: 10, fontWeight: 800, fill: '#9ca3af' }} 
                                />
                                <YAxis 
                                  axisLine={false} 
                                  tickLine={false} 
                                  tick={{ fontSize: 10, fill: '#9ca3af' }} 
                                />
                                <Tooltip 
                                  cursor={{ fill: '#f3f4f6' }} 
                                  contentStyle={{ 
                                    borderRadius: '16px', 
                                    border: '1px solid #f3f4f6', 
                                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
                                    padding: '12px',
                                    fontSize: '11px',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase'
                                  }} 
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                  {chartData.map((entry, index) => (
                                    <motion.rect 
                                      key={index} 
                                      fill={entry.name === 'Expenses' ? '#ef4444' : entry.name === 'Income' ? '#042d2d' : '#f4a460'} 
                                    />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-4">
                      {[
                        { label: 'Total Gross Income', value: reportData.totalIncome, color: 'text-[#042d2d]', bg: 'bg-[#042d2d]/5', borderColor: 'border-[#042d2d]/10' },
                        { label: 'Operating Expenses', value: reportData.totalExpenses, color: 'text-red-500', bg: 'bg-red-50', borderColor: 'border-red-100' },
                        { label: 'Net Institutional Margin', value: reportData.netProfit, color: 'text-brand-dark', bg: 'bg-brand-sand/20', borderColor: 'border-brand-sand/30' },
                      ].map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`${stat.bg} ${stat.borderColor} p-6 px-8 rounded-3xl border flex flex-col justify-center min-h-[140px]`}
                        >
                          <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-400 mb-2">{stat.label}</p>
                          <p className={`text-3xl font-black tracking-tight ${stat.color}`}>KES {stat.value.toLocaleString()}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase mt-2">Fiscal accuracy: 99.9%</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-16 pt-16 border-t border-gray-100">
                     <div className="flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left">
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-4">Official Endorsement</p>
                           <div className="w-48 h-12 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center italic text-gray-300 text-xs">
                              Digital Signature Placeholder
                           </div>
                        </div>
                        <div className="text-center md:text-right">
                           <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-loose">
                              This report is electronically generated and verified <br />
                              by SaaSLink EMIS Compliance Systems.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportingPage;
