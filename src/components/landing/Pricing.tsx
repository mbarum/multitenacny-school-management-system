import React, { useState, useEffect } from 'react';
import { SubscriptionPlan, PlatformPricing, Currency } from '../../types';
import * as api from '../../services/api';
import Skeleton from '../common/Skeleton';
import { useData } from '../../contexts/DataContext';
import SubscriptionModal from './SubscriptionModal';
import { Smartphone, ShieldCheck, Sparkles, Check } from 'lucide-react';

interface PricingProps {
    onSelectPlan?: (plan: SubscriptionPlan, billing: 'MONTHLY' | 'ANNUALLY') => void;
}

const Pricing: React.FC<PricingProps> = ({ onSelectPlan }) => {
    const { formatCurrency, convertCurrency } = useData();
    const [billing, setBilling] = useState<'MONTHLY' | 'ANNUALLY'>('MONTHLY');
    const [pricing, setPricing] = useState<PlatformPricing | null>(null);
    const [loading, setLoading] = useState(true);
    const [currency, setCurrency] = useState<string>('KES');

    // Subscription Modal State
    const [modalOpen, setModalOpen] = useState(false);
    const [activeModalPlan, setActiveModalPlan] = useState<SubscriptionPlan>(SubscriptionPlan.BASIC);

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
        return convertCurrency(basePrice, currency);
    };

    const handlePlanClick = (planId: SubscriptionPlan) => {
        setActiveModalPlan(planId);
        setModalOpen(true);
        if (onSelectPlan) {
            onSelectPlan(planId, billing);
        }
    };

    const plans = [
        {
            id: SubscriptionPlan.FREE,
            name: 'Starter Evaluation',
            price: 0,
            badge: '14-Day Free Trial',
            description: 'Evaluate the core student database, dual CBC & Traditional grading, and parent directory with zero financial commitment.',
            features: [
                'Up to 150 Students Enrolled',
                'Dual CBC Rubric & 8-4-4 Marks Engine',
                '5 Staff / Teacher Logins',
                'Class Attendance & Roll Call',
                'Manual Fee Payment Entries',
                'Standard A4 PDF Report Cards'
            ],
            notIncluded: [
                'Automated M-Pesa Fee Reconciliation',
                'Parent SMS & Real-time Portal',
                'Gemini AI Fee Defaulter Predictions',
                'Bulk WhatsApp Broadcasts'
            ],
            cta: 'Start 14-Day Evaluation'
        },
        {
            id: SubscriptionPlan.BASIC,
            name: 'Growth Academic Suite',
            price: getPrice(SubscriptionPlan.BASIC) || 12500,
            badge: 'Most Popular for Academies',
            description: 'The definitive cloud operating system for primary, junior, and secondary schools seeking zero cash leakage.',
            features: [
                'Up to 650 Students Enrolled',
                'Automated M-Pesa Fee Reconciliation',
                'Instant Parent SMS Receipt Confirmations',
                'Automated Defaulter Statements & Balance Reminders',
                'Competency-Based Education (CBE) & 8-4-4 Grading',
                'Unlimited Teacher & Staff Accounts',
                'Parent Online Portal with Real-Time Fee Balances',
                'Official Stamped Financial Receipts with QR'
            ],
            notIncluded: [
                'Multi-Campus Super-Admin Control',
                'Gemini AI Financial Forecaster'
            ],
            cta: 'Subscribe to Growth Suite',
            highlight: true
        },
        {
            id: SubscriptionPlan.PREMIUM,
            name: 'Enterprise Cloud ERP',
            price: getPrice(SubscriptionPlan.PREMIUM) || 24000,
            badge: 'Comprehensive K-12 & Groups',
            description: 'For large educational institutions, multiple branches, and high schools requiring full scale, AI insights, and custom integrations.',
            features: [
                'Unlimited Students & Multiple Campuses',
                'Everything in Growth Suite',
                'Gemini AI Financial Analyst & Cashflow Forecaster',
                'Automated Staff Payroll & KRA Statutory Deductions',
                'Full Library & Text-Book Barcode Tracker',
                'Custom School Domain & Subdomain Mapping',
                'Automated Multi-Year Archival & Data Sovereignty',
                '24/7 Dedicated Technical Engineer & Priority Hotline'
            ],
            notIncluded: [],
            cta: 'Subscribe to Enterprise'
        }
    ];

    if (loading) {
        return <div className="py-24 bg-white flex justify-center"><Skeleton className="h-96 w-full max-w-5xl" /></div>;
    }

    return (
        <div id="pricing" className="py-24 bg-slate-50 relative overflow-hidden border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center max-w-3xl mx-auto">
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                        Transparent School Licensing
                    </span>
                    <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl tracking-tight">
                        Predictable Termly & Annual Investment
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-600">
                        Zero hidden implementation fees, zero hardware purchases. Every plan includes comprehensive onboarding, data import assistance, and compliance under the Kenya Data Protection Act 2019.
                    </p>
                </div>

                <div className="mt-8 flex flex-col items-center gap-4 sm:gap-6">
                    {/* Currency & Billing Toggle */}
                    <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-full">
                        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                            <span className="text-xs font-bold text-slate-600">Currency:</span>
                            <select 
                                value={currency} 
                                onChange={(e) => setCurrency(e.target.value)}
                                className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
                            >
                                {Object.values(Currency).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {/* Billing Toggle */}
                        <div className="bg-white p-1 rounded-xl flex border border-slate-200 shadow-sm max-w-full overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setBilling('MONTHLY')}
                                className={`${billing === 'MONTHLY' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'} whitespace-nowrap px-3 sm:px-5 py-2 text-xs font-bold rounded-lg transition-all`}
                            >
                                Per Term (3x/Yr)
                            </button>
                            <button
                                type="button"
                                onClick={() => setBilling('ANNUALLY')}
                                className={`${billing === 'ANNUALLY' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'} whitespace-nowrap px-3 sm:px-5 py-2 text-xs font-bold rounded-lg transition-all`}
                            >
                                Annual Prepaid <span className="ml-1 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">Save 20%</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="mt-10 sm:mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
                    {plans.map((plan, index) => (
                        <div 
                            key={plan.name} 
                            className={`relative flex flex-col p-6 sm:p-8 bg-white border rounded-3xl shadow-sm hover:shadow-xl transition-all ${
                                plan.highlight 
                                    ? 'border-primary-600 ring-2 ring-primary-600/20 z-10 lg:-translate-y-2' 
                                    : 'border-slate-200'
                            } ${index === 2 ? 'md:col-span-2 lg:col-span-1' : ''}`}
                        >
                            {plan.highlight && (
                                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                                    <span className="bg-primary-600 text-white text-[11px] font-bold px-3.5 py-1 rounded-full uppercase tracking-wider shadow-md">
                                        {plan.badge}
                                    </span>
                                </div>
                            )}

                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-slate-900">{plan.name}</h3>
                                <p className="mt-2 text-xs text-slate-500 leading-relaxed min-h-[36px]">{plan.description}</p>
                                
                                <div className="mt-6 flex items-baseline text-slate-900 border-b border-slate-100 pb-6">
                                    <span className="text-4xl font-black tracking-tight">{formatCurrency(plan.price, currency)}</span>
                                    <span className="ml-1.5 text-xs font-bold text-slate-500">
                                        {plan.price === 0 ? ' (No credit card needed)' : billing === 'MONTHLY' ? '/ term' : '/ year'}
                                    </span>
                                </div>

                                {/* Features List */}
                                <div className="mt-6">
                                    <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Included Capabilities:</div>
                                    <ul role="list" className="space-y-2.5">
                                        {plan.features.map((feature) => (
                                            <li key={feature} className="flex items-start text-xs text-slate-700">
                                                <svg className="h-4 w-4 text-emerald-600 shrink-0 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                                </svg>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                        {plan.notIncluded.map((feature) => (
                                            <li key={feature} className="flex items-start text-xs text-slate-400 opacity-60">
                                                <svg className="h-4 w-4 text-slate-300 shrink-0 mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <button
                                onClick={() => handlePlanClick(plan.id)}
                                className={`mt-8 block w-full py-3.5 px-4 rounded-xl text-center font-bold text-sm transition-all shadow-md ${
                                    plan.highlight 
                                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-primary-600/30 hover:scale-[1.02]' 
                                        : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                            >
                                {plan.cta}
                            </button>

                            <p className="text-center text-[11px] text-slate-400 mt-2">
                                Requires Terms & Conditions acceptance
                            </p>
                        </div>
                    ))}
                </div>
                
                {/* Assurance Badges */}
                <div className="mt-14 p-6 bg-white rounded-2xl border border-slate-200 shadow-sm text-center">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-700">
                        <div className="flex items-center justify-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs border border-emerald-200/50">
                                <Smartphone className="w-5 h-5" />
                            </span>
                            <div className="text-left">
                                <div className="font-bold text-slate-900 text-sm">Automated M-Pesa Fee Reconciliation</div>
                                <div className="text-slate-500 text-xs">Direct automated mobile money webhook clearing & instant receipts</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-xs border border-blue-200/50">
                                <ShieldCheck className="w-5 h-5" />
                            </span>
                            <div className="text-left">
                                <div className="font-bold text-slate-900 text-sm">Institutional Data Privacy & Sovereignty</div>
                                <div className="text-slate-500 text-xs">Encrypted cloud multi-tenancy compliant with regional Data Protection acts</div>
                            </div>
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <span className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-xs border border-purple-200/50">
                                <Sparkles className="w-5 h-5" />
                            </span>
                            <div className="text-left">
                                <div className="font-bold text-slate-900 text-sm">Free Guided Onboarding & Rapid Migration</div>
                                <div className="text-slate-500 text-xs">Complimentary historical Excel ledger import & comprehensive staff training</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Embedded Subscription Modal with Mandatory Terms Checkbox */}
            <SubscriptionModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                initialPlan={activeModalPlan}
                initialBilling={billing === 'ANNUALLY' ? 'ANNUALLY' : 'TERMLY'}
            />
        </div>
    );
};

export default Pricing;
