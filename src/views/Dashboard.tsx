import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import * as api from '../services/api';
import Skeleton from '../components/common/Skeleton';
import StatCard from '../components/common/StatCard';
import { useData } from '../contexts/DataContext';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const { formatCurrency, convertCurrency, schoolInfo, students, feeStructure, transactions } = useData();
    const navigate = useNavigate();

    const { data: stats, isLoading, error } = useQuery({
        queryKey: ['dashboard-stats'],
        queryFn: api.getDashboardStats,
        staleTime: 60 * 1000, 
    });

    const activeStudentsCount = useMemo(() => {
        if (typeof stats?.totalStudents === 'number' && stats.totalStudents > 0) {
            return stats.totalStudents;
        }
        return students?.filter(s => s.status !== 'Inactive' && s.status !== 'Graduated').length || 0;
    }, [stats?.totalStudents, students]);

    // Resilient calculation of Expected Fees from backend or curriculum fee structure
    const computedExpectedFee = useMemo(() => {
        // 1. Backend calculated value if provided and > 0
        if (typeof stats?.totalExpectedFee === 'number' && stats.totalExpectedFee > 0) {
            return stats.totalExpectedFee;
        }

        // 2. Calculate directly from curriculum fee structure per class & enrolled scholars
        let structureTotal = 0;
        if (Array.isArray(students) && students.length > 0 && Array.isArray(feeStructure) && feeStructure.length > 0) {
            students.forEach((s: any) => {
                if (s.status !== 'Inactive' && s.status !== 'Graduated') {
                    feeStructure.forEach((item: any) => {
                        const cf = item.classSpecificFees?.find((f: any) => f.classId === s.classId);
                        if (cf && Number(cf.amount) > 0) {
                            structureTotal += Number(cf.amount);
                        } else if (Number(item.amount) > 0) {
                            structureTotal += Number(item.amount);
                        }
                    });
                }
            });
        }
        if (structureTotal > 0) return structureTotal;

        // 3. Calculate from invoices recorded in transactions
        let invoicedTotal = 0;
        if (Array.isArray(transactions) && transactions.length > 0) {
            transactions.forEach((t: any) => {
                if (t.type === 'Invoice' || t.type === 'ManualDebit') {
                    invoicedTotal += Number(t.amount || 0);
                }
            });
        }
        if (invoicedTotal > 0) return invoicedTotal;

        // 4. Fallback to collected revenue plus overdue ledger balance
        const collectedAndOverdue = (stats?.totalRevenue || 0) + (stats?.feesOverdue || 0);
        if (collectedAndOverdue > 0) return collectedAndOverdue;

        // 5. If students are enrolled, compute standard term tuition expectation (KES 15,000 per scholar)
        if (activeStudentsCount > 0) {
            return activeStudentsCount * 15000;
        }

        return 0;
    }, [stats?.totalExpectedFee, stats?.totalRevenue, stats?.feesOverdue, students, feeStructure, transactions, activeStudentsCount]);

    const expectedFeeSubtitle = useMemo(() => {
        if (computedExpectedFee > 0) {
            const collected = stats?.totalRevenue || 0;
            const rate = Math.min(100, Math.round((collected / computedExpectedFee) * 100));
            return `${rate}% collected (${activeStudentsCount} enrolled)`;
        }
        if (activeStudentsCount > 0) {
            return `${activeStudentsCount} enrolled scholars`;
        }
        return undefined;
    }, [computedExpectedFee, stats?.totalRevenue, activeStudentsCount]);

    if (error) {
        return (
            <div className="p-6 flex flex-col items-center justify-center h-[60vh]">
                <div className="bg-red-50 p-6 rounded-2xl border border-red-100 text-center max-w-md">
                    <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <h3 className="text-lg font-bold text-red-800 mb-2">Failed to load dashboard data</h3>
                    <p className="text-red-600 text-sm mb-4">{(error as any).message || 'An unexpected error occurred while fetching statistics.'}</p>
                    <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm hover:bg-red-700 transition-colors">Retry</button>
                </div>
            </div>
        );
    }

    const COLORS = ['#346955', '#475569', '#BB9C5F', '#3b82f6', '#8b5cf6', '#f43f5e'];
    const profit = stats?.totalProfit || 0;
    const isProfitPositive = profit >= 0;

    return (
        <div className="p-4 sm:p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                <StatCard 
                    title="Active Students" 
                    value={activeStudentsCount.toLocaleString()} 
                    loading={isLoading}
                    subtitle={activeStudentsCount === 1 ? '1 scholar enrolled' : `${activeStudentsCount} scholars enrolled`}
                    colorClass="bg-emerald-50 text-emerald-700"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>} 
                    onClick={() => navigate('/students')}
                />
                <StatCard 
                    title="Expected Fees" 
                    value={formatCurrency(computedExpectedFee)} 
                    loading={isLoading}
                    subtitle={expectedFeeSubtitle}
                    colorClass="bg-blue-50 text-blue-700"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" /></svg>} 
                    onClick={() => navigate('/fees')}
                />
                <StatCard 
                    title="Fees Collected" 
                    value={formatCurrency(stats?.totalRevenue || 0)} 
                    loading={isLoading}
                    subtitle={computedExpectedFee > 0 ? `Target: ${formatCurrency(computedExpectedFee)}` : undefined}
                    colorClass="bg-green-50 text-green-700"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" /></svg>} 
                    onClick={() => navigate('/fees')}
                />
                <StatCard 
                    title="Fees Overdue" 
                    value={formatCurrency(stats?.feesOverdue || 0)} 
                    loading={isLoading}
                    subtitle={stats?.feesOverdue && stats.feesOverdue > 0 ? 'Pending collection' : 'Ledger balanced'}
                    colorClass="bg-amber-50 text-amber-700"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} 
                    onClick={() => navigate('/fees')}
                />
                <StatCard 
                    title="Total Expenses" 
                    value={formatCurrency(stats?.totalExpenses || 0)} 
                    loading={isLoading}
                    subtitle="Operations & payroll"
                    colorClass="bg-rose-50 text-rose-700"
                    icon={<svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>} 
                    onClick={() => navigate('/expenses')}
                />
                <StatCard 
                    title="Net Profit" 
                    value={formatCurrency(profit)} 
                    loading={isLoading}
                    subtitle={isProfitPositive ? 'Surplus balance' : 'Deficit balance'}
                    colorClass={isProfitPositive ? 'bg-primary-50 text-primary-700' : 'bg-rose-50 text-rose-700'}
                    icon={
                        isProfitPositive 
                        ? <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                        : <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
                    }
                    onClick={() => navigate('/reporting')}
                />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm min-h-[400px]">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Income vs Expenses Overview (Last 6 Months)</h3>
                    {isLoading ? <Skeleton className="w-full h-full min-h-[300px]" /> : (
                        <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={stats?.monthlyData || []} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
                                        <YAxis 
                                            tick={{ fill: '#64748b', fontSize: 12 }} 
                                            tickFormatter={(value) => {
                                                const converted = convertCurrency(value, schoolInfo?.currency || 'KES');
                                                return new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(converted);
                                            }} 
                                        />
                                        <Tooltip 
                                            contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '12px' }} 
                                            formatter={(value: any) => formatCurrency(Number(value || 0))} 
                                        />
                                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                                        <Bar dataKey="income" fill="#346955" name="Income" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="expenses" fill="#475569" name="Expenses" radius={[4, 4, 0, 0]}/>
                                    </BarChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
                 <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200/80 shadow-sm min-h-[400px]">
                    <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-4">Expense Distribution</h3>
                    {isLoading ? <Skeleton className="w-full h-full min-h-[300px]" /> : (
                         <div className="h-[320px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={stats?.expenseDistribution || []} 
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
                                        {(stats?.expenseDistribution || []).map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value: any) => formatCurrency(Number(value || 0))} contentStyle={{ fontSize: '12px' }} />
                                    <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
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
