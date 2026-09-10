import React from 'react';

interface FieldWrapperProps {
    label: string;
    htmlFor?: string;
    error?: string | null;
    children: React.ReactNode;
    required?: boolean;
}

const FieldWrapper: React.FC<FieldWrapperProps> = ({ label, htmlFor, error, children, required }) => (
    <div className="relative">
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {error && <p className="mt-1 text-xs text-red-600" role="alert">{error}</p>}
    </div>
);

export default FieldWrapper;
