
import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
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
                    <Link to="/login" className="text-sm font-bold text-primary-600 hover:text-primary-700">System Login</Link>
                </div>
            </nav>

            <main className="max-w-4xl mx-auto px-6 py-16 md:py-24">
                <header className="mb-16">
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Privacy Policy</h1>
                    <p className="text-slate-400 font-bold uppercase text-xs tracking-[0.3em]">Last Updated: October 2023 • Version 2.1</p>
                </header>

                <div className="prose prose-slate prose-lg max-w-none space-y-12 text-slate-700 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">1. Data Sovereignty</h2>
                        <p>At Saaslink, we recognize that school data—including student records, financial ledgers, and guardian contact details—is the sole property of the subscribing Institution. We act as data processors under the instructions of the school administration (the Data Controller).</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">2. Information Collection</h2>
                        <p>We collect information necessary to provide educational management services, including:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4 font-medium">
                            <li>Institutional metadata (School name, address, KRA PIN).</li>
                            <li>Student Personal Identifiable Information (PII) as provided by the school.</li>
                            <li>Financial transaction metadata from M-Pesa and Stripe integrations.</li>
                            <li>Administrative logs and system usage patterns for security auditing.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">3. Payment Information & Security</h2>
                        <p>For fee collection via M-Pesa, we process phone numbers and transaction codes. Credit card information processed via Stripe is never stored on our servers; it is handled via end-to-end encrypted tokens provided by the payment gateway.</p>
                    </section>

                    <section className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">4. Security Measures</h2>
                        <p>We employ bank-grade security protocols, including:</p>
                        <ul className="list-disc pl-6 space-y-2 mt-4 font-medium">
                            <li>AES-256 Encryption at rest.</li>
                            <li>TLS 1.3 Encryption for all data in transit.</li>
                            <li>Daily automated off-site backups.</li>
                            <li>Strict RBAC (Role-Based Access Control) to prevent internal data leakage.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-4">5. Contact Information</h2>
                        <p>For data inquiries or to exercise your right to be forgotten (as governed by the Kenya Data Protection Act 2019), please contact our Data Protection Officer at <a href="mailto:privacy@saaslink.com" className="text-primary-600 font-bold underline">privacy@saaslink.com</a>.</p>
                    </section>
                </div>
            </main>

            <footer className="bg-slate-50 py-12 border-t border-slate-100 text-center">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">&copy; 2023 Saaslink Technologies Limited</p>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;
