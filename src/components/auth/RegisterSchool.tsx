import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import * as api from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { SubscriptionPlan, PlatformPricing } from '../../types';
import { initiateSTKPush } from '../../services/darajaService';
import Spinner from '../common/Spinner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = api.getPlatformPricing().then(p => loadStripe(p.stripePublishableKey || 'pk_test_placeholder'));

const CheckoutForm: React.FC<{ 
    formData: any, 
    price: number, 
    onSuccess: (user: any) => void,
    onError: (msg: string) => void 
}> = ({ formData, price, onSuccess, onError }) => {
    const { formatCurrency } = useData();
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setIsProcessing(true);
        try {
            const { clientSecret } = await api.createPaymentIntent({
                plan: formData.plan,
                billingCycle: formData.billingCycle.toUpperCase(),
                email: formData.adminEmail
            });
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                    billing_details: { name: formData.adminName, email: formData.adminEmail },
                }
            });
            if (result.error) {
                onError(result.error.message || 'Payment failed');
            } else if (result.paymentIntent.status === 'succeeded') {
                const response = await api.registerSchool({ 
                    ...formData, 
                    billingCycle: formData.billingCycle.toUpperCase(),
                    paymentMethod: 'CARD', 
                    paymentIntentId: result.paymentIntent.id 
                });
                onSuccess(response.user);
            }
        } catch (err: any) {
            onError(err.message || 'Error during checkout');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 border-2 border-slate-100 rounded-2xl bg-white shadow-inner">
                <CardElement options={{ style: { base: { fontSize: '16px', fontWeight: '600', color: '#1e293b' } } }} />
            </div>
            <button type="submit" disabled={!stripe || isProcessing} className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
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
        api.getPlatformPricing().then(setPricing).catch(console.error);
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

        setError('');
        setIsLoading(true);

        try {
            const payload = { 
                ...formData, 
                billingCycle: formData.billingCycle.toUpperCase(),
                paymentMethod: method,
                invoiceNumber: method === 'WIRE' ? stableRef : undefined 
            };

            const response = await api.registerSchool(payload);
            
            // Save token immediately so subsequent authenticated calls (like STK push) work
            if (response.token) {
                localStorage.setItem('authToken', response.token);
            }

            if (response.status === 'PENDING') {
                setPaymentStatus('manual_success');
                addNotification("Registration submitted. Verification required.", "info");
            } else if (method === 'MPESA') {
                setPaymentStatus('processing');
                try {
                    await initiateSTKPush(cost.total, formData.phone, 'SUB_' + response.user.id.substring(0, 8), 'SUBSCRIPTION');
                    setPaymentStatus('success');
                    addNotification("STK Push sent to your phone. Please enter your PIN.", "success");
                    // Wait a bit longer for them to see the success message before redirecting
                    setTimeout(() => handleLogin(response.user, response.token), 4000);
                } catch (stkErr: any) {
                    console.error("STK Push failed", stkErr);
                    addNotification("Account created, but M-Pesa prompt failed: " + stkErr.message, "error");
                    // Still log them in since they have a grace period
                    setTimeout(() => handleLogin(response.user, response.token), 3000);
                }
            } else {
                setPaymentStatus('success');
                setTimeout(() => handleLogin(response.user, response.token), 2000);
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

        // Bank Details Section
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(20, 185, 170, 75, 5, 5, 'D');
        doc.setFontSize(12);
        doc.text('WIRE TRANSFER INSTRUCTIONS', 25, 198);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const yStart = 210;
        const line = 8;
        doc.text('Beneficiary Name:', 25, yStart);
        doc.text('SAASLINK TECHNOLOGIES LIMITED', 70, yStart);
        
        doc.text('Bank Name:', 25, yStart + line);
        doc.text('NCBA Bank Kenya PLC', 70, yStart + line);

        doc.text('Account Number:', 25, yStart + line * 2);
        doc.text('8809220019', 70, yStart + line * 2);

        doc.text('Branch Name:', 25, yStart + line * 3);
        doc.text('Nairobi - Upperhill Branch', 70, yStart + line * 3);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text('MANDATORY REFERENCE:', 25, yStart + line * 5);
        doc.text(stableRef, 80, yStart + line * 5);

        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text('* Use the reference exactly as shown. Activation occurs instantly upon verification.', 25, 275);

        doc.save(`Saaslink_Proforma_${stableRef}.pdf`);
        addNotification("Proforma invoice generated.", "success");
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
                            <span className="ml-3 text-2xl font-black uppercase">SAASLINK</span>
                        </div>
                        <h2 className="text-3xl font-black mb-6 uppercase">Service Package</h2>
                        <div className="space-y-4">
                            {[SubscriptionPlan.FREE, SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM].map(p => (
                                <div key={p} onClick={() => setFormData({...formData, plan: p})} className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${formData.plan === p ? 'border-primary-500 bg-primary-600/10' : 'border-slate-800 hover:border-slate-700'}`}>
                                    <span className="font-bold uppercase tracking-widest text-xs">{p}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="pt-10 border-t border-slate-800">
                        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Total Commitment</p>
                        <p className="text-4xl font-black mt-1 text-primary-500">{cost.total === 0 ? 'FREE' : formatCurrency(cost.total)}</p>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="md:w-7/12 p-10 md:p-14 bg-white overflow-y-auto max-h-[90vh]">
                    {paymentStatus === 'manual_success' ? (
                        <div className="text-center py-20 animate-fade-in-up">
                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-8">
                                <svg className="w-10 h-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                            </div>
                            <h3 className="text-3xl font-black">Order Transmitted</h3>
                            <p className="mt-4 text-slate-600 font-bold uppercase tracking-widest text-xs">Reference: {stableRef}</p>
                            <p className="text-sm text-slate-500 mt-6 leading-relaxed max-w-sm mx-auto">
                                We have received your institutional application. Please complete the bank transfer using the proforma details.
                                Once funds are verified by our billing department, your portal will be activated and login credentials dispatched.
                            </p>
                            <div className="mt-10 flex flex-col gap-3">
                                <button onClick={downloadInvoice} className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-black uppercase text-xs tracking-widest border-2 border-slate-200 hover:bg-slate-200">Re-download Proforma</button>
                                <button onClick={() => navigate('/login')} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl">Return to Login</button>
                            </div>
                        </div>
                    ) : paymentStatus === 'success' ? (
                        <div className="text-center py-20"><h3 className="text-3xl font-black">Provisioning Portal...</h3><div className="mt-8 flex justify-center"><Spinner /></div></div>
                    ) : (
                        <div className="space-y-10">
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-slate-800 border-b pb-2 uppercase tracking-wide">Institutional Profile</h3>
                                <input value={formData.schoolName} onChange={e=>setFormData({...formData, schoolName:e.target.value})} placeholder="Legal School Name" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none bg-slate-50/50 focus:border-primary-500 transition-all"/>
                                <div className="grid grid-cols-2 gap-4">
                                    <input value={formData.adminName} onChange={e=>setFormData({...formData, adminName:e.target.value})} placeholder="Principal Name" className="p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none bg-slate-50/50 focus:border-primary-500 transition-all"/>
                                    <input value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} placeholder="Phone (e.g. 07XX...)" className="p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none bg-slate-50/50 focus:border-primary-500 transition-all"/>
                                </div>
                                <input value={formData.adminEmail} onChange={e=>setFormData({...formData, adminEmail:e.target.value})} placeholder="Official System Email" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none bg-slate-50/50 focus:border-primary-500 transition-all"/>
                                <input type="password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} placeholder="Master Admin Password" className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold outline-none bg-slate-50/50 focus:border-primary-500 transition-all"/>
                            </div>

                            {formData.plan !== SubscriptionPlan.FREE && (
                                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 text-center">Settlement Gateway</h4>
                                    <div className="flex gap-4 mb-10">
                                        <button onClick={() => setPaymentMethod('MPESA')} className={`flex-1 p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'MPESA' ? 'border-primary-500 bg-white' : 'border-white opacity-50'}`}>
                                            <img src="https://i.imgur.com/G5YvJ2F.png" className="h-5" alt="mpesa" /><span className="text-[10px] font-black uppercase">Instant</span>
                                        </button>
                                        <button onClick={() => setPaymentMethod('CARD')} className={`flex-1 p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'CARD' ? 'border-indigo-500 bg-white' : 'border-white opacity-50'}`}>
                                            <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg><span className="text-[10px] font-black uppercase">Card</span>
                                        </button>
                                        <button onClick={() => setPaymentMethod('WIRE')} className={`flex-1 p-4 rounded-2xl border-4 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'WIRE' ? 'border-slate-800 bg-white' : 'border-white opacity-50'}`}>
                                            <svg className="w-6 h-6 text-slate-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg><span className="text-[10px] font-black uppercase">Bank Wire</span>
                                        </button>
                                    </div>

                                    {paymentMethod === 'CARD' && (
                                        <Elements stripe={stripePromise}>
                                            <CheckoutForm formData={formData} price={cost.total} onSuccess={(u) => handleLogin(u)} onError={(msg) => { setError(msg); setIsLoading(false); }} />
                                        </Elements>
                                    )}

                                    {paymentMethod === 'MPESA' && (
                                        <button onClick={() => handleRegistration('MPESA')} disabled={isLoading} className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-xl hover:bg-green-700 transition-all shadow-xl shadow-green-500/20">
                                            {isLoading ? <Spinner /> : 'Initiate M-Pesa STK'}
                                        </button>
                                    )}

                                    {paymentMethod === 'WIRE' && (
                                        <div className="space-y-6 animate-fade-in">
                                            <div className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-xl">
                                                <div className="flex justify-between items-center mb-6 border-b-2 border-dashed border-slate-100 pb-4">
                                                    <div><p className="text-[10px] font-black text-slate-400 uppercase">License Quote</p><p className="text-xl font-black text-slate-800 uppercase">{formData.plan}</p></div>
                                                    <p className="text-2xl font-black text-primary-600">{formatCurrency(cost.total)}</p>
                                                </div>
                                                <button type="button" onClick={downloadInvoice} className="w-full py-3 bg-slate-100 text-slate-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all border border-slate-200">
                                                    Get Proforma PDF
                                                </button>
                                            </div>
                                            <button onClick={() => handleRegistration('WIRE')} disabled={isLoading} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xl hover:bg-black transition-all">
                                                {isLoading ? <Spinner /> : 'Submit Order'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {formData.plan === SubscriptionPlan.FREE && (
                                <button onClick={() => handleRegistration()} disabled={isLoading} className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/20">
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
