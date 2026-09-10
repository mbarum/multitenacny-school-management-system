
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import Pricing from './Pricing';
import { SubscriptionPlan } from '../../types';
import { Link } from 'react-router-dom';

interface LandingPageProps {
    onNavigate: (path: string, state?: any) => void;
}

// Inline component for Cookie Banner
const CookieBanner: React.FC = () => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const consent = localStorage.getItem('cookie_consent');
        if (!consent) {
            setVisible(true);
        }
    }, []);

    const accept = () => {
        localStorage.setItem('cookie_consent', 'true');
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 text-white p-4 z-50 shadow-inner flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-slate-700">
            <div className="text-sm text-slate-300 max-w-3xl">
                We use cookies to enhance your experience, analyze site traffic, and serve personalized content. By clicking "Accept", you consent to our use of cookies in accordance with our <Link to="/privacy" className="underline text-primary-400 hover:text-primary-300">Cookie Policy</Link>.
            </div>
            <div className="flex gap-3">
                <button onClick={() => setVisible(false)} className="px-4 py-2 text-sm text-slate-300 hover:text-white transition-colors">Decline</button>
                <button onClick={accept} className="px-6 py-2 bg-primary-600 text-white text-sm font-bold rounded-lg hover:bg-primary-700 transition-colors shadow-lg shadow-primary-900/50">
                    Accept All
                </button>
            </div>
        </div>
    );
};

// Inline component for WhatsApp FAB
const WhatsAppFAB: React.FC = () => (
    <a 
        href="https://wa.me/254720935895?text=Hello%20Saaslink%2C%20I%20would%20like%20to%20know%20more%20about%20the%20school%20system." 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-green-500 text-white p-4 rounded-full shadow-2xl hover:bg-green-600 transition-transform hover:scale-110 hover:shadow-green-500/40 flex items-center justify-center group"
        aria-label="Chat on WhatsApp"
    >
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
            <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
        </svg>
        <span className="absolute right-full mr-3 bg-slate-800 text-white text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
            Chat with Support
        </span>
    </a>
);

