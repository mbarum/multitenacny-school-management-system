import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import {
    GraduationCap,
    BarChart3,
    Sliders,
    CloudUpload,
    Sparkles,
    Calculator,
    LineChart,
    FileSpreadsheet,
    CheckCircle2,
    FileCheck
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
                    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                                    {t('curriculum.cbe.tag', 'Primary, Junior & Senior Secondary (K-12)')}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">CBE / CBC Aligned</span>
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs border border-emerald-200/60">
                                    <GraduationCap className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                        {t('curriculum.cbe.title', 'Competency-Based Education (CBE / CBC)')}
                                    </h3>
                                    <p className="text-xs text-emerald-700 font-semibold mt-0.5">Formative Rubric Evaluation Engine</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                {t('curriculum.cbe.desc', 'Fully configured for formative assessment methodologies across Pre-Primary, Lower Primary, Upper Primary (KPSEA), Junior Secondary, and Senior High School levels.')}
                            </p>

                            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                                <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                        <Sliders className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">Standard 4-Level Formative Rubrics:</strong>
                                        <span className="text-slate-600">Exceeding (EE), Meeting (ME), Approaching (AE), and Below Expectations (BE) tracked across strands, sub-strands, and learning tasks.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                        <CloudUpload className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">National Assessment & Ministry Synchronization:</strong>
                                        <span className="text-slate-600">Export formative learner scores formatted directly for upload to national assessment portals, eliminating manual data entry.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                        <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">Core Competencies & Holistic Values:</strong>
                                        <span className="text-slate-600">Built-in qualitative evaluation for communication, critical thinking, digital literacy, civic citizenship, and self-efficacy.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Primary through High School Ready</span>
                            <span className="font-semibold text-emerald-700 flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                Automated CBE Report Cards
                            </span>
                        </div>
                    </div>

                    {/* 8-4-4 & High School Track Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div>
                            <div className="flex items-center justify-between gap-4 mb-6">
                                <span className="text-xs font-bold uppercase tracking-wider text-primary-700 bg-primary-50 px-3 py-1 rounded-full border border-primary-200">
                                    {t('curriculum.traditional.tag', 'Primary to High School Examination Streams')}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">8-4-4 Standard</span>
                            </div>

                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-700 flex items-center justify-center shrink-0 shadow-xs border border-primary-200/60">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">
                                        {t('curriculum.traditional.title', 'Traditional 8-4-4 & Numeric Examination System')}
                                    </h3>
                                    <p className="text-xs text-primary-700 font-semibold mt-0.5">Standard Mean Grade & Ranking Engine</p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-600 leading-relaxed mb-6">
                                {t('curriculum.traditional.desc', 'Complete multi-assessment examination suite configured for primary schools, high schools, boarding academies, and numeric curriculum streams.')}
                            </p>

                            <div className="space-y-4 text-xs sm:text-sm text-slate-700">
                                <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-xl bg-primary-100/80 text-primary-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                        <Calculator className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">12-Point Grade Engine & Curve Analytics:</strong>
                                        <span className="text-slate-600">Automated grade conversion (A to E, 12 to 1 points), subject mean grade calculations, and stream class rankings.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-xl bg-primary-100/80 text-primary-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                        <LineChart className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">Continuous Assessment Weightings:</strong>
                                        <span className="text-slate-600">Automate Opener, Midterm CAT, and Endterm finals with custom institutional percentages and grade boundary curves.</span>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
                                    <div className="w-8 h-8 rounded-xl bg-primary-100/80 text-primary-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                                        <FileSpreadsheet className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <strong className="text-slate-900 block font-semibold">Institutional Merit Broadsheets:</strong>
                                        <span className="text-slate-600">Generate comprehensive cohort broadsheets with mean deviations, subject rankings, and print-ready formats for BOM audits.</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                            <span>Certified for Ministry Inspections</span>
                            <span className="font-semibold text-primary-700 flex items-center gap-1.5">
                                <FileCheck className="w-4 h-4 text-primary-600" />
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
