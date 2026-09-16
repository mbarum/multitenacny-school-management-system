import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    BookOpenCheck,
    Award,
    Target,
    UploadCloud,
    Compass,
    Binary,
    TrendingUp,
    FileSpreadsheet,
    CheckCircle2,
    ShieldCheck,
    Sparkles
} from 'lucide-react';

export const DualCurriculumShowcase: React.FC = () => {
    const { t } = useLanguage();

    return (
        <section id="curriculum" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Section Header */}
                <div className="max-w-3xl mx-auto text-center mb-12 sm:mb-16">
                    <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-xs font-bold rounded-full uppercase tracking-wider mb-3">
                        {t('curriculum.badge', 'Dual-Curriculum Standard & K-12 Regional Support')}
                    </span>
                    <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                        {t('curriculum.title', 'Unified for Competency-Based (CBE) & Traditional 8-4-4 Systems')}
                    </h2>
                    <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed">
                        {t('curriculum.desc', 'Institutions across East Africa and beyond face the demanding reality of managing formative Competency-Based levels alongside traditional numeric 8-4-4 classes from Primary through High School. SaasLink delivers dedicated, certified grading engines for both pathways under one unified platform.')}
                    </p>
                </div>

                {/* Side-by-Side Architectural Pillars (Stacks on mobile, 2 columns on tablet/desktop) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
                    {/* CBC / CBE Track Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200/70 shadow-2xs">
                                    {t('curriculum.cbe.tag', 'Primary, Junior & Senior Secondary (K-12)')}
                                </span>
                                <span className="text-xs font-semibold text-emerald-600 bg-emerald-50/50 px-2.5 py-1 rounded-lg border border-emerald-100">CBE / CBC Aligned</span>
                            </div>

                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-600/25 ring-4 ring-emerald-50 group-hover:scale-105 transition-transform duration-300">
                                    <BookOpenCheck className="w-7 h-7 text-white stroke-[2.2]" />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                        {t('curriculum.cbe.title', 'Competency-Based Education (CBE / CBC)')}
                                    </h3>
                                    <p className="text-xs font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
                                        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                                        Formative Rubric Evaluation Engine
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                {t('curriculum.cbe.desc', 'Fully configured for formative assessment methodologies across Pre-Primary, Lower Primary, Upper Primary (KPSEA), Junior Secondary, and Senior High School levels.')}
                            </p>

                            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                                <div className="flex items-start gap-3.5 p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-emerald-50/30 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border border-emerald-200/60">
                                        <Target className="w-4.5 h-4.5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-bold text-sm">Standard 4-Level Formative Rubrics:</strong>
                                        <span className="text-slate-600 leading-relaxed">Exceeding (EE), Meeting (ME), Approaching (AE), and Below Expectations (BE) tracked across strands, sub-strands, and learning tasks.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5 p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-emerald-50/30 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border border-emerald-200/60">
                                        <UploadCloud className="w-4.5 h-4.5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-bold text-sm">National Assessment & Ministry Synchronization:</strong>
                                        <span className="text-slate-600 leading-relaxed">Export formative learner scores formatted directly for upload to national assessment portals, eliminating manual data entry.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5 p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-emerald-50/30 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border border-emerald-200/60">
                                        <Compass className="w-4.5 h-4.5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-bold text-sm">Core Competencies & Holistic Values:</strong>
                                        <span className="text-slate-600 leading-relaxed">Built-in qualitative evaluation for communication, critical thinking, digital literacy, civic citizenship, and self-efficacy.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Primary through High School Ready</span>
                            <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
                                Automated CBE Report Cards
                            </span>
                        </div>
                    </div>

                    {/* 8-4-4 & High School Track Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/90 shadow-sm flex flex-col justify-between hover:shadow-lg transition-all duration-300 group">
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1.5 rounded-full border border-primary-200/70 shadow-2xs">
                                    {t('curriculum.traditional.tag', 'Primary to High School Examination Streams')}
                                </span>
                                <span className="text-xs font-semibold text-primary-600 bg-primary-50/50 px-2.5 py-1 rounded-lg border border-primary-100">8-4-4 Standard</span>
                            </div>

                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-600 to-indigo-800 text-white flex items-center justify-center shrink-0 shadow-md shadow-primary-600/25 ring-4 ring-primary-50 group-hover:scale-105 transition-transform duration-300">
                                    <Award className="w-7 h-7 text-white stroke-[2.2]" />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                        {t('curriculum.traditional.title', 'Traditional 8-4-4 & Numeric Examination System')}
                                    </h3>
                                    <p className="text-xs font-bold text-primary-700 mt-1 flex items-center gap-1.5">
                                        <TrendingUp className="w-3.5 h-3.5 text-primary-600" />
                                        Standard Mean Grade & Ranking Engine
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                {t('curriculum.traditional.desc', 'Complete multi-assessment examination suite configured for primary schools, high schools, boarding academies, and numeric curriculum streams.')}
                            </p>

                            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                                <div className="flex items-start gap-3.5 p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-primary-50/30 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border border-primary-200/60">
                                        <Binary className="w-4.5 h-4.5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-bold text-sm">12-Point Grade Engine & Curve Analytics:</strong>
                                        <span className="text-slate-600 leading-relaxed">Automated grade conversion (A to E, 12 to 1 points), subject mean grade calculations, and stream class rankings.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5 p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-primary-50/30 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border border-primary-200/60">
                                        <TrendingUp className="w-4.5 h-4.5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-bold text-sm">Continuous Assessment Weightings:</strong>
                                        <span className="text-slate-600 leading-relaxed">Automate Opener, Midterm CAT, and Endterm finals with custom institutional percentages and grade boundary curves.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5 p-4 bg-slate-50/80 rounded-2xl border border-slate-100/90 hover:bg-primary-50/30 transition-colors">
                                    <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 shadow-2xs mt-0.5 border border-primary-200/60">
                                        <FileSpreadsheet className="w-4.5 h-4.5 stroke-[2.2]" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-bold text-sm">Institutional Merit Broadsheets:</strong>
                                        <span className="text-slate-600 leading-relaxed">Generate comprehensive cohort broadsheets with mean deviations, subject rankings, and print-ready formats for BOM audits.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Certified for Ministry Inspections</span>
                            <span className="font-bold text-primary-700 flex items-center gap-1.5">
                                <ShieldCheck className="w-4 h-4 text-primary-600 stroke-[2.5]" />
                                One-Click PDF/Excel Export
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DualCurriculumShowcase;
