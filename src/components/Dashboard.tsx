
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as api from '../services/api';
import Skeleton from './common/Skeleton';
import { useData } from '../contexts/DataContext';

interface DashboardStats {
    totalStudents: number;
    totalRevenue: number;
    totalExpenses: number;
    feesOverdue: number;
    monthlyData: { name: string; income: number; expenses: number }[];
    expenseDistribution: { name: string; value: number }[];
}

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement, loading?: boolean }> = ({ title, value, icon, loading }) => (
    <div className="bg-white p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-transform transform hover:-translate-y-1 h-32">
        <div className="p-4 bg-primary-100 rounded-full text-primary-600 shrink-0">
            {icon}
        </div>
        <div className="w-full">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {loading ? (
                <Skeleton className="h-8 w-3/4 mt-1" />
            ) : (
                <p className="text-3xl font-bold text-slate-800">{value}</p>
            )}
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { formatCurrency } = useData();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const data = await api.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error("Failed to load dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };
        loadStats();
    }, []);

    const COLORS = ['#346955', '#475569', '#BB9C5F', '#3b82f6', '#8b5cf6', '#f43f5e'];

    return (
        <div className="p-6 md:p-8 space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title="Active Students" 
                    value={stats?.totalStudents.toLocaleString() || '0'} 
                    loading={loading}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
                />
                <StatCard 
                    title="Total Revenue" 
                    value={stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : formatCurrency(0)} 
                    loading={loading}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} 
                />
                <StatCard 
                    title="Total Expenses" 
                    value={stats?.totalExpenses ? formatCurrency(stats.totalExpenses) : formatCurrency(0)} 
                    loading={loading}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>} 
                />
                <StatCard 
                    title="Fees Overdue" 
                    value={stats?.feesOverdue ? formatCurrency(stats.feesOverdue) : formatCurrency(0)} 
                    loading={loading}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg h-[400px]">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Income vs Expenses Overview (Last 6 Months)</h3>
                    {loading ? <Skeleton className="w-full h-full" /> : (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                                <YAxis tick={{ fill: '#64748b' }} tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }} formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                                <Bar dataKey="income" fill="#346955" name="Income" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="expenses" fill="#475569" name="Expenses" radius={[4, 4, 0, 0]}/>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>
                 <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg h-[400px]">
                    <h3 className="text-xl font-semibold text-slate-700 mb-4">Expense Distribution</h3>
                    {loading ? <Skeleton className="w-full h-full" /> : (
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={stats?.expenseDistribution} 
                                    dataKey="value" 
                                    nameKey="name" 
                                    cx="50%" 
                                    cy="50%" 
                                    outerRadius={100} 
                                    fill="#8884d8" 
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                                        const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                                        return percent > 0.05 ? (
                                            <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-xs font-bold">
                                                {`${(percent * 100).toFixed(0)}%`}
                                            </text>
                                        ) : null;
                                    }}
                                >
                                    {stats?.expenseDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                 <Tooltip formatter={(value: number) => formatCurrency(value)}/>
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;