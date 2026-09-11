
import React, { useState } from 'react';
import { initiateSTKPush } from '../../services/darajaService';
import type { Student, Transaction } from '../../types';
import Modal from '../../components/common/Modal';
import Spinner from '../../components/common/Spinner';
import ReceiptModal from '../../components/common/ReceiptModal';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from '../../components/common/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { TransactionType } from '../../types';
import { buildStudentTermInvoice, FinancialDocument } from '../../utils/invoiceReceiptGenerator';
import { FileText, Receipt, Download } from 'lucide-react';

const ParentFinances: React.FC = () => {
    const { parentChildren, darajaSettings, addNotification, formatCurrency, schoolInfo } = useData();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedChildForPayment, setSelectedChildForPayment] = useState<Student | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [selectedInvoiceDoc, setSelectedInvoiceDoc] = useState<FinancialDocument | null>(null);
    const [selectedChildForReceipt, setSelectedChildForReceipt] = useState<Student | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [isPaying, setIsPaying] = useState(false);
    
    // Fetch financial data for all children
    const { data: childData = {}, isLoading } = useQuery({
        queryKey: ['parent-financials-detailed', parentChildren.map(c => c.id).join(',')],
        queryFn: async () => {
             const data: Record<string, { balance: number, recentTransactions: Transaction[] }> = {};
             for (const child of parentChildren) {
                    const res = await api.getStudents({ search: child.admissionNumber, limit: 1, pagination: 'false' });
                    const list = Array.isArray(res) ? res : res.data;
                    const updatedChild = list.find((s: Student) => s.id === child.id);
                    const balance = updatedChild?.balance || 0;

                    // Fix: Updated api.getTransactions parameter with updated type that includes studentId.
                    const transactionsRes = await api.getTransactions({ studentId: child.id, type: 'Payment', limit: 5 });
                    
                    data[child.id] = {
                        balance,
                        recentTransactions: Array.isArray(transactionsRes?.data) ? transactionsRes.data : (Array.isArray(transactionsRes) ? transactionsRes : [])
                    };
                }
                return data;
        },
        enabled: parentChildren.length > 0
    });

    const openPaymentModal = (child: Student) => {
        setSelectedChildForPayment(child);
        const balance = childData[child.id]?.balance || 0;
        setPaymentAmount(balance > 0 ? balance : 0);
        setIsPaymentModalOpen(true);
    };

    const openReceiptModal = (transaction: Transaction, child?: Student) => {
        setSelectedInvoiceDoc(null);
        setSelectedTransaction(transaction);
        setSelectedChildForReceipt(child || null);
        setIsReceiptModalOpen(true);
    };

    const openInvoiceModal = async (child: Student, currentBalance: number) => {
        if (!schoolInfo) return;
        try {
            const feeItems = await api.getFeeStructure();
            const doc = buildStudentTermInvoice(
                child,
                Array.isArray(feeItems) ? feeItems : [],
                schoolInfo,
                darajaSettings,
                currentBalance
            );
            setSelectedTransaction(null);
            setSelectedChildForReceipt(child);
            setSelectedInvoiceDoc(doc);
            setIsReceiptModalOpen(true);
        } catch (err) {
            console.error("Failed to generate fee invoice:", err);
            addNotification("Could not load fee structure for invoice", "error");
        }
    };

    const handlePayFees = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedChildForPayment || paymentAmount <= 0) {
            addNotification("Please enter a valid amount.", 'error');
            return;
        }

        setIsPaying(true);
        addNotification("Sending STK push to your phone. Please enter your M-Pesa PIN when prompted.", 'info');

        try {
            const response = await initiateSTKPush(
                paymentAmount,
                selectedChildForPayment.guardianContact,
                selectedChildForPayment.admissionNumber
            );
            
            addNotification(response.CustomerMessage, 'success');
            setIsPaymentModalOpen(false);
            setSelectedChildForPayment(null);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during payment.";
            addNotification(errorMessage, 'error');
        } finally {
            setIsPaying(false);
        }
    };
    
    if (isLoading) {
        return (
            <div className="p-6 md:p-8 space-y-6">
                <h2 className="text-3xl font-bold text-slate-800 mb-6">Financial Overview</h2>
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        )
    }
    
    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Financial Overview</h2>
            {parentChildren.map(child => {
                 const financials = childData[child.id] || { balance: 0, recentTransactions: [] };
                 return (
                    <div key={child.id} className="bg-white p-6 rounded-xl shadow-lg mb-6">
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-2xl font-bold text-slate-800">{child.name}</h3>
                                <p className="text-slate-600">{child.class}</p>
                            </div>
                            <div className="text-right flex flex-col items-end">
                                <p className="text-sm text-slate-500">Outstanding Balance</p>
                                <p className={`text-3xl font-bold ${financials.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(financials.balance)}</p>
                                <div className="flex flex-wrap gap-2 mt-2 justify-end">
                                    <button 
                                        type="button"
                                        onClick={() => openInvoiceModal(child, financials.balance)}
                                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                                        title="Download printable A4 fee invoice with payment methods"
                                    >
                                        <FileText className="w-3.5 h-3.5 text-primary-600" />
                                        <span>Fee Invoice (A4)</span>
                                    </button>
                                    {financials.balance > 0 && (
                                        <button onClick={() => openPaymentModal(child)} className="px-5 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 text-xs">
                                            Pay Fees Now
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 border-t pt-4">
                            <h4 className="font-semibold text-slate-700 mb-2">Recent Payments</h4>
                            <table className="w-full text-left text-sm">
                                <thead>
                                    <tr className="bg-slate-50">
                                        <th className="p-2">Date</th>
                                        <th className="p-2">Receipt #</th>
                                        <th className="p-2">Method</th>
                                        <th className="p-2 text-right">Amount</th>
                                        <th className="p-2 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {financials.recentTransactions.map((p: Transaction) => (
                                        <tr key={p.id} className="border-b last:border-0">
                                            <td className="p-2">{new Date(p.date).toLocaleDateString()}</td>
                                            <td className="p-2 font-mono">{p.transactionCode}</td>
                                            <td className="p-2">{p.method}</td>
                                            <td className="p-2 text-right font-medium">{formatCurrency(p.amount)}</td>
                                            <td className="p-2 text-center">
                                                <button onClick={() => openReceiptModal(p, child)} className="text-primary-600 hover:underline font-bold text-xs inline-flex items-center gap-1">
                                                    <Receipt className="w-3 h-3" />
                                                    <span>VIEW RECEIPT</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                     {financials.recentTransactions.length === 0 && (
                                        <tr><td colSpan={5} className="text-center text-slate-500 py-4">No recent payments found.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            })}
             <Modal isOpen={isPaymentModalOpen} onClose={() => setIsPaymentModalOpen(false)} title={`Pay Fees for ${selectedChildForPayment?.name}`}>
                <form onSubmit={handlePayFees} className="space-y-4">
                     {isPaying ? (
                        <div className="text-center p-8">
                            <Spinner />
                            <p className="mt-4 text-slate-600">Processing payment...</p>
                            <p className="text-sm text-slate-500">Please check your phone to enter your M-Pesa PIN.</p>
                        </div>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Amount to Pay ({useData().schoolInfo?.currency || 'KES'})</label>
                                <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-md shadow-sm" required />
                            </div>
                            <p className="text-sm text-slate-600">Payment will be made via M-Pesa to phone number: <strong>{selectedChildForPayment?.guardianContact}</strong></p>
                            <div className="flex justify-end pt-2">
                                <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700" disabled={!darajaSettings?.consumerKey}>
                                    Confirm & Pay
                                </button>
                            </div>
                            {!darajaSettings?.consumerKey && <p className="text-xs text-red-600 text-center">Online payments are currently unavailable. Please contact the school.</p>}
                        </>
                    )}
                </form>
            </Modal>
            <ReceiptModal
                isOpen={isReceiptModalOpen}
                onClose={() => {
                    setIsReceiptModalOpen(false);
                    setSelectedTransaction(null);
                    setSelectedInvoiceDoc(null);
                    setSelectedChildForReceipt(null);
                }}
                transaction={selectedTransaction}
                document={selectedInvoiceDoc}
                student={selectedChildForReceipt}
            />
        </div>
    );
};

export default ParentFinances;
