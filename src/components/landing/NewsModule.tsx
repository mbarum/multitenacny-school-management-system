import React, { useState } from 'react';

interface Article {
    id: string;
    title: string;
    category: string;
    date: string;
    readTime: string;
    excerpt: string;
    author: string;
    authorRole: string;
    content: string[];
}

export const NewsModule: React.FC = () => {
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

    const articles: Article[] = [
        {
            id: 'cbc-assessment-matrix',
            title: 'Mastering the Junior School CBC Assessment Matrix: What Kenyan Headteachers Need to Know',
            category: 'CBC Curriculum',
            date: 'February 24, 2024',
            readTime: '4 min read',
            excerpt: 'How automated rubrics and continuous assessment trackers save teachers up to 14 hours every term while meeting strict KNEC CBA guidelines.',
            author: 'Mary Nduta Mburu',
            authorRole: 'Senior Educational Consultant & Former KICD Curriculum Specialist',
            content: [
                'The transition to the Competency-Based Curriculum (CBC) marks a profound shift from high-stakes rote examinations to continuous formative assessment. However, for many headteachers and subject facilitators, managing learner portfolios across multiple strands and sub-strands has introduced acute administrative friction.',
                'Under the Kenya National Examinations Council (KNEC) guidelines, teachers must track four distinct performance levels: Exceeding Expectations (EE), Meeting Expectations (ME), Approaching Expectations (AE), and Below Expectations (BE). When calculated manually on physical marksheets, this process consumes over 25 hours per term for a teacher managing three streams.',
                'Digital systems like SaasLink eliminate this friction by translating live classroom observations into standardized digital rubrics with single-click scoring. Teachers record assessments directly on smartphones or tablets, while the platform auto-compiles summary CBA upload files formatted precisely to KNEC portal specifications.',
                'The result? A 75% reduction in report compilation time, zero transcription errors, and rich, descriptive narrative reports that give parents deep clarity regarding their child’s unique aptitudes and values.'
            ]
        },
        {
            id: 'daraja-mpesa-school-fees',
            title: 'The Death of Paper Receipts: How Real-Time Daraja M-Pesa Integration Stops Fee Pilferage',
            category: 'School Finance',
            date: 'January 18, 2024',
            readTime: '5 min read',
            excerpt: 'Why over 400 private and public academies in Kenya are abandoning manual banking slips in favor of automated API ledger reconciliation.',
            author: 'David Ochieng, CPA(K)',
            authorRole: 'Head of Educational Accounts, SaasLink Technologies Ltd',
            content: [
                'Every term, school finance offices across Kenya face the same chaotic phenomenon: long cashier queues of parents clutching paper bank deposit slips, faded M-Pesa SMS messages forwarded from third parties, and hours spent manually scouring bank statements to locate missing transaction reference codes.',
                'Manual receipting creates two severe vulnerabilities: human error in ledger posting and deliberate presentation of fabricated or recycled deposit slips. School audits regularly reveal between 3% and 7% uncollected revenue due to slip reconciliation gaps.',
                'With SaasLink’s direct Safaricom Daraja API integration, parents pay directly to the school’s official Paybill quoting their scholar’s admission number as the account reference. Within 800 milliseconds, Safaricom sends a verified server-to-server webhook.',
                'The student’s digital fee ledger is credited instantly, the parent receives an automated SMS confirmation with a cryptographically verified receipt link, and the Bursar’s dashboard reflects the balance in real-time. No slips, no cash handling, and zero leakage.'
            ]
        },
        {
            id: 'data-privacy-kenyan-schools',
            title: 'Kenya Data Protection Act 2019: An Essential Compliance Guide for School Boards',
            category: 'Legal & Policy',
            date: 'March 02, 2024',
            readTime: '6 min read',
            excerpt: 'Understanding your statutory responsibilities as a Data Controller when collecting minor learner records, medical details, and guardian contacts.',
            author: 'Adv. Felix Kipkorir',
            authorRole: 'Legal Counsel, SaasLink Technologies Ltd',
            content: [
                'Enacted by the Parliament of Kenya, the Data Protection Act (DPA) of 2019 governs how organizations collect, process, store, and share personal data. Because schools routinely process sensitive data concerning minors, the Office of the Data Protection Commissioner (ODPC) has designated educational institutions as high-responsibility data controllers.',
                'Key statutory obligations required of schools include obtaining explicit parental consent, ensuring that student marks are not publicly displayed without authorization, and engaging only vetted, certified cloud data processors.',
                'SaasLink Technologies Ltd acts as your compliant Data Processor. All databases are isolated through rigorous multi-tenancy, encrypted at rest with AES-256 standards, and hosted in sovereign, highly audited cloud facilities. School directors can rest assured that their digital infrastructure complies fully with Kenyan statutory mandates.'
            ]
        },
        {
            id: 'dual-curriculum-hybrid',
            title: 'Dual-Curriculum Timetabling: Strategies for Schools Running CBC and Traditional 8-4-4 Concurrently',
            category: 'Academic Administration',
            date: 'December 12, 2023',
            readTime: '4 min read',
            excerpt: 'How hybrid academies seamlessly timetable shared laboratories, specialist teachers, and dual grading scales under one roof.',
            author: 'Grace Muthoni K.',
            authorRole: 'Principal, Greenfield Comprehensive School',
            content: [
                'During the ongoing national transition, Kenyan schools frequently operate as hybrid institutions—educating Junior Secondary learners under the CBC framework while preparing senior candidates under the traditional 8-4-4 or international curriculums.',
                'This dual environment creates administrative headaches: timetabling shared science labs, assigning teachers who instruct both systems, and generating two completely divergent report card formats at the close of term.',
                'SaasLink was engineered from inception with unified dual-curriculum flexibility. School administrators configure CBC learning areas for lower cohorts and numerical subject marksheets for senior forms on the exact same portal. Staff seamlessly view their individual schedules without curriculum conflict.'
            ]
        }
    ];

    return (
        <section id="news" className="py-20 bg-slate-50 border-t border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded-full uppercase tracking-wider mb-2">
                        Insights & Policy Updates
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                        EdTech News, CBC Guidelines & School Leadership
                    </h2>
                    <p className="mt-4 text-base sm:text-lg text-slate-600">
                        Authoritative practical analysis on curriculum transitions, automated school accounting, and statutory data protection from the SaasLink Technologies Ltd editorial team.
                    </p>
                </div>

                {/* News Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {articles.map((art) => (
                        <article
                            key={art.id}
                            className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between group"
                        >
                            <div>
                                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                                    <span className="px-2.5 py-1 bg-primary-50 text-primary-700 font-bold rounded-md">
                                        {art.category}
                                    </span>
                                    <span>{art.date} &bull; {art.readTime}</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-900 group-hover:text-primary-600 transition-colors leading-snug mb-3">
                                    {art.title}
                                </h3>
                                <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                    {art.excerpt}
                                </p>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                                        {art.author.charAt(0)}
                                    </div>
                                    <div className="text-xs">
                                        <div className="font-bold text-slate-900">{art.author}</div>
                                        <div className="text-slate-500 text-[10px] truncate max-w-[180px]">{art.authorRole}</div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setSelectedArticle(art)}
                                    className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                                >
                                    Read Article
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </div>

            {/* Read Article Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
                    <div 
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200"
                        role="dialog"
                        aria-modal="true"
                    >
                        <div className="p-6 md:p-8 bg-slate-900 text-white relative">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
                                aria-label="Close article"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                            <span className="inline-block px-2.5 py-1 bg-primary-500/20 text-primary-300 text-xs font-bold rounded mb-3">
                                {selectedArticle.category} &bull; {selectedArticle.date}
                            </span>
                            <h3 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-snug">
                                {selectedArticle.title}
                            </h3>
                            <div className="mt-4 flex items-center gap-3 text-xs text-slate-300 pt-3 border-t border-slate-800">
                                <span className="font-bold text-white">{selectedArticle.author}</span>
                                <span>&bull;</span>
                                <span className="text-slate-400">{selectedArticle.authorRole}</span>
                            </div>
                        </div>

                        <div className="p-6 md:p-8 space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {selectedArticle.content.map((paragraph, idx) => (
                                <p key={idx}>{paragraph}</p>
                            ))}

                            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 mt-6">
                                <strong>Published by:</strong> SaasLink Technologies Ltd Editorial & Curriculum Research Division. For institutional permissions or workshop inquiries, contact <strong>0720935895</strong> or email <strong>editor@saaslink.co.ke</strong>.
                            </div>
                        </div>

                        <div className="p-4 bg-slate-100 border-t border-slate-200 flex justify-end">
                            <button
                                onClick={() => setSelectedArticle(null)}
                                className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                            >
                                Close Article
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
};

export default NewsModule;
