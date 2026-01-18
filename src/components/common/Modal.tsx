
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

    return (
        <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex justify-center items-end sm:items-center p-0 sm:p-4 transition-all duration-300 no-print-backdrop"
            onClick={onClose}
        >
            <style>
                {`
                @keyframes modalSlideUp {
                    from { transform: translateY(100%); opacity: 0.5; }
                    to { transform: translateY(0); opacity: 1; }
                }
                @keyframes modalScaleIn {
                    from { transform: scale(0.95); opacity: 0; }
                    to { transform: scale(1); opacity: 1; }
                }
                .animate-modal-mobile { animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                .animate-modal-desktop { animation: modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
                
                @media print {
                    .fixed { position: static !important; }
                    .no-print-backdrop { background: none !important; backdrop-filter: none !important; padding: 0 !important; }
                    .animate-modal-mobile, .animate-modal-desktop { animation: none !important; transform: none !important; }
                    .rounded-t-[2.5rem], .rounded-[2.5rem] { border-radius: 0 !important; }
                    .h-[92vh], .max-h-[90vh] { height: auto !important; max-height: none !important; }
                    .shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] { shadow: none !important; box-shadow: none !important; }
                    .overflow-hidden { overflow: visible !important; }
                }
                `}
            </style>
            <div 
                className={`bg-white rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.3)] w-full ${sizeClasses[size]} h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col animate-modal-mobile sm:animate-modal-desktop overflow-hidden border border-slate-100 print:border-none print:shadow-none print:w-full`}
                onClick={e => e.stopPropagation()}
            >
                {/* Fixed Header */}
                <div className="flex justify-between items-center border-b border-slate-100 p-6 sm:p-8 shrink-0 bg-white z-10 no-print">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight leading-none">{title}</h3>
                        <div className="w-12 h-1.5 bg-primary-600 rounded-full mt-2"></div>
                    </div>
                    <button onClick={onClose} className="p-3 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-all group">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 group-hover:rotate-90 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content Body - Scrollable */}
                <div className="overflow-y-auto p-6 sm:p-8 flex-grow custom-scrollbar overscroll-contain print:overflow-visible print:p-0">
                    <div className="max-w-full">
                        {children}
                    </div>
                </div>

                {/* Fixed Footer */}
                {footer ? (
                     <div className="border-t border-slate-100 p-6 sm:p-8 shrink-0 bg-slate-50/80 backdrop-blur-md z-10 no-print">
                        {footer}
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default Modal;
