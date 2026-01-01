
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import * as api from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { SubscriptionPlan, PlatformPricing } from '../../types';
import { initiateSTKPush } from '../../services/darajaService';
import Spinner from '../common/Spinner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = api.getPlatformPricing().then(p => loadStripe(p.stripePublishableKey || 'pk_test_placeholder'));

const CheckoutForm: React.FC<{ 
    formData: any, 
    price: number, 
    onSuccess: (user: any) => void,
    onError: (msg: string) => void 
}> = ({ formData, price, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);
        try {
            // 1. Create intent on backend
            const { clientSecret } = await api.createPaymentIntent({
                plan: formData.plan,
                billingCycle: formData.billingCycle,
                email: formData.adminEmail
            });

            // 2. Confirm on Stripe
            const result = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement)!,
                    billing_details: { name: formData.adminName, email: formData.adminEmail },
                }
            });

            if (result.error) {
                onError(result.error.message || 'Payment failed');
            } else if (result.paymentIntent.status === 'succeeded') {
                // 3. Register school
                const response = await api.registerSchool({ ...formData, paymentIntentId: result.paymentIntent.id });
                onSuccess(response.user);
            }
        } catch (err: any) {
            onError(err.message || 'An error occurred during checkout');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="p-4 border-2 border-slate-100 rounded-2xl bg-white shadow-inner">
                <CardElement options={{ style: { base: { fontSize: '16px', fontWeight: '600', color: '#1e293b' } } }} />
            </div>
            <button 
                type="submit" 
                disabled={!stripe || isProcessing}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 active:scale-95"
            >
                {isProcessing ? <Spinner /> : `Confirm & Pay KES ${price.toLocaleString()}`}
            </button>
        </form>
    );
};

