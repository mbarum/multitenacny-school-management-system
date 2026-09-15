import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import Pricing from './Pricing';
import SubscriptionModal from './SubscriptionModal';
import DualCurriculumShowcase from './DualCurriculumShowcase';
import NewsModule from './NewsModule';
import ContactModule from './ContactModule';
import LanguageSelector from './LanguageSelector';
import { SubscriptionPlan } from '../../types';

interface LandingPageProps {
    onNavigate: (path: string, state?: any) => void;
}

// Cookie Consent Banner (Compliant with Kenya Data Protection Act 2019)
const CookieBanner: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('saaslink_cookie_consent');
        if (!consent) {
            setVisible(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('saaslink_cookie_consent', 'accepted');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <aside 
            aria-label="Cookie and Privacy Consent"
            className="fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-md text-white p-4 z-50 shadow-2xl border-t border-slate-700/80 animate-in slide-in-from-bottom duration-300"
        >
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-xs sm:text-sm">
                <div className="text-slate-300 max-w-4xl leading-relaxed">
                    <strong className="text-white">SaasLink Technologies Ltd Notice:</strong> We use functional and analytical cookies to safeguard session integrity, streamline M-Pesa payment callbacks, and personalize your administrative experience. Review our{' '}
                    <Link to="/cookies" className="text-primary-400 font-semibold hover:underline">
                        Cookies Policy
                    </Link>{' '}
                    and{' '}
                    <Link to="/privacy" className="text-primary-400 font-semibold hover:underline">
                        Data Privacy Agreement
                    </Link>.
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <button 
                        onClick={() => setVisible(false)} 
                        className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                    >
                        Necessary Only
                    </button>
                    <button 
                        onClick={accept} 
                        className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-600/30 transition-all"
                    >
                        Accept All Cookies
                    </button>
                </div>
            </div>
        </aside>
    );
};

// WhatsApp Floating Action Button (Linked to 0720935895)
const WhatsAppFAB: React.FC = () => (
    <a 
        href="https://wa.me/254720935895?text=Hello%20SaasLink%20Technologies%2C%20I%20would%20like%20to%20inquire%20about%20the%20School%20Management%20System." 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-700 text-white p-3.5 sm:p-4 rounded-full shadow-2xl transition-all hover:scale-110 hover:shadow-emerald-600/50 flex items-center justify-center group"
        aria-label="Chat with SaasLink Technical Team on WhatsApp"
        id="btn-whatsapp-floating"
    >
        <svg className="w-6 h-6 sm:w-7 sm:h-7 fill-current" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
        <span className="hidden sm:inline-block ml-2 text-xs font-bold tracking-wide">WhatsApp Support (0720935895)</span>
    </a>
);

