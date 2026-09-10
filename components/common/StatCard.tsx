
import React from 'react';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactElement; colorClass?: string }> = ({ title, value, icon, colorClass = 'text-primary-600 bg-primary-100' }) => (
    <div className="bg-white p-6 rounded-lg shadow-md flex items-center space-x-4">
        <div className={`p-3 rounded-full ${colorClass}`}>
            {icon}
        </div>
        <div>
            <p className="text-sm text-slate-500">{title}</p>
            <p className="text-2xl font-bold text-slate-800">{value}</p>
        </div>
    </div>
);

export default StatCard;