const RegisterSchool: React.FC = () => {
    const { handleLogin, addNotification, formatCurrency } = useData();
    const location = useLocation();
    const navState = location.state as { plan?: SubscriptionPlan; billing?: 'MONTHLY' | 'ANNUALLY' } | null;

    const [formData, setFormData] = useState({
        schoolName: '', adminName: '', adminEmail: '', password: '', phone: '',
        plan: navState?.plan || SubscriptionPlan.FREE,
        billingCycle: navState?.billing || 'MONTHLY',
        currency: 'KES'
    });
    
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pricing, setPricing] = useState<PlatformPricing | null>(null);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CARD'>('MPESA');
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    useEffect(() => {
        api.getPlatformPricing().then(setPricing).catch(console.error);
    }, []);

    const calculatePrice = () => {
        if (formData.plan === SubscriptionPlan.FREE || !pricing) return 0;
        if (formData.plan === SubscriptionPlan.BASIC) 
            return formData.billingCycle === 'MONTHLY' ? pricing.basicMonthlyPrice : pricing.basicAnnualPrice;
        return formData.billingCycle === 'MONTHLY' ? pricing.premiumMonthlyPrice : pricing.premiumAnnualPrice;
    };

    const handleMpesaFlow = async () => {
        setError('');
        setIsLoading(true);
        try {
            const response = await api.registerSchool(formData);
            const { user } = response;

            if (formData.plan !== SubscriptionPlan.FREE) {
                setPaymentStatus('processing');
                await initiateSTKPush(calculatePrice(), formData.phone, 'SUB_' + user.id.substring(0, 8));
                addNotification("M-Pesa STK Push triggered. Check your phone.", 'info');
            }
            
            setPaymentStatus('success');
            setTimeout(() => handleLogin(user), 2000);
        } catch (err: any) {
            setError(err.message || 'Registration failed.');
            setIsLoading(false);
        }
    };

    const handleStripeSuccess = (user: any) => {
        setPaymentStatus('success');
        addNotification('Payment successful! Initializing portal...', 'success');
        setTimeout(() => handleLogin(user), 2000);
    };

    const priceValue = calculatePrice();

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row">
                <div className="md:w-5/12 bg-slate-900 p-10 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center mb-8">
                            <svg className="h-10 w-10 text-primary-500" viewBox="0 0 100 100" fill="currentColor">
                                <path d="M50 0C22.38 0 0 22.38 0 50C0 77.62 22.38 100 50 100C77.62 100 100 77.62 100 50C100 22.38 77.62 0 50 0ZM65.82 68.32C60.36 74.5 50 71.18 50 71.18C50 71.18 39.64 74.5 34.18 68.32C28.32 61.66 31.46 50 31.46 50C31.46 50 28.32 38.34 34.18 31.68C39.64 25.5 50 28.82 50 28.82C50 28.82 60.36 25.5 65.82 31.68C71.68 38.34 68.54 50 68.54 50C68.54 50 71.68 61.66 65.82 68.32Z"/>
                            </svg>
                            <span className="ml-3 text-3xl font-black tracking-tighter">Saaslink</span>
                        </div>
                        <h2 className="text-4xl font-black mb-4 leading-none">Institutional<br/>Registration.</h2>
                        <p className="text-slate-400 font-medium text-lg leading-relaxed">Access standard administration & financial intelligence tools instantly.</p>
                    </div>
                    
                    <div className="mt-8 relative z-10">
                        <div className="bg-slate-800 p-6 rounded-[1.5rem] border border-slate-700">
                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-2">Checkout Details</p>
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-2xl uppercase tracking-tight">{formData.plan} PLAN</span>
                                <span className="text-xs bg-slate-700 px-2 py-1 rounded-full font-black uppercase">{formData.billingCycle}</span>
                            </div>
                            <div className="text-4xl font-black">{priceValue === 0 ? 'FREE' : `KES ${priceValue.toLocaleString()}`}</div>
                        </div>
                    </div>
                </div>

                <div className="md:w-7/12 p-10 md:p-14 bg-white overflow-y-auto max-h-[90vh]">
                    {paymentStatus === 'success' ? (
                        <div className="text-center py-20 animate-fade-in-up">
                            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-8">
                                <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">Registration Verified</h3>
                            <p className="mt-4 text-slate-500 text-lg">Initializing your institutional cloud environment. One moment...</p>
                            <div className="mt-8 flex justify-center"><Spinner /></div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 gap-6">
                                <input name="schoolName" value={formData.schoolName} onChange={e=>setFormData({...formData, schoolName:e.target.value})} placeholder="School Name" className="w-full p-4 border border-slate-200 rounded-2xl font-bold"/>
                                <div className="grid grid-cols-2 gap-4">
                                    <input name="adminName" value={formData.adminName} onChange={e=>setFormData({...formData, adminName:e.target.value})} placeholder="Admin Full Name" className="w-full p-4 border border-slate-200 rounded-2xl font-bold"/>
                                    <input name="phone" value={formData.phone} onChange={e=>setFormData({...formData, phone:e.target.value})} placeholder="Mobile Number" className="w-full p-4 border border-slate-200 rounded-2xl font-bold"/>
                                </div>
                                <input name="adminEmail" value={formData.adminEmail} onChange={e=>setFormData({...formData, adminEmail:e.target.value})} placeholder="Official Email" className="w-full p-4 border border-slate-200 rounded-2xl font-bold"/>
                                <input type="password" name="password" value={formData.password} onChange={e=>setFormData({...formData, password:e.target.value})} placeholder="System Password" className="w-full p-4 border border-slate-200 rounded-2xl font-bold"/>
                            </div>

                            {formData.plan !== SubscriptionPlan.FREE && (
                                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200">
                                    <div className="flex gap-4 mb-8">
                                        <button onClick={() => setPaymentMethod('MPESA')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'MPESA' ? 'border-green-500 bg-white' : 'border-transparent opacity-40'}`}>
                                            <img src="https://i.imgur.com/G5YvJ2F.png" className="h-6 mx-auto" alt="mpesa" />
                                        </button>
                                        <button onClick={() => setPaymentMethod('CARD')} className={`flex-1 p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'CARD' ? 'border-indigo-500 bg-white' : 'border-transparent opacity-40'}`}>
                                             <svg className="w-8 h-8 text-indigo-600 mx-auto" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                                        </button>
                                    </div>
                                    
                                    {paymentMethod === 'CARD' ? (
                                        <Elements stripe={stripePromise}>
                                            <CheckoutForm formData={formData} price={priceValue} onSuccess={handleStripeSuccess} onError={setError} />
                                        </Elements>
                                    ) : (
                                        <button onClick={handleMpesaFlow} disabled={isLoading} className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-xl hover:bg-green-700 transition-all flex justify-center items-center h-[68px]">
                                            {isLoading ? <Spinner /> : `Pay with M-Pesa ${formatCurrency(priceValue)}`}
                                        </button>
                                    )}
                                </div>
                            )}

                            {formData.plan === SubscriptionPlan.FREE && (
                                <button onClick={handleMpesaFlow} className="w-full py-5 bg-primary-600 text-white rounded-2xl font-black text-xl hover:bg-primary-700 transition-all">Activate Free Account</button>
                            )}

                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="h-5 w-5 text-primary-600 rounded-lg" />
                                <span className="text-sm text-slate-400 font-bold">Agreed to Terms of Service & Privacy Policy.</span>
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterSchool;
