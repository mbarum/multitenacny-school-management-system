import React from 'react';
import { Link } from 'react-router-dom';

const CookiePolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 text-slate-900">
            <nav className="border-b border-slate-200 bg-white sticky top-0 z-30">
                <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-primary-600 p-2 rounded-xl text-white shadow-md">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                            </svg>
                        </div>
                        <div>
                            <span className="font-extrabold text-slate-900 tracking-tight text-lg">SaasLink</span>
                            <span className="block text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Technologies Ltd</span>
                        </div>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link to="/" className="text-sm font-semibold text-slate-600 hover:text-primary-600">Home</Link>
                        <Link to="/login" className="text-sm font-bold text-primary-600 hover:text-primary-700 bg-primary-50 px-3 py-1.5 rounded-lg">Login</Link>
                    </div>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-12 md:py-16">
                <header className="mb-12 border-b border-slate-200 pb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-bold mb-4">
                        Compliance & Data Transparency
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Cookies & Local Storage Policy</h1>
                    <p className="text-slate-500 text-sm">
                        Proprietor: <strong className="text-slate-800">SaasLink Technologies Ltd</strong> &bull; Registered in the Republic of Kenya &bull; Effective Date: January 2024 &bull; Version 3.2
                    </p>
                </header>

                <div className="space-y-8 text-slate-700 text-base leading-relaxed bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Purpose and Scope</h2>
                        <p>
                            This Cookies Policy explains how <strong>SaasLink Technologies Ltd</strong> ("SaasLink", "the Company", "we", "us") utilizes cookies, local browser storage, and related session tracking technologies when educational institutions, administrators, teachers, parents, and scholars interact with the SaasLink School Cloud platform.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. What Are Cookies and Local Storage?</h2>
                        <p>
                            Cookies are small encrypted data files placed on your device by your browser. Local Storage is a modern web standard enabling client browsers to cache non-sensitive interface preferences and security tokens. We use these technologies exclusively to authenticate authorized users, safeguard session integrity, protect against Cross-Site Request Forgery (CSRF), and maintain multi-tenant data isolation.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. Categories of Cookies We Employ</h2>
                        <div className="space-y-4 mt-4">
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <h3 className="font-bold text-slate-900">A. Strictly Necessary & Authentication Cookies</h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    Vital for system operation. These hold temporary encrypted cryptographic tokens to identify your authenticated role (e.g., School Principal, Bursar, Teacher, or Parent) and ensure no tenant can access another school's confidential database records.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <h3 className="font-bold text-slate-900">B. Operational & Financial Security Cookies</h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    Used during fee payments, invoice verification, and M-Pesa Daraja callbacks to validate idempotency and avoid duplicate ledger entries.
                                </p>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                                <h3 className="font-bold text-slate-900">C. User Interface & Preferences</h3>
                                <p className="text-sm text-slate-600 mt-1">
                                    Stores user settings such as curriculum preference (CBC vs Traditional 8-4-4 views), active academic terms, table sorting, and sidebar collapsed status.
                                </p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">4. Strict Prohibition of Third-Party Advertising Trackers</h2>
                        <p>
                            <strong>SaasLink Technologies Ltd adheres to a strict educational privacy mandate:</strong> We never sell, lease, or syndicate student or parent behavioral data. We do NOT host third-party behavioral advertising cookies, ad networks, or data brokers on our school management portals.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">5. Managing and Withdrawing Consent</h2>
                        <p>
                            Users may adjust cookie preferences anytime via their browser settings. Please note that disabling strictly necessary cookies will prevent login and access to academic marksheets, financial ledgers, and parent portals.
                        </p>
                    </section>

                    <section className="bg-primary-50 p-6 rounded-xl border border-primary-100">
                        <h2 className="text-lg font-bold text-primary-900 mb-2">6. Contacting Our Data Protection Desk</h2>
                        <p className="text-sm text-primary-800 mb-2">
                            For technical inquiries concerning cookie implementations or to report concerns:
                        </p>
                        <ul className="text-sm text-primary-900 font-medium space-y-1">
                            <li><strong>Entity:</strong> SaasLink Technologies Ltd</li>
                            <li><strong>Direct Helpline:</strong> 0720935895 (+254 720 935 895)</li>
                            <li><strong>Email:</strong> privacy@saaslink.co.ke</li>
                            <li><strong>Headquarters:</strong> Westlands, Nairobi, Republic of Kenya</li>
                        </ul>
                    </section>
                </div>
            </main>

            <footer className="bg-white border-t border-slate-200 py-8 text-center text-sm text-slate-500">
                <p>&copy; {new Date().getFullYear()} SaasLink Technologies Ltd. All rights reserved.</p>
                <div className="flex justify-center gap-6 mt-3">
                    <Link to="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
                    <Link to="/terms" className="hover:text-slate-900">Terms of Service</Link>
                    <Link to="/" className="hover:text-slate-900">Back to Landing Page</Link>
                </div>
            </footer>
        </div>
    );
};

export default CookiePolicy;
