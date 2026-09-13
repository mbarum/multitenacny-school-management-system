
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
    subtitle?: string;
}

const StatCard: React.FC<StatCardProps> = ({ 
    title, 
    value, 
    icon, 
    colorClass = 'text-primary-600 bg-primary-100', 
    loading = false,
    onClick,
    isSelected = false,
    subtitle
}) => {
    // Dynamically calculate font size so lengthy currency amounts or values never overflow the card
    const getValueFontSize = (val: string) => {
        if (!val) return 'text-xl sm:text-2xl lg:text-3xl';
        const str = String(val);
        if (str.length > 16) return 'text-base sm:text-lg xl:text-xl';
        if (str.length > 12) return 'text-lg sm:text-xl xl:text-2xl';
        if (str.length > 8) return 'text-xl sm:text-2xl xl:text-2xl';
        return 'text-2xl sm:text-3xl';
    };

    return (
        <div 
            onClick={onClick}
            className={`bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-3 sm:gap-4 transition-all duration-200 min-w-0 overflow-hidden
            ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
            ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2 border-transparent' : ''}
            `}
        >
            <div className={`p-3 rounded-xl shrink-0 flex items-center justify-center ${colorClass}`}>
                {icon}
            </div>
            <div className="min-w-0 flex-1 overflow-hidden">
                <p 
                    className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 truncate" 
                    title={title}
                >
                    {title}
                </p>
                {loading ? (
                    <Skeleton className="h-7 w-24 mt-1" />
                ) : (
                    <p 
                        className={`font-black text-slate-800 tracking-tight truncate mt-0.5 ${getValueFontSize(value)}`}
                        title={value}
                    >
                        {value}
                    </p>
                )}
                {subtitle && (
                    <p className="text-[11px] text-slate-400 truncate mt-0.5" title={subtitle}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatCard;
