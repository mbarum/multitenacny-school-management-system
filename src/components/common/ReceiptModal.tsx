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
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="lg" footer={<button onClick={() => window.print()} className="px-10 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl no-print hover:scale-105 transition-all">Download / Print</button>}>
            <div className="printable-area p-4 sm:p-8 bg-white text-slate-900 font-sans m-2">
                {/* Modern Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-8 border-slate-900 pb-8 mb-12 gap-6">
                    <div className="flex items-center space-x-6">
                        {schoolInfo.logoUrl && (
                            <img src={schoolInfo.logoUrl} className="h-24 w-auto object-contain" alt="Logo" crossOrigin="anonymous" />
                        )}
                        <div className="max-w-md">
                            <h1 className="text-3xl font-black uppercase tracking-tighter leading-none text-primary-900">{schoolInfo.name}</h1>
                            <div className="mt-4 space-y-1">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">{schoolInfo.address}</p>
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">
                                    <span className="text-primary-600">TEL:</span> {schoolInfo.phone} | <span className="text-primary-600">EMAIL:</span> {schoolInfo.email}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className={`inline-block px-5 py-2 rounded-xl font-black text-sm tracking-[0.2em] mb-4 ${isInvoice ? 'bg-slate-900 text-white' : 'bg-primary-600 text-white'}`}>
                            {title}
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.2em]">Document Identifier</p>
                            <p className="text-2xl font-black font-mono text-slate-800">#{transaction.transactionCode || transaction.id.substring(0,8).toUpperCase()}</p>
                            <p className="text-xs font-bold text-slate-500">{new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Client Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payee / Student Details</p>
                        <p className="text-2xl font-black text-slate-900 uppercase leading-none mb-2">{transaction.studentName}</p>
                        <p className="text-xs font-bold text-primary-600 uppercase tracking-widest">Adm No: {transaction.studentId.substring(0, 8).toUpperCase()}</p>
                    </div>
                    <div className="p-8 border-2 border-slate-50 rounded-[2rem]">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Payment Intelligence</p>
                        <div className="space-y-3">
                             <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Method:</span> <span className="text-sm font-black text-slate-800 uppercase">{transaction.method || 'Institutional Ledger'}</span></div>
                             <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Category:</span> <span className="text-sm font-black text-slate-800 uppercase">{transaction.type}</span></div>
                             <div className="flex justify-between"><span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Currency:</span> <span className="text-sm font-black text-slate-800">{schoolInfo.currency || 'KES'}</span></div>
                        </div>
                    </div>
                </div>

                {/* Ledger Table */}
                <div className="border-4 border-slate-900 rounded-[2.5rem] overflow-hidden mb-16 shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-8 font-black uppercase tracking-widest text-xs">Line Item Description</th>
                                <th className="p-8 font-black uppercase tracking-widest text-xs text-right">Unit Price</th>
                                <th className="p-8 font-black uppercase tracking-widest text-xs text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="p-10 font-black text-xl text-slate-800 uppercase tracking-tight leading-snug">
                                    {transaction.description}
                                </td>
                                <td className="p-10 text-right font-bold text-slate-400 text-lg">
                                    {transaction.amount.toLocaleString()}
                                </td>
                                <td className="p-10 text-right font-black text-2xl text-slate-900">
                                    {transaction.amount.toLocaleString()}
                                </td>
                            </tr>
                            <tr className="bg-slate-50">
                                <td colSpan={2} className="p-8 text-right font-black uppercase tracking-[0.2em] text-xs text-slate-400">Net {isInvoice ? 'Chargeable' : 'Disbursement'} Total</td>
                                <td className={`p-8 text-right font-black text-5xl ${isInvoice ? 'text-slate-900' : 'text-primary-700'}`}>
                                    {formatCurrency(transaction.amount)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Formal Verification Section */}
                <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 items-end px-4">
                    <div className="text-center signature-block">
                        <div className="border-b-2 border-slate-900 h-16 mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Institutional Signatory</p>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center">
                        <div className="w-40 h-40 rounded-full border-8 border-double border-slate-100 flex items-center justify-center opacity-40 transform rotate-[-12deg] mb-2">
                            <div className="text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Saaslink Cloud</p>
                                <p className="text-xs font-black uppercase text-slate-400">Verified Proof</p>
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Electronic Confirmation Seal</p>
                    </div>
                    <div className="text-center signature-block">
                        <div className="border-b-2 border-slate-900 h-16 mb-4"></div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Client / Guardian Acceptance</p>
                    </div>
                </div>

                <div className="mt-24 pt-10 border-t border-dashed border-slate-200 text-center">
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.8em]">Saaslink Education Cloud Enterprise Suite &copy; {new Date().getFullYear()}</p>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiptModal;