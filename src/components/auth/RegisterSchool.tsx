
import React, { useState, useEffect, useMemo } from 'react';
import * as api from '../../services/api';
import { useData } from '../../contexts/DataContext';
import { SubscriptionPlan, PlatformPricing, Currency } from '../../types';
import { initiateSTKPush } from '../../services/darajaService';
import Spinner from '../common/Spinner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Modal from '../common/Modal';

// Replace with your actual publishable key in .env or hardcode for testing
const stripePromise = loadStripe((import.meta as any).env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_placeholder_key_replace_me');

interface RegisterSchoolProps {
    initialState?: {
        plan?: SubscriptionPlan;
        billing?: 'MONTHLY' | 'ANNUALLY';
    };
}

// Legal Documents Content
const LEGAL_DOCS = {
    TERMS: (
        <div className="space-y-4 text-sm text-slate-700">
            <h4 className="font-bold">1. Introduction</h4>
            <p>These Terms of Service ("Terms") govern your use of the school management software provided by <strong>SaasLink Technologies Limited</strong> ("Company", "we", "us"). By registering an account, you agree to these Terms.</p>
            
            <h4 className="font-bold">2. License Grant</h4>
            <p>Subject to your compliance with these Terms and payment of applicable fees, we grant you a non-exclusive, non-transferable, limited license to access and use the Platform for your internal school administration purposes.</p>
            
            <h4 className="font-bold">3. User Obligations</h4>
            <p>You are responsible for maintaining the confidentiality of your account credentials. You represent that all information provided during registration is accurate. You are solely responsible for all content (student data, financial records) uploaded to the platform.</p>
            
            <h4 className="font-bold">4. Fees and Payments</h4>
            <p>Subscription fees are billed in advance on a monthly or annual basis. All payments are non-refundable. Failure to pay may result in suspension of access.</p>
            
            <h4 className="font-bold">5. Limitation of Liability</h4>
            <p className="uppercase">To the maximum extent permitted by law, SaasLink Technologies Limited shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business interruption. In no event shall our total liability exceed the amount paid by you in the twelve (12) months preceding the claim.</p>
            
            <h4 className="font-bold">6. Disclaimer of Warranties</h4>
            <p>The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, whether express or implied, including fitness for a particular purpose.</p>
            
            <h4 className="font-bold">7. Termination</h4>
            <p>We reserve the right to terminate or suspend your account immediately, without prior notice or liability, for any reason, including breach of these Terms.</p>
        </div>
    ),
    PRIVACY: (
        <div className="space-y-4 text-sm text-slate-700">
            <h4 className="font-bold">1. Data Collection</h4>
            <p>We collect information necessary to provide our services, including:</p>
            <ul className="list-disc pl-5">
                <li>School details (Name, Address, Registration No).</li>
                <li>Administrator contact details (Name, Email, Phone).</li>
                <li>Student and Parent Personal Identifiable Information (PII) uploaded by the School.</li>
                <li>Financial transaction data.</li>
            </ul>

            <h4 className="font-bold">2. Use of Data</h4>
            <p>We use your data to:</p>
            <ul className="list-disc pl-5">
                <li>Provide, maintain, and improve the Platform.</li>
                <li>Process payments and generate financial reports.</li>
                <li>Communicate with you regarding updates, security alerts, and support.</li>
            </ul>

            <h4 className="font-bold">3. Data Sharing</h4>
            <p>We do not sell your data. We may share data with trusted third-party service providers (Sub-processors) solely for the purpose of running the application, including:</p>
            <ul className="list-disc pl-5">
                <li><strong>Safaricom PLC</strong> (M-Pesa integrations).</li>
                <li><strong>Stripe</strong> (Card payment processing).</li>
                <li><strong>Google Cloud</strong> (Hosting and AI services).</li>
            </ul>

            <h4 className="font-bold">4. Data Security</h4>
            <p>We implement industry-standard security measures, including encryption in transit and at rest, to protect your data from unauthorized access.</p>
        </div>
    ),
    DPA: (
        <div className="space-y-4 text-sm text-slate-700">
            <p>This Data Processing Agreement ("DPA") forms part of the Terms of Service between the School ("Data Controller") and SaasLink Technologies Limited ("Data Processor").</p>
            
            <h4 className="font-bold">1. Nature of Processing</h4>
            <p>The Data Processor shall process Personal Data solely on behalf of the Data Controller for the purpose of providing School Management Services.</p>
            
            <h4 className="font-bold">2. Compliance with Laws</h4>
            <p>Both parties agree to comply with all applicable data protection laws, including the Data Protection Act, 2019 (Kenya) and GDPR where applicable.</p>
            
            <h4 className="font-bold">3. Confidentiality</h4>
            <p>The Processor ensures that persons authorized to process the personal data have committed themselves to confidentiality.</p>
            
            <h4 className="font-bold">4. Security</h4>
            <p>The Processor shall implement appropriate technical and organizational measures to ensure a level of security appropriate to the risk.</p>
            
            <h4 className="font-bold">5. Sub-processors</h4>
            <p>The Controller authorizes the Processor to engage sub-processors (e.g., Cloud Providers, Payment Gateways) to support the delivery of services.</p>
        </div>
    )
};

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

        try {
            const cardElement = elements.getElement(CardElement);
            if (!cardElement) throw new Error("Card element not found");

            // Mocking the flow for this specific UI component to show structure. 
            // In production, you MUST call backend to create intent.
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });

            if (error) {
                onFailure(error.message || 'Payment failed');
            } else {
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
    const { handleLogin, addNotification, formatCurrency } = useData();
    const [formData, setFormData] = useState({
        schoolName: '',
        adminName: '',
        adminEmail: '',
        password: '',
        phone: '',
        plan: initialState?.plan || SubscriptionPlan.FREE,
        billingCycle: initialState?.billing || 'MONTHLY',
        currency: 'KES'
    });
    
    // Legal Consent
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [agreedToPrivacy, setAgreedToPrivacy] = useState(false);

    // Modal State
    const [activeLegalDoc, setActiveLegalDoc] = useState<'TERMS' | 'PRIVACY' | 'DPA' | null>(null);

    const [isLoading, setIsLoading] = useState(false);
    const [pricing, setPricing] = useState<PlatformPricing | null>(null);
    const [exchangeRates, setExchangeRates] = useState<Record<string, number>>({});
    const [error, setError] = useState('');
    
    const [paymentMethod, setPaymentMethod] = useState<'MPESA' | 'CARD'>('MPESA');
    const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success'>('idle');

    useEffect(() => {
        const fetchPricingAndRates = async () => {
            try {
                const [priceData, ratesData] = await Promise.all([
                    api.getPlatformPricing(),
                    api.getExchangeRates()
                ]);
                setPricing(priceData);
                setExchangeRates(ratesData);
            } catch (error) {
                console.error("Failed to load pricing or rates", error);
                setPricing({ id: 0, basicMonthlyPrice: 3000, basicAnnualPrice: 30000, premiumMonthlyPrice: 5000, premiumAnnualPrice: 50000 });
            }
        };
        fetchPricingAndRates();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const calculatePrice = () => {
        if (formData.plan === SubscriptionPlan.FREE || !pricing) return 0;
        let basePrice = 0;
        if (formData.plan === SubscriptionPlan.BASIC) basePrice = formData.billingCycle === 'MONTHLY' ? pricing.basicMonthlyPrice : pricing.basicAnnualPrice;
        if (formData.plan === SubscriptionPlan.PREMIUM) basePrice = formData.billingCycle === 'MONTHLY' ? pricing.premiumMonthlyPrice : pricing.premiumAnnualPrice;
        
        // Convert based on selected currency
        const rate = exchangeRates[formData.currency] || 1;
        return basePrice * rate;
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
                         // Note: initiateSTKPush expects KES amount if using standard Paybill. 
                         // If paying in other currencies, ensure payment gateway handles it or convert back to KES for MPesa.
                         // For simplicity here, assuming we pay in KES for MPesa regardless of display currency, OR user selects KES for MPesa.
                         // If user selected USD but pays via M-Pesa, M-Pesa charges KES.
                         
                         let payAmount = price;
                         if (formData.currency !== 'KES') {
                             // Convert back to KES for M-Pesa stk push if not KES
                             // Using simplistic inverse rate
                             const rate = exchangeRates[formData.currency] || 1;
                             payAmount = price / rate;
                         }

                         const stkResponse = await initiateSTKPush(Math.round(payAmount), formData.phone, 'SUB_' + user.schoolId.substring(0, 8));
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

    const getLegalTitle = () => {
        switch(activeLegalDoc) {
            case 'TERMS': return 'Terms of Service';
            case 'PRIVACY': return 'Privacy Policy';
            case 'DPA': return 'Data Processing Agreement';
            default: return '';
        }
    }

    const price = calculatePrice();

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
                            <div className="text-3xl font-bold text-primary-400 mb-2">
                                {formatCurrency(price, formData.currency)}
                            </div>
                            <p className="text-xs text-slate-400">
                                {formData.plan === SubscriptionPlan.FREE ? 'Forever free.' : 'Payment processed securely.'}
                            </p>
                        </div>
                    </div>
                    <div className="mt-8 text-xs text-slate-500 relative z-10">
                        &copy; {new Date().getFullYear()} SaasLink Technologies Limited
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

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                                    <input type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} required className="block w-full p-3 border border-slate-300 rounded-lg" placeholder="admin@school.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Currency</label>
                                    <select 
                                        name="currency" 
                                        value={formData.currency} 
                                        onChange={handleChange} 
                                        className="block w-full p-3 border border-slate-300 rounded-lg bg-white"
                                    >
                                        {Object.values(Currency).map(curr => (
                                            <option key={curr} value={curr}>{curr}</option>
                                        ))}
                                    </select>
                                </div>
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
                                        I agree to the <button type="button" onClick={(e) => { e.preventDefault(); setActiveLegalDoc('TERMS'); }} className="text-primary-600 hover:underline font-semibold bg-transparent border-0 p-0 inline">Terms of Service</button>.
                                    </span>
                                </label>
                                <label className="flex items-start space-x-3 cursor-pointer">
                                    <input type="checkbox" checked={agreedToPrivacy} onChange={e => setAgreedToPrivacy(e.target.checked)} className="mt-1 h-4 w-4 text-primary-600 rounded border-slate-300 focus:ring-primary-500" />
                                    <span className="text-sm text-slate-600">
                                        I accept the <button type="button" onClick={(e) => { e.preventDefault(); setActiveLegalDoc('PRIVACY'); }} className="text-primary-600 hover:underline font-semibold bg-transparent border-0 p-0 inline">Privacy Policy</button> and <button type="button" onClick={(e) => { e.preventDefault(); setActiveLegalDoc('DPA'); }} className="text-primary-600 hover:underline font-semibold bg-transparent border-0 p-0 inline">Data Processing Agreement</button>.
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
                                                amount={price} 
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

            {/* Legal Document Modal */}
            <Modal
                isOpen={activeLegalDoc !== null}
                onClose={() => setActiveLegalDoc(null)}
                title={getLegalTitle()}
                size="xl"
            >
                <div className="max-h-[60vh] overflow-y-auto p-2">
                    {activeLegalDoc && LEGAL_DOCS[activeLegalDoc]}
                </div>
                <div className="mt-4 pt-4 border-t flex justify-end">
                    <button 
                        onClick={() => setActiveLegalDoc(null)}
                        className="px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 font-semibold"
                    >
                        Close
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default RegisterSchool;
