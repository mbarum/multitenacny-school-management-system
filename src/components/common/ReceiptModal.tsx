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
            footer={<button onClick={() => window.print()} className="px-12 py-4 bg-slate-900 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl no-print hover:scale-105 transition-all">Download / Print Official PDF</button>}
        >
            <div className="printable-area p-4 sm:p-10 bg-white text-slate-900 font-sans print:m-0 print:p-0">
                {/* Modern Identity Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start border-b-[10px] border-slate-900 pb-10 mb-12 gap-8 relative">
                    <div className="flex items-center space-x-8">
                        {schoolInfo.logoUrl && (
                            <img src={schoolInfo.logoUrl} className="h-24 w-auto object-contain grayscale brightness-0" alt="Logo" crossOrigin="anonymous" />
                        )}
                        <div className="max-w-md">
                            <h1 className="text-4xl font-black uppercase tracking-tighter leading-none text-slate-900 mb-4">{schoolInfo.name}</h1>
                            <div className="space-y-1">
                                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[9px]">{schoolInfo.address}</p>
                                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[9px]">
                                    CONTACT: {schoolInfo.phone} • {schoolInfo.email}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto">
                        <div className={`inline-block px-6 py-2 rounded-lg font-black text-sm tracking-[0.3em] mb-6 transform -rotate-1 ${isInvoice ? 'bg-slate-900 text-white' : 'bg-primary-600 text-white'}`}>
                            {title}
                        </div>
                        <div className="space-y-1">
                            <p className="text-slate-300 font-black uppercase text-[10px] tracking-widest">Serial Identifier</p>
                            <p className="text-2xl font-black font-mono text-slate-900 leading-none">#{transaction.transactionCode || transaction.id.substring(0,8).toUpperCase()}</p>
                            <p className="text-xs font-bold text-slate-400 uppercase mt-2">{new Date(transaction.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                        </div>
                    </div>
                </div>

                {/* Identification Lattice */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-16">
                    <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 relative overflow-hidden group">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Scholar Identity</p>
                        <p className="text-3xl font-black text-slate-900 uppercase leading-tight mb-2">{transaction.studentName}</p>
                        <p className="text-sm font-black text-primary-600 font-mono">INDEX: {transaction.studentId.substring(0, 13).toUpperCase()}</p>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-125 transition-transform duration-700"></div>
                    </div>
                    <div className="p-8 border-2 border-slate-50 rounded-[2.5rem] flex flex-col justify-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Financial Context</p>
                        <div className="grid grid-cols-2 gap-y-4">
                             <span className="text-[10px] font-black text-slate-400 uppercase">Method</span>
                             <span className="text-xs font-black text-slate-900 uppercase text-right">{transaction.method || 'System Transfer'}</span>
                             <span className="text-[10px] font-black text-slate-400 uppercase">Base Currency</span>
                             <span className="text-xs font-black text-slate-900 uppercase text-right">{schoolInfo.currency || 'KES'}</span>
                        </div>
                    </div>
                </div>

                {/* Main Ledger Itemization */}
                <div className="border-4 border-slate-900 rounded-[3rem] overflow-hidden mb-16 shadow-2xl">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-900 text-white">
                                <th className="p-8 font-black uppercase tracking-widest text-[10px]">Description of Charge/Credit</th>
                                <th className="p-8 font-black uppercase tracking-widest text-[10px] text-right">Net Valuation</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="border-b border-slate-100">
                                <td className="p-10">
                                    <div className="font-black text-2xl text-slate-800 uppercase tracking-tighter leading-snug">{transaction.description}</div>
                                    <div className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-widest">Academic Year {new Date().getFullYear()} Cycle</div>
                                </td>
                                <td className="p-10 text-right">
                                    <div className="font-black text-3xl text-slate-900 font-mono tracking-tighter">{transaction.amount.toLocaleString()}</div>
                                </td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="p-8 text-right font-black uppercase tracking-[0.3em] text-[10px] text-slate-400">Statutory Final Total</td>
                                <td className={`p-8 text-right font-black text-6xl tracking-tighter ${isInvoice ? 'text-slate-900' : 'text-primary-700'}`}>
                                    {formatCurrency(transaction.amount)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Trust Verification Seal */}
                <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-12 items-end px-6">
                    <div className="text-center">
                        <div className="border-b-2 border-slate-900 h-16 mb-4"></div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Institutional Signature</p>
                    </div>
                    <div className="text-center flex flex-col items-center justify-center">
                        <div className="w-32 h-32 rounded-full border-4 border-double border-slate-100 flex items-center justify-center opacity-30 transform rotate-[-15deg] mb-3 bg-slate-50 shadow-inner">
                            <div className="text-center">
                                <p className="text-[7px] font-black uppercase tracking-widest text-slate-400">Cloud Secured</p>
                                <p className="text-[10px] font-black uppercase text-primary-600">VERIFIED</p>
                            </div>
                        </div>
                        <p className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">Electronic Auth Proof</p>
                    </div>
                    <div className="text-center">
                        <div className="border-b-2 border-slate-900 h-16 mb-4"></div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Official Receiving Stamp</p>
                    </div>
                </div>

                <div className="mt-32 pt-10 border-t border-dashed border-slate-200 text-center">
                    <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.8em]">Digitally Provisioned via Saaslink Cloud Infrastructure</p>
                </div>
            </div>
        </Modal>
    );
};

export default ReceiptModal;