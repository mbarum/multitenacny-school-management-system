import React, { useState, useEffect } from 'react';
import type { LmsSubmission, LmsAssignment } from '../../types';

interface LmsGradingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveGrade: (submissionId: string, gradeData: {
        score: number;
        gradeLetter: string;
        teacherFeedback?: string;
        gradedBy?: string;
        rubricScores?: Array<{ criterion: string; score: number; maxScore: number }>;
    }) => Promise<void>;
    submission: LmsSubmission | null;
    assignment: LmsAssignment | null;
    currentTeacherName?: string;
}

const LmsGradingModal: React.FC<LmsGradingModalProps> = ({
    isOpen,
    onClose,
    onSaveGrade,
    submission,
    assignment,
    currentTeacherName = 'Teacher'
}) => {
    const totalPoints = assignment?.totalPoints || 50;

    const [score, setScore] = useState<number>(45);
    const [gradeLetter, setGradeLetter] = useState('A');
    const [feedback, setFeedback] = useState('');
    const [rubricScores, setRubricScores] = useState([
        { criterion: 'Concept Understanding & Theory', score: 18, maxScore: 20 },
        { criterion: 'Methodology & Calculations', score: 18, maxScore: 20 },
        { criterion: 'Neatness & Presentation', score: 9, maxScore: 10 }
    ]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    // Compute letter grade from score
    const computeGradeLetter = (val: number, max: number) => {
        const pct = (val / max) * 100;
        if (pct >= 80) return 'A';
        if (pct >= 70) return 'B';
        if (pct >= 60) return 'C';
        if (pct >= 50) return 'D';
        return 'E';
    };

    useEffect(() => {
        if (submission) {
            const initialScore = submission.score !== undefined && submission.score !== null 
                ? submission.score 
                : Math.round(totalPoints * 0.85);
            setScore(initialScore);
            setGradeLetter(submission.gradeLetter || computeGradeLetter(initialScore, totalPoints));
            setFeedback(submission.teacherFeedback || 'Well organized solution with clear logical steps. Good mastery of CBC key concepts.');
            if (submission.rubricScores && submission.rubricScores.length > 0) {
                setRubricScores(submission.rubricScores.map(r => ({
                    criterion: r.criterion || r.name || 'Criterion',
                    score: r.score !== undefined ? r.score : (r.awardedScore !== undefined ? r.awardedScore : r.maxScore),
                    maxScore: r.maxScore
                })));
            } else {
                setRubricScores([
                    { criterion: 'Concept Understanding & Theory', score: Math.round(totalPoints * 0.4 * 0.9), maxScore: Math.round(totalPoints * 0.4) },
                    { criterion: 'Methodology & Calculations', score: Math.round(totalPoints * 0.4 * 0.85), maxScore: Math.round(totalPoints * 0.4) },
                    { criterion: 'Neatness & Presentation', score: Math.round(totalPoints * 0.2 * 0.9), maxScore: Math.round(totalPoints * 0.2) }
                ]);
            }
        }
        setError('');
    }, [submission, totalPoints, isOpen]);

    if (!isOpen || !submission || !assignment) return null;

    const handleScoreChange = (val: number) => {
        const clamped = Math.max(0, Math.min(totalPoints, val));
        setScore(clamped);
        setGradeLetter(computeGradeLetter(clamped, totalPoints));
    };

    const handleRubricScoreChange = (idx: number, val: number) => {
        const copy = [...rubricScores];
        copy[idx].score = Math.max(0, Math.min(copy[idx].maxScore, val));
        setRubricScores(copy);
        const sum = copy.reduce((acc, curr) => acc + curr.score, 0);
        setScore(sum);
        setGradeLetter(computeGradeLetter(sum, totalPoints));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        try {
            await onSaveGrade(submission.id, {
                score,
                gradeLetter,
                teacherFeedback: feedback.trim(),
                gradedBy: currentTeacherName,
                rubricScores
            });
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Failed to save grade');
        } finally {
            setIsSubmitting(false);
        }
    };

    const percentage = Math.round((score / totalPoints) * 100);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                Grade Homework Submission
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {assignment.title} • {assignment.className} ({assignment.subjectName})
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition p-1"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs">
                            {error}
                        </div>
                    )}

                    {/* Student Info Card */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
                                {submission.studentName.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{submission.studentName}</h3>
                                <p className="text-xs text-slate-500">Adm #{submission.studentAdmissionNumber}</p>
                            </div>
                        </div>
                        <div className="text-right text-xs">
                            <span className="text-slate-500">Submitted on:</span>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">
                                {submission.submittedAt ? (
                                    `${new Date(submission.submittedAt).toLocaleDateString()} at ${new Date(submission.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                ) : 'Recent'}
                            </p>
                            {submission.status === 'Late' && (
                                <span className="inline-block mt-0.5 px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 font-bold text-[10px]">
                                    Late Submission
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Submitted Content / Attached file */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Student Work & Attachments
                        </h4>

                        {(submission.content || submission.submissionText) && (
                            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                                {submission.content || submission.submissionText}
                            </div>
                        )}

                        {((submission.attachments && submission.attachments.length > 0) || submission.attachmentUrl) ? (
                            <div className="space-y-2">
                                {(submission.attachments || [{ name: submission.attachmentName || 'Assignment_Submission.pdf', url: submission.attachmentUrl || '#', size: '2.4 MB' }]).map((att, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-primary-50 dark:bg-primary-950/30 rounded-xl border border-primary-100 dark:border-primary-900/50 text-xs">
                                        <div className="flex items-center space-x-2.5">
                                            <div className="p-2 bg-primary-600 text-white rounded-lg">
                                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="font-semibold text-primary-950 dark:text-primary-200">{att.name}</p>
                                                {att.size && <p className="text-[10px] text-slate-500">{att.size}</p>}
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => alert(`Simulated downloading: ${att.name}`)}
                                            className="px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-primary-600 dark:text-primary-400 font-semibold rounded-lg border border-primary-200 dark:border-primary-800 shadow-sm transition flex items-center text-xs"
                                        >
                                            <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                            </svg>
                                            Download File
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-slate-400 italic">No file attachment was uploaded with this response.</p>
                        )}
                    </div>

                    {/* Rubric Evaluation Breakdown */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Assessment Rubric Criteria
                        </h4>

                        <div className="space-y-2.5">
                            {rubricScores.map((item, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.criterion}</span>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="number"
                                            min="0"
                                            max={item.maxScore}
                                            value={item.score}
                                            onChange={(e) => handleRubricScoreChange(idx, Number(e.target.value))}
                                            className="w-16 px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded text-center font-bold focus:outline-none focus:ring-1 focus:ring-primary-500"
                                        />
                                        <span className="text-slate-500 font-semibold">/ {item.maxScore} pts</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Total Score & Letter Grade Banner */}
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">Total Computed Score</span>
                            <div className="flex items-baseline space-x-2 mt-1">
                                <input
                                    type="number"
                                    min="0"
                                    max={totalPoints}
                                    value={score}
                                    onChange={(e) => handleScoreChange(Number(e.target.value))}
                                    className="w-20 px-2 py-1 text-2xl font-bold bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 rounded-lg text-emerald-700 dark:text-emerald-300 focus:outline-none"
                                />
                                <span className="text-sm font-bold text-slate-500">/ {totalPoints} Points</span>
                                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">({percentage}%)</span>
                            </div>
                        </div>

                        <div className="text-right">
                            <span className="text-xs font-semibold text-slate-500">Letter Grade</span>
                            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {gradeLetter}
                            </div>
                        </div>
                    </div>

                    {/* Constructive Teacher Feedback */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Teacher Feedback & Guidance Notes
                        </label>
                        <textarea
                            rows={3}
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            placeholder="Provide constructive feedback, praise strengths, and highlight areas for improvement..."
                            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50 flex items-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    Saving Grade...
                                </>
                            ) : (
                                'Publish Grade & Feedback'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LmsGradingModal;
