
import React, { useState, useEffect } from 'react';
import { initiateSTKPush } from '../../services/darajaService';
import type { Student, Transaction, NewTransaction } from '../../types';
import { PaymentMethod } from '../../types';
import Modal from '../common/Modal';
import Spinner from '../common/Spinner';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from '../common/Skeleton';

const ParentFinances: React.FC = () => {
    const { parentChildren, darajaSettings, addNotification } = useData();
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedChildForPayment, setSelectedChildForPayment] = useState<Student | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [isPaying, setIsPaying] = useState(false);
    
    // Local state for financials per child
    const [childData, setChildData] = useState<Record<string, { balance: number, recentTransactions: Transaction[] }>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFinancials = async () => {
            setLoading(true);
            const data: Record<string, { balance: number, recentTransactions: Transaction[] }> = {};
            
            try {
                for (const child of parentChildren) {
                    // Fetch student details to get the balance (calculated on backend)
                    const studentDetails = await api.getStudents({ search: child.admissionNumber, limit: 1 });
                    const updatedChild = studentDetails.data.find(s => s.id === child.id);
                    const balance = updatedChild?.balance || 0;

                    // Fetch recent transactions
                    const transactionsRes = await api.getTransactions({ studentId: child.id, type: 'Payment', limit: 3 });
                    
                    data[child.id] = {
                        balance,
                        recentTransactions: transactionsRes.data
                    };
                }
                setChildData(data);
            } catch (error) {
                console.error("Error fetching financial data for parent view", error);
            } finally {
                setLoading(false);
            }
        };

        if (parentChildren.length > 0) {
            fetchFinancials();
        } else {
            setLoading(false);
        }
    }, [parentChildren]);


    const openPaymentModal = (child: Student) => {
        setSelectedChildForPayment(child);
        const balance = childData[child.id]?.balance || 0;
        setPaymentAmount(balance > 0 ? balance : 0);
        setIsPaymentModalOpen(true);
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
    
    if (loading) {
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
                            <div className="text-right">
                                <p className="text-sm text-slate-500">Outstanding Balance</p>
                                <p className={`text-3xl font-bold ${financials.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>KES {financials.balance.toLocaleString()}</p>
                                {financials.balance > 0 && <button onClick={() => openPaymentModal(child)} className="mt-2 px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Pay Fees Now</button>}
                            </div>
                        </div>
                        <div className="mt-4 border-t pt-4">
                            <h4 className="font-semibold text-slate-700 mb-2">Recent Payments</h4>
                            <table className="w-full text-left text-sm">
                                <tbody>
                                    {financials.recentTransactions.map(p => (
                                        <tr key={p.id}><td>{new Date(p.date).toLocaleDateString()}</td><td>{p.method}</td><td>{p.transactionCode}</td><td className="text-right font-medium">KES {p.amount.toLocaleString()}</td></tr>
                                    ))}
                                     {financials.recentTransactions.length === 0 && (
                                        <tr><td colSpan={4} className="text-center text-slate-500 py-2">No recent payments found.</td></tr>
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
                                <label className="block text-sm font-medium text-slate-700">Amount to Pay (KES)</label>
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
        </div>
    );
};

export default ParentFinances;
