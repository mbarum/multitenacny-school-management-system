
import React, { useState, useEffect } from 'react';
import { SubscriptionPlan, PlatformPricing, Currency } from '../../types';
import * as api from '../../services/api';
import Skeleton from '../common/Skeleton';
import { convertAmount, formatCurrency, EXCHANGE_RATES } from '../../utils/currency';

interface PricingProps {
    onSelectPlan: (plan: SubscriptionPlan, billing: 'MONTHLY' | 'ANNUALLY') => void;
}

const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
    const [billing, setBilling] = useState<'MONTHLY' | 'ANNUALLY'>('MONTHLY');
    const [pricing, setPricing] = useState<PlatformPricing | null>(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState<Currency>(Currency.KES);

    useEffect(() => {
        const fetchPricing = async () => {
            try {
                const data = await api.getPlatformPricing();
                setPricing(data);
            } catch (error) {
                console.error("Failed to load pricing", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPricing();
    }, []);

    const getPrice = (plan: SubscriptionPlan) => {
        if (!pricing) return 0;
        let basePrice = 0;
        if (plan === SubscriptionPlan.BASIC) {
            basePrice = billing === 'MONTHLY' ? pricing.basicMonthlyPrice : pricing.basicAnnualPrice;
        }
        if (plan === SubscriptionPlan.PREMIUM) {
            basePrice = billing === 'MONTHLY' ? pricing.premiumMonthlyPrice : pricing.premiumAnnualPrice;
        }
        return convertAmount(basePrice, currency);
    };

    const plans = [
        {
            id: SubscriptionPlan.FREE,
            name: 'Starter',
            price: 0,
            description: 'Essential tools for small schools just getting started.',
            features: [
                'Up to 50 Students',
                '2 Staff Accounts',
                'Student Registry',
                'Basic Reports',
                'Manual Fee Recording'
            ],
            notIncluded: [
                'Parent Portal',
                'M-Pesa Integration',
                'AI Insights',
                'Library System'
            ],
            cta: 'Start Free'
        },
        {
            id: SubscriptionPlan.BASIC,
            name: 'Growth',
            price: getPrice(SubscriptionPlan.BASIC),
            description: 'Automated finance and communication for growing schools.',
            features: [
                'Up to 500 Students',
                '10 Staff Accounts',
                'Everything in Starter',
                'Parent Portal Access',
                'Automated M-Pesa Payments',
                'SMS & Email Alerts',
                'Data Export (CSV)'
            ],
            notIncluded: [
                'AI Financial Insights',
                'Library Management',
                'Audit Logs'
            ],
            cta: 'Get Growth',
            highlight: true
        },
        {
            id: SubscriptionPlan.PREMIUM,
            name: 'Enterprise',
            price: getPrice(SubscriptionPlan.PREMIUM),
            description: 'Full-suite management with AI power and unlimited scale.',
            features: [
                'Unlimited Students',
                'Unlimited Staff',
                'Everything in Growth',
                'Gemini AI Financial Analyst',
                'Full Library System',
                'Detailed Audit Logs',
                'Priority Support',
                'ID Card Generation'
            ],
            notIncluded: [],
            cta: 'Go Enterprise'
        }
    ];

    if (loading) {
        return <div className="py-24 bg-white flex justify-center"><Skeleton className="h-96 w-full max-w-5xl" /></div>;
    }

    return (
        <div id="pricing" className="py-24 bg-white relative overflow-hidden">
             {/* Background decorative blob */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-full h-full z-0 pointer-events-none opacity-30">
                 <div className="absolute top-20 left-20 w-72 h-72 bg-primary-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
                 <div className="absolute top-20 right-20 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-base font-semibold text-primary-600 tracking-wide uppercase">Pricing</h2>
                    <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">
                        Simple, transparent pricing for every stage
                    </p>
                    <p className="mt-4 text-xl text-slate-600">
                        Choose the plan that fits your school's needs. Upgrade, downgrade, or cancel at any time.
                    </p>
                </div>

                <div className="mt-8 flex flex-col items-center gap-6">
                    {/* Currency Selector */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-slate-600">Currency:</span>
                        <select 
                            value={currency} 
                            onChange={(e) => setCurrency(e.target.value as Currency)}
                            className="p-1 border border-slate-300 rounded text-sm bg-white focus:ring-primary-500 focus:border-primary-500"
                        >
                            {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Billing Toggle */}
                    <div className="relative bg-slate-100 p-1 rounded-xl flex shadow-inner">
                        <button
                            type="button"
                            onClick={() => setBilling('MONTHLY')}
                            className={`${billing === 'MONTHLY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'} relative w-36 py-2.5 text-sm font-bold rounded-lg focus:outline-none transition-all duration-200`}
                        >
                            Monthly
                        </button>
                        <button
                            type="button"
                            onClick={() => setBilling('ANNUALLY')}
                            className={`${billing === 'ANNUALLY' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'} relative w-36 py-2.5 text-sm font-bold rounded-lg focus:outline-none transition-all duration-200`}
                        >
                            Yearly <span className="absolute -top-3 -right-3 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm">-17%</span>
                        </button>
                    </div>
                </div>

                <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
                    {plans.map((plan) => (
                        <div key={plan.name} className={`relative flex flex-col p-8 bg-white border rounded-2xl shadow-lg transition-transform hover:-translate-y-1 ${plan.highlight ? 'border-primary-500 ring-4 ring-primary-500/20 z-10 scale-105' : 'border-slate-200'}`}>
                            {plan.highlight && (
                                <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <span className="bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-sm">
                                        Most Popular
                                    </span>
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                <p className="mt-2 text-sm text-slate-500">{plan.description}</p>
                                <p className="mt-6 flex items-baseline text-slate-900">
                                    <span className="text-5xl font-extrabold tracking-tight">{formatCurrency(plan.price, currency)}</span>
                                    <span className="ml-1 text-xl font-semibold text-slate-500">/{billing === 'MONTHLY' ? 'mo' : 'yr'}</span>
                                </p>

                                {/* Features */}
                                <ul role="list" className="mt-8 space-y-4">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start">
                                            <div className="flex-shrink-0">
                                                <svg className="h-6 w-6 text-green-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                                </svg>
                                            </div>
                                            <p className="ml-3 text-base text-slate-700">{feature}</p>
                                        </li>
                                    ))}
                                    {plan.notIncluded.map((feature) => (
                                        <li key={feature} className="flex items-start opacity-50">
                                            <div className="flex-shrink-0">
                                                <svg className="h-6 w-6 text-slate-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </div>
                                            <p className="ml-3 text-base text-slate-500">{feature}</p>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <button
                                onClick={() => onSelectPlan(plan.id, billing)}
                                className={`mt-8 block w-full py-4 px-6 border border-transparent rounded-xl text-center font-bold text-lg transition-all shadow-md ${plan.highlight ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-500/30' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}`}
                            >
                                {plan.cta}
                            </button>
                        </div>
                    ))}
                </div>
                
                <div className="mt-12 text-center">
                    <p className="text-slate-500 flex flex-wrap items-center justify-center gap-4 text-sm">
                        <span className="flex items-center text-slate-700">
                            <svg className="w-5 h-5 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                            Secure M-Pesa Integration
                        </span>
                        <span className="flex items-center text-slate-700">
                            <svg className="w-5 h-5 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            Data Encrypted & Backed Up
                        </span>
                        <span className="flex items-center text-slate-700">
                            <svg className="w-5 h-5 mr-1.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            Cancel Anytime
                        </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Pricing;