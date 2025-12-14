
import React, { useEffect, useState } from 'react';
import type { Student } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from '../common/Skeleton';

const ParentDashboard: React.FC = () => {
    const { parentChildren, setSelectedChild, setActiveView } = useData();
    const [balances, setBalances] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const loadBalances = async () => {
            setLoading(true);
            const newBalances: Record<string, number> = {};
            try {
                for (const child of parentChildren) {
                    // Fetch updated student data which includes calculated balance
                    const res = await api.getStudents({ search: child.admissionNumber, limit: 1 });
                    if (res && res.data) {
                        const student = res.data.find((s: Student) => s.id === child.id);
                        newBalances[child.id] = student?.balance || 0;
                    }
                }
                setBalances(newBalances);
            } catch (e) {
                console.error("Error loading balances", e);
            } finally {
                setLoading(false);
            }
        };
        
        if (parentChildren.length > 0) {
            loadBalances();
        } else {
            setLoading(false);
        }
    }, [parentChildren]);

    const handleSelectChild = (child: Student) => {
        setSelectedChild(child);
        setActiveView('parent_child_details');
    };
    
    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">My Children</h2>
            <div className="space-y-6">
                {loading ? <Skeleton className="h-32 w-full rounded-xl" /> : 
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
                                    KES {balance.toLocaleString()}
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
