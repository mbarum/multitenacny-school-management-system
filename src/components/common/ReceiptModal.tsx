
import React from 'react';
import Modal from './Modal';
import { Transaction, TransactionType } from '../../types';
import { useData } from '../../contexts/DataContext';

const ReceiptModal: React.FC<{ isOpen: boolean; onClose: () => void; transaction: Transaction | null }> = ({ isOpen, onClose, transaction }) => {
    const { schoolInfo, formatCurrency } = useData();
    if (!transaction || !schoolInfo) return null;

    const isInvoice = transaction.type === TransactionType.Invoice || transaction.type === TransactionType.ManualDebit;
    const title = isInvoice ? 'OFFICIAL INVOICE' : 'OFFICIAL RECEIPT';
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" footer={<button onClick={() => window.print()} className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl no-print hover:scale-105 transition-all">Export PDF / Print</button>}>
            <div className="printable-area p-8 bg-white text-slate-900 font-sans border-8 border-slate-50 m-2">
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        .printable-area, .printable-area * { visibility: visible; }
                        .printable-area { position: absolute; left: 0; top: 0; width: 100%; padding: 0; border: none; }
                        .no-print { display: none !important; }
                    }
                `}</style>
                
                <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
                    <div className="flex items-center space-x-6">
                        {schoolInfo.logoUrl && <img src={schoolInfo.logoUrl} className="h-24 w-auto object-contain" alt="Logo" crossOrigin="anonymous" />}
                        <div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none">{schoolInfo.name}</h1>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">{schoolInfo.address}</p>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">TEL: {schoolInfo.phone} | EMAIL: {schoolInfo.email}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`inline-block px-4 py-1.5 rounded-lg font-black text-xs tracking-[0.2em] mb-4 ${isInvoice ? 'bg-slate-900 text-white' : 'bg-primary-600 text-white'}`}>{title}</div>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Document No.</p>
                        <p className="text-xl font-black font-mono">#{transaction.transactionCode || 'N/A'}</p>
                        <p className="text-[10px] text-slate-400 font-bold mt-2">{new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-10 mb-12">
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Billed To</p>
                        <p className="text-2xl font-black text-slate-900 uppercase leading-none">{transaction.studentName}</p>
                        <p className="text-sm font-bold text-slate-500 mt-2 uppercase tracking-wide">ID: {transaction.studentId.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="p-6">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Transaction Info</p>
                        <div className="space-y-1">
                             <div className="flex justify-between"><span className="text-sm text-slate-500">Method:</span> <span className="text-sm font-black">{transaction.method || 'Internal Transfer'}</span></div>
                             <div className="flex justify-between"><span className="text-sm text-slate-500">Category:</span> <span className="text-sm font-black">{transaction.type}</span></div>
                        </div>
                    </div>
                </div>

                <div className="border-4 border-slate-900 rounded-3xl overflow-hidden mb-12">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-6 font-black uppercase tracking-widest text-[10px]">Item Description</th>
                                <th className="p-6 font-black uppercase tracking-widest text-[10px] text-right">Amount ({schoolInfo.currency || 'KES'})</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-8 border-b-2 border-slate-100 font-black text-lg text-slate-800 uppercase tracking-tight">{transaction.description}</td>
                                <td className="p-8 border-b-2 border-slate-100 text-right font-black text-2xl">{transaction.amount.toLocaleString()}</td>
                            </tr>
                            <tr className="bg-slate-50">
                                <td className="p-6 text-right font-black uppercase tracking-widest text-xs text-slate-400">Total {isInvoice ? 'Charge' : 'Amount Paid'}</td>
                                <td className={`p-6 text-right font-black text-4xl ${isInvoice ? 'text-slate-900' : 'text-primary-700'}`}>{formatCurrency(transaction.amount)}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="mt-20 flex justify-between items-end border-t-2 border-dashed border-slate-200 pt-10">
                    <div className="w-48 text-center">
                        <div className="border-b-2 border-slate-900 h-10 mb-2"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">School Signatory</p>
                    </div>
                    <div className="text-center">
                        <div className="w-32 h-32 rounded-full border-4 border-double border-slate-100 flex items-center justify-center mb-2 opacity-30">
                            <p className="text-[10px] font-black uppercase rotate-[-15deg]">Official Seal</p>
                        </div>
                    </div>
                    <div className="w-48 text-center">
                        <div className="border-b-2 border-slate-900 h-10 mb-2"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Parent/Guardian</p>
                    </div>
                </div>

                <p className="text-center text-[10px] font-bold text-slate-300 mt-16 uppercase tracking-[0.5em]">Powered by Saaslink Cloud &copy; {new Date().getFullYear()}</p>
            </div>
        </Modal>
    );
};

export default ReceiptModal;
