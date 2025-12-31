
import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import * as api from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { SubscriptionPlan, PlatformPricing, Currency } from '../../types';
import { initiateSTKPush } from '../../services/darajaService';
import Spinner from '../common/Spinner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Modal from '../common/Modal';

const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

const RegisterSchool: React.FC = () => {
    const { handleLogin, addNotification, formatCurrency } = useData();
    const location = useLocation();
    
    // Extract plan from navigation state passed from LandingPage
    const navState = location.state as { plan?: SubscriptionPlan; billing?: 'MONTHLY' | 'ANNUALLY' } | null;

    const [formData, setFormData] = useState({
        schoolName: '',
        adminName: '',
        adminEmail: '',
        password: '',
        phone: '',
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculatePrice = () => {
        if (formData.plan === SubscriptionPlan.FREE || !pricing) return 0;
        if (formData.plan === SubscriptionPlan.BASIC) 
            return formData.billingCycle === 'MONTHLY' ? pricing.basicMonthlyPrice : pricing.basicAnnualPrice;
        return formData.billingCycle === 'MONTHLY' ? pricing.premiumMonthlyPrice : pricing.premiumAnnualPrice;
    };

    const executeRegistration = async () => {
        setError('');
        setIsLoading(true);
        try {
             const response = await api.registerSchool(formData);
             const { user } = response;

             if (formData.plan !== SubscriptionPlan.FREE && paymentMethod === 'MPESA') {
                 setPaymentStatus('processing');
                 try {
                    await initiateSTKPush(calculatePrice(), formData.phone, 'SUB_' + user.id.substring(0, 8));
                    addNotification("Payment request sent to your phone.", 'info');
                 } catch (e) {
                    addNotification("Registration successful, but M-Pesa trigger failed.", "error");
                 }
             }
             
             setPaymentStatus('success');
             setTimeout(() => {
                handleLogin(user);
                addNotification('Welcome to Saaslink!', 'success');
            }, 2000); 

        } catch (err: any) {
            setError(err.message || 'Registration failed.');
            setIsLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) {
            setError("Please agree to the terms of service.");
            return;
        }
        executeRegistration();
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
                        <h2 className="text-4xl font-black mb-4 leading-none">Complete Your<br/>School Profile.</h2>
                        <p className="text-slate-400 font-medium text-lg leading-relaxed">Join the elite institutions using our cloud-native management suite.</p>
                    </div>
                    
                    <div className="mt-8 relative z-10">
                        <div className="bg-slate-800 p-6 rounded-[1.5rem] border border-slate-700 shadow-inner">
                            <p className="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-2">Checkout Details</p>
                            <div className="flex justify-between items-center mb-4">
                                <span className="font-bold text-2xl uppercase tracking-tight">{formData.plan} PLAN</span>
                                <span className="text-xs bg-slate-700 px-2 py-1 rounded-full font-black uppercase">{formData.billingCycle}</span>
                            </div>
                            <div className="text-4xl font-black">
                                {priceValue === 0 ? 'FREE' : `KES ${priceValue.toLocaleString()}`}
                            </div>
                            <p className="text-xs text-slate-500 mt-2 italic font-bold">* No hidden setup fees</p>
                        </div>
                    </div>
                </div>

                <div className="md:w-7/12 p-10 md:p-14 bg-white overflow-y-auto max-h-[90vh]">
                    {paymentStatus === 'success' ? (
                        <div className="text-center py-20 animate-fade-in-up">
                            <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-8">
                                <svg className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            </div>
                            <h3 className="text-3xl font-black text-slate-900">Welcome Aboard!</h3>
                            <p className="mt-4 text-slate-500 text-lg">Your school portal is being initialized. One moment...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleFormSubmit} className="space-y-6">
                            <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight">Institutional Registration</h3>
                            
                            <div className="grid grid-cols-3 gap-2 mb-8">
                                {[SubscriptionPlan.FREE, SubscriptionPlan.BASIC, SubscriptionPlan.PREMIUM].map(p => (
                                    <button 
                                        key={p} 
                                        type="button" 
                                        onClick={() => setFormData({...formData, plan: p})}
                                        className={`p-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase tracking-widest ${formData.plan === p ? 'border-primary-600 bg-primary-50 text-primary-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>

                            {error && <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-sm font-bold border border-red-100">{error}</div>}
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Institutional Name</label>
                                    <input name="schoolName" value={formData.schoolName} onChange={handleChange} required className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all outline-none font-bold" placeholder="e.g. Riverside Academy" />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Admin Name</label>
                                        <input name="adminName" value={formData.adminName} onChange={handleChange} required className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all outline-none font-bold" placeholder="Full Name" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Admin Phone</label>
                                        <input name="phone" value={formData.phone} onChange={handleChange} required className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all outline-none font-bold" placeholder="07XX XXX XXX" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Official Email Address</label>
                                    <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all outline-none font-bold" placeholder="admin@school.com" />
                                </div>

                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1">System Password</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 transition-all outline-none font-bold" placeholder="Min 8 characters" minLength={8} />
                                </div>
                            </div>

                            {formData.plan !== SubscriptionPlan.FREE && (
                                <div className="animate-fade-in-up bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Payment Method</p>
                                    <div className="flex gap-4 mb-4">
                                        <button 
                                            type="button" 
                                            onClick={() => setPaymentMethod('MPESA')}
                                            className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'MPESA' ? 'border-green-500 bg-white' : 'border-transparent bg-slate-100 opacity-60'}`}
                                        >
                                            <img src="https://i.imgur.com/G5YvJ2F.png" className="h-6" alt="mpesa" />
                                            <span className="text-[10px] font-black uppercase">STK Push</span>
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setPaymentMethod('CARD')}
                                            className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-1 transition-all ${paymentMethod === 'CARD' ? 'border-indigo-500 bg-white' : 'border-transparent bg-slate-100 opacity-60'}`}
                                        >
                                            <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 24 24"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>
                                            <span className="text-[10px] font-black uppercase">Credit Card</span>
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-slate-400 font-bold leading-snug">Payments are processed securely via SSL encryption.</p>
                                </div>
                            )}

                            <label className="flex items-start gap-3 cursor-pointer group">
                                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-1 h-5 w-5 text-primary-600 rounded-lg border-slate-300" />
                                <span className="text-sm text-slate-500 font-medium leading-tight group-hover:text-slate-700 transition-colors">
                                    I agree to the <Link to="#" className="text-primary-600 font-black hover:underline">Terms of Service</Link> and platform privacy policies.
                                </span>
                            </label>

                            <button 
                                type="submit" 
                                disabled={isLoading} 
                                className="w-full py-5 bg-primary-600 text-white rounded-[1.5rem] font-black text-xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-500/30 hover:-translate-y-1 flex justify-center items-center h-[68px]"
                            >
                                {isLoading ? <Spinner /> : (formData.plan === SubscriptionPlan.FREE ? `Activate Free Account` : `Register & Pay ${formatCurrency(priceValue)}`)}
                            </button>
                            
                            <p className="text-center text-sm font-bold text-slate-400">
                                Already managed here? <Link to="/login" className="text-primary-600 hover:underline">Sign In</Link>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterSchool;
