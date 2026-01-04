import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';
import { SubscriptionPlan, PlatformPricing } from '../../types';
import * as api from '../../services/api';
import { initiateSTKPush } from '../../services/darajaService';
import Spinner from './Spinner';

interface UpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose }) => {
    const { schoolInfo, formatCurrency, addNotification, refreshSchoolInfo } = useData();
    const [pricing, setPricing] = useState<PlatformPricing | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'WIRE'>('MPESA');

    useEffect(() => {
        if (isOpen) {
            api.getPlatformPricing().then(setPricing);
        }
    }, [isOpen]);

    if (!schoolInfo) return null;

    const premiumMonthly = pricing?.premiumMonthlyPrice || 5000;
    const totalWithVat = premiumMonthly * 1.16;

    const handleUpgrade = async () => {
        setIsProcessing(true);
        try {
            if (paymentMethod === 'MPESA') {
                addNotification("Initiating M-Pesa STK Push...", "info");
                // The reference tells the backend this is an upgrade to PREMIUM
                const ref = `UPG_PREM_${schoolInfo.id.substring(0, 8)}`;
                await initiateSTKPush(totalWithVat, schoolInfo.phone || '', ref);
                addNotification("Upgrade request sent. Enter PIN to complete.", "success");
                onClose();
            } else {
                // For wire, we just notify the system and show instructions
                // The SuperAdmin logic already handles recordManualPayment with plan updates
                addNotification("Upgrade request received. Please complete bank transfer.", "info");
                onClose();
            }
            await refreshSchoolInfo();
        } catch (err: any) {
            addNotification(err.message, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Institutional Tier Upgrade" size="lg">
            <div className="space-y-8">
                <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary-400 mb-2">Target Package</p>
                        <h3 className="text-3xl font-black uppercase">Premium Enterprise</h3>
                        <div className="mt-6 space-y-2">
                             <div className="flex items-center text-sm font-bold gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                                AI Financial Analyst & Audit Tool
                             </div>
                             <div className="flex items-center text-sm font-bold gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                                Advanced Library Management Suite
                             </div>
                             <div className="flex items-center text-sm font-bold gap-2">
                                <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                                Unlimited Scholars & Staff Capacity
                             </div>
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary-600/20 rounded-full blur-[80px]"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setPaymentMethod('MPESA')}
                        className={`p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'MPESA' ? 'border-primary-500 bg-primary-50' : 'border-slate-50'}`}
                    >
                        <img src="https://i.imgur.com/G5YvJ2F.png" className="h-6" alt="mpesa" />
                        <span className="text-[10px] font-black uppercase">Instant M-Pesa</span>
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('WIRE')}
                        className={`p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'WIRE' ? 'border-slate-800 bg-slate-50' : 'border-slate-50'}`}
                    >
                        <svg className="w-6 h-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                        <span className="text-[10px] font-black uppercase">Bank Wire</span>
                    </button>
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-400 font-bold uppercase text-xs">Settlement Amount:</span>
                        <span className="text-3xl font-black text-slate-900">{formatCurrency(totalWithVat)}</span>
                    </div>
                    <button 
                        onClick={handleUpgrade}
                        disabled={isProcessing}
                        className="w-full py-5 bg-primary-600 text-white rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex justify-center items-center"
                    >
                        {isProcessing ? <Spinner /> : 'Finalize Upgrade Order'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default UpgradeModal;