
import React, { useState, useEffect } from 'react';
import * as api from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { SubscriptionPlan, PlatformPricing } from '../../types';
import { initiateSTKPush } from '../../services/darajaService';
import Spinner from '../common/Spinner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Replace with your actual publishable key in .env or hardcode for testing
// Fix: Cast import.meta to any to resolve TS error "Property 'env' does not exist on type 'ImportMeta'"
const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder_key_replace_me');

interface RegisterSchoolProps {
    initialState?: {
        plan?: SubscriptionPlan;
        billing?: 'MONTHLY' | 'ANNUALLY';
    };
}

const StripePaymentForm: React.FC<{ 
    amount: number, 
    email: string, 
    onSuccess: (method: string) => void, 
    onFailure: (err: string) => void 
}> = ({ amount, email, onSuccess, onFailure }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) return;

        setProcessing(true);

        // 1. In a real app, create PaymentIntent on server and get clientSecret
        // This relies on the new API endpoint we added
        // Since we are inside the registration flow, we fetch the intent first
        // Note: The main registration hasn't happened yet in the parent component logic,
        // but for Stripe we need an intent.
        
        try {
            // Trigger the payment
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) throw new Error("Card element not found");

            // Mocking the flow for this specific UI component to show structure. 
            // In production, you MUST call backend to create intent.
            // Assuming `api.createPaymentIntent` returns { clientSecret }
            // const { clientSecret } = await api.createPaymentIntent({ plan: 'BASIC', billingCycle: 'MONTHLY', email });
            
            // For now, we simulate a successful tokenization to pass to the registration endpoint
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                onFailure(error.message || 'Payment failed');
            } else {
                // Determine if we need actual charge or just method setup.
                // Here we just pass success to parent to proceed with registration
                onSuccess('Card'); 
            }
        } catch (err: any) {
            onFailure(err.message);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="mt-4 p-4 border border-slate-200 rounded-lg bg-slate-50">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">Secure Card Payment via Stripe</h4>
            <CardElement options={{
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#424770',
                        '::placeholder': { color: '#aab7c4' },
                    },
                    invalid: { color: '#9e2146' },
                },
            }} />
            <button 
                type="button" 
                onClick={handleSubmit} 
                disabled={!stripe || processing}
                className="mt-4 w-full py-2 bg-indigo-600 text-white rounded font-bold hover:bg-indigo-700 disabled:bg-slate-400"
            >
                {processing ? 'Processing...' : `Pay KES ${amount.toLocaleString()}`}
            </button>
            <p className="text-xs text-center text-slate-500 mt-2 flex items-center justify-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                AES-256 Encrypted. PCI-DSS Compliant.
            </p>
        </div>
    );
};

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
    
    // Legal Consent
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

    const [isLoading, setIsLoading] = useState(false);
    const [pricing, setPricing] = useState<PlatformPricing | null>(null);
    const [error, setError] = useState('');
    
    const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CARD'>('MPESA');
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const data = await api.getPlatformPricing();
                setPricing(data);
            } catch (error) {
                console.error("Failed to fetch pricing", error);
                setPricing({ id: 0, basicMonthlyPrice: 3000, basicAnnualPrice: 30000, premiumMonthlyPrice: 5000, premiumAnnualPrice: 50000 });
            }
        };
        fetchPricing();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculatePrice = () => {
        if (formData.plan === SubscriptionPlan.FREE || !pricing) return 0;
        if (formData.plan === SubscriptionPlan.BASIC) return formData.billingCycle === 'MONTHLY' ? pricing.basicMonthlyPrice : pricing.basicAnnualPrice;
        if (formData.plan === SubscriptionPlan.PREMIUM) return formData.billingCycle === 'MONTHLY' ? pricing.premiumMonthlyPrice : pricing.premiumAnnualPrice;
        return 0;
    };

    // Main Registration Logic
    const executeRegistration = async () => {
        setError('');
        setIsLoading(true);
        try {
             // 1. Register
             const response = await api.registerSchool(formData);
             const { user, token } = response;

             // 2. Payment (If M-Pesa selected)
             if (formData.plan !== SubscriptionPlan.FREE && paymentMethod === 'MPESA') {
                 setPaymentStatus('processing');
                 const price = calculatePrice();
                 try {
                     if (user && user.schoolId) {
                         const stkResponse = await initiateSTKPush(price, formData.phone, 'SUB_' + user.schoolId.substring(0, 8));
                         addNotification(stkResponse.CustomerMessage, 'info');
                         setPaymentStatus('success'); 
                     }
                 } catch (payErr) {
                     addNotification("Account created, but M-Pesa trigger failed.", "error");
                 }
             } else {
                 setPaymentStatus('success');
             }

             // 3. Login
             setTimeout(() => {
                handleLogin(user, token);
                addNotification('Welcome to Saaslink!', 'success');
            }, 3000); 

        } catch (err: any) {
            setError(err.message || 'Registration failed.');
            setIsLoading(false);
            setPaymentStatus('idle');
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms || !agreedToPrivacy) {
            setError("You must agree to the Terms and Privacy Policy to continue.");
            return;
        }

        // If Paid Plan + Card selected, user must click the Stripe button inside component, not this main submit
        if (formData.plan !== SubscriptionPlan.FREE && paymentMethod === 'CARD') {
            return; // Logic handled inside StripePaymentForm onSuccess
        }

        executeRegistration();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col md:flex-row">
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
                        <p className="text-slate-400 text-sm leading-relaxed">Secure, compliant, and powerful school management.</p>
                    </div>
                    <div className="mt-8 relative z-10">
                        <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-3">Subscription</h3>
                        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-center mb-2">
                                <span className="font-bold text-xl text-white">{formData.plan} Plan</span>
                                <span className="text-xs bg-primary-600 text-white px-2 py-1 rounded font-bold">{formData.billingCycle}</span>
                            </div>
                            <div className="text-3xl font-bold text-primary-400 mb-2">KES {calculatePrice().toLocaleString()}</div>
                            <p className="text-xs text-slate-400">
                                {formData.plan === SubscriptionPlan.FREE ? 'Forever free.' : 'Payment processed securely.'}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 text-xs text-slate-500 relative z-10">
                        &copy; 2024 Saaslink Technologies
                    </div>
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary-900 rounded-full opacity-50 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-900 rounded-full opacity-50 blur-3xl"></div>
                </div>

                {/* Right Side: Form */}
                <div className="md:w-7/12 p-8 md:p-12 bg-white overflow-y-auto max-h-[100vh]">
                    {paymentStatus === 'processing' || paymentStatus === 'success' ? (
                        <div className="text-center py-20 flex flex-col items-center justify-center h-full">
                            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                                {paymentStatus === 'processing' ? <Spinner /> : <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900">
                                {paymentStatus === 'processing' ? 'Processing...' : 'Welcome Aboard!'}
                            </h3>
                            <p className="mt-4 text-slate-600 max-w-xs mx-auto">
                                Account created successfully. Redirecting to dashboard...
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            {error && <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded-r">{error}</div>}
                            
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">School Name</label>
                                <input name="schoolName" value={formData.schoolName} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg" placeholder="e.g. Springfield Academy" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Admin Name</label>
                                    <input name="adminName" value={formData.adminName} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg" placeholder="John Doe" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input name="phone" value={formData.phone} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg" placeholder="0712..." />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg" placeholder="admin@school.com" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Create Password</label>
                                <input type="password" name="password" value={formData.password} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg" placeholder="Min 8 chars" minLength={8} />
                            </div>

                            {/* Legal Checkboxes */}
                            <div className="pt-2 space-y-3">
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                    <span className="text-sm text-slate-600">
                                        I agree to the <a href="#" className="text-primary-600 hover:underline">Terms of Service</a>. I understand that my data will be processed securely.
                                    </span>
                                </label>
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={agreedToPrivacy} onChange={e => setAgreedToPrivacy(e.target.checked)} className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                    <span className="text-sm text-slate-600">
                                        I accept the <a href="#" className="text-primary-600 hover:underline">Privacy Policy</a> and Data Processing Agreement.
                                    </span>
                                </label>
                            </div>
                            
                            {/* Payment Method Toggle (Only for Paid Plans) */}
                            {formData.plan !== SubscriptionPlan.FREE && (
                                <div className="pt-4 border-t border-slate-100">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                                    <div className="flex space-x-4 mb-4">
                                        <button 
                                            type="button" 
                                            onClick={() => setPaymentMethod('MPESA')}
                                            className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 ${paymentMethod === 'MPESA' ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <span>M-Pesa</span>
                                        </button>
                                        <button 
                                            type="button" 
                                            onClick={() => setPaymentMethod('CARD')}
                                            className={`flex-1 py-2 px-4 rounded-lg border flex items-center justify-center gap-2 ${paymentMethod === 'CARD' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                        >
                                            <span>Card (Stripe)</span>
                                        </button>
                                    </div>

                                    {paymentMethod === 'CARD' && (
                                        <Elements stripe={stripePromise}>
                                            <StripePaymentForm 
                                                amount={calculatePrice()} 
                                                email={formData.adminEmail}
                                                onSuccess={(method) => {
                                                    console.log('Stripe success via', method);
                                                    executeRegistration();
                                                }}
                                                onFailure={(err) => setError(err)}
                                            />
                                        </Elements>
                                    )}
                                </div>
                            )}

                            {/* Main Submit Button (Hidden if Card selected because StripeForm has its own button) */}
                            {!(formData.plan !== SubscriptionPlan.FREE && paymentMethod === 'CARD') && (
                                <div className="pt-4">
                                    <button 
                                        type="submit" 
                                        disabled={isLoading || !agreedToTerms || !agreedToPrivacy} 
                                        className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold text-lg hover:bg-primary-700 disabled:bg-slate-400 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex justify-center items-center"
                                    >
                                        {isLoading ? <Spinner /> : `Register & ${formData.plan === SubscriptionPlan.FREE ? 'Start' : 'Pay'}`}
                                    </button>
                                </div>
                            )}
                            
                            <p className="text-center text-sm text-slate-500 mt-6">
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