// Structured FAQ Data
const faqs = [
    {
        question: "Does SaasLink accommodate both CBC (Competency-Based) and Traditional 8-4-4 learning?",
        answer: "Yes. SaasLink was engineered specifically for the Kenyan curriculum transition. Our hybrid academic engine lets schools run CBC formative assessments (EE, ME, AE, BE rubrics across sub-strands) for Pre-Primary and Primary/Junior Secondary cohorts, while concurrently running traditional percentage-based marks, mean grades (A to E), and rankings for 8-4-4 candidate classes on the same platform."
    },
    {
        question: "How does the direct M-Pesa integration prevent school fee leakage?",
        answer: "We connect directly to the automated M-Pesa gateway. When a parent pays via your school Paybill or Till with the student admission number as reference, an encrypted webhook callback is delivered within 800 milliseconds. The student ledger is credited instantly, an automated SMS receipt is dispatched to the parent, and the Bursar sees the live transaction. Zero manual receipt books, zero fake bank deposit slips."
    },
    {
        question: "What legal agreements govern our school's data on SaasLink?",
        answer: "All institutional data is strictly protected under the Kenya Data Protection Act 2019. SaasLink Technologies Ltd serves as your designated Data Processor, governed by our comprehensive Terms of Service and Data Processing Agreement. Subscribing schools maintain sole ownership of their records, which are encrypted at rest (AES-256) and backed up daily."
    },
    {
        question: "Can we migrate our existing student marks and fee records from Excel?",
        answer: "Yes. Every subscription includes dedicated technical onboarding. Our deployment engineers format and import your historical student bio-data, parent phone registries, and pending fee arrears from standard Excel or CSV sheets within 24 hours, at zero extra charge."
    },
    {
        question: "What happens if our school needs emergency technical assistance during exam or closing week?",
        answer: "We maintain a dedicated Kenyan technical support desk reachable directly via phone hotline at 0720935895 and WhatsApp (+254 720 935 895). Priority response is guaranteed within 15 minutes during academic reporting periods."
    }
];

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
    const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
    const [selectedModalPlan, setSelectedModalPlan] = useState<SubscriptionPlan>(SubscriptionPlan.BASIC);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const openSubscription = (plan: SubscriptionPlan = SubscriptionPlan.BASIC) => {
        setSelectedModalPlan(plan);
        setSubscriptionModalOpen(true);
        setMobileMenuOpen(false);
    };

    // Schema.org Structured Data for SEO - Multi-entity Knowledge Graph
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "@id": "https://saaslink.co.ke/#software",
                "name": "SaasLink School Management System",
                "operatingSystem": "Web, Cloud, iOS, Android",
                "applicationCategory": "EducationalApplication",
                "aggregateRating": {
                    "@type": "AggregateRating",
                    "ratingValue": "4.9",
                    "ratingCount": "184",
                    "bestRating": "5",
                    "worstRating": "1"
                },
                "description": "Comprehensive school management cloud system supporting Competency-Based Curriculum (CBC) and traditional 8-4-4 learning, featuring automated M-Pesa fee collection, parent portals, and KNEC assessment exports.",
                "offers": {
                    "@type": "AggregateOffer",
                    "priceCurrency": "KES",
                    "lowPrice": "0",
                    "highPrice": "62000",
                    "offerCount": "3"
                },
                "author": {
                    "@type": "EducationalOrganization",
                    "@id": "https://saaslink.co.ke/#organization",
                    "name": "SaasLink Technologies Ltd",
                    "telephone": "+254720935895",
                    "email": "info@saaslink.co.ke",
                    "url": "https://saaslink.co.ke",
                    "address": {
                        "@type": "PostalAddress",
                        "streetAddress": "Westlands Commercial Center",
                        "addressLocality": "Nairobi",
                        "addressRegion": "Nairobi County",
                        "addressCountry": "KE"
                    }
                }
            },
            {
                "@type": "WebSite",
                "@id": "https://saaslink.co.ke/#website",
                "url": "https://saaslink.co.ke",
                "name": "SaasLink Technologies Ltd",
                "description": "Premier Kenyan school ERP cloud platform for CBC rubrics, 8-4-4 grades, M-Pesa automated accounting, and student attendance.",
                "publisher": {
                    "@id": "https://saaslink.co.ke/#organization"
                }
            },
            {
                "@type": "FAQPage",
                "@id": "https://saaslink.co.ke/#faq",
                "mainEntity": [
                    {
                        "@type": "Question",
                        "name": "How does SaasLink automate school fee collection with M-Pesa?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "SaasLink connects directly to your school Paybill or Till via automated M-Pesa C2B APIs. When a parent pays using the student admission number as account reference, the system instantly matches the payment, sends an SMS receipt to the parent, updates the student ledger, and eliminates manual reconciliation."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Does SaasLink support the Kenyan Competency-Based Curriculum (CBC) and KNEC CBA?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes. SaasLink includes native digital rubrics for Exceeding Expectations (EE), Meeting Expectations (ME), Approaching Expectations (AE), and Below Expectations (BE) across all strands and sub-strands, with one-click export files formatted precisely for KNEC portal uploads."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Can a school manage both CBC Junior School and traditional 8-4-4 streams together?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes. SaasLink features concurrent dual-curriculum engine architecture allowing institutions to run standard numerical grading for 8-4-4 classes alongside formative competency rubrics for CBC classes under one unified database."
                        }
                    },
                    {
                        "@type": "Question",
                        "name": "Is school and learner data protected under the Kenya Data Protection Act 2019?",
                        "acceptedAnswer": {
                            "@type": "Answer",
                            "text": "Yes. SaasLink enforces strict multi-tenant data isolation, AES-256 encrypted backups, role-based access control, and complete audit logging compliant with the Office of the Data Protection Commissioner (ODPC) guidelines."
                        }
                    }
                ]
            }
        ]
    };

    return (
        <div className="min-h-screen w-full overflow-x-hidden bg-white text-slate-900 font-sans selection:bg-primary-500 selection:text-white">
            <Helmet>
                <title>SaasLink Technologies Ltd | School Management System for Kenyan Schools</title>
                <meta name="description" content="SaasLink is the premier school management cloud platform for Kenyan schools. Seamlessly manage CBC formative rubrics, traditional 8-4-4 marks, automated M-Pesa fee reconciliation, and parent SMS. Call 0720935895." />
                <meta name="keywords" content="CBC school system Kenya, Competency Based Curriculum software, KNEC CBA report cards, M-Pesa school fees automation, 8-4-4 school management system, SaasLink Technologies Ltd" />
                <link rel="canonical" href="https://saaslink.co.ke" />
                <meta property="og:title" content="SaasLink School Management Cloud | CBC & Traditional Learning Suite" />
                <meta property="og:description" content="Automate school fee collection with M-Pesa, grade CBC and traditional streams concurrently, and generate instant report cards." />
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            </Helmet>

            {/* Top Operational Hotline & Quick Switcher Bar */}
            <div className="bg-slate-950 text-slate-300 text-xs py-2.5 px-4 border-b border-slate-800">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-2">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            Hotline:
                        </span>
                        <a href="tel:0720935895" className="font-bold text-white hover:text-emerald-400 transition-colors">
                            0720935895
                        </a>
                        <span className="text-slate-600">&bull;</span>
                        <a 
                            href="https://wa.me/254720935895?text=Hello%20SaasLink%20Technologies%2C%20I%20would%20like%20to%20inquire%20about%20the%20School%20Management%20System."
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="font-semibold text-emerald-400 hover:text-emerald-300"
                        >
                            WhatsApp Chat
                        </a>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-400 hidden md:inline">
                            Proprietor: <strong>SaasLink Technologies Ltd</strong> (Kenya DPA 2019 Certified)
                        </span>
                        <LanguageSelector variant="dark" />
                    </div>
                </div>
            </div>

            {/* Main Navigation Header (Mobile First) */}
            <header className={`sticky top-0 z-30 transition-all duration-200 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-slate-200' : 'bg-white border-b border-slate-100'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
                    {/* Brand Identity */}
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="bg-primary-600 group-hover:bg-primary-700 transition-colors p-2 sm:p-2.5 rounded-xl text-white shadow-md shadow-primary-600/20">
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight">SaasLink</span>
                                <span className="text-[10px] font-black uppercase tracking-wider bg-primary-50 text-primary-700 px-2 py-0.5 rounded-md border border-primary-200">Cloud</span>
                            </div>
                            <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Technologies Ltd</span>
                        </div>
                    </Link>

                    {/* Desktop Navigation Links */}
                    <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-700">
                        <a href="#curriculum" className="hover:text-primary-600 transition-colors">CBC & 8-4-4</a>
                        <a href="#features" className="hover:text-primary-600 transition-colors">Capabilities</a>
                        <a href="#pricing" className="hover:text-primary-600 transition-colors">Subscription Plans</a>
                        <a href="#news" className="hover:text-primary-600 transition-colors">EdTech News</a>
                        <a href="#contact" className="hover:text-primary-600 transition-colors">Contact</a>
                    </nav>

                    {/* Action Buttons (Desktop & Mobile) */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Subscribe School Button */}
                        <button
                            onClick={() => openSubscription(SubscriptionPlan.BASIC)}
                            id="nav-subscribe-school"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-primary-600/30 hover:scale-[1.02] transition-all"
                        >
                            <span>Subscribe School</span>
                        </button>

                        {/* Mobile Hamburger Toggle Button */}
                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            id="btn-mobile-menu-toggle"
                            aria-label="Toggle Mobile Menu"
                            className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileMenuOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Mobile Dropdown Menu Drawer */}
                {mobileMenuOpen && (
                    <div className="lg:hidden bg-white border-b border-slate-200 px-4 pt-3 pb-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                        <nav className="flex flex-col space-y-3 text-sm font-bold text-slate-800">
                            <a 
                                href="#curriculum" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-slate-50"
                            >
                                CBC & 8-4-4 Standards
                            </a>
                            <a 
                                href="#features" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-slate-50"
                            >
                                Core Capabilities
                            </a>
                            <a 
                                href="#pricing" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-slate-50"
                            >
                                Subscription Tiers
                            </a>
                            <a 
                                href="#news" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-slate-50"
                            >
                                EdTech Regulations & News
                            </a>
                            <a 
                                href="#contact" 
                                onClick={() => setMobileMenuOpen(false)}
                                className="p-2 rounded-lg hover:bg-slate-50"
                            >
                                Contact & Support (0720935895)
                            </a>
                        </nav>

                        <div className="pt-3 border-t border-slate-100 flex flex-col gap-2.5">
                            <div className="flex items-center justify-between py-1">
                                <span className="text-xs font-semibold text-slate-500">Language:</span>
                                <LanguageSelector variant="light" />
                            </div>
                            <button
                                onClick={() => openSubscription(SubscriptionPlan.BASIC)}
                                className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold text-sm text-center shadow-md"
                            >
                                Subscribe School Now
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {/* Hero Section (Mobile First, Spacious, Authoritative) */}
            <section className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 bg-gradient-to-b from-slate-50 via-white to-slate-50 border-b border-slate-200 overflow-hidden">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold tracking-wide mb-6 shadow-sm">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>Official Operating Cloud for Kenyan Educational Institutions</span>
                    </div>

                    {/* Headline */}
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15] mb-6">
                        The Cloud School Operating System for{' '}
                        <span className="text-primary-600">
                            CBC & Traditional Learning
                        </span>.
                    </h1>

                    {/* Subhead */}
                    <p className="text-base sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto mb-10">
                        Designed for Kenyan Primary, Junior Secondary, and High Schools. Seamlessly unify KICD-compliant Competency-Based formative rubrics, 8-4-4 numeric examinations, automated M-Pesa fee reconciliation, and instant parent SMS. Managed by <strong>SaasLink Technologies Ltd</strong>.
                    </p>

                    {/* Mobile-Friendly CTAs */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 max-w-md sm:max-w-none mx-auto mb-12">
                        <button
                            onClick={() => openSubscription(SubscriptionPlan.BASIC)}
                            id="hero-btn-subscribe"
                            className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-base font-bold shadow-xl shadow-primary-600/30 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                        >
                            <span>Subscribe Your School Now</span>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                        </button>

                        <a
                            href="tel:0720935895"
                            className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>Call 0720935895</span>
                        </a>
                    </div>

                    {/* Authoritative Trust Metric Bar (Mobile-first responsive grid) */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-6 border-t border-slate-200/80 text-left">
                        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">450+</div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Schools Enrolled</div>
                            <div className="text-[11px] text-slate-400">Across 38 Kenyan Counties</div>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="text-2xl sm:text-3xl font-black text-emerald-600 tracking-tight">800ms</div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">M-Pesa Auto-Match</div>
                            <div className="text-[11px] text-slate-400">Zero manual receipting</div>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="text-2xl sm:text-3xl font-black text-primary-600 tracking-tight">100%</div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">KICD / KNEC CBA</div>
                            <div className="text-[11px] text-slate-400">Pre-Primary to Form 4</div>
                        </div>

                        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
                            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">DPA 2019</div>
                            <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">Data Sovereignty</div>
                            <div className="text-[11px] text-slate-400">Republic of Kenya Certified</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Curriculum Architecture (CBC & 8-4-4 Co-Existence) */}
            <DualCurriculumShowcase />

            {/* Core Capabilities Section (Clean 4-Card Layout, Mobile First) */}
            <section id="features" className="py-16 sm:py-24 bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
                        <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
                            Complete Administrative Suite
                        </span>
                        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                            Engineered for Institutional Rigor & Zero Fraud
                        </h2>
                        <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                            Every module addresses the everyday challenges of Kenyan School Directors, Principals, and Bursars—eliminating paper logbooks, lost fee payments, and manual report card compilation.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
                        {/* Capability 1 */}
                        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-6 shadow-md">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Direct M-Pesa Hook</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Link your institutional Paybill or Till number directly. When parents pay using the student's admission number, our webhook credits the ledger within 800 milliseconds and sends an immediate SMS receipt. Eliminates teller slips and prevents financial leakage.
                            </p>
                        </div>

                        {/* Capability 2 */}
                        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white flex items-center justify-center mb-6 shadow-md">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">KNEC-Ready Academic Portfolios</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Generate formative CBC rubrics (EE/ME/AE/BE) across strands and sub-strands, ready for KNEC CBA export. Concurrently compile 8-4-4 subject rankings, mean grade curves, and terminal broadsheets stamped with secure QR verification.
                            </p>
                        </div>

                        {/* Capability 3 */}
                        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-6 shadow-md">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Parent Portal & Automated SMS Broadcasts</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Empower parents with a dedicated mobile-responsive portal to check termly balances, download official receipts, and inspect report cards. Broadcast opening dates, urgent circulars, and fee reminders via branded sender ID.
                            </p>
                        </div>

                        {/* Capability 4 */}
                        <div className="p-6 sm:p-8 rounded-3xl bg-slate-50 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mb-6 shadow-md">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Sovereign Cloud & Kenya DPA 2019</h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                Role-based permissions guarantee that teachers only access their assigned streams while bursars manage finance. Backed by bank-grade encryption at rest and in transit, daily automated backups, and full regulatory compliance under Kenya's Data Protection Act.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Transparent Subscription Pricing Section */}
            <Pricing onSelectPlan={(plan) => openSubscription(plan)} />

            {/* EdTech & Kenyan Curriculum News Module */}
            <NewsModule />

            {/* Direct Contact & WhatsApp Module */}
            <ContactModule />

            {/* Frequently Asked Questions (Clean Accordion) */}
            <section id="faq" className="py-16 sm:py-24 bg-slate-50 border-t border-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                            Governance & Assurance
                        </span>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                            Frequently Asked Questions
                        </h2>
                        <p className="mt-3 text-slate-600 text-sm sm:text-base">
                            Key operational and legal details for School Directors, Principals, and Boards of Management.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div 
                                key={index} 
                                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-colors"
                            >
                                <button
                                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                    className="w-full flex justify-between items-center p-5 sm:p-6 text-left focus:outline-none hover:bg-slate-50/50"
                                >
                                    <span className="text-base sm:text-lg font-bold text-slate-900 pr-4">{faq.question}</span>
                                    <span className={`w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 transition-transform ${openFaqIndex === index ? 'rotate-180 bg-primary-50 text-primary-600' : 'text-slate-500'}`}>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </span>
                                </button>
                                {openFaqIndex === index && (
                                    <div className="px-5 sm:px-6 pb-6 text-sm sm:text-base text-slate-600 leading-relaxed border-t border-slate-100 pt-4 bg-slate-50/30">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Bottom Call to Action */}
            <section className="py-16 sm:py-20 bg-slate-950 text-white border-t border-slate-800">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
                    <span className="inline-block px-3.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
                        Rapid 24-Hour School Onboarding
                    </span>
                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                        Modernize Your Institution's Operations Today
                    </h2>
                    <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                        Join over 450 schools across Kenya benefiting from zero fee leakage, automated CBC rubrics, and sovereign cloud security with <strong>SaasLink Technologies Ltd</strong>.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 pt-4">
                        <button
                            onClick={() => openSubscription(SubscriptionPlan.BASIC)}
                            className="w-full sm:w-auto px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-2xl text-base font-bold shadow-xl shadow-primary-600/50 hover:scale-105 transition-all"
                        >
                            Subscribe Your School
                        </button>
                        <a
                            href="tel:0720935895"
                            className="w-full sm:w-auto px-6 py-4 bg-transparent hover:bg-slate-800/80 text-slate-200 rounded-2xl text-base font-bold border border-slate-700 transition-all text-center flex items-center justify-center gap-2"
                        >
                            <span>Call 0720935895</span>
                        </a>
                    </div>
                </div>
            </section>

            {/* Comprehensive Legal & Compliance Footer */}
            <footer className="bg-white pt-14 pb-10 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 sm:gap-10 mb-10">
                        {/* Column 1: Corporate Identity */}
                        <div className="md:col-span-2 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="bg-primary-600 p-2 rounded-xl text-white shadow-md">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                    </svg>
                                </div>
                                <span className="font-black text-xl text-slate-900 tracking-tight">SaasLink Technologies Ltd</span>
                            </div>
                            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md">
                                SaasLink Technologies Ltd is the registered proprietor, developer, and cloud operator of the SaasLink School Management System. Engineered in Nairobi, Kenya, in strict compliance with the Kenya Data Protection Act 2019 and Ministry of Education curriculum guidelines.
                            </p>
                            <div className="text-xs text-slate-500 space-y-1 pt-1">
                                <div><strong>Head Office:</strong> Westlands Commercial Center, Nairobi, Kenya</div>
                                <div><strong>Direct Telephone:</strong> 0720935895 / +254 720 935 895</div>
                                <div><strong>WhatsApp Desk:</strong> +254 720 935 895</div>
                                <div><strong>Email:</strong> info@saaslink.co.ke &bull; support@saaslink.co.ke</div>
                            </div>
                        </div>

                        {/* Column 2: System Features */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Capabilities</h4>
                            <ul className="space-y-2 text-xs text-slate-600">
                                <li><a href="#curriculum" className="hover:text-primary-600">CBC Formative Rubrics</a></li>
                                <li><a href="#curriculum" className="hover:text-primary-600">8-4-4 Numeric Examinations</a></li>
                                <li><a href="#features" className="hover:text-primary-600">M-Pesa Fee Hook</a></li>
                                <li><a href="#features" className="hover:text-primary-600">Parent Communications Portal</a></li>
                                <li><a href="#pricing" className="hover:text-primary-600">Subscription Plans</a></li>
                                <li><a href="#contact" className="hover:text-primary-600">Support & Inquiries</a></li>
                            </ul>
                        </div>

                        {/* Column 3: Legal & Regulatory */}
                        <div>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">Legal & Governance</h4>
                            <ul className="space-y-2 text-xs text-slate-600">
                                <li>
                                    <Link to="/terms" className="hover:text-primary-600 font-semibold text-slate-800">
                                        Terms and Conditions of Service
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/privacy" className="hover:text-primary-600 font-semibold text-slate-800">
                                        Data Privacy & Protection Policy
                                    </Link>
                                </li>
                                <li>
                                    <Link to="/cookies" className="hover:text-primary-600 font-semibold text-slate-800">
                                        Cookies Policy
                                    </Link>
                                </li>
                                <li><a href="#news" className="hover:text-primary-600">Kenya DPA 2019 Compliance</a></li>
                                <li><a href="#contact" className="hover:text-primary-600">Support Desk (0720935895)</a></li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
                        <p>
                            &copy; {new Date().getFullYear()} <strong>SaasLink Technologies Ltd</strong>. All rights reserved.
                        </p>
                        <div className="flex items-center gap-4">
                            <Link to="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
                            <span>&bull;</span>
                            <Link to="/terms" className="hover:text-slate-900">Terms of Service</Link>
                            <span>&bull;</span>
                            <Link to="/cookies" className="hover:text-slate-900">Cookies Policy</Link>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Interactive Subscription Capture Modal with Legal Protection */}
            <SubscriptionModal
                isOpen={subscriptionModalOpen}
                onClose={() => setSubscriptionModalOpen(false)}
                initialPlan={selectedModalPlan}
            />

            {/* Compliant Cookie Consent Banner */}
            <CookieBanner />

            {/* Floating Action Button for WhatsApp (0720935895) */}
            <WhatsAppFAB />
        </div>
    );
};

export default LandingPage;
