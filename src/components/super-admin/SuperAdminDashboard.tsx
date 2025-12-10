
import React, { useState, useEffect } from 'react';
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
                <StatCard title="Total Schools" value={stats?.totalSchools?.toString() || '0'} icon={<span className="text-2xl">🏫</span>} />
                <StatCard title="Active Subscriptions" value={stats?.activeSubs?.toString() || '0'} icon={<span className="text-2xl">✅</span>} colorClass="bg-green-100 text-green-600" />
                <StatCard title="Trials" value={stats?.trialSubs?.toString() || '0'} icon={<span className="text-2xl">⏳</span>} colorClass="bg-yellow-100 text-yellow-600" />
                <StatCard title="Est. Monthly Revenue" value={`KES ${stats?.mrr?.toLocaleString() || '0'}`} icon={<span className="text-2xl">💰</span>} />
            </div>

            {/* Schools Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="p-6 border-b border-slate-200">
                    <h3 className="text-xl font-bold text-slate-800">Registered Schools (Tenants)</h3>
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
                            {schools.map(school => (
                                <tr key={school.id} className="hover:bg-slate-50">
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
                                            className="text-primary-600 hover:text-primary-800 font-medium text-sm"
                                        >
                                            Manage
                                        </button>
                                    </td>
                                </tr>
                            ))}
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
                    <div className="flex justify-end pt-4">
                        <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 font-semibold">
                            Save Changes
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default SuperAdminDashboard;
