
import React from 'react';
import Skeleton from './Skeleton';

interface StatCardProps {
    title: string;
    value: string;
    icon: React.ReactElement;
    colorClass?: string;
    loading?: boolean;
    onClick?: () => void;
    isSelected?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    icon, 
    colorClass = 'text-primary-600 bg-primary-100', 
    loading = false,
    onClick,
    isSelected = false
}) => (
    <div 
        onClick={onClick}
        className={`bg-white p-6 rounded-xl shadow-md flex items-center space-x-4 transition-all duration-200 
        ${onClick ? 'cursor-pointer hover:shadow-xl hover:-translate-y-1' : ''}
        ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2' : ''}
        `}
    >
        <div className={`p-4 rounded-full shrink-0 ${colorClass}`}>
            {icon}
        </div>
        <div className="w-full">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            {loading ? (
                <Skeleton className="h-8 w-24 mt-1" />
            ) : (
                <p className="text-3xl font-bold text-slate-800">{value}</p>
            )}
        </div>
    </div>
);

export default StatCard;
