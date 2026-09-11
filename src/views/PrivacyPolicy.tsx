import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy: React.FC = () => {
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
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold mb-4">
                        Statutory Compliance: Kenya Data Protection Act 2019
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">Data Privacy & Protection Policy</h1>
                    <p className="text-slate-500 text-sm">
                        Owner & Proprietary Operator: <strong className="text-slate-800">SaasLink Technologies Ltd</strong> &bull; Registration: CPR/2023/102941 &bull; Nairobi, Kenya &bull; Last Revised: 2024
                    </p>
                </header>

                <div className="space-y-8 text-slate-700 text-base leading-relaxed bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm">
                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">1. Identification of the Data Processor and Controller</h2>
                        <p>
                            This Privacy Policy sets forth the binding data governance standards enacted by <strong>SaasLink Technologies Ltd</strong> (hereinafter referred to as <em>"SaasLink"</em>, <em>"we"</em>, <em>"us"</em>, or <em>"the Company"</em>), the sole owner and developer of the SaasLink School Management & Multi-Tenancy ERP software.
                        </p>
                        <p className="mt-3">
                            Under the provisions of the <strong>Kenya Data Protection Act, 2019 (DPA)</strong> and international privacy benchmarks (including the General Data Protection Regulation / GDPR):
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 mt-2 font-medium">
                            <li>The subscribing School / Institution acts as the <strong>Data Controller</strong>, responsible for obtaining lawful parental/guardian consent and entering accurate student, guardian, and staff records.</li>
                            <li><strong>SaasLink Technologies Ltd</strong> acts as the secure <strong>Data Processor</strong>, processing educational records strictly on behalf of and pursuant to instructions from the Data Controller.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">2. Categories of Information Processed</h2>
                        <p>To enable academic assessment (CBC and Traditional 8-4-4 grading), automated M-Pesa fee collection, and institutional administration, we process:</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Scholar & Academic Data</h3>
                                <p className="text-xs text-slate-600">Full legal names, NEMIS/Admission numbers, class streams, CBC formative rubric ratings (EE, ME, AE, BE), exam scores, and attendance logs.</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Parent & Guardian Contacts</h3>
                                <p className="text-xs text-slate-600">Verified telephone numbers for SMS report notifications and M-Pesa payment validation, email addresses, and home residential counties.</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Financial & Ledger Metadata</h3>
                                <p className="text-xs text-slate-600">Fee structures, payment receipts, Safaricom Daraja M-Pesa transaction reference codes, bank deposit references, and termly fee arrears.</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                                <h3 className="font-bold text-slate-900 text-sm mb-1">Institutional Credentials</h3>
                                <p className="text-xs text-slate-600">Ministry of Education registration codes, KRA PIN certificates, school bank account numbers for settlement routing, and teacher account identifiers.</p>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">3. Protection of Minors' Sensitive Educational Records</h2>
                        <p>
                            Given that primary and secondary school learners are classified as vulnerable data subjects, <strong>SaasLink Technologies Ltd</strong> enforces enhanced safeguards:
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 mt-2 font-medium">
                            <li>Learner records are segregated using multi-tenant cryptographic partition IDs. No unauthorized third party, advertiser, or foreign institution can view student performance.</li>
                            <li>Learner images and biometrics (if captured for student ID cards) are encrypted at rest with AES-256 and never utilized for automated algorithmic profiling.</li>
                            <li>Schools must certify that parental consent has been secured prior to enrolling learners into the system.</li>
                        </ul>
                    </section>

                    <section className="bg-slate-900 text-white p-8 rounded-2xl">
                        <h2 className="text-xl font-bold text-emerald-400 mb-3">4. Security Architecture & Disaster Resilience</h2>
                        <p className="text-sm text-slate-300 mb-4">
                            SaasLink Technologies Ltd employs defense-in-depth infrastructure standards across our sovereign cloud environments:
                        </p>
                        <ul className="space-y-2 text-sm text-slate-200">
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">&check;</span>
                                <strong>End-to-End Encryption:</strong> TLS 1.3 in transit with HSTS enforcement; AES-256 for all stored database records and automated backups.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">&check;</span>
                                <strong>Role-Based Access Control (RBAC):</strong> Strict granular permissions separating Bursar, Class Teacher, Principal, and Parent privileges.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">&check;</span>
                                <strong>Immutable Audit Trails:</strong> Every financial ledger adjustment, mark modification, or report export is time-stamped and logged.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-emerald-400 font-bold">&check;</span>
                                <strong>Automated Disaster Recovery:</strong> Geo-redundant snapshots executed every 6 hours with verified 15-minute point-in-time recovery.
                            </li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">5. Data Retention, Portability & Right to Erasure</h2>
                        <p>
                            Institutions retain 100% ownership over their data. Upon termination of an active institutional subscription or upon request from the School Board:
                        </p>
                        <ul className="list-disc pl-6 space-y-1.5 mt-2">
                            <li>The institution can export all student marksheets, financial balance sheets, and registries in standardized CSV and PDF formats within 30 days.</li>
                            <li>Following data extraction and settlement of accounts, SaasLink Technologies Ltd securely purges production database tables associated with the tenant in accordance with industry media sanitization standards.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-slate-900 mb-3">6. Third-Party Integrations & Safaricom Daraja API</h2>
                        <p>
                            To automate fee collection, SaasLink communicates directly with the Safaricom Daraja M-Pesa API. We store only official transaction confirmation tokens, amounts, and parent phone numbers for reconciliation. We never possess nor store parent M-Pesa PIN numbers or personal financial credentials.
                        </p>
                    </section>

                    <section className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">7. Legal Disclaimers & Limitation of Liability</h2>
                        <p className="text-sm text-slate-600 leading-normal">
                            SaasLink Technologies Ltd shall not be held liable for losses arising from unauthorized access resulting from institutional staff sharing passwords, failing to log out on public school terminals, or entering fraudulent student or fee data into the system. The subscribing school indemnifies SaasLink Technologies Ltd against third-party claims arising from breaches of parental consent by the institution.
                        </p>
                    </section>

                    <section className="border-t border-slate-200 pt-6">
                        <h2 className="text-lg font-bold text-slate-900 mb-2">8. Data Protection Officer (DPO) Contact</h2>
                        <p className="text-sm text-slate-600 mb-3">
                            Direct any inquiries regarding data protection, rights under the Kenya Data Protection Act 2019, or security audits to:
                        </p>
                        <div className="bg-primary-50/70 p-4 rounded-xl border border-primary-100 text-sm space-y-1">
                            <p><strong>Entity:</strong> SaasLink Technologies Ltd (Data Privacy Division)</p>
                            <p><strong>Telephone Hotline:</strong> 0720935895 / +254 720 935 895</p>
                            <p><strong>WhatsApp Support:</strong> +254 720 935 895</p>
                            <p><strong>Official Inquiries:</strong> legal@saaslink.co.ke</p>
                            <p><strong>Offices:</strong> Westlands Commercial Center, Nairobi, Kenya</p>
                        </div>
                    </section>
                </div>
            </main>

            <footer className="bg-white border-t border-slate-200 py-8 text-center text-sm text-slate-500">
                <p>&copy; {new Date().getFullYear()} SaasLink Technologies Ltd. All rights reserved.</p>
                <div className="flex justify-center gap-6 mt-3">
                    <Link to="/terms" className="hover:text-slate-900">Terms of Service</Link>
                    <Link to="/cookies" className="hover:text-slate-900">Cookies Policy</Link>
                    <Link to="/" className="hover:text-slate-900">Back to Landing Page</Link>
                </div>
            </footer>
        </div>
    );
};

export default PrivacyPolicy;
