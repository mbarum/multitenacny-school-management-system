import React, { useState } from 'react';
import { SubscriptionPlan } from '../../types';
import { Link } from 'react-router-dom';

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
    const [plan, setPlan] = useState<SubscriptionPlan>(initialPlan);
    const [billingCycle, setBillingCycle] = useState<'TERMLY' | 'ANNUALLY'>(
        initialBilling === 'ANNUALLY' ? 'ANNUALLY' : 'TERMLY'
    );

    // Form fields
    const [schoolName, setSchoolName] = useState('');
    const [registrationCode, setRegistrationCode] = useState('');
    const [curriculumType, setCurriculumType] = useState('DUAL_CBC_TRADITIONAL');
    const [schoolLevel, setSchoolLevel] = useState('PRIMARY_AND_JUNIOR');
    const [county, setCounty] = useState('Nairobi');
    const [studentCount, setStudentCount] = useState('200-500');
    
    const [contactName, setContactName] = useState('');
    const [contactRole, setContactRole] = useState('Principal / Headteacher');
    const [contactEmail, setContactEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');

    // Addons
    const [addonMpesa, setAddonMpesa] = useState(true);
    const [addonSms, setAddonSms] = useState(true);
    const [addonCbcPortfolio, setAddonCbcPortfolio] = useState(true);

    // Mandatory Legal Consents
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [acceptPrivacy, setAcceptPrivacy] = useState(false);

    // State
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedData, setSubmittedData] = useState<any | null>(null);

    if (!isOpen) return null;

    const planPrices = {
        [SubscriptionPlan.FREE]: { termly: 0, annually: 0, label: 'Starter Evaluation' },
        [SubscriptionPlan.BASIC]: { termly: 12500, annually: 32000, label: 'Growth Academic Suite' },
        [SubscriptionPlan.PREMIUM]: { termly: 24000, annually: 62000, label: 'Enterprise Cloud ERP' },
    };

    const currentPrice = planPrices[plan] ? planPrices[plan][billingCycle === 'ANNUALLY' ? 'annually' : 'termly'] : 12500;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!acceptTerms || !acceptPrivacy) return;

        setIsSubmitting(true);
        setTimeout(() => {
            const refCode = `SL-SUB-${Date.now().toString().slice(-6)}`;
            const submission = {
                referenceCode: refCode,
                schoolName,
                registrationCode: registrationCode || 'PENDING-VERIFICATION',
                curriculumType,
                schoolLevel,
                county,
                studentCount,
                contactName,
                contactRole,
                contactEmail,
                contactPhone,
                plan,
                billingCycle,
                amount: currentPrice,
                addons: {
                    mpesaDaraja: addonMpesa,
                    bulkSms: addonSms,
                    cbcPortfolio: addonCbcPortfolio
                },
                termsAcceptedDate: new Date().toISOString(),
                licensor: 'SaasLink Technologies Ltd'
            };

            // Store in localStorage for persistence
            try {
                const existing = JSON.parse(localStorage.getItem('saaslink_pending_subscriptions') || '[]');
                existing.push(submission);
                localStorage.setItem('saaslink_pending_subscriptions', JSON.stringify(existing));
            } catch (err) {
                console.error('Storage error:', err);
            }

            setIsSubmitting(false);
            setSubmittedData(submission);
            if (onSuccess) onSuccess(submission);
        }, 800);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <div 
                className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
                role="dialog" 
                aria-modal="true"
            >
                {/* Modal Header */}
                <div className="bg-gradient-to-r from-slate-900 to-primary-950 text-white p-6 relative">
                    <button
                        onClick={onClose}
                        className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                        aria-label="Close dialog"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2 text-primary-400 text-xs font-bold uppercase tracking-wider mb-2">
                        <span>SaasLink Technologies Ltd</span> &bull; <span>Official School Enrollment</span>
                    </div>
                    <h2 className="text-2xl font-bold tracking-tight text-white">
                        {submittedData ? 'Subscription Application Confirmed' : 'Subscribe to SaasLink Cloud'}
                    </h2>
                    <p className="text-slate-300 text-xs mt-1">
                        {submittedData 
                            ? 'Your official institutional subscription has been registered with SaasLink Technologies Ltd.'
                            : 'Complete this verified registration form to subscribe and activate your school portal.'}
                    </p>
                </div>

                {submittedData ? (
                    /* Success Confirmation View */
                    <div className="p-8 text-center space-y-6">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <div>
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 mb-2">
                                Reference: {submittedData.referenceCode}
                            </span>
                            <h3 className="text-xl font-bold text-slate-900">
                                Welcome, {submittedData.schoolName}!
                            </h3>
                            <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto">
                                Your subscription to <strong>{planPrices[submittedData.plan]?.label}</strong> ({submittedData.billingCycle.toLowerCase()} cycle) has been received. Our onboarding engineer will reach you on <strong>{submittedData.contactPhone}</strong> to assist with school setup.
                            </p>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 max-w-md mx-auto text-slate-700">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Curriculum Structure:</span>
                                <span className="font-semibold text-slate-900">{submittedData.curriculumType.replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Lead Administrator:</span>
                                <span className="font-semibold text-slate-900">{submittedData.contactName} ({submittedData.contactRole})</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Termly/Annual Fee:</span>
                                <span className="font-semibold text-slate-900">KES {submittedData.amount.toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-1.5">
                                <span className="text-slate-500">Owner & Licensor:</span>
                                <span className="font-semibold text-primary-700">SaasLink Technologies Ltd</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                            <a
                                href={`https://wa.me/254720935895?text=Hello%20SaasLink%20Technologies%2C%20I%20just%20submitted%20subscription%20application%20${submittedData.referenceCode}%20for%20${encodeURIComponent(submittedData.schoolName)}.`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md inline-flex items-center justify-center gap-2 transition-colors"
                            >
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 16 16">
                                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326z"/>
                                </svg>
                                Fast-Track on WhatsApp
                            </a>
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Subscription Capture Form */
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                        {/* Plan & Cycle Selection Bar */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Selected Plan</label>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {[
                                            { id: SubscriptionPlan.FREE, label: 'Starter (Trial)' },
                                            { id: SubscriptionPlan.BASIC, label: 'Growth Suite' },
                                            { id: SubscriptionPlan.PREMIUM, label: 'Enterprise' }
                                        ].map((p) => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setPlan(p.id)}
                                                className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                                                    plan === p.id 
                                                        ? 'bg-primary-600 text-white border-primary-600 shadow-sm' 
                                                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                                }`}
                                            >
                                                {p.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Billing Cadence</label>
                                    <div className="flex flex-wrap gap-1 bg-white p-1 rounded-lg border border-slate-200 mt-1">
                                        <button
                                            type="button"
                                            onClick={() => setBillingCycle('TERMLY')}
                                            className={`px-2.5 py-1 text-xs font-bold rounded ${billingCycle === 'TERMLY' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            Per Term
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setBillingCycle('ANNUALLY')}
                                            className={`px-2.5 py-1 text-xs font-bold rounded ${billingCycle === 'ANNUALLY' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'}`}
                                        >
                                            Annual (Save 20%)
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-slate-200/80 text-xs">
                                <span className="text-slate-600 font-medium">Subscription Investment:</span>
                                <span className="text-base font-extrabold text-slate-900">
                                    KES {currentPrice.toLocaleString()} {billingCycle === 'ANNUALLY' ? '/ year' : '/ term'}
                                </span>
                            </div>
                        </div>

                        {/* Step 1: Institutional Identification */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 inline-flex items-center justify-center text-[10px]">1</span>
                                School Information
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Official School Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. St. Austin Academy"
                                        value={schoolName}
                                        onChange={(e) => setSchoolName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        MoE / KNEC Code (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 20401002"
                                        value={registrationCode}
                                        onChange={(e) => setRegistrationCode(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Curriculum Focus <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={curriculumType}
                                        onChange={(e) => setCurriculumType(e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="DUAL_CBC_TRADITIONAL">Dual CBC & Traditional</option>
                                        <option value="CBC_ONLY">CBC Only (Pre-Primary & Primary)</option>
                                        <option value="TRADITIONAL_844">Traditional 8-4-4 / KCSE</option>
                                        <option value="INTERNATIONAL_IGCSE">International / Cambridge IGCSE</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Enrollment Tier <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={studentCount}
                                        onChange={(e) => setStudentCount(e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="50-200">50 - 200 Students</option>
                                        <option value="200-500">201 - 500 Students</option>
                                        <option value="500-1000">501 - 1,000 Students</option>
                                        <option value="1000+">1,000+ Students</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        County / Region <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Nairobi / Kiambu"
                                        value={county}
                                        onChange={(e) => setCounty(e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Administrative Official */}
                        <div className="space-y-4 pt-2 border-t border-slate-200">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-primary-700 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary-100 text-primary-700 inline-flex items-center justify-center text-[10px]">2</span>
                                Administrator & Contact Person
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Contact Full Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Dr. Jane Mutua"
                                        value={contactName}
                                        onChange={(e) => setContactName(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Official Role / Title <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={contactRole}
                                        onChange={(e) => setContactRole(e.target.value)}
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="School Director / Owner">School Director / Owner</option>
                                        <option value="Principal / Headteacher">Principal / Headteacher</option>
                                        <option value="Finance Bursar / Accountant">Finance Bursar / Accountant</option>
                                        <option value="ICT Administrator">ICT Administrator</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Official Email Address <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="principal@yourschool.ac.ke"
                                        value={contactEmail}
                                        onChange={(e) => setContactEmail(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Direct Phone / WhatsApp No <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        placeholder="0720935895 or +254..."
                                        value={contactPhone}
                                        onChange={(e) => setContactPhone(e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Step 3: Mandatory Legal Consent Checkboxes (Protects SaasLink Technologies Ltd) */}
                        <div className="p-4 bg-slate-50 rounded-xl border-2 border-slate-200 space-y-3">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                                Mandatory Legal Agreements & Terms Acceptance
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">
                                You must check both conditions below to confirm your institutional subscription under the governance of <strong>SaasLink Technologies Ltd</strong>:
                            </p>

                            <div className="space-y-2.5 pt-1">
                                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                    />
                                    <span className="text-xs text-slate-700 leading-normal">
                                        I certify that I have legal authority to bind this school and unconditionally accept the{' '}
                                        <Link to="/terms" target="_blank" className="font-bold text-primary-600 hover:underline">
                                            Terms and Conditions of Service
                                        </Link>{' '}
                                        and{' '}
                                        <Link to="/cookies" target="_blank" className="font-bold text-primary-600 hover:underline">
                                            Cookies Policy
                                        </Link>{' '}
                                        of <strong>SaasLink Technologies Ltd</strong>.
                                    </span>
                                </label>

                                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={acceptPrivacy}
                                        onChange={(e) => setAcceptPrivacy(e.target.checked)}
                                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500 cursor-pointer"
                                    />
                                    <span className="text-xs text-slate-700 leading-normal">
                                        I accept the{' '}
                                        <Link to="/privacy" target="_blank" className="font-bold text-primary-600 hover:underline">
                                            Data Privacy & Protection Agreement
                                        </Link>{' '}
                                        pursuant to the Kenya Data Protection Act 2019, designating <strong>SaasLink Technologies Ltd</strong> as our secure cloud Data Processor.
                                    </span>
                                </label>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-[11px] text-slate-500 text-center sm:text-left">
                                Need direct support? Call: <strong className="text-slate-800">0720935895</strong>
                            </div>
                            <div className="flex gap-3 w-full sm:w-auto">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-1/2 sm:w-auto px-4 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!acceptTerms || !acceptPrivacy || isSubmitting}
                                    className={`w-1/2 sm:w-auto px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
                                        acceptTerms && acceptPrivacy && !isSubmitting
                                            ? 'bg-primary-600 hover:bg-primary-700 shadow-primary-600/30 hover:scale-[1.02]'
                                            : 'bg-slate-300 cursor-not-allowed text-slate-500 shadow-none'
                                    }`}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                                            Registering School...
                                        </>
                                    ) : (
                                        <>
                                            Complete Subscription
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                            </svg>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default SubscriptionModal;
