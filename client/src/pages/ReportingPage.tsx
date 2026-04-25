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
    <div className="max-w-full px-6 py-8 bg-canvas min-h-full">
      <header className="mb-8 border-b border-border-muted pb-6 flex justify-between items-end">
          <div>
            <nav className="flex mb-2 text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              <span>Insights</span>
              <span className="mx-2">/</span>
              <span className="text-on-surface font-bold uppercase tracking-widest">Financial Reports</span>
            </nav>
            <h1 className="text-3xl font-serif italic font-medium text-on-surface leading-tight">Institutional Performance Ledger</h1>
            <p className="text-gray-500 font-sans mt-1 text-sm">Synthesizing operational data into verifiable financial intelligence.</p>
          </div>
          
          <div className="flex space-x-2">
             <button
                onClick={downloadExcel}
                disabled={!reportData}
                className="bg-surface border border-border-muted text-on-surface px-4 py-1.5 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-canvas transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Export Index
              </button>
          </div>
        </header>

        <div className="bg-surface border border-border-muted p-6 shadow-sm mb-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
            <div className="md:col-span-1">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2 block">Period Start</label>
              <input
                type="date"
                className="w-full border border-border-muted rounded px-4 py-2 outline-none focus:ring-1 focus:ring-on-surface bg-canvas font-mono text-xs text-on-surface"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-1">
              <label className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-2 block">Period End</label>
              <input
                type="date"
                className="w-full border border-border-muted rounded px-4 py-2 outline-none focus:ring-1 focus:ring-on-surface bg-canvas font-mono text-xs text-on-surface"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="md:col-span-2">
              <button
                onClick={fetchReport}
                disabled={loading}
                className="w-full bg-on-surface text-surface px-6 py-2 rounded-sm font-bold uppercase tracking-widest text-[10px] hover:bg-opacity-90 transition-all disabled:opacity-50"
              >
                {loading ? 'Synthesizing Data...' : 'Generate Performance Report'}
              </button>
            </div>
          </div>
        </div>

        {reportData && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-8 animate-in fade-in duration-700"
          >
            <div className="bg-white border border-gray-200 shadow-sm overflow-hidden">
               {schoolInfo && <SchoolLetterhead schoolData={schoolInfo} variant="full" />}
               
               <div className="p-12">
                  <div className="flex items-center justify-between mb-16 border-b border-canvas pb-8">
                     <div>
                        <h2 className="text-2xl font-serif italic text-on-surface leading-none">Fiscal Audit & Flow Summary</h2>
                        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mt-3">Temporal Index: {startDate} — {endDate}</p>
                     </div>
                     <div className="px-3 py-1 bg-canvas rounded-sm border border-border-muted">
                        <span className="text-[9px] font-mono font-bold text-gray-500 uppercase tracking-widest">Status: Verified Ledger</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                    <div className="lg:col-span-3">
                       <h3 className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-10">Revenue vs Expenditure Matrix</h3>
                       <div className="h-[400px]">
                         <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={chartData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                             <XAxis 
                               dataKey="name" 
                               axisLine={false} 
                               tickLine={false} 
                               tick={{ fontSize: 9, fontWeight: 700, fill: '#9ca3af', textTransform: 'uppercase' }} 
                             />
                             <YAxis 
                               axisLine={false} 
                               tickLine={false} 
                               tick={{ fontSize: 9, fill: '#9ca3af', fontPadding: 20 }} 
                             />
                             <Tooltip 
                               cursor={{ fill: '#f9fafb' }} 
                               contentStyle={{ 
                                 borderRadius: '0px', 
                                 border: '1px solid #e5e7eb', 
                                 boxShadow: 'none',
                                 padding: '12px',
                                 fontSize: '10px',
                                 fontWeight: 'bold',
                                 fontFamily: 'monospace',
                                 textTransform: 'uppercase'
                               }} 
                             />
                             <Bar dataKey="value">
                               {chartData.map((entry, index) => (
                                 <motion.rect 
                                   key={index} 
                                   fill={entry.name === 'Expenses' ? '#991b1b' : entry.name === 'Income' ? '#111827' : '#4b5563'} 
                                 />
                               ))}
                             </Bar>
                           </BarChart>
                         </ResponsiveContainer>
                       </div>
                    </div>

                    <div className="space-y-6">
                      {[
                        { label: 'Total Receipts', value: reportData.totalIncome, color: 'text-on-surface' },
                        { label: 'Verified Debits', value: reportData.totalExpenses, color: 'text-red-500' },
                        { label: 'Net Operating Margin', value: reportData.netProfit, color: 'text-on-surface', highlight: true },
                      ].map((stat, i) => (
                        <motion.div
                          key={stat.label}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className={`${stat.highlight ? 'bg-canvas border-on-surface' : 'bg-surface border-border-muted'} p-6 border shadow-sm flex flex-col justify-center min-h-[120px]`}
                        >
                          <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400 mb-3">{stat.label}</p>
                          <p className={`text-2xl font-serif italic ${stat.color} tabular-nums leading-none`}>
                            <span className="text-xs font-sans not-italic mr-1 text-gray-400 font-normal">KES</span>
                            {stat.value.toLocaleString()}
                          </p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-24 pt-12 border-t border-canvas">
                     <div className="flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="text-left">
                           <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest mb-6">Internal Authorization</p>
                           <div className="w-64 h-1 border-b border-border-muted mb-2"></div>
                           <p className="text-[10px] font-serif italic text-gray-500 uppercase tracking-tight">Finance Controller Signature</p>
                        </div>
                        <div className="text-right max-w-sm">
                           <p className="text-[9px] font-mono font-bold text-gray-400 uppercase tracking-widest leading-loose">
                              This document represents a digital synthesis of institutional ledgers and is considered final for the selected period.
                           </p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </motion.div>
        )}
      </div>
  );
};

export default ReportingPage;