// FAQ Data
const faqs = [
    {
        question: "Is Saaslink compliant with the Kenyan CBC curriculum?",
        answer: "Yes, Saaslink is fully optimized for the Competency-Based Curriculum (CBC). It handles assessment rubrics, learning areas, and generates reports compliant with KNEC standards."
    },
    {
        question: "How does the M-Pesa integration work?",
        answer: "We integrate directly with Safaricom's Daraja API. When a parent pays via Paybill, the transaction is automatically detected, matched to the student's admission number, and the fee balance is updated instantly. No manual entry required."
    },
    {
        question: "Is my school's data secure?",
        answer: "Absolutely. We use bank-grade AES-256 encryption for all data storage and SSL/TLS for all data transmission. We also perform automated daily backups to ensure you never lose your records."
    },
    {
        question: "Can I manage multiple school branches?",
        answer: "Yes, Saaslink supports multi-tenancy. You can manage multiple branches from a single Super Admin dashboard with our Enterprise plan."
    },
    {
        question: "Do you offer training for teachers?",
        answer: "Yes, we provide free onboarding training for your administration and teaching staff to ensure everyone is comfortable using the system from day one."
    }
];

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleSelectPlan = (plan: SubscriptionPlan, billing: 'MONTHLY' | 'ANNUALLY') => {
        onNavigate('/register', { plan, billing });
    };

    const navLinks = [
        { name: 'Features', href: '#features' },
        { name: 'How it Works', href: '#how-it-works' },
        { name: 'Pricing', href: '#pricing' },
        { name: 'FAQ', href: '#faq' },
    ];

    // Structured Data (Schema.org)
    const schemaData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "SoftwareApplication",
                "name": "Saaslink School Management System",
                "operatingSystem": "Web",
                "applicationCategory": "EducationalApplication",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "KES"
                },
                "description": "Comprehensive school management software for East Africa featuring M-Pesa integration, CBC grading, and AI financial reporting."
            },
            {
                "@type": "Organization",
                "name": "Saaslink Technologies",
                "url": "https://saaslink.com",
                "logo": "https://saaslink.com/logo.png",
                "contactPoint": {
                    "@type": "ContactPoint",
                    "telephone": "+254-720-935-895",
                    "contactType": "sales",
                    "areaServed": ["KE", "UG", "TZ", "RW"]
                }
            }
        ]
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-primary-100 selection:text-primary-900 overflow-x-hidden">
            <Helmet>
                <title>Saaslink | #1 School Management System with M-Pesa & CBC</title>
                <meta name="description" content="Best School Management System in Kenya & East Africa. Automate fees with M-Pesa, manage CBC exams, generate reports, and track finances with AI. Try for free." />
                <meta name="keywords" content="School Management System Kenya, M-Pesa School Fees, CBC Grading System, School ERP East Africa, School Accounting Software" />
                <link rel="canonical" href="https://saaslink.com" />
                
                {/* Open Graph / Facebook */}
                <meta property="og:type" content="website" />
                <meta property="og:url" content="https://saaslink.com/" />
                <meta property="og:title" content="Saaslink - The Modern School OS for Africa" />
                <meta property="og:description" content="Streamline your school with automated fee collection, academic reporting, and financial insights. Built for Kenya, Uganda, Tanzania, and Rwanda." />
                <meta property="og:image" content="https://saaslink.com/og-image.jpg" />

                {/* Twitter */}
                <meta property="twitter:card" content="summary_large_image" />
                <meta property="twitter:url" content="https://saaslink.com/" />
                <meta property="twitter:title" content="Saaslink - School Management Simplified" />
                <meta property="twitter:description" content="The all-in-one platform for schools. Finance, Academics, Communication." />
                <meta property="twitter:image" content="https://saaslink.com/og-image.jpg" />
                
                {/* Structured Data */}
                <script type="application/ld+json">
                    {JSON.stringify(schemaData)}
                </script>
            </Helmet>

            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-md shadow-sm border-b border-slate-200 py-2' : 'bg-transparent py-4'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center cursor-pointer group" onClick={() => window.scrollTo(0,0)}>
                            <div className="bg-gradient-to-tr from-primary-700 to-primary-500 rounded-xl p-2 shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform duration-300">
                                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className="ml-3 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">Saaslink</span>
                        </div>

                        {/* Desktop Nav */}
                        <div className="hidden md:flex space-x-8 items-center">
                            {navLinks.map((link) => (
                                <a key={link.name} href={link.href} className="text-sm font-medium text-slate-600 hover:text-primary-600 transition-colors">
                                    {link.name}
                                </a>
                            ))}
                            <div className="flex items-center space-x-4 ml-4">
                                <button onClick={() => onNavigate('/login')} className="text-sm font-semibold text-slate-700 hover:text-primary-700 transition-colors">
                                    Log in
                                </button>
                                <button 
                                    onClick={() => handleSelectPlan(SubscriptionPlan.FREE, 'MONTHLY')} 
                                    className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-full hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button 
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                                className="text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors focus:outline-none"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isMobileMenuOpen ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    )}
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMobileMenuOpen && (
                    <div className="md:hidden absolute top-16 left-0 w-full bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-xl py-6 px-6 flex flex-col space-y-4 animate-fade-in-down">
                        {navLinks.map((link) => (
                            <a key={link.name} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium text-slate-700 hover:text-primary-600">
                                {link.name}
                            </a>
                        ))}
                        <hr className="border-slate-100" />
                        <button onClick={() => onNavigate('/login')} className="w-full py-3 bg-slate-100 text-slate-700 font-semibold rounded-xl hover:bg-slate-200">
                            Log in
                        </button>
                        <button onClick={() => handleSelectPlan(SubscriptionPlan.FREE, 'MONTHLY')} className="w-full py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg">
                            Get Started Free
                        </button>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <header className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
                {/* Background Decor */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-100/50 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
                    <div className="inline-flex items-center gap-2 py-1.5 px-4 rounded-full bg-white border border-slate-200 shadow-sm text-primary-700 text-xs sm:text-sm font-semibold mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
                        </span>
                        New: AI Financial Insights & Reporting
                    </div>
                    
                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-[1.1]">
                        Run Your School <br className="hidden sm:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-teal-500">From The Cloud.</span>
                    </h1>
                    
                    <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Access your school data from anywhere, on any device. 
                        We automate M-Pesa payments, academic reports, and accounting so you can focus on education.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16 relative z-20">
                        <button 
                            onClick={() => handleSelectPlan(SubscriptionPlan.BASIC, 'MONTHLY')}
                            className="px-8 py-4 bg-primary-600 text-white rounded-xl text-lg font-bold shadow-xl shadow-primary-600/30 hover:bg-primary-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-2"
                        >
                            Start Free Trial
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                        </button>
                        <button onClick={() => onNavigate('/login')} className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl text-lg font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
                            View Live Demo
                        </button>
                    </div>

                    {/* Sophisticated UI Showcase */}
                    <div className="relative max-w-5xl mx-auto mt-20 group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                        {/* Browser Main Window */}
                        <div className="relative z-10 bg-white rounded-3xl shadow-[0_32px_64px_-12px_rgba(0,0,0,0.15)] border border-slate-200 overflow-hidden transform group-hover:-translate-y-2 transition-transform duration-700 ease-out">
                            <div className="bg-slate-900 h-10 flex items-center px-4 space-x-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></div>
                                <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></div>
                                <div className="flex-1 flex justify-center">
                                    <div className="bg-slate-800 rounded-md px-10 py-1 text-[10px] text-slate-400 font-medium">saaslink.cloud/dashboard</div>
                                </div>
                            </div>
                            
                            <div className="flex h-[450px] sm:h-[600px]">
                                {/* Sidebar Mockup */}
                                <div className="hidden lg:flex w-20 sm:w-64 bg-slate-50 border-r border-slate-100 flex-col py-6 px-4 space-y-6">
                                    <div className="flex items-center space-x-3 px-2 mb-4">
                                        <div className="w-8 h-8 bg-primary-600 rounded-lg shrink-0"></div>
                                        <div className="h-3 w-24 bg-slate-200 rounded"></div>
                                    </div>
                                    {[1,2,3,4,5].map(i => (
                                        <div key={i} className="flex items-center space-x-3 px-2">
                                            <div className="w-5 h-5 bg-slate-200 rounded shrink-0"></div>
                                            <div className="h-2 w-32 bg-slate-100 rounded"></div>
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Content Area Mockup */}
                                <div className="flex-1 p-6 sm:p-10 overflow-hidden bg-white">
                                    <div className="flex justify-between items-center mb-10">
                                        <div className="h-6 w-48 bg-slate-100 rounded-lg"></div>
                                        <div className="flex items-center space-x-4">
                                            <div className="w-8 h-8 rounded-full bg-slate-100"></div>
                                            <div className="w-24 h-8 rounded-xl bg-primary-600"></div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                                        {[
                                            { color: 'bg-green-100', text: 'Revenue' },
                                            { color: 'bg-blue-100', text: 'Students' },
                                            { color: 'bg-orange-100', text: 'Fees Due' }
                                        ].map((card, i) => (
                                            <div key={i} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                                <div className={`w-10 h-10 ${card.color} rounded-xl mb-4`}></div>
                                                <div className="h-2 w-16 bg-slate-100 rounded mb-2"></div>
                                                <div className="h-4 w-24 bg-slate-200 rounded"></div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 h-full">
                                        <div className="flex justify-between mb-6">
                                            <div className="h-3 w-32 bg-slate-200 rounded"></div>
                                            <div className="h-3 w-16 bg-slate-200 rounded"></div>
                                        </div>
                                        <div className="space-y-4">
                                            {[1,2,3,4].map(i => (
                                                <div key={i} className="flex items-center justify-between py-3 border-b border-white">
                                                    <div className="flex items-center space-x-4">
                                                        <div className="w-10 h-10 rounded-full bg-white border border-slate-100"></div>
                                                        <div className="space-y-2">
                                                            <div className="h-2 w-32 bg-slate-200 rounded"></div>
                                                            <div className="h-1.5 w-20 bg-slate-100 rounded"></div>
                                                        </div>
                                                    </div>
                                                    <div className="h-5 w-20 bg-green-100 rounded-lg"></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating Action Cards */}
                        {/* 1. M-Pesa Confirmation Bubble */}
                        <div className="absolute -top-10 -right-4 sm:-right-10 z-20 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
                            <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center gap-4">
                                <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">
                                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">M-Pesa Reconciliation</p>
                                    <p className="text-sm font-black text-slate-800">Payment Verified: KES 14,500</p>
                                </div>
                            </div>
                        </div>

                        {/* 2. AI Insight Bubble */}
                        <div className="absolute -bottom-6 -left-4 sm:-left-12 z-20 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
                            <div className="bg-slate-900 p-5 rounded-2xl shadow-2xl border border-slate-700 max-w-xs text-left">
                                <div className="flex items-center gap-2 mb-3">
                                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                                    <span className="text-[9px] font-black text-primary-400 uppercase tracking-[0.2em]">Gemini AI Assistant</span>
                                </div>
                                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                    "I've detected a 12% increase in fee collection efficiency this term compared to last year."
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </header>
            
            {/* The "Anywhere" Banner */}
            <div className="bg-slate-900 py-12 border-y border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-slate-800">
                        <div className="p-4">
                            <h3 className="text-white font-bold text-lg mb-2">100% Cloud Based</h3>
                            <p className="text-slate-400 text-sm">No servers to buy. No installation required. Just login and manage.</p>
                        </div>
                        <div className="p-4">
                            <h3 className="text-white font-bold text-lg mb-2">Accessible Anywhere</h3>
                            <p className="text-slate-400 text-sm">Works on your laptop, tablet, and smartphone. Data syncs instantly.</p>
                        </div>
                        <div className="p-4">
                            <h3 className="text-white font-bold text-lg mb-2">Bank-Grade Security</h3>
                            <p className="text-slate-400 text-sm">Daily automated backups and encrypted connections keep data safe.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <section id="features" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-primary-600 font-bold tracking-wide uppercase text-sm mb-3">Why Saaslink?</h2>
                        <p className="text-4xl font-extrabold text-slate-900">A complete operating system for your school</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Finance Card */}
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-shadow duration-300">
                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01m0 0v6m0-6h6m-6 0H6" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Smart Finance</h3>
                            <ul className="space-y-4 text-slate-600">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span><strong>Automated M-Pesa</strong> fee collection with STK Push.</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span><strong>Gemini AI</strong> financial reports & insights.</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span>Real-time fee balance tracking.</span>
                                </li>
                            </ul>
                        </div>

                        {/* Academics Card */}
                        <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-shadow duration-300">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Academics & Exams</h3>
                            <ul className="space-y-4 text-slate-600">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span>Support for <strong>CBC & Traditional</strong> grading systems.</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span>Automated report card generation.</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span>Digital Library management system.</span>
                                </li>
                            </ul>
                        </div>

                         {/* Admin Card */}
                         <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-xl transition-shadow duration-300">
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-900 mb-4">Staff & Parents</h3>
                            <ul className="space-y-4 text-slate-600">
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span>Parent Portal for grades & fee balances.</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span>Bulk SMS & Email communication.</span>
                                </li>
                                <li className="flex items-start">
                                    <svg className="w-5 h-5 text-primary-500 mr-3 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                    <span>Staff Payroll with statutory deductions.</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works Section */}
            <section id="how-it-works" className="py-24 bg-white border-t border-slate-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
                            Up and running in minutes
                        </h2>
                        <p className="mt-4 text-lg text-slate-600">
                            Skip the expensive IT setup. Saaslink is plug-and-play.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
                        {/* Step 1 */}
                        <div className="relative group">
                            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold transition-transform group-hover:scale-110">1</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Create Account</h3>
                            <p className="text-slate-600 max-w-sm mx-auto">Register your school profile securely. No installation or hardware required.</p>
                        </div>
                        {/* Step 2 */}
                        <div className="relative group">
                             {/* Connector Line (Desktop) */}
                            <div className="hidden md:block absolute top-8 -left-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
                            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold transition-transform group-hover:scale-110">2</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Import Data</h3>
                            <p className="text-slate-600 max-w-sm mx-auto">Upload your student list via CSV or add them manually. We organize everything instantly.</p>
                        </div>
                        {/* Step 3 */}
                        <div className="relative group">
                            <div className="hidden md:block absolute top-8 -left-1/2 w-full h-0.5 bg-slate-100 -z-10"></div>
                            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-6 text-xl font-bold transition-transform group-hover:scale-110">3</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">Automate Fees</h3>
                            <p className="text-slate-600 max-w-sm mx-auto">Connect M-Pesa. Payments reconcile automatically. Parents get receipts instantly.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <Pricing onSelectPlan={handleSelectPlan} />

            {/* FAQ Section (SEO Optimized) */}
            <section id="faq" className="py-20 bg-slate-50 border-t border-slate-100">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</h2>
                        <p className="mt-4 text-lg text-slate-600">Everything you need to know about the product and billing.</p>
                    </div>
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div key={index} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                                <button
                                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                    className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
                                >
                                    <span className="text-lg font-medium text-slate-800">{faq.question}</span>
                                    <svg className={`w-5 h-5 text-slate-500 transform transition-transform ${openFaqIndex === index ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                                {openFaqIndex === index && (
                                    <div className="px-6 pb-6 text-slate-600 animate-fade-in-down">
                                        {faq.answer}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-primary-600 to-primary-800 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to digitize your school?</h2>
                    <p className="text-xl text-primary-100 mb-10">Join the fastest growing school management platform in East Africa. Try it free for 14 days.</p>
                    <button 
                        onClick={() => handleSelectPlan(SubscriptionPlan.FREE, 'MONTHLY')}
                        className="px-8 py-4 bg-white text-primary-800 rounded-full text-lg font-bold shadow-2xl hover:bg-slate-100 hover:scale-105 transition-all"
                    >
                        Create Free Account
                    </button>
                    <p className="mt-4 text-sm opacity-70">No credit card required for Starter plan.</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-white pt-16 pb-8 border-t border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center text-slate-900 mb-6">
                            <div className="bg-primary-600 rounded-lg p-1.5 mr-3">
                                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold tracking-tight">Saaslink</span>
                        </div>
                        <p className="text-slate-500 max-w-sm">
                            Simplifying education management with secure, cloud-based technology designed for modern African schools.
                        </p>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Product</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li><a href="#features" className="hover:text-primary-600">Features</a></li>
                            <li><a href="#pricing" className="hover:text-primary-600">Pricing</a></li>
                            <li><Link to="/login" className="hover:text-primary-600">Admin Login</Link></li>
                            <li><Link to="/register" className="hover:text-primary-600">Register School</Link></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 mb-4">Contact</h4>
                        <ul className="space-y-2 text-sm text-slate-600">
                            <li>sales@saaslink.com</li>
                            <li>+254 720 935 895</li>
                            <li>Nairobi, Kenya</li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center text-sm text-slate-500">
                    <p>&copy; {new Date().getFullYear()} Saaslink Technologies. All rights reserved.</p>
                    <div className="flex space-x-6 mt-4 md:mt-0">
                        <Link to="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
                        <Link to="/terms" className="hover:text-slate-900">Terms of Service</Link>
                    </div>
                </div>
            </footer>

            {/* Cookie Banner */}
            <CookieBanner />
            {/* WhatsApp Floating Button */}
            <WhatsAppFAB />
        </div>
    );
};

export default LandingPage;
