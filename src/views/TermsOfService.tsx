
import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-white">
            <nav className="border-b border-slate-100 py-6">
                <div className="max-w-4xl mx-auto px-6 flex justify-between items-center">
                    <Link to="/" className="flex items-center gap-2 group">
                        <div className="bg-primary-600 p-1.5 rounded-lg text-white">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/></svg>
                        </div>
                        <span className="font-black uppercase tracking-widest text-slate-900">Saaslink</span>
                    </Link>
                    <Link to="/register" className="text-sm font-bold text-primary-600 hover:text-primary-700">Start Free Trial</Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                <header className="mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Terms of Service</h1>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">Institutional Use Agreement • Eff. Oct 2023</p>
                </header>

                <div className="prose prose-slate prose-lg max-w-none space-y-12 text-slate-700 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">1. Acceptance of Terms</h2>
                        <p>By registering an institution on the Saaslink platform, the Administrator confirms they have the legal authority to bind the School to these terms. Usage of the system constitutes ongoing acceptance of all clauses herein.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">2. Subscription & Billing</h2>
                        <p>Service plans (Free, Basic, Premium) are billed in advance on a monthly or annual cycle. Failure to settle invoices within the 7-day grace period will result in automated portal lockout. Account restoration requires full settlement of arrears.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">3. M-Pesa Integration Liability</h2>
                        <p>Saaslink provides the bridge to Safaricom Daraja API. While we ensure 99.9% uptime of our integration, we are not liable for transaction delays caused by the Safaricom network or incorrect Paybill configuration by the school administration.</p>
                    </section>

                    <section className="bg-slate-900 p-8 rounded-[2rem] text-white">
                        <h2 className="text-2xl font-black text-primary-400 uppercase tracking-tight mb-4">4. Acceptable Use Policy</h2>
                        <p>The system shall not be used to:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4 font-bold uppercase text-[10px] tracking-widest text-slate-400">
                            <li>Store sensitive medical data outside designated fields.</li>
                            <li>Send unsolicited SMS broadcasts unrelated to school operations.</li>
                            <li>Attempt to bypass multi-tenancy isolation.</li>
                            <li>Reverse engineer any proprietary AI logic or financial algorithms.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">5. Intellectual Property</h2>
                        <p>All software code, database schemas, UI designs, and the Gemini-powered analysis models are the intellectual property of Saaslink Technologies Limited. Institutions are granted a non-exclusive license for the duration of their subscription.</p>
                    </section>
                </div>
            </main>

            <footer className="bg-slate-50 py-12 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">&copy; 2023 Saaslink Technologies Limited</p>
            </footer>
        </div>
    );
};

export default TermsOfService;
