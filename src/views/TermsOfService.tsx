import React from 'react';
import { Link } from 'react-router-dom';

const TermsOfService: React.FC = () => {
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
                        Binding Institutional Master Subscription Agreement
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Terms and Conditions of Service</h1>
                    <p className="text-slate-500 text-sm">
                        Proprietor & Licensor: <strong className="text-slate-800">SaasLink Technologies Ltd</strong> &bull; Governed under the Laws of Kenya &bull; Effective Date: January 2024 &bull; Version 4.0
                    </p>
                </header>

                <div className="space-y-8 text-slate-700 text-base leading-relaxed bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Ownership and Proprietary Rights</h2>
                        <p>
                            The SaasLink School Management System, including all source code, algorithms, visual interfaces, database architectures, documentation, and the CBC and Traditional learning evaluation engines, is the exclusive intellectual property of <strong>SaasLink Technologies Ltd</strong> ("SaasLink", "the Owner", "Licensor").
                        </p>
                        <p className="mt-3">
                            Subscription to this service grants the educational institution a limited, revocable, non-exclusive, non-transferable license to access the cloud software strictly for administrative, academic, and financial school management. No transfer of intellectual property rights, trademarks, or underlying software source code is conferred by this agreement.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. Authority to Bind the Institution</h2>
                        <p>
                            By checking the mandatory Terms & Conditions box during subscription registration or by executing an invoice payment, the individual completing the registration explicitly warrants and covenants that they are an authorized official (e.g., School Director, Board Member, Principal, Headteacher, or Bursar) possessing full legal power to bind the educational institution to these terms.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. Subscription Tiers, Invoicing and Settlement Cycles</h2>
                        <p>
                            Institutions may subscribe under <strong>Termly</strong> or <strong>Annual</strong> billing arrangements:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-2">
                            <li><strong>Invoicing:</strong> Official electronic invoices are issued 14 days prior to the commencement of a new academic term or billing cycle.</li>
                            <li><strong>Grace Period & Lockout Enforcement:</strong> A statutory 7-day grace period is granted following invoice due dates. Failure to settle outstanding SaaS subscription fees within the grace period will trigger automated platform lockout. While administrative write privileges are paused during lockout, existing historical records remain securely archived.</li>
                            <li><strong>Restoration of Service:</strong> Account restoration occurs automatically upon verified settlement via Lipa na M-Pesa Paybill, direct bank wire, or verified payment receipt submission.</li>
                            <li><strong>Taxes:</strong> All subscription fees quoted are subject to prevailing Value Added Tax (VAT) and statutory duties as mandated by the Kenya Revenue Authority (KRA).</li>
                        </ul>
                    </section>

                    <section className="bg-slate-900 text-white p-8 rounded-2xl">
                        <h2 className="text-xl font-bold text-emerald-400 mb-3">4. Limitation of Liability & Third-Party Telecommunications Disclaimer</h2>
                        <p className="text-sm text-slate-300 mb-3">
                            To the maximum extent permitted under Kenyan Law:
                        </p>
                        <ul className="space-y-3 text-sm text-slate-200">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">&bull;</span>
                                <strong>M-Pesa & Bank Gateway Dependency:</strong> SaasLink Technologies Ltd facilitates direct API communication with Safaricom Daraja and designated commercial banks. We shall NOT be held liable for delayed transaction notifications or network outages caused by Safaricom downtime, mobile network failure, or incorrect Paybill configurations input by school clerks.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">&bull;</span>
                                <strong>Consequential Damages:</strong> In no event shall SaasLink Technologies Ltd or its directors, officers, or employees be liable for indirect, punitive, incidental, or consequential losses, including lost tuition fees, parent disputes, or academic record delays.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">&bull;</span>
                                <strong>Aggregate Liability Cap:</strong> Total cumulative liability of SaasLink Technologies Ltd arising out of or related to this agreement shall be strictly capped at the total subscription fees paid by the institution during the immediately preceding three (3) calendar months.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">5. Institutional Obligations & Acceptable Use</h2>
                        <p>The subscribing school agrees to:</p>
                        <ul className="list-disc pl-6 space-y-1.5 mt-2">
                            <li>Maintain the confidentiality of administrative master credentials and enforce password hygiene among staff members.</li>
                            <li>Enter accurate, truthful student bio-data and adhere to the Kenya National Examinations Council (KNEC) and Kenya Institute of Curriculum Development (KICD) curriculum guidelines.</li>
                            <li>Refrain from attempting to reverse-engineer, decompile, copy, screen-scrape, or exploit any part of the system or its proprietary algorithms.</li>
                            <li>Not use the system's integrated SMS gateway to broadcast spam, political campaigning, unauthorized marketing, or content violating Kenyan communication laws.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">6. Service Level Commitment (99.9% Uptime Target)</h2>
                        <p>
                            SaasLink Technologies Ltd commits to providing 99.9% application availability, excluding scheduled maintenance windows announced at least 48 hours in advance (conducted outside school core teaching hours, typically 11:00 PM – 4:00 AM EAT).
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">7. Data Sovereignty, Termination & Retrieval</h2>
                        <p>
                            The subscribing school maintains ownership of its institutional data. Either party may terminate the subscription upon thirty (30) days' written notice prior to the end of an active academic term. Upon termination and full settlement of accounts, the school is granted a 30-day window to download complete data archives (student registries, financial ledgers, and academic reports) in standard spreadsheet and PDF formats.
                        </p>
                    </section>

                    <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">8. Governing Law & Dispute Resolution</h2>
                        <p className="text-sm text-slate-700 leading-normal">
                            This agreement is construed, interpreted, and governed in accordance with the Laws of the Republic of Kenya. Any dispute arising out of or in connection with these Terms shall first be referred to amicable negotiation between executive representatives of both parties. If unresolved within 21 days, the dispute shall be submitted to final and binding arbitration under the Nairobi Centre for International Arbitration (NCIA) Rules.
                        </p>
                    </section>

                    <section className="border-t border-slate-200 pt-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">9. Official Contacts for Legal Notices</h2>
                        <div className="bg-primary-50/70 p-4 rounded-xl border border-primary-100 text-sm space-y-1">
                            <p><strong>Entity:</strong> SaasLink Technologies Ltd</p>
                            <p><strong>Official Phone:</strong> 0720935895 / +254 720 935 895</p>
                            <p><strong>WhatsApp Support:</strong> +254 720 935 895</p>
                            <p><strong>Legal & Compliance Office:</strong> legal@saaslink.co.ke</p>
                            <p><strong>Postal & Physical Address:</strong> P.O. Box 28914-00100, Westlands, Nairobi, Kenya</p>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="bg-white border-t border-slate-200 py-8 text-center text-sm text-slate-500">
                <p>&copy; {new Date().getFullYear()} SaasLink Technologies Ltd. All rights reserved.</p>
                <div className="flex justify-center gap-6 mt-3">
                    <Link to="/privacy" className="hover:text-slate-900">Privacy Policy</Link>
                    <Link to="/cookies" className="hover:text-slate-900">Cookies Policy</Link>
                    <Link to="/" className="hover:text-slate-900">Back to Landing Page</Link>
                </div>
            </footer>
        </div>
    );
};

export default TermsOfService;
