
import React, { useState, useEffect, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import { School, SubscriptionStatus, SubscriptionPlan } from '../../types';
import * as api from '../../services/api';
import Modal from '../common/Modal';
import StatCard from '../common/StatCard';
import Skeleton from '../common/Skeleton';

const SuperAdminDashboard: React.FC = () => {
    const { addNotification } = useData();
    const [schools, setSchools] = useState<School[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // Filtering State
    const [filter, setFilter] = useState<'all' | 'active' | 'trial' | 'issues'>('all');
    
    // Edit Form State
    const [plan, setPlan] = useState<SubscriptionPlan>(SubscriptionPlan.FREE);
    const [status, setStatus] = useState<SubscriptionStatus>(SubscriptionStatus.TRIAL);
    const [endDate, setEndDate] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [schoolsData, statsData] = await Promise.all([
                api.getAllSchools(),
                api.getPlatformStats()
            ]);
            setSchools(schoolsData);
            setStats(statsData);
        } catch (error) {
            console.error(error);
            addNotification('Failed to load super admin data.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredSchools = useMemo(() => {
        if (filter === 'all') return schools;
        if (filter === 'active') return schools.filter(s => s.subscription?.status === SubscriptionStatus.ACTIVE);
        if (filter === 'trial') return schools.filter(s => s.subscription?.status === SubscriptionStatus.TRIAL);
        if (filter === 'issues') return schools.filter(s => s.subscription?.status === SubscriptionStatus.PAST_DUE || s.subscription?.status === SubscriptionStatus.CANCELLED);
        return schools;
    }, [schools, filter]);

    const openEditModal = (school: School) => {
        setSelectedSchool(school);
        setPlan(school.subscription?.plan || SubscriptionPlan.FREE);
        setStatus(school.subscription?.status || SubscriptionStatus.TRIAL);
        setEndDate(school.subscription?.endDate ? new Date(school.subscription.endDate).toISOString().split('T')[0] : '');
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedSchool) return;

        try {
            await api.updateSchoolSubscription(selectedSchool.id, {
                plan,
                status,
                endDate: endDate || undefined
            });
            addNotification('Subscription updated successfully.', 'success');
            setIsModalOpen(false);
            fetchData();
        } catch (error) {
            addNotification('Update failed.', 'error');
        }
    };

    if (loading) {
        return <div className="p-8"><Skeleton className="h-64 w-full" /></div>;
    }

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Platform Overview</h2>
            
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Total Schools" 
                    value={stats?.totalSchools?.toString() || '0'} 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    }
                    onClick={() => setFilter('all')}
                    isSelected={filter === 'all'}
                />
                <StatCard 
                    title="Active Subscriptions" 
                    value={stats?.activeSubs?.toString() || '0'} 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    colorClass="bg-green-100 text-green-600"
                    onClick={() => setFilter('active')}
                    isSelected={filter === 'active'}
                />
                <StatCard 
                    title="Trials" 
                    value={stats?.trialSubs?.toString() || '0'} 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                    colorClass="bg-yellow-100 text-yellow-600"
                    onClick={() => setFilter('trial')}
                    isSelected={filter === 'trial'}
                />
                <StatCard 
                    title="Est. Monthly Revenue" 
                    value={`KES ${stats?.mrr?.toLocaleString() || '0'}`} 
                    icon={
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01" />
                        </svg>
                    } 
                />
            </div>

            {/* Schools Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-slate-800">
                        {filter === 'all' && 'All Registered Schools'}
                        {filter === 'active' && 'Active Subscriptions'}
                        {filter === 'trial' && 'Schools in Trial'}
                        {filter === 'issues' && 'Past Due / Cancelled'}
                    </h3>
                    <span className="text-sm text-slate-500">{filteredSchools.length} record(s) found</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-6 py-3 font-semibold text-slate-600">School Name</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Admin</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Plan</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Status</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Expiry</th>
                                <th className="px-6 py-3 font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {filteredSchools.map(school => (
                                <tr key={school.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{school.name}</div>
                                        <div className="text-xs text-slate-500">{school.email}</div>
                                    </td>
                                    <td className="px-6 py-4">{school.adminName}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
                                            {school.subscription?.plan || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            school.subscription?.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 
                                            school.subscription?.status === 'TRIAL' ? 'bg-yellow-100 text-yellow-800' : 
                                            'bg-red-100 text-red-800'
                                        }`}>
                                            {school.subscription?.status || 'N/A'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {school.subscription?.endDate ? new Date(school.subscription.endDate).toLocaleDateString() : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button 
                                            onClick={() => openEditModal(school)}
                                            className="text-primary-600 hover:text-primary-800 font-medium text-sm border border-primary-200 px-3 py-1 rounded hover:bg-primary-50 transition-colors"
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredSchools.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                                        No schools found matching this filter.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Subscription Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`Manage Subscription: ${selectedSchool?.name}`} size="md">
                <form onSubmit={handleSave} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Plan</label>
                        <select 
                            value={plan} 
                            onChange={e => setPlan(e.target.value as SubscriptionPlan)}
                            className="w-full p-2 border rounded-md"
                        >
                            {Object.values(SubscriptionPlan).map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <select 
                            value={status} 
                            onChange={e => setStatus(e.target.value as SubscriptionStatus)}
                            className="w-full p-2 border rounded-md"
                        >
                            {Object.values(SubscriptionStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Expiry Date</label>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)}
                            className="w-full p-2 border rounded-md"
                        />
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold shadow">
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
