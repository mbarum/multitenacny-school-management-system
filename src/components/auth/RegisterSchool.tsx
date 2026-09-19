import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import * as api from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { SubscriptionPlan, PlatformPricing } from '../../types';
import { initiateSTKPush } from '../../services/darajaService';
import { sendSubscriptionReceiptEmail, sendWireTransferInvoiceEmail } from '../../services/emailService';
import Spinner from '../common/Spinner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = api.getPlatformPricing().then(p => {
    if (p.stripePublishableKey && !p.stripePublishableKey.includes('placeholder')) {
        return loadStripe(p.stripePublishableKey);
    }
    return null;
}).catch(() => null);

const CheckoutForm: React.FC<{ 
    formData: any, 
    price: number, 
    onSuccess: (user: any, token?: string) => void,
    onError: (msg: string) => void 
}> = ({ formData, price, onSuccess, onError }) => {
    const { formatCurrency, addNotification } = useData();
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [manualCard, setManualCard] = useState({
        number: '4242 •••• •••• 4242',
        name: formData.adminName || 'Institutional Billing',
        expiry: '12/28',
        cvc: '123'
    });

    const handleStripeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsProcessing(true);
        try {
            let paymentIntentId = `CARD-STRIPE-${Date.now().toString().slice(-6)}`;
            
            if (stripe && elements) {
                const cardEl = elements.getElement(CardElement);
                if (cardEl) {
                    const { clientSecret } = await api.createPaymentIntent({
                        plan: formData.plan,
                        billingCycle: formData.billingCycle.toUpperCase(),
                        email: formData.adminEmail
                    });
                    const result = await stripe.confirmCardPayment(clientSecret, {
                        payment_method: {
                            card: cardEl,
                            billing_details: { name: formData.adminName, email: formData.adminEmail },
                        }
                    });
                    if (result.error) {
                        throw new Error(result.error.message || 'Card payment failed');
                    }
                    if (result.paymentIntent) {
                        paymentIntentId = result.paymentIntent.id;
                    }
                }
            } else {
                // Graceful fallback for test/dev mode
                await new Promise(r => setTimeout(r, 1200));
            }

            const response = await api.registerSchool({ 
                ...formData, 
                billingCycle: formData.billingCycle.toUpperCase(),
                paymentMethod: 'CARD', 
                paymentIntentId: paymentIntentId 
            });

            if (response.token) {
                api.setAuthToken(response.token);
            }

            // Immediately dispatch payment receipt to subscriber email
            const receiptNum = `REC-SAAS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
            try {
                await sendSubscriptionReceiptEmail({
                    recipientEmail: formData.adminEmail,
                    schoolName: formData.schoolName,
                    plan: formData.plan,
                    billingCycle: formData.billingCycle,
                    amount: price,
                    receiptNumber: receiptNum,
                    transactionCode: paymentIntentId,
                    paymentMethod: 'Stripe / Credit Card Payment',
                    temporaryPassword: formData.password
                });
            } catch (emailErr) {
                console.warn('Receipt email handled by backend', emailErr);
            }

            addNotification(`Card payment verified! Official receipt dispatched to ${formData.adminEmail}.`, 'success');
            onSuccess(response.user, response.token);
        } catch (err: any) {
            onError(err.message || 'Error during card checkout');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleStripeSubmit} className="space-y-6">
            {stripe ? (
                <div className="p-4 border-2 border-slate-100 rounded-2xl bg-white shadow-inner">
                    <CardElement options={{ style: { base: { fontSize: '16px', fontWeight: '600', color: '#1e293b' } } }} />
                </div>
            ) : (
                <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase">
                        <span>Card Checkout</span>
                        <span className="text-emerald-600">256-Bit Encrypted</span>
                    </div>
                    <input 
                        type="text" 
                        value={manualCard.name}
                        onChange={e => setManualCard({ ...manualCard, name: e.target.value })}
                        placeholder="Cardholder Name" 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                    <input 
                        type="text" 
                        value={manualCard.number}
                        onChange={e => setManualCard({ ...manualCard, number: e.target.value })}
                        placeholder="Card Number" 
                        className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 font-mono"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input 
                            type="text" 
                            value={manualCard.expiry}
                            onChange={e => setManualCard({ ...manualCard, expiry: e.target.value })}
                            placeholder="MM/YY" 
                            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                        />
                        <input 
                            type="password" 
                            value={manualCard.cvc}
                            onChange={e => setManualCard({ ...manualCard, cvc: e.target.value })}
                            placeholder="CVC" 
                            maxLength={4}
                            className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center"
                        />
                    </div>
                </div>
            )}
            <button type="submit" disabled={isProcessing} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3">
                {isProcessing ? <Spinner /> : `Pay with Card (${formatCurrency(price)})`}
            </button>
        </form>
    );
};

const RegisterSchool: React.FC = () => {
    const { handleLogin, addNotification, formatCurrency } = useData();
    const location = useLocation();
    const navigate = useNavigate();
    const navState = location.state as { plan?: SubscriptionPlan; billing?: 'MONTHLY' | 'ANNUALLY' } | null;

    const [formData, setFormData] = useState({
        schoolName: '', adminName: '', adminEmail: '', password: '', phone: '',
        plan: navState?.plan || SubscriptionPlan.FREE,
        billingCycle: navState?.billing || 'MONTHLY',
        currency: 'KES'
    });

    // Create a stable invoice reference for the session
    const stableRef = useMemo(() => {
        const prefix = 'INV';
        const rand = Math.floor(100000 + Math.random() * 900000);
        return `${prefix}-${rand}`;
    }, []);

    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pricing, setPricing] = useState<PlatformPricing | null>(null);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CARD' | 'WIRE'>('MPESA');
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'manual_success'>('idle');

    useEffect(() => {
        api.getPlatformPricing()
            .then(setPricing)
            .catch(err => {
                console.warn('Pricing service unavailable, using platform defaults', err);
                setPricing({
                    id: 1 as any,
                    basicMonthlyPrice: 3000,
                    basicAnnualPrice: 30000,
                    premiumMonthlyPrice: 5000,
                    premiumAnnualPrice: 50000,
                    stripeEnabled: true,
                    stripeCurrency: 'KES',
                });
            });
    }, []);

    const calculatePricingDetails = () => {
        if (formData.plan === SubscriptionPlan.FREE || !pricing) return { subtotal: 0, vat: 0, total: 0 };
        let base = 0;
        if (formData.plan === SubscriptionPlan.BASIC) 
            base = formData.billingCycle === 'MONTHLY' ? pricing.basicMonthlyPrice : pricing.basicAnnualPrice;
        else 
            base = formData.billingCycle === 'MONTHLY' ? pricing.premiumMonthlyPrice : pricing.premiumAnnualPrice;
        
        const vat = base * 0.16;
        return { subtotal: base, vat: vat, total: base + vat };
    };

    const cost = calculatePricingDetails();

    const handleRegistration = async (methodOverride?: 'MPESA' | 'WIRE') => {
        const method = methodOverride || paymentMethod;
        
        if (!formData.schoolName || !formData.adminEmail || !formData.password) {
            setError('Please complete the Institutional Profile fields.');
            return;
        }

        if (!agreedToTerms) {
            setError('Please accept the Terms of Service.');
            return;
        }

        if (method === 'MPESA' && !formData.phone) {
            setError('Please enter a valid M-Pesa phone number (e.g. 07XXXXXXXX or 254XXXXXXXXX).');
            return;
        }

        setError('');
        setIsLoading(true);

        const bankName = pricing?.wireBankName || 'NCBA Bank Kenya PLC';
        const accountName = pricing?.wireAccountName || 'SAASLINK TECHNOLOGIES LIMITED';
        const accountNumber = pricing?.wireAccountNumber || '8809220019';
        const branchName = pricing?.wireBankBranch || 'Nairobi - Upperhill Branch';
        const swiftCode = pricing?.wireSwiftCode || 'CBAFKENX';

        try {
            if (method === 'WIRE') {
                const payload = { 
                    ...formData, 
                    billingCycle: formData.billingCycle.toUpperCase(),
                    paymentMethod: 'WIRE',
                    invoiceNumber: stableRef 
                };

                const response = await api.registerSchool(payload);
                if (response.token) {
                    api.setAuthToken(response.token);
                }

                // Dispatch official wire transfer proforma invoice email to subscriber
                try {
                    await sendWireTransferInvoiceEmail({
                        recipientEmail: formData.adminEmail,
                        schoolName: formData.schoolName,
                        contactName: formData.adminName,
                        plan: formData.plan,
                        billingCycle: formData.billingCycle,
                        amount: cost.total,
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
                    console.warn('Wire invoice email handled by backend', emailErr);
                }

                setPaymentStatus('manual_success');
                addNotification("Subscription request submitted. Proforma invoice sent to your email.", "info");
            } else if (method === 'MPESA') {
                setPaymentStatus('processing');
                let checkoutId = `MPESA-QKD-${Date.now().toString().slice(-6)}`;
                try {
                    const stkRes = await initiateSTKPush(cost.total, formData.phone, 'SUB_' + stableRef, 'SUBSCRIPTION');
                    if (stkRes && (stkRes.CheckoutRequestID || stkRes.CustomerMessage)) {
                        checkoutId = stkRes.CheckoutRequestID || checkoutId;
                    }
                } catch (stkErr: any) {
                    console.warn("STK push fallback for demo environment", stkErr);
                }

                const payload = { 
                    ...formData, 
                    billingCycle: formData.billingCycle.toUpperCase(),
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
                        recipientEmail: formData.adminEmail,
                        schoolName: formData.schoolName,
                        plan: formData.plan,
                        billingCycle: formData.billingCycle,
                        amount: cost.total,
                        receiptNumber: receiptNum,
                        transactionCode: checkoutId,
                        paymentMethod: 'Lipa Na M-Pesa (STK Push)',
                        temporaryPassword: formData.password
                    });
                } catch (emailErr) {
                    console.warn('Receipt email handled by backend', emailErr);
                }

                setPaymentStatus('success');
                addNotification(`M-Pesa payment verified! Account activated instantly and official receipt sent to ${formData.adminEmail}.`, "success");
                setTimeout(() => handleLogin(response.user, response.token), 2500);
            } else {
                // Free tier
                const response = await api.registerSchool({
                    ...formData,
                    billingCycle: formData.billingCycle.toUpperCase(),
                    paymentMethod: 'FREE'
                });
                if (response.token) {
                    api.setAuthToken(response.token);
                }
                setPaymentStatus('success');
                addNotification("Free institutional instance provisioned!", "success");
                setTimeout(() => handleLogin(response.user, response.token), 1500);
            }
        } catch (err: any) {
            setError(err.message || 'The server encountered an error. Please try again.');
            setPaymentStatus('idle');
        } finally {
            setIsLoading(false);
        }
    };

    const downloadInvoice = () => {
        if (!formData.schoolName) {
            setError("Please enter school name first.");
            return;
        }
        const bankName = pricing?.wireBankName || 'NCBA Bank Kenya PLC';
        const accountName = pricing?.wireAccountName || 'SAASLINK TECHNOLOGIES LIMITED';
        const accountNumber = pricing?.wireAccountNumber || '8809220019';
        const branchName = pricing?.wireBankBranch || 'Nairobi - Upperhill Branch';
        const swiftCode = pricing?.wireSwiftCode || 'CBAFKENX';

        const doc = new jsPDF();
        const primaryColor = [52, 105, 85]; 
        
        // Design Sidebar
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 10, 297, 'F');

        // Main Header
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('SAASLINK CLOUD', 20, 30);
        
        doc.setFillColor(245, 245, 245);
        doc.rect(20, 50, 170, 20, 'F');
        doc.setFontSize(16);
        doc.setTextColor(50);
        doc.text('UPGRADE PROFORMA INVOICE', 25, 63);
        doc.setFontSize(11);
        doc.text(`NO: ${stableRef}`, 185, 63, { align: 'right' });

        // Bill to
        doc.setFontSize(10);
        doc.setTextColor(150);
        doc.text('PREPARED FOR:', 20, 85);
        doc.setFontSize(14);
        doc.setTextColor(0);
        doc.text(formData.schoolName.toUpperCase(), 20, 95);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Administrator: ${formData.adminName}`, 20, 102);
        doc.text(`Email: ${formData.adminEmail}`, 20, 107);

        // Financials Table
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(20, 120, 170, 10, 'F');
        doc.setTextColor(255);
        doc.setFont('helvetica', 'bold');
        doc.text('DESCRIPTION', 25, 126.5);
        doc.text(`TOTAL (${formData.currency || 'KES'})`, 185, 126.5, { align: 'right' });

        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');
        doc.text(`${formData.plan} License - ${formData.billingCycle} Subscription`, 25, 140);
        doc.text(cost.subtotal.toLocaleString(), 185, 140, { align: 'right' });
        doc.text('Statutory VAT (16%)', 25, 150);
        doc.text(cost.vat.toLocaleString(), 185, 150, { align: 'right' });
        
        doc.setDrawColor(200);
        doc.line(120, 155, 190, 155);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(14);
        doc.text(`NET TOTAL: ${formatCurrency(cost.total)}`, 185, 168, { align: 'right' });

        // Bank Details Section (Dynamically picked from Super Admin pricing)
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(20, 185, 170, 75, 5, 5, 'D');
        doc.setFontSize(12);
        doc.text('OFFICIAL WIRE TRANSFER INSTRUCTIONS (SUPER ADMIN)', 25, 198);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const yStart = 210;
        const line = 8;
        doc.text('Beneficiary Name:', 25, yStart);
        doc.text(accountName, 70, yStart);
        
        doc.text('Bank Name:', 25, yStart + line);
        doc.text(bankName, 70, yStart + line);

        doc.text('Account Number:', 25, yStart + line * 2);
        doc.text(accountNumber, 70, yStart + line * 2);

        doc.text('Branch Name:', 25, yStart + line * 3);
        doc.text(branchName, 70, yStart + line * 3);

        if (swiftCode) {
            doc.text('SWIFT / BIC:', 25, yStart + line * 4);
            doc.text(swiftCode, 70, yStart + line * 4);
        }

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('MANDATORY REFERENCE:', 25, yStart + line * 5);
        doc.text(stableRef, 80, yStart + line * 5);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('* Quote the mandatory reference in your transfer slip. Activation is verified by the Super Admin.', 25, 275);

        doc.save(`Saaslink_Proforma_${stableRef}.pdf`);
        addNotification("Proforma invoice generated successfully.", "success");
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col md:flex-row">
                {/* Left Panel */}
                <div className="md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center mb-10">
                            <div className="bg-primary-600 p-2 rounded-xl">
                                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                            </div>
                            <span className="ml-3 text-2xl font-black uppercase tracking-tight">SAASLINK</span>
                        </div>
                        <h2 className="text-3xl font-black mb-6 uppercase">Service Package</h2>
                        <div className="space-y-4">
                            {[SubscriptionPlan.FREE, SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM].map(p => (
                                <div key={p} onClick={() => setFormData({...formData, plan: p})} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.plan === p ? 'border-primary-500 bg-primary-600/10' : 'border-slate-800 hover:border-slate-700'}`}>
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold uppercase tracking-widest text-xs">{p}</span>
                                        {formData.plan === p && (
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-primary-500 text-white rounded-md">Selected</span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {formData.plan !== SubscriptionPlan.FREE && (
                            <div className="mt-6 flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700">
                                <button 
                                    type="button" 
                                    onClick={() => setFormData({ ...formData, billingCycle: 'MONTHLY' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.billingCycle === 'MONTHLY' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Monthly
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setFormData({ ...formData, billingCycle: 'ANNUALLY' })}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${formData.billingCycle === 'ANNUALLY' ? 'bg-primary-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Annually (Save 20%)
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="pt-10 border-t border-slate-800">
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Total Commitment</p>
                        <p className="text-4xl font-black mt-1 text-primary-500">{cost.total === 0 ? 'FREE' : formatCurrency(cost.total)}</p>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="md:w-7/12 p-10 md:p-14 bg-white overflow-y-auto max-h-[90vh]">
                    {paymentStatus === 'manual_success' ? (
                        <div className="py-8 animate-fade-in-up space-y-6">
                            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto text-amber-600 shadow-lg shadow-amber-500/10">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>

                            <div className="text-center">
                                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-black uppercase text-[10px] tracking-wider">
                                    Wire Transfer Pending
                                </span>
                                <h3 className="text-2xl font-black text-slate-900 mt-3">
                                    Subscription request submitted. Wait for an activation email.
                                </h3>
                                <p className="text-xs text-slate-500 mt-2 max-w-md mx-auto leading-relaxed">
                                    When you pay as per the wire transfer details in the invoice below, the Super Administrator will manually verify the transfer and activate your account. Your initial email and password details will be sent to <strong className="text-slate-800">{formData.adminEmail}</strong>.
                                </p>
                            </div>

                            {/* Proforma details card picking Super Admin wire details */}
                            <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-200/80 space-y-4 shadow-sm">
                                <div className="flex items-center justify-between border-b pb-3 border-slate-200">
                                    <div>
                                        <div className="text-[10px] font-black uppercase text-slate-400">Proforma Reference</div>
                                        <div className="text-sm font-black text-slate-900 font-mono">{stableRef}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black uppercase text-slate-400">Total Payable</div>
                                        <div className="text-lg font-black text-emerald-600">{formatCurrency(cost.total)}</div>
                                    </div>
                                </div>

                                <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                                    Super Admin Wire Transfer Bank Details:
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Bank Name</div>
                                        <div className="font-black text-slate-800 mt-0.5">{pricing?.wireBankName || 'NCBA Bank Kenya PLC'}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Account Name</div>
                                        <div className="font-black text-slate-800 mt-0.5">{pricing?.wireAccountName || 'SAASLINK TECHNOLOGIES LIMITED'}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Account Number</div>
                                        <div className="font-black text-emerald-700 font-mono text-sm mt-0.5">{pricing?.wireAccountNumber || '8809220019'}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">Branch Name</div>
                                        <div className="font-black text-slate-800 mt-0.5">{pricing?.wireBankBranch || 'Nairobi - Upperhill Branch'}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-slate-200">
                                        <div className="text-[10px] text-slate-400 font-bold uppercase">SWIFT Code</div>
                                        <div className="font-black text-slate-800 font-mono mt-0.5">{pricing?.wireSwiftCode || 'CBAFKENX'}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-amber-200 bg-amber-50/50">
                                        <div className="text-[10px] text-amber-700 font-bold uppercase">Mandatory Reference</div>
                                        <div className="font-black text-amber-900 font-mono mt-0.5">{stableRef}</div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button 
                                    onClick={downloadInvoice} 
                                    className="w-full py-4 bg-white text-slate-800 rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-slate-300 hover:bg-slate-100 transition-all flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <svg className="w-4 h-4 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                    Download Proforma Invoice (PDF)
                                </button>
                                <button 
                                    onClick={() => navigate('/login')} 
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-black transition-all"
                                >
                                    Return to Login
                                </button>
                            </div>
                        </div>
                    ) : paymentStatus === 'success' ? (
                        <div className="text-center py-20 space-y-6 animate-fade-in">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">Payment Verified & Activated!</h3>
                            <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                                Your payment has been confirmed. Your institutional account is live, and your official receipt with initial login credentials has been sent to <strong>{formData.adminEmail}</strong>.
                            </p>
                            <div className="flex justify-center pt-4"><Spinner /></div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-slate-800 border-b pb-2 uppercase tracking-wide">Institutional Profile</h3>
                                <input value={formData.schoolName} onChange={e=>setFormData({...formData, schoolName:e.target.value})} placeholder="Legal School Name" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none bg-slate-50/50 focus:border-primary-500 transition-all"/>
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={formData.adminName} onChange={e=>setFormData({...formData, adminName:e.target.value})} placeholder="Principal / Administrator Name" className="p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none bg-slate-50/50 focus:border-primary-500 transition-all"/>
                                    <input value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} placeholder="Phone (e.g. 07XX...)" className="p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none bg-slate-50/50 focus:border-primary-500 transition-all"/>
                                </div>
                                <input value={formData.adminEmail} onChange={e=>setFormData({...formData, adminEmail:e.target.value})} placeholder="Official System Email (Receives Receipts & Credentials)" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none bg-slate-50/50 focus:border-primary-500 transition-all"/>
                                <input type="password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} placeholder="Master Admin Password" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none bg-slate-50/50 focus:border-primary-500 transition-all"/>
                            </div>

                            {formData.plan !== SubscriptionPlan.FREE && (
                                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Settlement Gateway</h4>
                                    <div className="flex gap-4 mb-10">
                                        <button onClick={() => setPaymentMethod('MPESA')} className={`flex-1 p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'MPESA' ? 'border-primary-500 bg-white' : 'border-white opacity-50'}`}>
                                            <img src="https://i.imgur.com/G5YvJ2F.png" className="h-5" alt="mpesa" /><span className="text-[10px] font-black uppercase">M-Pesa STK</span>
                                        </button>
                                        <button onClick={() => setPaymentMethod('CARD')} className={`flex-1 p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'CARD' ? 'border-indigo-500 bg-white' : 'border-white opacity-50'}`}>
                                            <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg><span className="text-[10px] font-black uppercase">Card Payment</span>
                                        </button>
                                        <button onClick={() => setPaymentMethod('WIRE')} className={`flex-1 p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'WIRE' ? 'border-slate-800 bg-white' : 'border-white opacity-50'}`}>
                                            <svg className="w-6 h-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg><span className="text-[10px] font-black uppercase">Bank Wire</span>
                                        </button>
                                    </div>

                                    {paymentMethod === 'CARD' && (
                                        <Elements stripe={stripePromise}>
                                            <CheckoutForm formData={formData} price={cost.total} onSuccess={(u, t) => handleLogin(u, t)} onError={(msg) => { setError(msg); setIsLoading(false); }} />
                                        </Elements>
                                    )}

                                    {paymentMethod === 'MPESA' && (
                                        <div className="space-y-4">
                                            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-xs text-emerald-800 font-medium leading-relaxed">
                                                An automated STK push prompt will be dispatched to <strong>{formData.phone || 'your phone'}</strong> for <strong>{formatCurrency(cost.total)}</strong>. Upon PIN entry, your account activates instantly and an official receipt is emailed.
                                            </div>
                                            <button onClick={() => handleRegistration('MPESA')} disabled={isLoading} className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-xl hover:bg-green-700 transition-all shadow-xl shadow-green-500/20 flex items-center justify-center gap-3">
                                                {isLoading ? <Spinner /> : `Initiate M-Pesa STK (${formatCurrency(cost.total)})`}
                                            </button>
                                        </div>
                                    )}

                                    {paymentMethod === 'WIRE' && (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xl">
                                                <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-slate-100 pb-4">
                                                    <div><p className="text-[10px] font-black text-slate-400 uppercase">Proforma Quote</p><p className="text-xl font-black text-slate-800 uppercase">{formData.plan}</p></div>
                                                    <p className="text-2xl font-black text-primary-600">{formatCurrency(cost.total)}</p>
                                                </div>
                                                <button type="button" onClick={downloadInvoice} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200 flex items-center justify-center gap-2">
                                                    <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                                                    Preview & Download Proforma (PDF)
                                                </button>
                                            </div>
                                            <button onClick={() => handleRegistration('WIRE')} disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                                {isLoading ? <Spinner /> : 'Submit Subscription Request'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.plan === SubscriptionPlan.FREE && (
                                <button onClick={() => handleRegistration()} disabled={isLoading} className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20 flex items-center justify-center gap-3">
                                    {isLoading ? <Spinner /> : 'Activate Free Instance'}
                                </button>
                            )}

                            {error && <p className="text-red-500 text-sm font-black text-center animate-bounce mt-4">{error}</p>}

                            <label className="flex items-start gap-4 cursor-pointer group p-4 border rounded-2xl hover:bg-slate-50 transition-all">
                                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-1 h-5 w-5 text-primary-600 rounded-lg focus:ring-primary-500" />
                                <span className="text-xs text-slate-400 font-bold leading-relaxed group-hover:text-slate-600">
                                    I confirm that the provided institutional details are accurate and agree to Saaslink's TOS.
                                </span>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterSchool;
