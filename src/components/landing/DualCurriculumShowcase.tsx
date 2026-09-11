import React from 'react';

export const DualCurriculumShowcase: React.FC = () => {
    return (
        <section id="curriculum" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
                        Dual-Curriculum Standard
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        Built Specifically for CBC & 8-4-4 Co-Existence
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                        Kenyan institutions face the complex reality of managing formative Competency-Based levels alongside traditional numeric 8-4-4 classes. SaasLink provides dedicated, certified grading engines for both pathways under one roof.
                    </p>
                </div>

                {/* Side-by-Side Architectural Pillars (Stacks on mobile, 2 columns on tablet/desktop) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    {/* CBC Track Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                    Grade 1 - 9 & Early Years
                                </span>
                                <span className="text-xs font-semibold text-slate-500">KICD Aligned</span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                                Competency-Based Curriculum (CBC)
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                Fully configured for formative assessment methodologies across Pre-Primary, Lower Primary, Upper Primary (KPSEA), and Junior School (Grade 7, 8 & 9).
                            </p>

                            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">&check;</div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">Official KICD 4-Level Rubrics:</strong>
                                        <span>Exceeding (EE), Meeting (ME), Approaching (AE), and Below Expectations (BE) tracked across strands and sub-strands.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">&check;</div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">KNEC CBA Portal Synchronization:</strong>
                                        <span>Export formative learner scores formatted directly for upload to the KNEC assessment portal, eliminating manual data entry.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">&check;</div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">Core Competencies & Values:</strong>
                                        <span>Built-in qualitative evaluation for communication, critical thinking, citizenship, creativity, and self-efficacy.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Includes KPSEA & KJSEA readiness</span>
                            <span className="font-semibold text-emerald-700">Automated Report Cards</span>
                        </div>
                    </div>

                    {/* 8-4-4 & Secondary Track Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
                                    Form 1 - 4 & Senior School
                                </span>
                                <span className="text-xs font-semibold text-slate-500">KCSE Standard</span>
                            </div>

                            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3">
                                Traditional 8-4-4 & Numeric System
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                Complete multi-assessment examination suite configured for Kenyan high schools, boarding academies, and numeric curriculum streams.
                            </p>

                            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">&check;</div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">KNEC 12-Point Grade Engine:</strong>
                                        <span>Automated grade conversion (A to E, 12 to 1 points), subject mean grade calculations, and stream class rankings.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">&check;</div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">Continuous Assessment Weightings:</strong>
                                        <span>Automate Opener, Midterm CAT, and Endterm finals with custom institutional percentages and grade boundary curves.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                                    <div className="w-5 h-5 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">&check;</div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">Institutional Merit Broadsheets:</strong>
                                        <span>Generate comprehensive cohort broadsheets with mean deviations, subject rankings, and print-ready formats for BOM audits.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Certified for Ministry of Education inspections</span>
                            <span className="font-semibold text-primary-700">One-Click PDF/Excel Export</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DualCurriculumShowcase;
