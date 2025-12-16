
import React from 'react';
import Modal from './Modal';
import { Transaction, SchoolInfo, TransactionType } from '../../types';
import { useData } from '../../contexts/DataContext';

interface ReceiptModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
}

const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, transaction }) => {
    const { schoolInfo, formatCurrency } = useData();

    if (!transaction || !schoolInfo) return null;

    const isInvoice = transaction.type === TransactionType.Invoice || transaction.type === TransactionType.ManualDebit;
    const title = isInvoice ? 'INVOICE' : 'RECEIPT';
    const colorClass = isInvoice ? 'text-slate-800' : 'text-green-700';
    const bgClass = isInvoice ? 'bg-slate-50' : 'bg-green-50';

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`${title} VIEW`} 
            size="lg"
            footer={
                <button onClick={() => window.print()} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 no-print">
                    Print {title}
                </button>
            }
        >
            <div className="printable-area p-6 bg-white border border-slate-200 shadow-sm" id="printable-receipt">
                <style>
                    {`
                    @media print {
                        body * { visibility: hidden; }
                        #printable-receipt, #printable-receipt * { visibility: visible; }
                        #printable-receipt { 
                            position: absolute; 
                            left: 0; 
                            top: 0; 
                            width: 100%; 
                            margin: 0;
                            padding: 2rem;
                            border: none;
                            box-shadow: none;
                        }
                        .no-print { display: none !important; }
                    }
                    `}
                </style>

                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-300 pb-6 mb-6">
                    <div className="flex items-center space-x-4">
                        {schoolInfo.logoUrl && (
                            <img src={schoolInfo.logoUrl} alt="Logo" className="h-20 w-20 object-contain rounded-md" />
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">{schoolInfo.name}</h2>
                            <p className="text-sm text-slate-600">{schoolInfo.address}</p>
                            <p className="text-sm text-slate-600">{schoolInfo.phone} | {schoolInfo.email}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h3 className={`text-3xl font-extrabold ${colorClass} tracking-widest`}>{title}</h3>
                        <p className="text-slate-500 mt-1"># {transaction.transactionCode || 'PENDING'}</p>
                        <p className="text-sm text-slate-500 mt-1">Date: {new Date(transaction.date).toLocaleDateString()}</p>
                    </div>
                </div>

                {/* Bill To */}
                <div className="mb-8">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</h4>
                    <div className="text-lg font-semibold text-slate-800">{transaction.studentName}</div>
                    {/* Access admission number if joined, currently mapped in service but typing might be loose */}
                    <div className="text-slate-600">Student ID: {(transaction as any).student?.admissionNumber || 'N/A'}</div>
                </div>

                {/* Line Item */}
                <div className="mb-8">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                                <th className="p-3 border-y border-slate-200">Description</th>
                                <th className="p-3 border-y border-slate-200 text-right">Method</th>
                                <th className="p-3 border-y border-slate-200 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-4 border-b border-slate-100 font-medium text-slate-700">{transaction.description}</td>
                                <td className="p-4 border-b border-slate-100 text-right text-slate-600">{transaction.method || '-'}</td>
                                <td className="p-4 border-b border-slate-100 text-right font-bold text-slate-800">{formatCurrency(transaction.amount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Total */}
                <div className="flex justify-end mb-12">
                    <div className={`${bgClass} p-4 rounded-lg w-1/2`}>
                        <div className="flex justify-between items-center">
                            <span className={`text-lg font-bold ${colorClass}`}>TOTAL {isInvoice ? 'DUE' : 'PAID'}</span>
                            <span className={`text-2xl font-extrabold ${colorClass}`}>{formatCurrency(transaction.amount)}</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-xs text-slate-400 mt-auto pt-8 border-t border-slate-200">
                    <p>Thank you for choosing {schoolInfo.name}.</p>
                    <p>Generated by Saaslink System.</p>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiptModal;
