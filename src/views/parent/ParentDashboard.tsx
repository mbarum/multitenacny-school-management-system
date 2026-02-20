
import React, { useEffect, useState } from 'react';
import type { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from '../../components/common/Skeleton';
import { useQuery } from '@tanstack/react-query';

const ParentDashboard: React.FC = () => {
    const { parentChildren, setSelectedChild, setActiveView, formatCurrency } = useData();
    
    // We can use a query to enrich student data with balances
    const { data: balances = {}, isLoading } = useQuery({
        queryKey: ['parent-balances', parentChildren.map(c => c.id).join(',')],
        queryFn: async () => {
            const newBalances: Record<string, number> = {};
            for (const child of parentChildren) {
                const res = await api.getStudents({ search: child.admissionNumber, limit: 1, pagination: 'false' });
                const list = Array.isArray(res) ? res : res.data;
                const student = list.find((s: Student) => s.id === child.id);
                newBalances[child.id] = student?.balance || 0;
            }
            return newBalances;
        },
        enabled: parentChildren.length > 0
    });

    const handleSelectChild = (child: Student) => {
        setSelectedChild(child);
        setActiveView('parent_child_details');
    };
    
    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">My Children</h2>
            <div className="space-y-6">
                {isLoading ? <Skeleton className="h-32 w-full rounded-xl" /> : 
                parentChildren.map(child => {
                    const balance = balances[child.id] || 0;
                    return (
                        <div 
                            key={child.id} 
                            onClick={() => handleSelectChild(child)}
                            className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group border border-transparent hover:border-primary-100"
                        >
                            <div className="flex items-center space-x-4">
                                <img src={child.profileImage} alt={child.name} className="h-20 w-20 rounded-full object-cover group-hover:ring-2 group-hover:ring-primary-500 group-hover:ring-offset-2 transition-all"/>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800 group-hover:text-primary-700 transition-colors">{child.name}</h3>
                                    <p className="text-slate-600">{child.class}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Outstanding Balance</p>
                                <p className={`text-2xl font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    {formatCurrency(balance)}
                                </p>
                                <span className="mt-2 text-primary-600 font-semibold text-sm group-hover:underline inline-block">View Details &rarr;</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ParentDashboard;
