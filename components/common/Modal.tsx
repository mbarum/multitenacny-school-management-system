
import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    size?: 'md' | 'lg' | 'xl' | '2xl' | '3xl';
    footer?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'lg', footer }) => {
    if (!isOpen) return null;
    
    const sizeClasses = {
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        '2xl': 'max-w-2xl',
        '3xl': 'max-w-3xl'
    };

    const animationStyle: React.CSSProperties = { animation: 'fadeIn 0.3s ease-out' };

    return (
        <div 
            className="fixed inset-0 bg-slate-900 bg-opacity-50 backdrop-blur-sm z-40 flex justify-center items-center p-4 transition-opacity"
            onClick={onClose}
        >
            <style>
                {`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                 @media print {
                    body * {
                      visibility: hidden;
                    }
                    .printable-area, .printable-area * {
                      visibility: visible;
                    }
                    .printable-area {
                      position: absolute;
                      left: 0;
                      top: 0;
                      width: 100%;
                      padding: 1rem; /* Add some padding for print */
                    }
                    .no-print { 
                        display: none !important; 
                    }
                }
                `}
            </style>
            <div 
                style={animationStyle}
                className={`bg-white rounded-xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col`}
                onClick={e => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b border-slate-200 p-4 sticky top-0 bg-white z-10 rounded-t-xl no-print">
                    <h3 className="text-2xl font-semibold text-slate-800">{title}</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-800 transition-colors p-1 rounded-full hover:bg-slate-100">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-y-auto p-6 flex-grow">{children}</div>
                {footer && (
                     <div className="flex justify-end items-center border-t border-slate-200 p-4 sticky bottom-0 bg-white z-10 rounded-b-xl no-print">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Modal;