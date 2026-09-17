
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
    // Refined font sizing: clean, legible, and balanced across all viewports
    const getValueFontSize = (val: string) => {
        if (!val) return 'text-lg sm:text-xl';
        const str = String(val).trim();
        if (str.length > 22) return 'text-xs sm:text-sm';
        if (str.length > 17) return 'text-sm sm:text-base';
        if (str.length > 13) return 'text-base sm:text-lg';
        if (str.length > 9) return 'text-lg sm:text-xl';
        return 'text-xl sm:text-2xl';
    };

    return (
        <div 
            onClick={onClick}
            className={`bg-white p-4 sm:p-4.5 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col justify-between transition-all duration-200 min-w-0 overflow-hidden group
            ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : ''}
            ${isSelected ? 'ring-2 ring-primary-500 ring-offset-2 border-transparent bg-primary-50/10' : ''}
            `}
        >
            {/* Top row: Title and Icon badge */}
            <div className="flex items-start justify-between gap-2.5 min-w-0">
                <p 
                    className="text-[11px] font-bold uppercase tracking-wider text-slate-500 line-clamp-2 leading-tight flex-1" 
                    title={title}
                >
                    {title}
                </p>
                <div className={`p-2 rounded-xl shrink-0 flex items-center justify-center [&>svg]:w-4 [&>svg]:h-4 sm:[&>svg]:w-4.5 sm:[&>svg]:h-4.5 ${colorClass}`}>
                    {icon}
                </div>
            </div>

            {/* Bottom section: Full width for Value and Subtitle */}
            <div className="mt-2.5 pt-0.5 min-w-0">
                {loading ? (
                    <Skeleton className="h-7 w-24 rounded-lg" />
                ) : (
                    <div 
                        className={`font-bold text-slate-900 tracking-tight tabular-nums leading-snug break-words ${getValueFontSize(value)}`}
                        title={value}
                    >
                        {value}
                    </div>
                )}
                {subtitle && (
                    <p className="text-[11px] font-medium text-slate-500 truncate mt-1" title={subtitle}>
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatCard;
