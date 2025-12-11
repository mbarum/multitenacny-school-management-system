
import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { SubscriptionPlan, PlatformPricing } from '../../types';
import { initiateSTKPush } from '../../services/darajaService';
import Spinner from '../common/Spinner';

interface RegisterSchoolProps {
    initialState?: {
        plan?: SubscriptionPlan;
        billing?: 'MONTHLY' | 'ANNUALLY';
    };
}

const RegisterSchool: React.FC<RegisterSchoolProps> = ({ initialState }) => {
    const { handleLogin, addNotification } = useData();
    const [formData, setFormData] = useState({
        schoolName: '',
        adminName: '',
        adminEmail: '',
        password: '',
        phone: '',
        plan: initialState?.plan || SubscriptionPlan.FREE,
        billingCycle: initialState?.billing || 'MONTHLY'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [pricing, setPricing] = useState<PlatformPricing | null>(null);
    const [error, setError] = useState('');
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const data = await api.getPlatformPricing();
                setPricing(data);
            } catch (error) {
                console.error("Failed to fetch pricing", error);
                // Fallback pricing if API fails
                setPricing({
                    id: 0,
                    basicMonthlyPrice: 3000,
                    basicAnnualPrice: 30000,
                    premiumMonthlyPrice: 5000,
                    premiumAnnualPrice: 50000
                });
            }
        };
        fetchPricing();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculatePrice = () => {
        if (formData.plan === SubscriptionPlan.FREE || !pricing) return 0;
        if (formData.plan === SubscriptionPlan.BASIC) {
            return formData.billingCycle === 'MONTHLY' ? pricing.basicMonthlyPrice : pricing.basicAnnualPrice;
        }
        if (formData.plan === SubscriptionPlan.PREMIUM) {
            return formData.billingCycle === 'MONTHLY' ? pricing.premiumMonthlyPrice : pricing.premiumAnnualPrice;
        }
        return 0;
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // 1. Register the school and user
            const response = await api.registerSchool(formData);
            const { user, token } = response;
            
            // 2. If Paid Plan, Trigger Payment
            if (formData.plan !== SubscriptionPlan.FREE) {
                setPaymentStatus('processing');
                const price = calculatePrice();
                try {
                    // Trigger STK Push to the registered phone number
                    // Ensure we handle network errors gracefully here
                    if (user && user.schoolId) {
                        const stkResponse = await initiateSTKPush(price, formData.phone, 'SUB_' + user.schoolId.substring(0, 8));
                        addNotification(stkResponse.CustomerMessage, 'info');
                        setPaymentStatus('success'); 
                    } else {
                         throw new Error("Invalid user data returned from registration.");
                    }
                } catch (payErr: any) {
                    console.error("Payment trigger failed", payErr);
                    addNotification("Account created, but payment trigger failed. Please pay via settings.", "error");
                    // Important: Don't stop the flow. The account is created.
                }
            }
            
            // 3. Login
            setTimeout(() => {
                handleLogin(user, token);
                addNotification('Welcome to Saaslink! Your school account is ready.', 'success');
            }, 3000); 

        } catch (err) {
            console.error("Registration error:", err);
            setError(err instanceof Error ? err.message : 'Registration failed. Please check your internet connection.');
            setIsLoading(false);
            setPaymentStatus('idle');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row">
                {/* Left Side: Summary */}
                <div className="md:w-5/12 bg-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex items-center mb-8">
                             <svg className="h-8 w-8 text-primary-500" viewBox="0 0 100 100" fill="currentColor">
                                <path d="M50 0C22.38 0 0 22.38 0 50C0 77.62 22.38 100 50 100C77.62 100 100 77.62 100 50C100 22.38 77.62 0 50 0ZM65.82 68.32C60.36 74.5 50 71.18 50 71.18C50 71.18 39.64 74.5 34.18 68.32C28.32 61.66 31.46 50 31.46 50C31.46 50 28.32 38.34 34.18 31.68C39.64 25.5 50 28.82 50 28.82C50 28.82 60.36 25.5 65.82 31.68C71.68 38.34 68.54 50 68.54 50C68.54 50 71.68 61.66 65.82 68.32Z"/>
                            </svg>
                            <span className="ml-3 text-2xl font-bold">Saaslink</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-4">Create Account</h2>
                        <p className="text-slate-400 text-sm leading-relaxed">Join hundreds of schools digitizing their operations today. Start your journey with the best school management platform in Kenya.</p>
                    </div>
                    <div className="mt-8 relative z-10">
                        <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-3">Subscription Details</h3>
                        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-xl text-white">{formData.plan} Plan</span>
                                <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded font-bold">{formData.billingCycle}</span>
                            </div>
                            <div className="text-3xl font-bold text-primary-400 mb-2">KES {calculatePrice().toLocaleString()}</div>
                            <p className="text-xs text-slate-400">
                                {formData.plan === SubscriptionPlan.FREE ? 'Forever free. Upgrade anytime.' : 'Payment triggered via M-Pesa immediately.'}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 text-xs text-slate-500 relative z-10">
                        &copy; 2024 Saaslink Technologies
                    </div>
                     {/* Decor */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-900 rounded-full opacity-50 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-900 rounded-full opacity-50 blur-3xl"></div>
                </div>

                {/* Right Side: Form */}
                <div className="md:w-7/12 p-8 md:p-12 bg-white">
                    {paymentStatus === 'processing' || paymentStatus === 'success' ? (
                        <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                                {paymentStatus === 'processing' ? <Spinner /> : <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                {paymentStatus === 'processing' ? 'Processing Registration...' : 'Registration Successful!'}
                            </h3>
                            <p className="mt-4 text-slate-600 max-w-xs mx-auto">
                                {paymentStatus === 'processing' ? 
                                    `We've sent an M-Pesa payment request to ${formData.phone}. Please enter your PIN.` : 
                                    'Account created successfully. Redirecting you to your dashboard...'}
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-5">
                            {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded-r">{error}</div>}
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                                <input name="schoolName" value={formData.schoolName} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="e.g. Springfield Academy" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Admin Name</label>
                                    <input name="adminName" value={formData.adminName} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone (M-Pesa)</label>
                                    <input name="phone" value={formData.phone} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="0712..." />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="admin@school.com" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Create Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all" placeholder="Min 8 chars" minLength={8} />
                            </div>
                            
                            <div className="pt-4">
                                <button type="submit" disabled={isLoading} className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 disabled:bg-slate-400 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex justify-center items-center">
                                    {isLoading ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Creating Account...
                                        </>
                                    ) : `Register & ${formData.plan === SubscriptionPlan.FREE ? 'Start' : 'Pay'}`}
                                </button>
                            </div>
                            
                            <p className="text-center text-sm text-slate-500 mt-6">
                                By registering, you agree to our Terms of Service. <br/>
                                Already have an account? <a href="/login" className="text-primary-600 font-semibold hover:underline">Login</a>
                            </p>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterSchool;
