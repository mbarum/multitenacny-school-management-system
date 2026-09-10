import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement, loading?: boolean, onClick?: () => void, colorClass?: string }> = ({ title, value, icon, loading, onClick, colorClass }) => (
    <div 
        onClick={onClick}
        className={`bg-white p-4 sm:p-6 rounded-xl shadow-lg flex items-center space-x-4 transition-transform transform hover:-translate-y-1 h-32 cursor-pointer hover:shadow-xl border border-transparent hover:border-slate-100`}
        role="button"
        tabIndex={0}
    >
        <div className={`p-4 rounded-full shrink-0 ${colorClass || 'bg-primary-100 text-primary-600'}`}>
            {icon}
        </div>
        <div className="w-full">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {loading ? (
                <Skeleton className="h-8 w-3/4 mt-1" />
            ) : (
                <p className={`text-xl sm:text-2xl font-bold text-slate-800 ${value.includes('-') ? 'text-red-600' : ''}`}>{value}</p>
            )}
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const { formatCurrency } = useData();
    const navigate = useNavigate();

    const { data: stats, isLoading } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: api.getDashboardStats,
        staleTime: 60 * 1000, 
    });

    const COLORS = ['#346955', '#475569', '#BB9C5F', '#3b82f6', '#8b5cf6', '#f43f5e'];
    const profit = stats?.totalProfit || 0;
    const isProfitPositive = profit >= 0;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <StatCard 
                    title="Active Students" 
                    value={stats?.totalStudents?.toLocaleString() || '0'} 
                    loading={isLoading}
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
                    onClick={() => navigate('/students')}
                />
                <StatCard 
                    title="Total Revenue" 
                    value={stats?.totalRevenue ? formatCurrency(stats.totalRevenue) : formatCurrency(0)} 
                    loading={isLoading}
                    colorClass="bg-green-100 text-green-700"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} 
                    onClick={() => navigate('/fees')}
                />
                <StatCard 
                    title="Total Expenses" 
                    value={stats?.totalExpenses ? formatCurrency(stats.totalExpenses) : formatCurrency(0)} 
                    loading={isLoading}
                    colorClass="bg-red-100 text-red-700"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>} 
                    onClick={() => navigate('/expenses')}
                />
                <StatCard 
                    title="Fees Overdue" 
                    value={stats?.feesOverdue ? formatCurrency(stats.feesOverdue) : formatCurrency(0)} 
                    loading={isLoading}
                    colorClass="bg-yellow-100 text-yellow-700"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
                    onClick={() => navigate('/fees')}
                />
                <StatCard 
                    title="Net Profit" 
                    value={formatCurrency(profit)} 
                    loading={isLoading}
                    colorClass={isProfitPositive ? 'bg-primary-100 text-primary-700' : 'bg-red-100 text-red-700'}
                    icon={
                        isProfitPositive 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                    }
                    onClick={() => navigate('/reporting')}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-xl shadow-lg min-h-[400px]">
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-4">Income vs Expenses Overview (Last 6 Months)</h3>
                    {isLoading ? <Skeleton className="w-full h-full min-h-[300px]" /> : (
                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats?.monthlyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
                                    <YAxis tick={{ fill: '#64748b' }} tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value)} />
                                    <Tooltip 
                                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem' }} 
                                        formatter={(value: any) => formatCurrency(Number(value || 0))} 
                                    />
                                    <Legend />
                                    <Bar dataKey="income" fill="#346955" name="Income (KES)" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="expenses" fill="#475569" name="Expenses (KES)" radius={[4, 4, 0, 0]}/>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
                 <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-xl shadow-lg min-h-[400px]">
                    <h3 className="text-lg sm:text-xl font-semibold text-slate-700 mb-4">Expense Distribution</h3>
                    {isLoading ? <Skeleton className="w-full h-full min-h-[300px]" /> : (
                         <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={stats?.expenseDistribution} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        outerRadius={80} 
                                        fill="#8884d8" 
                                        label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
                                            if (percent === undefined || midAngle === undefined) return null;
                                            const RADIAN = Math.PI / 180;
                                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                            return percent > 0.05 ? (
                                                <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" className="text-[10px] font-bold">
                                                    {`${(percent * 100).toFixed(0)}%`}
                                                </text>
                                            ) : null;
                                        }}
                                    >
                                        {stats?.expenseDistribution.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))}/>
                                    <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;