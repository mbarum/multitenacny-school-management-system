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

    // Generate a unique reference for the upgrade
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
        doc.text('SAASLINK', 20, 25);
        
        doc.setFillColor(240, 240, 240);
        doc.rect(20, 45, 170, 15, 'F');
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text('UPGRADE PROFORMA', 25, 55);
        doc.setFontSize(10);
        doc.text(`REF: ${upgradeRef}`, 185, 55, { align: 'right' });

        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text('CLIENT:', 20, 75);
        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(schoolInfo.name.toUpperCase(), 20, 82);

        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(20, 110, 170, 10, 'F');
        doc.setTextColor(255);
        doc.text('PLAN DESCRIPTION', 25, 116.5);
        doc.text('TOTAL (KES)', 185, 116.5, { align: 'right' });

        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');
        doc.text(`Migration to Premium Enterprise (Monthly)`, 25, 130);
        doc.text(totalWithVat.toLocaleString(), 185, 130, { align: 'right' });
        
        doc.setFont('helvetica', 'bold');
        doc.text(`TOTAL DUE: KES ${totalWithVat.toLocaleString()}`, 185, 155, { align: 'right' });

        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(20, 170, 170, 60, 3, 3, 'D');
        doc.text('BANK SETTLEMENT DETAILS', 25, 180);
        doc.setFont('helvetica', 'normal');
        doc.text('Bank: I&M Bank Kenya | Branch: Nairobi', 25, 190);
        doc.text('Acc Name: SAASLINK TECHNOLOGIES LTD', 25, 198);
        doc.text('Acc Number: 05206707336350', 25, 206);
        doc.setFont('helvetica', 'bold');
        doc.text(`MANDATORY REFERENCE: ${upgradeRef}`, 25, 218);

        doc.save(`${upgradeRef}_Invoice.pdf`);
        addNotification("Proforma invoice downloaded.", "success");
    };

    const handleUpgrade = async () => {
        setIsProcessing(true);
        try {
            if (paymentMethod === 'MPESA') {
                addNotification("Initiating M-Pesa STK Push...", "info");
                const ref = `UPG_PREM_${schoolInfo.id.substring(0, 8)}`;
                await initiateSTKPush(totalWithVat, schoolInfo.phone || '', ref);
                addNotification("Upgrade request sent. Enter PIN to complete.", "success");
                onClose();
            } else {
                // Persistent Request for Super Admin
                await api.initiateSubscriptionPayment({
                    amount: totalWithVat,
                    method: 'WIRE',
                    plan: SubscriptionPlan.PREMIUM,
                    transactionCode: upgradeRef
                });
                
                downloadProforma();
                addNotification("Upgrade request recorded. Awaiting bank verification.", "info");
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
                <div className="bg-slate-900 p-8 rounded-3xl text-white relative overflow-hidden shadow-2xl">
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
                        </div>
                    </div>
                    <div className="absolute top-0 right-0 w-48 h-48 bg-primary-600/20 rounded-full blur-[80px]"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setPaymentMethod('MPESA')}
                        className={`p-6 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'MPESA' ? 'border-primary-500 bg-primary-50' : 'border-slate-50'}`}
                    >
                        <img src="https://i.imgur.com/G5YvJ2F.png" className="h-6" alt="mpesa" />
                        <span className="text-[10px] font-black uppercase">Instant M-Pesa</span>
                    </button>
                    <button 
                        onClick={() => setPaymentMethod('WIRE')}
                        className={`p-6 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'WIRE' ? 'border-slate-800 bg-slate-50' : 'border-slate-50'}`}
                    >
                        <svg className="w-6 h-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
                        <span className="text-[10px] font-black uppercase">Bank Wire</span>
                    </button>
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-slate-400 font-bold uppercase text-xs">Total Commitment:</span>
                        <span className="text-3xl font-black text-slate-900">{formatCurrency(totalWithVat)}</span>
                    </div>
                    <button 
                        onClick={handleUpgrade}
                        disabled={isProcessing}
                        className="w-full py-5 bg-primary-600 text-white rounded-3xl font-black uppercase text-sm tracking-widest shadow-2xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex justify-center items-center"
                    >
                        {isProcessing ? <Spinner /> : (paymentMethod === 'MPESA' ? 'Initiate Payment' : 'Generate Invoice & Order')}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default UpgradeModal;