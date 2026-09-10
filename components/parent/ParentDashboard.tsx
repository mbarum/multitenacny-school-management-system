
import React from 'react';
import type { Student } from '../../types';
import { useData } from '../../contexts/DataContext';

const ParentDashboard: React.FC = () => {
    const { parentChildren, studentFinancials, setSelectedChild, setActiveView } = useData();
    
    const handleSelectChild = (child: Student) => {
        setSelectedChild(child);
        setActiveView('parent_child_details');
    };
    
    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">My Children</h2>
            <div className="space-y-6">
                {parentChildren.map(child => {
                    const financials = studentFinancials[child.id] || { balance: 0 };
                    return (
                        <div key={child.id} className="bg-white p-6 rounded-xl shadow-lg flex items-center justify-between hover:shadow-xl transition-shadow">
                            <div className="flex items-center space-x-4">
                                <img src={child.profileImage} alt={child.name} className="h-20 w-20 rounded-full object-cover"/>
                                <div>
                                    <h3 className="text-2xl font-bold text-slate-800">{child.name}</h3>
                                    <p className="text-slate-600">{child.class}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Outstanding Balance</p>
                                <p className={`text-2xl font-bold ${financials.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    KES {financials.balance.toLocaleString()}
                                </p>
                                <button onClick={() => handleSelectChild(child)} className="mt-2 text-primary-600 font-semibold hover:underline">View Details &rarr;</button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ParentDashboard;
