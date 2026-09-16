import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { 
    CheckCircle2, 
    Clock, 
    Download, 
    CreditCard, 
    Building2, 
    ShieldCheck, 
    Sparkles, 
    ArrowRight,
    RefreshCw,
    AlertCircle
} from 'lucide-react';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';
import { SubscriptionPlan, PlatformPricing, SubscriptionStatus } from '../../types';
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
    const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'WIRE'>('WIRE');
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(SubscriptionPlan.PREMIUM);
    const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUALLY'>('ANNUALLY');
    const [orderSubmitted, setOrderSubmitted] = useState(false);
    const [lastOrderRef, setLastOrderRef] = useState<string>('');

    const upgradeRef = useMemo(() => {
        if (!schoolInfo) return '';
        const prefix = (schoolInfo.name || 'SCH').substring(0, 3).toUpperCase();
        const rand = Math.floor(1000 + Math.random() * 9000);
        return `UPG-${prefix}-${rand}`;
    }, [schoolInfo, isOpen]);

    useEffect(() => {
        if (isOpen) {
            api.getPlatformPricing().then(setPricing).catch(() => {});
            setOrderSubmitted(false);
        }
    }, [isOpen]);

    if (!schoolInfo) return null;

    const isPendingApproval = schoolInfo.subscriptionStatus === SubscriptionStatus.PENDING_APPROVAL || 
                              (schoolInfo as any).subscriptionStatus === 'PENDING-VERIFICATION';

    // Pricing calculation
    const isPremium = selectedPlan === SubscriptionPlan.PREMIUM;
    const monthlyRate = isPremium ? (pricing?.premiumMonthlyPrice || 6000) : (pricing?.basicMonthlyPrice || 3000);
    const annualRate = isPremium ? (pricing?.premiumAnnualPrice || 60000) : (pricing?.basicAnnualPrice || 30000);

    const baseAmount = billingCycle === 'ANNUALLY' ? annualRate : monthlyRate;
    const vatAmount = Math.round(baseAmount * 0.16);
    const totalWithVat = baseAmount + vatAmount;

    // Bank wire details
    const bankName = pricing?.wireBankName || 'NCBA Bank Kenya PLC';
    const accountName = pricing?.wireAccountName || 'SAASLINK TECHNOLOGIES LIMITED';
    const accountNumber = pricing?.wireAccountNumber || '8809220019';
    const branchName = pricing?.wireBankBranch || 'Nairobi - Upperhill Branch';
    const swiftCode = pricing?.wireSwiftCode || 'CBAFKENX';

    const activeRef = lastOrderRef || schoolInfo.invoiceNumber || upgradeRef;

    const downloadProforma = (refToUse = activeRef) => {
        const doc = new jsPDF();
        const primaryColor = [30, 41, 59]; // slate-800
        const accentColor = [16, 185, 129]; // emerald-500

        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 35, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(22);
        doc.setTextColor(255, 255, 255);
        doc.text('SAASLINK CLOUD PLATFORM', 20, 22);

        doc.setFontSize(10);
        doc.setTextColor(200, 200, 200);
        doc.text('OFFICIAL PROFORMA INVOICE & WIRE PAYMENT INSTRUCTIONS', 20, 29);

        // Header metadata
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(10);
        doc.text(`INVOICE REF: ${refToUse}`, 20, 48);
        doc.text(`DATE ISSUED: ${new Date().toLocaleDateString('en-GB')}`, 20, 54);
        doc.text(`STATUS: PENDING WIRE TRANSFER VERIFICATION`, 20, 60);

        // School Information
        doc.setFillColor(248, 250, 252);
        doc.rect(20, 68, 170, 28, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.rect(20, 68, 170, 28, 'S');

        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text('BILL TO SUBSCRIBER:', 25, 76);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(schoolInfo.name.toUpperCase(), 25, 84);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text(`Admin Contact: ${schoolInfo.email} | Phone: ${schoolInfo.phone || 'N/A'}`, 25, 91);

        // Subscription breakdown
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(20, 105, 170, 10, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('PACKAGE & SERVICE SPECIFICATION', 25, 111.5);
        doc.text(`AMOUNT (${schoolInfo.currency || 'KES'})`, 185, 111.5, { align: 'right' });

        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const planTitle = `${selectedPlan} Plan Subscription (${billingCycle === 'ANNUALLY' ? '12 Months Enterprise Access' : '1 Month Institutional Access'})`;
        doc.text(planTitle, 25, 125);
        doc.text(baseAmount.toLocaleString(), 185, 125, { align: 'right' });

        doc.text('Statutory Value Added Tax (VAT 16%)', 25, 134);
        doc.text(vatAmount.toLocaleString(), 185, 134, { align: 'right' });

        doc.setDrawColor(203, 213, 225);
        doc.line(20, 142, 190, 142);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('TOTAL PAYABLE:', 25, 152);
        doc.text(`${formatCurrency(totalWithVat)}`, 185, 152, { align: 'right' });

        // Settlement Instructions Box
        doc.setFillColor(241, 245, 249);
        doc.roundedRect(20, 165, 170, 75, 3, 3, 'F');
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(20, 165, 170, 75, 3, 3, 'S');

        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text('OFFICIAL BANK WIRE SETTLEMENT DETAILS', 25, 177);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(51, 65, 85);
        doc.text(`Bank Name:       ${bankName}`, 25, 188);
        doc.text(`Account Name:    ${accountName}`, 25, 196);
        doc.text(`Account Number:  ${accountNumber}`, 25, 204);
        doc.text(`Branch & Swift:  ${branchName} (Swift: ${swiftCode})`, 25, 212);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(180, 83, 9); // amber-700
        doc.text(`MANDATORY WIRE REFERENCE CODE: ${refToUse}`, 25, 225);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 116, 139);
        doc.text('* Once transfer is initiated, the platform Super Administrator will verify receipt and unlock full features.', 20, 255);
        doc.text('* Support: hi@saaslink.com | Nairobi, Kenya', 20, 262);

        doc.save(`${refToUse}_Proforma_Invoice.pdf`);
        addNotification("Proforma invoice downloaded successfully.", "success");
    };

    const handleUpgrade = async () => {
        setIsProcessing(true);
        try {
            if (paymentMethod === 'MPESA') {
                addNotification("Requesting STK Push...", "info");
                const ref = `UPG_${selectedPlan.substring(0, 3)}_${Date.now().toString().slice(-6)}`;
                await initiateSTKPush(totalWithVat, schoolInfo.phone || '', ref, 'SUBSCRIPTION');
                addNotification("M-Pesa payment request dispatched to your mobile phone.", "success");
                onClose();
            } else {
                await api.initiateSubscriptionPayment({
                    schoolId: schoolInfo.id,
                    amount: totalWithVat,
                    method: 'WIRE',
                    plan: selectedPlan,
                    billingCycle,
                    transactionCode: upgradeRef,
                    email: schoolInfo.email
                });
                setLastOrderRef(upgradeRef);
                setOrderSubmitted(true);
                downloadProforma(upgradeRef);
                addNotification("Wire transfer order submitted! Proforma invoice downloaded.", "success");
            }
            await refreshSchoolInfo();
        } catch (err: any) {
            addNotification(err.message || "Failed to process subscription order.", "error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={orderSubmitted || isPendingApproval ? "Wire Transfer Verification Status" : "Institutional Subscription Upgrade"} 
            size="xl"
        >
            <div className="space-y-6 p-1">
                {/* STATE 1: PENDING VERIFICATION NOTICE */}
                {(orderSubmitted || isPendingApproval) ? (
                    <div className="space-y-6">
                        <div className="bg-amber-500/10 border border-amber-500/30 dark:border-amber-500/20 rounded-2xl p-6 text-slate-800 dark:text-slate-100">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-sm">
                                    <Clock className="w-6 h-6 animate-pulse" />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="text-lg font-black text-slate-900 dark:text-white">
                                            Wire Transfer Order: Pending Super Admin Verification
                                        </h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200">
                                            PENDING-VERIFICATION
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                        Your subscription request for <strong>{schoolInfo.name}</strong> ({schoolInfo.email}) has been recorded. Bank wire transfers require manual financial reconciliation by the platform Super Administrator before your full license unlocks.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-6 pt-5 border-t border-amber-500/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                <div className="bg-white/70 dark:bg-slate-800/80 p-4 rounded-xl border border-amber-200/50 dark:border-slate-700">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        Order Reference & Invoice
                                    </span>
                                    <div className="font-mono text-sm font-black text-slate-900 dark:text-white">
                                        {activeRef}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1">
                                        Account: {schoolInfo.email}
                                    </div>
                                </div>

                                <div className="bg-white/70 dark:bg-slate-800/80 p-4 rounded-xl border border-amber-200/50 dark:border-slate-700">
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                        Subscription Target
                                    </span>
                                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                        {selectedPlan} Plan • {billingCycle}
                                    </div>
                                    <div className="text-[11px] text-slate-500 mt-1">
                                        Total: {formatCurrency(totalWithVat)} (VAT Included)
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Official Bank Settlement Info */}
                        <div className="bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Building2 className="w-5 h-5 text-primary-600" />
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                                    Bank Wire Settlement Instructions
                                </h4>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Bank Name</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{bankName}</span>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Name</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{accountName}</span>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Number</span>
                                    <span className="font-mono font-bold text-slate-900 dark:text-white">{accountNumber}</span>
                                </div>
                                <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Branch & Swift</span>
                                    <span className="font-bold text-slate-900 dark:text-white">{branchName} ({swiftCode})</span>
                                </div>
                            </div>

                            <div className="mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 text-xs">
                                <div>
                                    <span className="text-[10px] uppercase font-black text-amber-800 dark:text-amber-300 block">
                                        Required Wire Reference (Put on Payment Slip)
                                    </span>
                                    <span className="font-mono font-black text-amber-900 dark:text-amber-200 text-sm">
                                        {activeRef}
                                    </span>
                                </div>
                                <button
                                    onClick={() => downloadProforma(activeRef)}
                                    className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    Download PDF
                                </button>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                            <button
                                onClick={async () => {
                                    setIsProcessing(true);
                                    await refreshSchoolInfo();
                                    setIsProcessing(false);
                                    addNotification("Subscription status refreshed.", "info");
                                }}
                                disabled={isProcessing}
                                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                            >
                                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin' : ''}`} />
                                Check Activation Status
                            </button>

                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-sm transition-colors"
                            >
                                Understood, Close
                            </button>
                        </div>
                    </div>
                ) : (
                    /* STATE 2: SUBSCRIPTION SELECTION FORM */
                    <div className="space-y-6">
                        {/* Current Status Pill */}
                        <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                            <span className="text-slate-500">Current Institution Tier:</span>
                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 uppercase font-black">
                                    {schoolInfo.plan}
                                </span>
                                <span>•</span>
                                <span>{schoolInfo.subscriptionStatus}</span>
                            </div>
                        </div>

                        {/* Plan selection */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Basic Card */}
                            <div 
                                onClick={() => setSelectedPlan(SubscriptionPlan.BASIC)}
                                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                                    selectedPlan === SubscriptionPlan.BASIC 
                                        ? 'border-primary-600 bg-primary-50/20 dark:bg-primary-950/20 shadow-sm' 
                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                }`}
                            >
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm">
                                            Basic Standard
                                        </h4>
                                        {selectedPlan === SubscriptionPlan.BASIC && (
                                            <CheckCircle2 className="w-5 h-5 text-primary-600" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4">Essential student administration and academic reports.</p>
                                    <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                            <span>Full Student & Staff Management</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                            <span>CBC & 8-4-4 Assessment Reports</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-primary-600" />
                                            <span>Basic Tuition Fee Ledger</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-xl font-black text-slate-900 dark:text-white">
                                        {formatCurrency(billingCycle === 'ANNUALLY' ? (pricing?.basicAnnualPrice || 30000) : (pricing?.basicMonthlyPrice || 3000))}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-normal"> / {billingCycle === 'ANNUALLY' ? 'year' : 'month'}</span>
                                </div>
                            </div>

                            {/* Premium Card */}
                            <div 
                                onClick={() => setSelectedPlan(SubscriptionPlan.PREMIUM)}
                                className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                                    selectedPlan === SubscriptionPlan.PREMIUM 
                                        ? 'border-emerald-600 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm' 
                                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                                }`}
                            >
                                <div className="absolute -top-3 right-4 bg-emerald-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-xs">
                                    Recommended
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-sm flex items-center gap-1.5">
                                            <Sparkles className="w-4 h-4 text-emerald-600" />
                                            Enterprise Premium
                                        </h4>
                                        {selectedPlan === SubscriptionPlan.PREMIUM && (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mb-4">Complete institutional platform with AI and automation.</p>
                                    <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                            <span>All Basic Features Included</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                            <span>Integrated Library Management</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                            <span>M-Pesa Automated Daraja Reconciliation</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                                            <span>LMS, Assignments & Digital Library</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <span className="text-xl font-black text-slate-900 dark:text-white">
                                        {formatCurrency(billingCycle === 'ANNUALLY' ? (pricing?.premiumAnnualPrice || 60000) : (pricing?.premiumMonthlyPrice || 6000))}
                                    </span>
                                    <span className="text-[11px] text-slate-400 font-normal"> / {billingCycle === 'ANNUALLY' ? 'year' : 'month'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Billing Cycle Toggle */}
                        <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Billing Cadence:</span>
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('MONTHLY')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${
                                        billingCycle === 'MONTHLY' ? 'bg-slate-900 text-white dark:bg-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    Monthly
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setBillingCycle('ANNUALLY')}
                                    className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                                        billingCycle === 'ANNUALLY' ? 'bg-slate-900 text-white dark:bg-primary-600 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                                    }`}
                                >
                                    <span>Annually</span>
                                    <span className="text-[9px] bg-emerald-500 text-white px-1 rounded">2 Mo Free</span>
                                </button>
                            </div>
                        </div>

                        {/* Payment Method Selector */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                                Select Payment Method
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    type="button"
                                    onClick={() => setPaymentMethod('WIRE')}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                                        paymentMethod === 'WIRE' 
                                            ? 'border-slate-900 bg-slate-50 dark:border-primary-500 dark:bg-slate-800 shadow-sm' 
                                            : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <Building2 className="w-5 h-5 text-slate-900 dark:text-primary-400" />
                                    <span className="text-xs font-bold">Bank Wire Transfer</span>
                                    <span className="text-[10px] text-slate-400">Proforma & Manual Verify</span>
                                </button>

                                <button 
                                    type="button"
                                    onClick={() => setPaymentMethod('MPESA')}
                                    className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                                        paymentMethod === 'MPESA' 
                                            ? 'border-emerald-600 bg-emerald-50/40 dark:border-emerald-500 dark:bg-slate-800 shadow-sm' 
                                            : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    <CreditCard className="w-5 h-5 text-emerald-600" />
                                    <span className="text-xs font-bold">Lipa Na M-Pesa</span>
                                    <span className="text-[10px] text-slate-400">Instant STK Push</span>
                                </button>
                            </div>
                        </div>

                        {/* Summary & Submit */}
                        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Plan Rate:</span>
                                <span className="font-bold">{formatCurrency(baseAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500">Statutory VAT (16%):</span>
                                <span className="font-bold">{formatCurrency(vatAmount)}</span>
                            </div>
                            <div className="flex justify-between items-center text-base font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-800">
                                <span>Total Amount Payable:</span>
                                <span className="text-emerald-600 dark:text-emerald-400 text-lg">
                                    {formatCurrency(totalWithVat)}
                                </span>
                            </div>

                            <button 
                                onClick={handleUpgrade}
                                disabled={isProcessing}
                                className="w-full py-3.5 bg-slate-900 hover:bg-black dark:bg-primary-600 dark:hover:bg-primary-500 text-white rounded-xl font-bold text-sm tracking-wide shadow-md transition-all flex justify-center items-center gap-2 active:scale-95 disabled:bg-slate-400 mt-2"
                            >
                                {isProcessing ? (
                                    <Spinner />
                                ) : paymentMethod === 'MPESA' ? (
                                    <>
                                        <span>Pay via M-Pesa STK Push</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                ) : (
                                    <>
                                        <span>Generate Bank Wire Order & Proforma PDF</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                            <p className="text-center text-[10px] text-slate-400">
                                Wire orders receive a download proforma invoice and are activated upon financial verification.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default UpgradeModal;
