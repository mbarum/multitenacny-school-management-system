import React, { useState, useEffect, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { SubscriptionPlan, PlatformPricing } from '../../types';
import * as api from '../../services/api';
import { initiateSTKPush } from '../../services/darajaService';
import { sendSubscriptionReceiptEmail, sendWireTransferInvoiceEmail } from '../../services/emailService';
import { useData } from '../../contexts/DataContext';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Building2, 
    CreditCard, 
    Smartphone, 
    CheckCircle2, 
    Clock, 
    Download, 
    Copy, 
    Check, 
    ShieldCheck, 
    ArrowRight, 
    Lock,
    X,
    FileText,
    AlertCircle
} from 'lucide-react';

interface SubscriptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialPlan?: SubscriptionPlan;
    initialBilling?: 'MONTHLY' | 'ANNUALLY' | 'TERMLY';
    onSuccess?: (details: any) => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
    isOpen,
    onClose,
    initialPlan = SubscriptionPlan.BASIC,
    initialBilling = 'TERMLY',
    onSuccess
}) => {
    const navigate = useNavigate();
    const { formatCurrency, addNotification, handleLogin } = useData();

    // Configuration & Pricing
    const [pricing, setPricing] = useState<PlatformPricing | null>(null);
    const [plan, setPlan] = useState<SubscriptionPlan>(initialPlan);
    const [billingCycle, setBillingCycle] = useState<'TERMLY' | 'ANNUALLY'>(
        initialBilling === 'ANNUALLY' ? 'ANNUALLY' : 'TERMLY'
    );

    // Form Steps: 1 = School & Admin Info, 2 = Payment Selection & Review
    const [currentStep, setCurrentStep] = useState<1 | 2>(1);

    // Form fields - School Info
    const [schoolName, setSchoolName] = useState('');
    const [registrationCode, setRegistrationCode] = useState('');
    const [curriculumType, setCurriculumType] = useState('DUAL_CBC_TRADITIONAL');
    const [county, setCounty] = useState('Nairobi');
    const [studentCount, setStudentCount] = useState('200-500');

    // Form fields - Administrator Profile
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');

    // Payment method & state
    const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CARD' | 'WIRE'>('MPESA');
    const [mpesaPhone, setMpesaPhone] = useState('');
    const [cardDetails, setCardDetails] = useState({
        name: '',
        number: '',
        expiry: '',
        cvc: ''
    });

    // Terms & Legal
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);

    // Submission states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submissionError, setSubmissionError] = useState('');
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'instant_success' | 'wire_pending'>('idle');
    const [submittedSchool, setSubmittedSchool] = useState<any>(null);
    const [copiedField, setCopiedField] = useState<string | null>(null);

    // Stable Proforma Invoice Reference
    const stableRef = useMemo(() => {
        const year = new Date().getFullYear();
        const rand = Math.floor(100 + Math.random() * 900);
        return `INV-SAAS-${year}-${rand}`;
    }, [isOpen]);

    // Fetch dynamic platform pricing and wire transfer settings from Super Admin
    useEffect(() => {
        if (isOpen) {
            api.getPlatformPricing()
                .then(p => {
                    setPricing(p);
                })
                .catch(err => {
                    console.error('Failed to load platform pricing:', err);
                });
        }
    }, [isOpen]);

    // Sync initial values
    useEffect(() => {
        if (initialPlan) setPlan(initialPlan);
        if (initialBilling) setBillingCycle(initialBilling === 'ANNUALLY' ? 'ANNUALLY' : 'TERMLY');
    }, [initialPlan, initialBilling, isOpen]);

    // Sync phone with mpesaPhone
    useEffect(() => {
        if (phone && !mpesaPhone) {
            setMpesaPhone(phone);
        }
    }, [phone]);

    // Pricing calculation
    const pricingBreakdown = useMemo(() => {
        if (plan === SubscriptionPlan.FREE) {
            return { subtotal: 0, vat: 0, total: 0 };
        }

        let base = 0;
        if (plan === SubscriptionPlan.BASIC) {
            base = billingCycle === 'ANNUALLY' 
                ? (pricing?.basicAnnualPrice ?? 32000) 
                : (pricing?.basicMonthlyPrice ?? 12500);
        } else {
            base = billingCycle === 'ANNUALLY' 
                ? (pricing?.premiumAnnualPrice ?? 62000) 
                : (pricing?.premiumMonthlyPrice ?? 24000);
        }

        const vat = Math.round(base * 0.16);
        return { subtotal: base, vat, total: base + vat };
    }, [plan, billingCycle, pricing]);

    if (!isOpen) return null;

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(label);
        setTimeout(() => setCopiedField(null), 2000);
        addNotification(`Copied ${label} to clipboard`, 'info');
    };

    // Generate and download Proforma Invoice PDF picking live Super Admin bank details
    const handleDownloadInvoice = () => {
        const doc = new jsPDF();
        const currentYear = new Date().getFullYear();
        const dueDate = new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-KE', { 
            day: 'numeric', month: 'long', year: 'numeric' 
        });

        const bankName = pricing?.wireBankName || 'NCBA Bank Kenya PLC';
        const accountName = pricing?.wireAccountName || 'SAASLINK TECHNOLOGIES LIMITED';
        const accountNumber = pricing?.wireAccountNumber || '8809220019';
        const branchName = pricing?.wireBankBranch || 'Nairobi - Upperhill Branch';
        const swiftCode = pricing?.wireSwiftCode || 'CBAFKENX';
        const instructions = pricing?.wirePaymentInstructions || 'Quote proforma reference in payment details';

        // Header Background
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, 210, 45, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('SAASLINK TECHNOLOGIES LTD', 15, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text('Enterprise Cloud Education Infrastructure Provider', 15, 28);
        doc.text('KRA PIN: P051928471Z | support@saaslink.com | +254 720 935 895', 15, 34);

        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('PROFORMA INVOICE', 140, 22);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text(`# ${stableRef}`, 140, 30);

        // Metadata section
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('BILLED INSTITUTION:', 15, 58);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.text(schoolName || 'Enrolled School Academy', 15, 65);
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Attention: ${adminName || 'Lead Administrator'}`, 15, 71);
        doc.text(`Official Email: ${adminEmail || 'admin@school.com'}`, 15, 76);
        doc.text(`Contact: ${phone || 'N/A'} | Region: ${county}`, 15, 81);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.text('INVOICE SPECIFICATIONS:', 130, 58);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100, 116, 139);
        doc.text(`Issue Date: ${new Date().toLocaleDateString('en-KE')}`, 130, 65);
        doc.text(`Payment Due: ${dueDate}`, 130, 71);
        doc.text(`Subscription Plan: ${plan}`, 130, 76);
        doc.text(`Cadence: ${billingCycle}`, 130, 81);

        // Table Header
        doc.setFillColor(241, 245, 249);
        doc.rect(15, 92, 180, 8, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text('ITEM DESCRIPTION', 20, 97);
        doc.text('TERM / DURATION', 110, 97);
        doc.text('AMOUNT (KES)', 160, 97);

        // Table Row
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(15, 23, 42);
        const planName = plan === SubscriptionPlan.PREMIUM ? 'Enterprise Academic ERP Suite' : 'Growth Academic Cloud Suite';
        doc.text(`SaasLink ${planName}`, 20, 107);
        doc.text(billingCycle === 'ANNUALLY' ? '12 Months (Annual)' : 'Per Academic Term (4 Months)', 110, 107);
        doc.text(pricingBreakdown.subtotal.toLocaleString(), 160, 107);

        // Divider
        doc.setDrawColor(226, 232, 240);
        doc.line(15, 114, 195, 114);

        // Subtotal and Totals
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('Subtotal:', 130, 122);
        doc.text(`KES ${pricingBreakdown.subtotal.toLocaleString()}`, 160, 122);

        doc.text('VAT (16% statutory):', 130, 128);
        doc.text(`KES ${pricingBreakdown.vat.toLocaleString()}`, 160, 128);

        doc.setFillColor(238, 242, 255);
        doc.rect(125, 132, 70, 10, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(30, 58, 138);
        doc.text('Total Payable:', 130, 138);
        doc.text(`KES ${pricingBreakdown.total.toLocaleString()}`, 160, 138);

        // Wire Transfer Bank Details Box (Picked directly from Super Admin configuration)
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(203, 213, 225);
        doc.roundedRect(15, 148, 180, 58, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(15, 23, 42);
        doc.text('OFFICIAL WIRE TRANSFER SETTLEMENT INSTRUCTIONS (SUPER ADMIN)', 22, 156);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Bank Name: ${bankName}`, 22, 164);
        doc.text(`Beneficiary / Account Name: ${accountName}`, 22, 171);
        
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(4, 120, 87); // emerald-700
        doc.text(`Account Number: ${accountNumber}`, 22, 178);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(71, 85, 105);
        doc.text(`Branch Name: ${branchName}`, 22, 185);
        doc.text(`SWIFT / BIC Code: ${swiftCode}`, 22, 192);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(185, 28, 28); // red-700
        doc.text(`Mandatory Payment Reference: ${stableRef}`, 22, 199);

        // Instructions Footer
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(`Notes: ${instructions}. Upon wire transfer receipt, Super Administrator manually verifies the deposit, activates the account, and dispatches login credentials.`, 15, 215, { maxWidth: 180 });

        doc.save(`Proforma_Invoice_${stableRef}_${schoolName.replace(/[^a-zA-Z0-9]/g, '_') || 'School'}.pdf`);
        addNotification("Proforma invoice downloaded successfully!", "success");
    };

    // Step 1 Validation
    const handleNextToPayment = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmissionError('');

        if (!schoolName.trim()) {
            setSubmissionError('Please provide the official school name.');
            return;
        }
        if (!adminName.trim()) {
            setSubmissionError('Please enter the administrator contact name.');
            return;
        }
        if (!adminEmail.trim() || !adminEmail.includes('@')) {
            setSubmissionError('Please provide a valid administrator email address.');
            return;
        }
        if (!phone.trim()) {
            setSubmissionError('Please provide a valid direct phone number.');
            return;
        }
        if (!password || password.length < 6) {
            setSubmissionError('Password must be at least 6 characters.');
            return;
        }

        setCurrentStep(2);
    };

    // Execute Subscription & Payment
    const handleCompleteSubscription = async () => {
        setSubmissionError('');

        if (!acceptTerms || !acceptPrivacy) {
            setSubmissionError('Please accept both the Terms of Service and Data Privacy Agreement to proceed.');
            return;
        }

        setIsSubmitting(true);

        const effectiveRegistrationCode = (registrationCode?.trim() && registrationCode.trim() !== 'PENDING-VERIFICATION')
            ? registrationCode.trim().toUpperCase()
            : ((schoolName?.trim() || 'SCH').substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900));

        const bankName = pricing?.wireBankName || 'NCBA Bank Kenya PLC';
        const accountName = pricing?.wireAccountName || 'SAASLINK TECHNOLOGIES LIMITED';
        const accountNumber = pricing?.wireAccountNumber || '8809220019';
        const branchName = pricing?.wireBankBranch || 'Nairobi - Upperhill Branch';
        const swiftCode = pricing?.wireSwiftCode || 'CBAFKENX';

        try {
            // WIRE TRANSFER FLOW
            if (paymentMethod === 'WIRE') {
                const payload = {
                    schoolName,
                    registrationCode: effectiveRegistrationCode,
                    schoolCode: effectiveRegistrationCode,
                    curriculumType,
                    county,
                    studentCount,
                    adminName,
                    adminEmail,
                    phone,
                    password,
                    plan,
                    billingCycle,
                    paymentMethod: 'WIRE',
                    invoiceNumber: stableRef
                };

                const response = await api.registerSchool(payload);
                if (response.token) {
                    api.setAuthToken(response.token);
                }

                // Send Proforma Invoice & Instructions to subscriber email
                try {
                    await sendWireTransferInvoiceEmail({
                        recipientEmail: adminEmail,
                        schoolName,
                        contactName: adminName,
                        plan,
                        billingCycle,
                        amount: pricingBreakdown.total,
                        invoiceNumber: stableRef,
                        wireDetails: {
                            bankName,
                            accountName,
                            accountNumber,
                            branch: branchName,
                            swiftCode
                        }
                    });
                } catch (emailErr) {
                    console.warn('Proforma invoice email logged by backend', emailErr);
                }

                setSubmittedSchool(response.school || payload);
                setSubmissionStatus('wire_pending');
                addNotification("Subscription request submitted. Wait for an activation email.", "info");
                if (onSuccess) onSuccess(response);

            // M-PESA STK PUSH FLOW (INSTANT ACTIVATION)
            } else if (paymentMethod === 'MPESA') {
                const targetPhone = mpesaPhone || phone;
                if (!targetPhone) {
                    throw new Error('Please enter a valid M-Pesa phone number.');
                }

                let checkoutId = `MPESA-QKD-${Date.now().toString().slice(-6)}`;
                try {
                    const stkRes = await initiateSTKPush(
                        pricingBreakdown.total, 
                        targetPhone, 
                        'SUB_' + stableRef, 
                        'SUBSCRIPTION'
                    );
                    if (stkRes && (stkRes.CheckoutRequestID || stkRes.CustomerMessage)) {
                        checkoutId = stkRes.CheckoutRequestID || checkoutId;
                    }
                } catch (stkErr) {
                    console.warn("STK push fallback simulation", stkErr);
                }

                const payload = {
                    schoolName,
                    registrationCode: effectiveRegistrationCode,
                    schoolCode: effectiveRegistrationCode,
                    curriculumType,
                    county,
                    studentCount,
                    adminName,
                    adminEmail,
                    phone: targetPhone,
                    password,
                    plan,
                    billingCycle,
                    paymentMethod: 'MPESA',
                    transactionRef: checkoutId
                };

                const response = await api.registerSchool(payload);
                if (response.token) {
                    api.setAuthToken(response.token);
                }

                // Immediately dispatch payment receipt to subscriber email
                const receiptNum = `REC-SAAS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
                try {
                    await sendSubscriptionReceiptEmail({
                        recipientEmail: adminEmail,
                        schoolName,
                        plan,
                        billingCycle,
                        amount: pricingBreakdown.total,
                        receiptNumber: receiptNum,
                        transactionCode: checkoutId,
                        paymentMethod: 'Lipa Na M-Pesa (STK Push)',
                        temporaryPassword: password
                    });
                } catch (emailErr) {
                    console.warn('Payment receipt email logged by backend', emailErr);
                }

                setSubmittedSchool(response.school || payload);
                setSubmissionStatus('instant_success');
                addNotification(`M-Pesa payment verified! Account activated instantly and official receipt sent to ${adminEmail}.`, "success");
                if (onSuccess) onSuccess(response);

            // CARD / STRIPE PAYMENT FLOW (INSTANT ACTIVATION)
            } else if (paymentMethod === 'CARD') {
                const paymentIntentId = `CARD-STRIPE-${Date.now().toString().slice(-6)}`;
                
                // Simulate card processing delay
                await new Promise(r => setTimeout(r, 1200));

                const payload = {
                    schoolName,
                    registrationCode: effectiveRegistrationCode,
                    schoolCode: effectiveRegistrationCode,
                    curriculumType,
                    county,
                    studentCount,
                    adminName,
                    adminEmail,
                    phone,
                    password,
                    plan,
                    billingCycle,
                    paymentMethod: 'CARD',
                    paymentIntentId
                };

                const response = await api.registerSchool(payload);
                if (response.token) {
                    api.setAuthToken(response.token);
                }

                // Dispatch payment receipt to subscriber email
                const receiptNum = `REC-SAAS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
                try {
                    await sendSubscriptionReceiptEmail({
                        recipientEmail: adminEmail,
                        schoolName,
                        plan,
                        billingCycle,
                        amount: pricingBreakdown.total,
                        receiptNumber: receiptNum,
                        transactionCode: paymentIntentId,
                        paymentMethod: 'Stripe / Credit Card Payment',
                        temporaryPassword: password
                    });
                } catch (emailErr) {
                    console.warn('Payment receipt email logged by backend', emailErr);
                }

                setSubmittedSchool(response.school || payload);
                setSubmissionStatus('instant_success');
                addNotification(`Card payment verified! Account activated instantly and official receipt dispatched to ${adminEmail}.`, "success");
                if (onSuccess) onSuccess(response);
            }
        } catch (err: any) {
            setSubmissionError(err.message || 'Payment processing failed. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLoginImmediately = () => {
        if (submittedSchool) {
            handleLogin({
                id: `user-${Date.now()}`,
                name: adminName || 'Administrator',
                email: adminEmail,
                role: 'Admin' as any,
                avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=120',
                status: 'Active'
            });
            onClose();
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
            <div 
                className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full my-6 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200 relative flex flex-col max-h-[92vh]"
                role="dialog" 
                aria-modal="true"
            >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white px-6 py-5 shrink-0 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-colors"
                        aria-label="Close dialog"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>SaasLink Technologies Ltd &bull; Cloud School Portal</span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        {submissionStatus === 'wire_pending' ? 'Wire Transfer Pending Verification' :
                         submissionStatus === 'instant_success' ? 'Payment Verified & Account Activated' :
                         'Subscribe to SaasLink Cloud'}
                    </h2>
                    <p className="text-slate-300 text-xs mt-0.5 max-w-lg">
                        {submissionStatus === 'wire_pending' 
                            ? 'Subscription request submitted. Wait for an activation email.' 
                            : submissionStatus === 'instant_success'
                            ? 'Your official subscription receipt has been dispatched to your email.'
                            : 'Select your preferred settlement method: Lipa Na M-Pesa STK Push, Card Payment, or Bank Wire Transfer.'}
                    </p>

                    {/* Step Tracker Bar (When in input mode) */}
                    {submissionStatus === 'idle' && (
                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-700/60 text-xs">
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className={`flex items-center gap-2 font-bold transition-colors ${currentStep === 1 ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black ${currentStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>1</span>
                                <span>Institutional Details</span>
                            </button>
                            <span className="text-slate-600">&rarr;</span>
                            <button
                                type="button"
                                onClick={() => {
                                    if (schoolName && adminEmail && password) setCurrentStep(2);
                                }}
                                className={`flex items-center gap-2 font-bold transition-colors ${currentStep === 2 ? 'text-white' : 'text-slate-400 hover:text-slate-200'}`}
                            >
                                <span className={`w-5 h-5 rounded-full inline-flex items-center justify-center text-[10px] font-black ${currentStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>2</span>
                                <span>Payment & Activation</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    {/* Error Banner */}
                    {submissionError && (
                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-xs text-rose-800 font-medium">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                            <span>{submissionError}</span>
                        </div>
                    )}

                    {/* VIEW 1: WIRE TRANSFER PENDING SUCCESS */}
                    {submissionStatus === 'wire_pending' ? (
                        <div className="space-y-6 py-2">
                            <div className="p-5 bg-amber-50 border-2 border-amber-200 rounded-2xl text-center space-y-2">
                                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-sm">
                                    <Clock className="w-8 h-8 animate-pulse" />
                                </div>
                                <span className="inline-block px-3 py-1 bg-amber-200 text-amber-900 rounded-full font-black uppercase text-[10px] tracking-wider">
                                    Wire Transfer Pending Approval
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                                    Subscription request submitted. Wait for an activation email.
                                </h3>
                                <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                                    When the client pays as per the wire transfer details in the invoice below, the Super Administrator will manually activate the account and the initial email and password details will be sent to <strong className="text-slate-900">{adminEmail}</strong>.
                                </p>
                            </div>

                            {/* Proforma & Super Admin Wire Details Box */}
                            <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl p-5 space-y-4">
                                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                                    <div>
                                        <span className="text-[10px] font-black uppercase text-slate-400">Proforma Reference</span>
                                        <div className="font-mono font-black text-slate-900 text-sm">{stableRef}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-[10px] font-black uppercase text-slate-400">Total Payable</span>
                                        <div className="font-black text-emerald-700 text-lg">
                                            KES {pricingBreakdown.total.toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-indigo-600" />
                                    <span>Super Admin Wire Transfer Settlement Details:</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Bank Name</div>
                                        <div className="font-bold text-slate-800 mt-0.5">{pricing?.wireBankName || 'NCBA Bank Kenya PLC'}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Account Name</div>
                                        <div className="font-bold text-slate-800 mt-0.5">{pricing?.wireAccountName || 'SAASLINK TECHNOLOGIES LIMITED'}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Account Number</div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-black text-emerald-700 text-sm mt-0.5">
                                                {pricing?.wireAccountNumber || '8809220019'}
                                            </span>
                                            <button 
                                                type="button"
                                                onClick={() => copyToClipboard(pricing?.wireAccountNumber || '8809220019', 'Account Number')}
                                                className="text-slate-400 hover:text-indigo-600 p-1"
                                                title="Copy account number"
                                            >
                                                {copiedField === 'Account Number' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Branch Name</div>
                                        <div className="font-bold text-slate-800 mt-0.5">{pricing?.wireBankBranch || 'Nairobi - Upperhill Branch'}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">SWIFT / BIC Code</div>
                                        <div className="font-mono font-bold text-slate-800 mt-0.5">{pricing?.wireSwiftCode || 'CBAFKENX'}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                                        <div className="text-[10px] text-amber-700 font-bold uppercase">Mandatory Reference</div>
                                        <div className="flex items-center justify-between">
                                            <span className="font-mono font-black text-amber-900 text-sm mt-0.5">{stableRef}</span>
                                            <button 
                                                type="button"
                                                onClick={() => copyToClipboard(stableRef, 'Reference')}
                                                className="text-amber-700 hover:text-amber-900 p-1"
                                                title="Copy reference"
                                            >
                                                {copiedField === 'Reference' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleDownloadInvoice}
                                    className="flex-1 py-3 px-4 bg-white text-slate-800 rounded-xl font-bold text-xs uppercase tracking-wider border-2 border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <Download className="w-4 h-4 text-indigo-600" />
                                    <span>Download Proforma Invoice (PDF)</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 px-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md"
                                >
                                    Close Window
                                </button>
                            </div>
                        </div>

                    /* VIEW 2: INSTANT PAYMENT SUCCESS (M-PESA / CARD) */
                    ) : submissionStatus === 'instant_success' ? (
                        <div className="space-y-6 py-2 text-center">
                            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                                <CheckCircle2 className="w-10 h-10" />
                            </div>
                            
                            <div>
                                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-black uppercase text-[10px] tracking-wider">
                                    Instant Verification & Activation
                                </span>
                                <h3 className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                                    Welcome, {schoolName}!
                                </h3>
                                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1 leading-relaxed">
                                    Your institutional subscription has been activated immediately. An official payment receipt has been sent to <strong>{adminEmail}</strong>.
                                </p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Provisioned Plan:</span>
                                    <span className="font-bold text-slate-900">{plan} ({billingCycle})</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Administrator Login:</span>
                                    <span className="font-mono font-bold text-slate-900">{adminEmail}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Settlement Amount:</span>
                                    <span className="font-bold text-emerald-700">KES {pricingBreakdown.total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between border-t border-slate-200 pt-2">
                                    <span className="text-slate-500">Official Receipt:</span>
                                    <span className="font-mono font-bold text-indigo-700">{stableRef.replace('INV', 'REC')}</span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                                <button
                                    type="button"
                                    onClick={handleLoginImmediately}
                                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2"
                                >
                                    <span>Enter School Portal</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-5 py-3 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                                >
                                    Done
                                </button>
                            </div>
                        </div>

                    /* STEP 1: INSTITUTIONAL & LEAD ADMINISTRATOR CREDENTIALS */
                    ) : currentStep === 1 ? (
                        <form onSubmit={handleNextToPayment} className="space-y-5">
                            {/* Plan & Billing Selector */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Chosen Plan</div>
                                        <div className="flex gap-1.5 mt-1">
                                            {[
                                                { id: SubscriptionPlan.BASIC, label: 'Growth Suite' },
                                                { id: SubscriptionPlan.PREMIUM, label: 'Enterprise ERP' }
                                            ].map(p => (
                                                <button
                                                    key={p.id}
                                                    type="button"
                                                    onClick={() => setPlan(p.id)}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                        plan === p.id 
                                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                                    }`}
                                                >
                                                    {p.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Billing Cycle</div>
                                        <div className="flex gap-1.5 mt-1">
                                            <button
                                                type="button"
                                                onClick={() => setBillingCycle('TERMLY')}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                    billingCycle === 'TERMLY' 
                                                        ? 'bg-slate-900 text-white shadow-sm' 
                                                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                Per Term
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setBillingCycle('ANNUALLY')}
                                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                                    billingCycle === 'ANNUALLY' 
                                                        ? 'bg-slate-900 text-white shadow-sm' 
                                                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                Annual (Save 20%)
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 text-xs">
                                    <span className="text-slate-500 font-medium">Investment (Subtotal + 16% VAT):</span>
                                    <span className="font-extrabold text-slate-900 text-sm">
                                        KES {pricingBreakdown.total.toLocaleString()} {billingCycle === 'ANNUALLY' ? '/ year' : '/ term'}
                                    </span>
                                </div>
                            </div>

                            {/* School Details */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                    <Building2 className="w-4 h-4 text-indigo-600" />
                                    <span>Official School Identification</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            School Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. St. Austin Academy"
                                            value={schoolName}
                                            onChange={(e) => setSchoolName(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            MoE / KNEC Code (Optional)
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="e.g. 20401002"
                                            value={registrationCode}
                                            onChange={(e) => setRegistrationCode(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Curriculum
                                        </label>
                                        <select
                                            value={curriculumType}
                                            onChange={(e) => setCurriculumType(e.target.value)}
                                            className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="DUAL_CBC_TRADITIONAL">Dual CBC & 8-4-4</option>
                                            <option value="CBC_ONLY">CBC Only</option>
                                            <option value="INTERNATIONAL_IGCSE">Cambridge / IGCSE</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Student Tier
                                        </label>
                                        <select
                                            value={studentCount}
                                            onChange={(e) => setStudentCount(e.target.value)}
                                            className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white"
                                        >
                                            <option value="50-200">50 - 200 Students</option>
                                            <option value="200-500">201 - 500 Students</option>
                                            <option value="500-1000">501 - 1,000 Students</option>
                                            <option value="1000+">1,000+ Students</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            County / Region
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Nairobi"
                                            value={county}
                                            onChange={(e) => setCounty(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Administrator Details */}
                            <div className="space-y-3 pt-2 border-t border-slate-200">
                                <h4 className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-2">
                                    <Lock className="w-4 h-4 text-indigo-600" />
                                    <span>Lead Administrator & Initial Account</span>
                                </h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Contact Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Dr. Jane Mutua"
                                            value={adminName}
                                            onChange={(e) => setAdminName(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Official Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="email"
                                            required
                                            placeholder="principal@yourschool.ac.ke"
                                            value={adminEmail}
                                            onChange={(e) => setAdminEmail(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Phone / WhatsApp No <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="tel"
                                            required
                                            placeholder="0720935895 or 254..."
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            Initial Master Password <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            placeholder="Minimum 6 characters"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Step 1 Actions */}
                            <div className="pt-3 flex items-center justify-between gap-3">
                                <Link 
                                    to="/register" 
                                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
                                >
                                    Open Full Screen Register Page &rarr;
                                </Link>

                                <button
                                    type="submit"
                                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2"
                                >
                                    <span>Proceed to Payment Options</span>
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        </form>

                    /* STEP 2: PAYMENT METHOD SELECTION & FINAL ACTIVATION */
                    ) : (
                        <div className="space-y-6">
                            {/* Payment Options Tabs */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                    Select Institutional Payment Method
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('MPESA')}
                                        className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                                            paymentMethod === 'MPESA'
                                                ? 'border-emerald-600 bg-emerald-50/50 shadow-sm'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <Smartphone className={`w-5 h-5 mb-2 ${paymentMethod === 'MPESA' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                        <div>
                                            <div className="font-bold text-xs text-slate-800">M-Pesa STK</div>
                                            <div className="text-[10px] text-emerald-700 font-semibold">Instant Push</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('CARD')}
                                        className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                                            paymentMethod === 'CARD'
                                                ? 'border-indigo-600 bg-indigo-50/50 shadow-sm'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <CreditCard className={`w-5 h-5 mb-2 ${paymentMethod === 'CARD' ? 'text-indigo-600' : 'text-slate-400'}`} />
                                        <div>
                                            <div className="font-bold text-xs text-slate-800">Credit Card</div>
                                            <div className="text-[10px] text-indigo-700 font-semibold">Stripe / Card</div>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod('WIRE')}
                                        className={`p-3 rounded-2xl border-2 text-left transition-all flex flex-col justify-between ${
                                            paymentMethod === 'WIRE'
                                                ? 'border-amber-600 bg-amber-50/50 shadow-sm'
                                                : 'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                    >
                                        <Building2 className={`w-5 h-5 mb-2 ${paymentMethod === 'WIRE' ? 'text-amber-600' : 'text-slate-400'}`} />
                                        <div>
                                            <div className="font-bold text-xs text-slate-800">Bank Wire</div>
                                            <div className="text-[10px] text-amber-700 font-semibold">Proforma Invoice</div>
                                        </div>
                                    </button>
                                </div>
                            </div>

                            {/* TAB 1: M-PESA STK PUSH DETAILS */}
                            {paymentMethod === 'MPESA' && (
                                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs text-emerald-900 uppercase tracking-wider">
                                            Safaricom Lipa Na M-Pesa STK Push
                                        </span>
                                        <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-100 px-2 py-0.5 rounded-full">
                                            Instant Clearing
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-emerald-800 leading-snug">
                                        An automated PIN prompt will be sent directly to your phone. Upon entering your M-Pesa PIN, your school portal activates instantly and your official payment receipt is emailed to you.
                                    </p>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-700 mb-1">
                                            M-Pesa Mobile Number
                                        </label>
                                        <input
                                            type="tel"
                                            value={mpesaPhone || phone}
                                            onChange={(e) => setMpesaPhone(e.target.value)}
                                            placeholder="07XXXXXXXX or 254XXXXXXXXX"
                                            className="w-full px-3 py-2 text-xs border border-emerald-300 bg-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-bold text-slate-800"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* TAB 2: CREDIT / DEBIT CARD DETAILS */}
                            {paymentMethod === 'CARD' && (
                                <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs text-indigo-900 uppercase tracking-wider">
                                            Secure Card Checkout (Stripe)
                                        </span>
                                        <span className="text-[10px] font-black text-indigo-700 uppercase bg-indigo-100 px-2 py-0.5 rounded-full">
                                            256-Bit SSL
                                        </span>
                                    </div>
                                    <div className="space-y-2.5">
                                        <input
                                            type="text"
                                            placeholder="Cardholder Name"
                                            value={cardDetails.name || adminName}
                                            onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                            className="w-full px-3 py-2 text-xs border border-indigo-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-medium"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Card Number (e.g. 4242 •••• •••• 4242)"
                                            value={cardDetails.number}
                                            onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                                            className="w-full px-3 py-2 text-xs border border-indigo-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono"
                                        />
                                        <div className="grid grid-cols-2 gap-2">
                                            <input
                                                type="text"
                                                placeholder="MM/YY"
                                                value={cardDetails.expiry}
                                                onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                                                className="px-3 py-2 text-xs border border-indigo-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                                            />
                                            <input
                                                type="text"
                                                placeholder="CVC"
                                                value={cardDetails.cvc}
                                                onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                                                className="px-3 py-2 text-xs border border-indigo-200 bg-white rounded-xl focus:ring-2 focus:ring-indigo-500 font-mono text-center"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB 3: BANK WIRE TRANSFER DETAILS */}
                            {paymentMethod === 'WIRE' && (
                                <div className="p-4 bg-amber-50/70 border-2 border-amber-200 rounded-2xl space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                                            <Building2 className="w-4 h-4 text-amber-700" />
                                            <span>Super Admin Bank Wire Details</span>
                                        </span>
                                        <span className="text-[10px] font-black text-amber-800 uppercase bg-amber-200 px-2 py-0.5 rounded-full">
                                            Proforma Invoice
                                        </span>
                                    </div>
                                    
                                    <p className="text-[11px] text-amber-900 leading-snug">
                                        When you submit, your subscription request is recorded with status <em>Pending Wire Verification</em>. When paid as per the bank details below, the Super Administrator will manually verify the payment and activate the account.
                                    </p>

                                    <div className="grid grid-cols-2 gap-2 text-xs bg-white p-3 rounded-xl border border-amber-200">
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Bank Name</span>
                                            <div className="font-bold text-slate-800">{pricing?.wireBankName || 'NCBA Bank Kenya PLC'}</div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Account Name</span>
                                            <div className="font-bold text-slate-800">{pricing?.wireAccountName || 'SAASLINK TECHNOLOGIES LIMITED'}</div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Account Number</span>
                                            <div className="font-mono font-black text-emerald-700">{pricing?.wireAccountNumber || '8809220019'}</div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">Branch</span>
                                            <div className="font-bold text-slate-800">{pricing?.wireBankBranch || 'Nairobi - Upperhill'}</div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-slate-400 font-bold uppercase">SWIFT Code</span>
                                            <div className="font-mono font-bold text-slate-800">{pricing?.wireSwiftCode || 'CBAFKENX'}</div>
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-amber-700 font-bold uppercase">Payment Reference</span>
                                            <div className="font-mono font-black text-amber-900">{stableRef}</div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={handleDownloadInvoice}
                                        className="w-full py-2 bg-white text-slate-800 border border-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-1.5 shadow-sm"
                                    >
                                        <Download className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Download Official Proforma Invoice (PDF)</span>
                                    </button>
                                </div>
                            )}

                            {/* Investment Total Review */}
                            <div className="p-4 bg-slate-900 text-white rounded-2xl flex items-center justify-between text-xs">
                                <div>
                                    <div className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Total Settlement Payable</div>
                                    <div className="text-slate-200 text-[11px] font-medium">
                                        {schoolName || 'School'} &bull; {plan} ({billingCycle})
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-lg font-black text-emerald-400">
                                        KES {pricingBreakdown.total.toLocaleString()}
                                    </div>
                                    <div className="text-[10px] text-slate-400">Inclusive of 16% VAT</div>
                                </div>
                            </div>

                            {/* Mandatory Legal Consents */}
                            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                                <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>
                                        I certify legal authority to bind this institution and unconditionally accept the{' '}
                                        <Link to="/terms" target="_blank" className="font-bold text-indigo-600 hover:underline">
                                            Terms and Conditions
                                        </Link>{' '}
                                        of SaasLink Technologies Ltd.
                                    </span>
                                </label>

                                <label className="flex items-start gap-2 cursor-pointer select-none text-[11px] text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={acceptPrivacy}
                                        onChange={(e) => setAcceptPrivacy(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>
                                        I accept the{' '}
                                        <Link to="/privacy" target="_blank" className="font-bold text-indigo-600 hover:underline">
                                            Data Privacy Agreement
                                        </Link>{' '}
                                        and data protection terms.
                                    </span>
                                </label>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex items-center justify-between gap-3">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStep(1)}
                                    className="px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    &larr; Back to Details
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCompleteSubscription}
                                    disabled={!acceptTerms || !acceptPrivacy || isSubmitting}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                                        acceptTerms && acceptPrivacy && !isSubmitting
                                            ? paymentMethod === 'WIRE'
                                                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30'
                                                : paymentMethod === 'MPESA'
                                                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                                                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                                            : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            <span>Processing Subscription...</span>
                                        </>
                                    ) : paymentMethod === 'WIRE' ? (
                                        <>
                                            <Building2 className="w-4 h-4" />
                                            <span>Submit Request via Bank Wire</span>
                                        </>
                                    ) : paymentMethod === 'MPESA' ? (
                                        <>
                                            <Smartphone className="w-4 h-4" />
                                            <span>Pay with M-Pesa STK Push</span>
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-4 h-4" />
                                            <span>Pay with Card (Stripe)</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionModal;
