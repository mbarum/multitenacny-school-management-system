
import React from 'react';

interface SkeletonProps {
    className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ className }) => (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`}></div>
);

export default Skeleton;
