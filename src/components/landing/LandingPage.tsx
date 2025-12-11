
import React from 'react';
import Pricing from './Pricing';
import { SubscriptionPlan } from '../../types';

interface LandingPageProps {
    onNavigate: (path: string, state?: any) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {

    const handleSelectPlan = (plan: SubscriptionPlan, billing: 'MONTHLY' | 'ANNUALLY') => {
        onNavigate('/register', { plan, billing });
    };

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            {/* Navbar */}
            <nav className="fixed w-full bg-white/90 backdrop-blur-md z-50 border-b border-slate-100" aria-label="Main Navigation">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="bg-primary-600 rounded-lg p-1.5">
                                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className="ml-3 text-xl font-bold text-slate-900 tracking-tight">Saaslink</span>
                        </div>
                        <div className="hidden md:flex space-x-8 items-center">
                            <a href="#features" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Features</a>
                            <a href="#pricing" className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Pricing</a>
                            <button onClick={() => onNavigate('/login')} className="text-slate-600 hover:text-primary-600 font-medium transition-colors">Log in</button>
                            <button 
                                onClick={() => handleSelectPlan(SubscriptionPlan.FREE, 'MONTHLY')} 
                                className="px-5 py-2 bg-primary-600 text-white rounded-full font-semibold hover:bg-primary-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <header className="pt-32 pb-20 lg:pt-40 lg:pb-28 bg-gradient-to-b from-slate-50 to-white overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="text-center max-w-4xl mx-auto z-10 relative">
                        <span className="inline-block py-1.5 px-4 rounded-full bg-white text-primary-700 text-sm font-semibold mb-6 border border-slate-200 shadow-sm">
                            The #1 School Management System in East Africa
                        </span>
                        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-8 leading-tight">
                            Manage Your School <br/>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-800">Like a Pro</span>
                        </h1>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto font-light">
                            Streamline admissions, automate M-Pesa fee collection, track academics, and get AI-powered financial insights. All in one secure platform tailored for Kenyan, Ugandan, Tanzanian, and Rwandan schools.
                        </p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button 
                                onClick={() => handleSelectPlan(SubscriptionPlan.BASIC, 'MONTHLY')}
                                className="px-8 py-4 bg-primary-600 text-white rounded-xl text-lg font-bold shadow-lg hover:bg-primary-700 hover:shadow-xl hover:-translate-y-1 transition-all flex items-center justify-center"
                            >
                                Start Your Free Trial
                                <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                            </button>
                            <button onClick={() => onNavigate('/login')} className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-xl text-lg font-bold shadow-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
                                Admin Login
                            </button>
                        </div>
                        <p className="mt-8 text-sm text-slate-500 flex flex-wrap items-center justify-center gap-6">
                            <span className="flex items-center"><svg className="w-5 h-5 mr-1.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> Instant Setup</span>
                            <span className="flex items-center"><svg className="w-5 h-5 mr-1.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> 14-Day Free Trial</span>
                            <span className="flex items-center"><svg className="w-5 h-5 mr-1.5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> No Credit Card Required</span>
                        </p>
                    </div>
                </div>
            </header>
            
            {/* Trusted By Section (Social Proof) */}
            <section className="py-10 bg-white border-b border-slate-100" aria-label="Trusted By Schools">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-6">Trusted by modern schools across East Africa</p>
                    <div className="flex justify-center items-center gap-8 md:gap-16 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholder Logos for professionalism */}
                         <div className="text-xl font-bold text-slate-600 flex items-center gap-2"><div className="w-8 h-8 bg-slate-300 rounded"></div> ACADEMY</div>
                         <div className="text-xl font-bold text-slate-600 flex items-center gap-2"><div className="w-8 h-8 bg-slate-300 rounded-full"></div> HIGH SCHOOL</div>
                         <div className="text-xl font-bold text-slate-600 flex items-center gap-2"><div className="w-8 h-8 bg-slate-300 rounded"></div> INT. SCHOOL</div>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section id="features" className="py-24 bg-slate-50" aria-label="Features">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-primary-600 font-semibold tracking-wide uppercase text-sm">Powerful Features</h2>
                        <p className="mt-2 text-3xl font-extrabold text-slate-900 sm:text-4xl">Everything you need to run a modern school</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                            {
                                title: 'Automated M-Pesa',
                                desc: 'Collect fees instantly via STK Push. Automated reconciliation means no more lost receipts or manual data entry.',
                                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v.01m0 0v6m0-6h6m-6 0H6" /></svg>
                            },
                            {
                                title: 'AI Financial Insights',
                                desc: 'Gemini AI acts as your virtual CFO, analyzing income and expenses to provide executive summaries and alerts.',
                                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            },
                            {
                                title: 'Parent Portal',
                                desc: 'Give parents real-time access to grades, fee balances, and announcements from any device, anywhere.',
                                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 5.197M15 21a6 6 0 00-9-5.197" /></svg>
                            },
                            {
                                title: 'Library Management',
                                desc: 'Track book issuance, returns, lost books, and fines with a complete library system. Never lose a book again.',
                                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                            },
                             {
                                title: 'Staff & Payroll',
                                desc: 'Manage staff profiles, track attendance, and generate compliant payslips and P9 forms effortlessly.',
                                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.653-.122-1.28-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.653.122-1.28.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            },
                            {
                                title: 'Multi-Tenant Security',
                                desc: 'Enterprise-grade data isolation ensures your school records are private, backed up, and secure.',
                                icon: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            }
                        ].map((item, idx) => (
                            <article key={idx} className="bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group">
                                <div className="bg-primary-50 w-12 h-12 rounded-xl flex items-center justify-center text-primary-600 mb-6 group-hover:bg-primary-600 group-hover:text-white transition-colors">
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-3">{item.title}</h3>
                                <p className="text-slate-600 leading-relaxed text-sm">{item.desc}</p>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <Pricing onSelectPlan={handleSelectPlan} />

            {/* Footer */}
            <footer className="bg-slate-900 text-slate-300 py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center text-white mb-6">
                            <div className="bg-primary-600 rounded-lg p-1 mr-3">
                                <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                            </div>
                            <span className="text-2xl font-bold tracking-tight">Saaslink</span>
                        </div>
                        <p className="max-w-md text-slate-400 mb-6">Transforming education management across Africa with cutting-edge technology and seamless payments.</p>
                        <div className="flex space-x-4">
                            {/* Social icons placeholders */}
                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                                <span className="sr-only">Twitter</span>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
                            </div>
                            <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors cursor-pointer">
                                <span className="sr-only">LinkedIn</span>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Product</h4>
                        <ul className="space-y-3 text-sm">
                            <li><a href="#features" className="hover:text-primary-500 transition-colors">Features</a></li>
                            <li><a href="#pricing" className="hover:text-primary-500 transition-colors">Pricing</a></li>
                            <li><a href="/login" className="hover:text-primary-500 transition-colors">Admin Login</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Contact Sales</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 00-2-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                <a href="mailto:sales@saaslink.com" className="hover:text-white transition-colors">sales@saaslink.com</a>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                <span>+254 720 935 895</span>
                            </li>
                            <li className="flex items-start">
                                <svg className="w-5 h-5 mr-2 text-primary-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                <span>Nairobi, Kenya</span>
                            </li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 pt-8 border-t border-slate-800 text-sm text-center flex flex-col md:flex-row justify-between items-center">
                    <p>&copy; {new Date().getFullYear()} Saaslink Technologies. All rights reserved.</p>
                    <div className="space-x-6 mt-4 md:mt-0">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;