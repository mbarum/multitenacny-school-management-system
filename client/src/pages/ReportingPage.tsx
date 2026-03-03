import React, { useState } from 'react';
import api from '../services/api';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ReportingPage: React.FC = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">Financial Reporting</h1>
          <p className="text-gray-500 mt-2">Analyze school revenue and expenditure trends.</p>
        </header>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 mb-10 flex flex-wrap gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Start Date</label>
            <input
              type="date"
              className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">End Date</label>
            <input
              type="date"
              className="w-full border rounded-xl px-4 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <button
            onClick={fetchReport}
            disabled={loading}
            className="bg-black text-white px-10 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-all disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
          {reportData && (
            <button
              onClick={downloadExcel}
              className="bg-emerald-600 text-white px-10 py-2 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all"
            >
              Export Excel
            </button>
          )}
        </div>

        {reportData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-8">Financial Overview</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 600 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                    <Tooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <div className="space-y-6">
              {[
                { label: 'Total Income', value: reportData.totalIncome, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { label: 'Total Expenses', value: reportData.totalExpenses, color: 'text-red-600', bg: 'bg-red-50' },
                { label: 'Net Profit', value: reportData.netProfit, color: 'text-blue-600', bg: 'bg-blue-50' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`${stat.bg} p-8 rounded-3xl border border-white/50`}
                >
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">{stat.label}</p>
                  <p className={`text-4xl font-bold ${stat.color}`}>${stat.value.toLocaleString()}</p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportingPage;
