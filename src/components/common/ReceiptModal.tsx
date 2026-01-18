
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
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={title} 
            size="lg" 
            footer={<button onClick={() => window.print()} className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl no-print hover:scale-105 transition-all">Export as PDF / Print</button>}
        >
            <div className="printable-area p-4 sm:p-8 bg-white text-slate-900 font-sans print:m-0 print:p-0">
                {/* Modern Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-8 border-slate-900 pb-8 mb-10 gap-6">
                    <div className="flex items-center space-x-6">
                        {schoolInfo.logoUrl && (
                            <img src={schoolInfo.logoUrl} className="h-20 w-auto object-contain" alt="Logo" crossOrigin="anonymous" />
                        )}
                        <div className="max-w-md">
                            <h1 className="text-2xl font-black uppercase tracking-tighter leading-none text-slate-900">{schoolInfo.name}</h1>
                            <div className="mt-3 space-y-1">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">{schoolInfo.address}</p>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[8px]">
                                    <span className="text-primary-600">TEL:</span> {schoolInfo.phone} | <span className="text-primary-600">EMAIL:</span> {schoolInfo.email}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className={`inline-block px-4 py-1.5 rounded-lg font-black text-xs tracking-[0.2em] mb-3 ${isInvoice ? 'bg-slate-900 text-white' : 'bg-primary-600 text-white'}`}>
                            {title}
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-slate-400 font-black uppercase text-[9px] tracking-[0.2em]">Document ID</p>
                            <p className="text-xl font-black font-mono text-slate-800">#{transaction.transactionCode || transaction.id.substring(0,8).toUpperCase()}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                    <div className="bg-slate-50 p-6 rounded-3xl border-2 border-slate-100 relative overflow-hidden">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Scholar Identity</p>
                        <p className="text-xl font-black text-slate-900 uppercase leading-none mb-1">{transaction.studentName}</p>
                        <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Adm No: {transaction.studentId.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="p-6 border-2 border-slate-50 rounded-3xl">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">Finance Metadata</p>
                        <div className="space-y-2">
                             <div className="flex justify-between border-b border-slate-100 pb-1.5"><span className="text-[9px] font-bold text-slate-500 uppercase">Channel:</span> <span className="text-[10px] font-black text-slate-800 uppercase">{transaction.method || 'System Ledger'}</span></div>
                             <div className="flex justify-between"><span className="text-[9px] font-bold text-slate-500 uppercase">Currency:</span> <span className="text-[10px] font-black text-slate-800">{schoolInfo.currency || 'KES'}</span></div>
                        </div>
                    </div>
                </div>

                {/* Main Table */}
                <div className="border-4 border-slate-900 rounded-[2rem] overflow-hidden mb-12 shadow-sm">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-6 font-black uppercase tracking-widest text-[10px]">Description</th>
                                <th className="p-6 font-black uppercase tracking-widest text-[10px] text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100">
                                <td className="p-8 font-black text-lg text-slate-800 uppercase tracking-tight">
                                    {transaction.description}
                                </td>
                                <td className="p-8 text-right font-black text-xl text-slate-900">
                                    {transaction.amount.toLocaleString()}
                                </td>
                            </tr>
                            <tr className="bg-slate-50">
                                <td className="p-6 text-right font-black uppercase tracking-[0.2em] text-[10px] text-slate-400">Grand Disbursement Total</td>
                                <td className={`p-6 text-right font-black text-4xl ${isInvoice ? 'text-slate-900' : 'text-primary-700'}`}>
                                    {formatCurrency(transaction.amount)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer Signatures */}
                <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 items-end px-4">
                    <div className="text-center signature-block">
                        <div className="border-b-2 border-slate-900 h-12 mb-3"></div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Institutional Seal</p>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full border-4 border-double border-slate-100 flex items-center justify-center opacity-30 transform rotate-[-12deg] mb-2">
                             <div className="text-center">
                                <p className="text-[6px] font-black uppercase tracking-widest text-slate-400">Saaslink Cloud</p>
                                <p className="text-[8px] font-black uppercase text-primary-600">VERIFIED</p>
                            </div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Electronic Auth</p>
                    </div>
                    <div className="text-center signature-block">
                        <div className="border-b-2 border-slate-900 h-12 mb-3"></div>
                        <p className="text-[8px] font-black uppercase tracking-widest text-slate-400">Client Acceptance</p>
                    </div>
                </div>

                <div className="mt-20 pt-8 border-t border-dashed border-slate-200 text-center">
                    <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.5em]">Saaslink Cloud Infrastructure &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiptModal;
