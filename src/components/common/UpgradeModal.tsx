
import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
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

    const upgradeRef = useMemo(() => {
        if (!schoolInfo) return '';
        const prefix = schoolInfo.name.substring(0, 3).toUpperCase();
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `UPG-${prefix}-${rand}`;
    }, [schoolInfo, isOpen]);

    useEffect(() => {
        if (isOpen) {
            api.getPlatformPricing().then(setPricing);
        }
    }, [isOpen]);

    if (!schoolInfo) return null;

    const premiumMonthly = pricing?.premiumMonthlyPrice || 5000;
    const totalWithVat = premiumMonthly * 1.16;

    const downloadProforma = () => {
        const doc = new jsPDF();
        const primaryColor = [52, 105, 85]; 
        
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 10, 297, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('SAASLINK CLOUD', 20, 25);
        
        doc.setFillColor(245, 245, 245);
        doc.rect(20, 45, 170, 15, 'F');
        doc.setFontSize(14);
        doc.setTextColor(50);
        doc.text('UPGRADE PROFORMA INVOICE', 25, 55);
        doc.setFontSize(10);
        doc.text(`REF: ${upgradeRef}`, 185, 55, { align: 'right' });

        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('PREPARED FOR:', 20, 75);
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(schoolInfo.name.toUpperCase(), 20, 82);

        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(20, 110, 170, 10, 'F');
        doc.setTextColor(255);
        doc.setFontSize(10);
        doc.text('LICENSE PLAN DESCRIPTION', 25, 116.5);
        doc.text('NET TOTAL (KES)', 185, 116.5, { align: 'right' });

        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');
        doc.text(`Institutional Migration: Enterprise Premium (Monthly)`, 25, 130);
        doc.text(premiumMonthly.toLocaleString(), 185, 130, { align: 'right' });
        doc.text(`Statutory VAT (16%)`, 25, 138);
        doc.text((premiumMonthly * 0.16).toLocaleString(), 185, 138, { align: 'right' });
        
        doc.setDrawColor(200);
        doc.line(130, 145, 190, 145);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`DUE: KES ${totalWithVat.toLocaleString()}`, 185, 155, { align: 'right' });

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(20, 175, 170, 70, 3, 3, 'D');
        doc.setFontSize(11);
        doc.text('BANK SETTLEMENT INSTRUCTIONS', 25, 188);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Bank: Standard Chartered Bank | Branch: Westlands', 25, 200);
        doc.text('Acc Name: SAASLINK TECHNOLOGIES LTD', 25, 208);
        doc.text('Acc Number: 0102044893300', 25, 216);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`MANDATORY REFERENCE CODE: ${upgradeRef}`, 25, 230);

        doc.setFontSize(7);
        doc.setTextColor(150);
        doc.text('* Activation occurs within 2 hours of payment verification. Access our 24/7 support at hi@saaslink.com', 20, 280);

        doc.save(`${upgradeRef}_Upgrade_Order.pdf`);
        addNotification("Proforma invoice generated successfully.", "success");
    };

    const handleUpgrade = async () => {
        setIsProcessing(true);
        try {
            if (paymentMethod === 'MPESA') {
                addNotification("Requesting STK Push...", "info");
                const ref = `UPG_PREM_${schoolInfo.id.substring(0, 8)}`;
                await initiateSTKPush(totalWithVat, schoolInfo.phone || '', ref, 'SUBSCRIPTION');
                addNotification("Payment request dispatched. Portal will unlock instantly.", "success");
                onClose();
            } else {
                await api.initiateSubscriptionPayment({
                    amount: totalWithVat,
                    method: 'WIRE',
                    plan: SubscriptionPlan.PREMIUM,
                    transactionCode: upgradeRef
                });
                downloadProforma();
                addNotification("Order recorded. Please complete the bank transfer.", "info");
                onClose();
            }
            // Auto-refresh context to show pending status if applicable
            await refreshSchoolInfo();
        } catch (err: any) {
            addNotification(err.message || "Failed to initiate upgrade.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Service Package Upgrade" size="lg">
            <div className="space-y-8 p-1">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl border-4 border-slate-800">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary-400 mb-3">Enterprise Migration</p>
                        <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">Institutional Premium</h3>
                        <div className="mt-8 grid grid-cols-1 gap-4">
                             {[
                                'AI-Powered Financial Intelligence',
                                'Full-Scale Library Management Suite',
                                'KNEC Compliant Academic Reporting',
                                'Unlimited Multi-Branch Support'
                             ].map(feat => (
                                <div key={feat} className="flex items-center text-xs font-black uppercase tracking-widest gap-3">
                                    <div className="bg-primary-600 rounded-full p-1"><svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg></div>
                                    {feat}
                                </div>
                             ))}
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setPaymentMethod('MPESA')}
                        className={`p-6 rounded-3xl border-4 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'MPESA' ? 'border-primary-500 bg-primary-50 shadow-lg' : 'border-slate-50 opacity-60 hover:opacity-100'}`}
                    >
                        <img src="https://i.imgur.com/G5YvJ2F.png" className="h-6" alt="mpesa" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Instant Activation</span>
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('WIRE')}
                        className={`p-6 rounded-3xl border-4 transition-all flex flex-col items-center gap-3 ${paymentMethod === 'WIRE' ? 'border-slate-800 bg-slate-50 shadow-lg' : 'border-slate-50 opacity-60 hover:opacity-100'}`}
                    >
                        <svg className="w-6 h-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                        <span className="text-[10px] font-black uppercase tracking-widest">Bank Transfer</span>
                    </button>
                </div>

                <div className="flex flex-col gap-4 pt-8 border-t border-slate-100">
                    <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border-2 border-white shadow-inner">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Licensing Fee</p>
                            <p className="text-3xl font-black text-slate-900 mt-1">{formatCurrency(totalWithVat)}</p>
                        </div>
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest vertical-text rotate-180">VAT Incl.</span>
                    </div>
                    <button 
                        onClick={handleUpgrade}
                        disabled={isProcessing}
                        className="w-full py-6 bg-primary-600 text-white rounded-[1.8rem] font-black uppercase text-sm tracking-[0.2em] shadow-2xl shadow-primary-600/40 hover:bg-primary-700 hover:-translate-y-1 transition-all flex justify-center items-center active:scale-95 disabled:bg-slate-400"
                    >
                        {isProcessing ? <Spinner /> : (paymentMethod === 'MPESA' ? 'Activate Premium License' : 'Generate Bank Order')}
                    </button>
                    <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-widest">A secure electronic activation record will be created</p>
                </div>
            </div>
        </Modal>
    );
};

export default UpgradeModal;
