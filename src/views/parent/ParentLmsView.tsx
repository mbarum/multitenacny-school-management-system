import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import type { LmsAssignment, LmsLiveClass, LmsSubmission, Student } from '../../types';
import VirtualClassroomModal from '../lms/VirtualClassroomModal';

const ParentLmsView: React.FC = () => {
    const {
        lmsAssignments,
        lmsSubmissions,
        lmsLiveClasses,
        submitLmsAssignment,
        parentChildren,
        students,
        currentUser,
        addNotification
    } = useData();

    // Determine active student
    const activeStudentList = parentChildren;
    const [selectedStudentId, setSelectedStudentId] = useState<string>(activeStudentList[0]?.id || '');

    const currentStudent = useMemo(() => {
        return activeStudentList.find(s => s.id === selectedStudentId) || activeStudentList[0] || null;
    }, [activeStudentList, selectedStudentId]);

    // Active sub-tab
    const [activeTab, setActiveTab] = useState<'homework' | 'live_classes'>('homework');
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'GRADED'>('ALL');

    // Submission modal
    const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
    const [selectedAssignmentForSubmit, setSelectedAssignmentForSubmit] = useState<LmsAssignment | null>(null);
    const [submissionText, setSubmissionText] = useState('');
    const [attachedFileName, setAttachedFileName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Feedback review modal
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [viewingSubmission, setViewingSubmission] = useState<LmsSubmission | null>(null);
    const [viewingAssignment, setViewingAssignment] = useState<LmsAssignment | null>(null);

    // Virtual classroom modal
    const [isVirtualRoomOpen, setIsVirtualRoomOpen] = useState(false);
    const [activeLiveClass, setActiveLiveClass] = useState<LmsLiveClass | null>(null);

    // Filter assignments for current student's class
    const studentAssignments = useMemo(() => {
        if (!currentStudent) return [];
        return lmsAssignments.filter(a => a.classId === currentStudent.classId || a.status === 'Published');
    }, [lmsAssignments, currentStudent]);

    // Submissions for current student
    const studentSubmissionsMap = useMemo(() => {
        if (!currentStudent) return new Map<string, LmsSubmission>();
        const map = new Map<string, LmsSubmission>();
        lmsSubmissions.forEach(sub => {
            if (sub.studentId === currentStudent.id) {
                map.set(sub.assignmentId, sub);
            }
        });
        return map;
    }, [lmsSubmissions, currentStudent]);

    // Filtered assignments based on tab/status
    const displayAssignments = useMemo(() => {
        return studentAssignments.filter(a => {
            const sub = studentSubmissionsMap.get(a.id);
            if (filterStatus === 'PENDING') {
                return !sub || sub.status === 'Submitted' || sub.status === 'Late';
            }
            if (filterStatus === 'GRADED') {
                return sub?.status === 'Graded';
            }
            return true;
        });
    }, [studentAssignments, studentSubmissionsMap, filterStatus]);

    // Filter live classes for student's class
    const studentLiveClasses = useMemo(() => {
        if (!currentStudent) return lmsLiveClasses;
        return lmsLiveClasses.filter(c => c.classId === currentStudent.classId || !c.classId);
    }, [lmsLiveClasses, currentStudent]);

    const handleOpenSubmitModal = (assignment: LmsAssignment) => {
        setSelectedAssignmentForSubmit(assignment);
        const existing = studentSubmissionsMap.get(assignment.id);
        setSubmissionText(existing?.content || '');
        setAttachedFileName(existing?.attachments?.[0]?.name || '');
        setIsSubmitModalOpen(true);
    };

    const handleOpenFeedback = (assignment: LmsAssignment, submission: LmsSubmission) => {
        setViewingAssignment(assignment);
        setViewingSubmission(submission);
        setIsFeedbackModalOpen(true);
    };

    const handleSubmitWork = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAssignmentForSubmit || !currentStudent) return;

        if (!submissionText.trim() && !attachedFileName.trim()) {
            alert('Please enter your response or attach a file.');
            return;
        }

        setIsSubmitting(true);
        try {
            const isLate = new Date() > new Date(selectedAssignmentForSubmit.dueDate);
            await submitLmsAssignment({
                assignmentId: selectedAssignmentForSubmit.id,
                studentId: currentStudent.id,
                studentName: currentStudent.name,
                studentAdmissionNumber: currentStudent.admissionNumber,
                content: submissionText.trim(),
                attachments: attachedFileName.trim() ? [
                    { name: attachedFileName.trim(), url: '#', size: '2.1 MB' }
                ] : [],
                status: isLate ? 'Late' : 'Submitted',
                submittedAt: new Date().toISOString()
            });
            addNotification('Homework submitted successfully to teacher!', 'success');
            setIsSubmitModalOpen(false);
        } catch {
            addNotification('Failed to submit homework', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleJoinClass = (c: LmsLiveClass) => {
        setActiveLiveClass(c);
        setIsVirtualRoomOpen(true);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-6xl mx-auto">
            {/* Header & Student Switcher */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300">
                            Student & Parent LMS Portal
                        </span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                        Homework & Virtual Classrooms
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Track school assignments, submit completed homework, and join live online Google Meet & Zoom classes
                    </p>
                </div>

                {/* Switch Child Selector (if multiple children) */}
                {activeStudentList.length > 1 && (
                    <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-xs text-slate-500 font-semibold pl-2">Viewing Student:</span>
                        <select
                            value={selectedStudentId}
                            onChange={(e) => setSelectedStudentId(e.target.value)}
                            className="text-xs font-bold bg-slate-50 dark:bg-slate-800 border-none rounded-lg px-2.5 py-1.5 text-slate-800 dark:text-slate-200 focus:outline-none"
                        >
                            {activeStudentList.map(s => (
                                <option key={s.id} value={s.id}>{s.name} (Adm #{s.admissionNumber})</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Student Quick Summary Banner */}
            {currentStudent && (
                <div className="p-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center space-x-3.5">
                        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-xl font-extrabold shadow-inner">
                            {currentStudent.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-base sm:text-lg font-bold">{currentStudent.name}</h2>
                            <p className="text-xs text-primary-100">
                                Admission #{currentStudent.admissionNumber} • {currentStudent.className || 'Grade 8 Science Stream'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 text-xs font-semibold">
                        <div className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                            <span className="text-primary-200 block text-[10px]">Pending Tasks:</span>
                            <span className="text-sm font-bold">
                                {studentAssignments.filter(a => !studentSubmissionsMap.has(a.id)).length}
                            </span>
                        </div>
                        <div className="bg-white/10 px-3 py-1.5 rounded-xl backdrop-blur-sm">
                            <span className="text-primary-200 block text-[10px]">Graded:</span>
                            <span className="text-sm font-bold">
                                {Array.from(studentSubmissionsMap.values()).filter(s => s.status === 'Graded').length}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('homework')}
                    className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
                        activeTab === 'homework'
                            ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Assignments & Homework ({studentAssignments.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('live_classes')}
                    className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
                        activeTab === 'live_classes'
                            ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Live Classes (Meet & Zoom) ({studentLiveClasses.length})</span>
                </button>
            </div>

            {/* TAB 1: HOMEWORK & SUBMISSIONS */}
            {activeTab === 'homework' && (
                <div className="space-y-5">
                    {/* Status Filter Buttons */}
                    <div className="flex items-center space-x-2">
                        {(['ALL', 'PENDING', 'GRADED'] as const).map(s => (
                            <button
                                key={s}
                                onClick={() => setFilterStatus(s)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                                    filterStatus === s
                                        ? 'bg-primary-600 text-white shadow-sm'
                                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50'
                                }`}
                            >
                                {s === 'ALL' ? 'All Assignments' : s === 'PENDING' ? 'Pending Action' : 'Graded & Feedback'}
                            </button>
                        ))}
                    </div>

                    {/* Assignments List */}
                    {displayAssignments.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                No assignments found for the selected filter.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {displayAssignments.map(assign => {
                                const sub = studentSubmissionsMap.get(assign.id);
                                const isGraded = sub?.status === 'Graded';
                                const isSubmitted = sub && !isGraded;
                                const isPastDue = new Date(assign.dueDate) < new Date();

                                return (
                                    <div
                                        key={assign.id}
                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition space-y-4"
                                    >
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-primary-50 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                                                        {assign.type}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        {assign.subjectName} • {assign.className}
                                                    </span>
                                                </div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                    {assign.title}
                                                </h3>
                                            </div>

                                            <div className="flex items-center space-x-2">
                                                {isGraded ? (
                                                    <div className="text-right">
                                                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 flex items-center">
                                                            ✓ Graded: {sub.score} / {assign.totalPoints} pts ({sub.gradeLetter})
                                                        </span>
                                                    </div>
                                                ) : isSubmitted ? (
                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300">
                                                        ⏳ Submitted &bull; Awaiting Teacher Grade
                                                    </span>
                                                ) : (
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        isPastDue 
                                                            ? 'bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300' 
                                                            : 'bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300'
                                                    }`}>
                                                        {isPastDue ? '⚠️ Past Due' : 'Pending Submission'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {assign.description && (
                                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                {assign.description}
                                            </p>
                                        )}

                                        {/* Due date & points banner */}
                                        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl gap-2">
                                            <div className="flex items-center space-x-2">
                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>
                                                    Due: <strong>{new Date(assign.dueDate).toLocaleDateString()} at {new Date(assign.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                                                </span>
                                            </div>
                                            <span>Maximum Marks: <strong>{assign.totalPoints}</strong> (Pass: {assign.passPoints || assign.passingPoints || 25})</span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                                            {isGraded && (
                                                <button
                                                    onClick={() => handleOpenFeedback(assign, sub)}
                                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition flex items-center"
                                                >
                                                    <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    View Teacher Feedback & Rubric
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleOpenSubmitModal(assign)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center shadow ${
                                                    isSubmitted 
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200' 
                                                        : 'bg-primary-600 hover:bg-primary-700 text-white'
                                                }`}
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                                </svg>
                                                {isSubmitted ? 'Update Submission' : 'Submit Homework'}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: VIRTUAL LIVE CLASSES */}
            {activeTab === 'live_classes' && (
                <div className="space-y-5">
                    {studentLiveClasses.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                No virtual classes currently scheduled for this class.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {studentLiveClasses.map(live => {
                                const isZoom = live.platform === 'Zoom';
                                const isLive = live.status === 'Live';

                                return (
                                    <div
                                        key={live.id}
                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition space-y-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                                                isZoom ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                            }`}>
                                                {live.platform}
                                            </span>
                                            {isLive && (
                                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-600 text-white animate-pulse">
                                                    🔴 Class Active Now
                                                </span>
                                            )}
                                        </div>

                                        <div>
                                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                {live.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-0.5">
                                                {live.subjectName} • Teacher: <strong>{live.teacherName}</strong>
                                            </p>
                                        </div>

                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs space-y-1">
                                            <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
                                                <span>Date: <strong>{new Date(live.scheduledStartTime || (live.date ? `${live.date}T${live.startTime || '10:00'}:00` : new Date().toISOString())).toLocaleDateString()}</strong></span>
                                                <span>Time: <strong>{new Date(live.scheduledStartTime || (live.date ? `${live.date}T${live.startTime || '10:00'}:00` : new Date().toISOString())).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                                            </div>
                                            <p className="text-slate-500 text-[11px]">Duration: {live.durationMinutes} Minutes</p>
                                        </div>

                                        {isZoom && live.meetingId && (
                                            <div className="text-xs font-mono bg-blue-50 dark:bg-blue-950/30 p-2.5 rounded-lg text-blue-900 dark:text-blue-200">
                                                Meeting ID: <strong>{live.meetingId}</strong> {live.passcode ? `• Passcode: ${live.passcode}` : ''}
                                            </div>
                                        )}

                                        <div className="flex items-center space-x-3 pt-2">
                                            <button
                                                onClick={() => handleJoinClass(live)}
                                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow flex items-center justify-center"
                                            >
                                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                Join Live Classroom
                                            </button>
                                            <a
                                                href={live.joinUrl || live.meetingUrl || '#'}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition"
                                            >
                                                Direct Link &rarr;
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* Submission Modal */}
            {isSubmitModalOpen && selectedAssignmentForSubmit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    Turn In Homework
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {selectedAssignmentForSubmit.title}
                                </p>
                            </div>
                            <button onClick={() => setIsSubmitModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmitWork} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Student Response / Answer Text
                                </label>
                                <textarea
                                    rows={4}
                                    value={submissionText}
                                    onChange={(e) => setSubmissionText(e.target.value)}
                                    placeholder="Type your explanation, answers, or comments for the teacher..."
                                    className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Attach Document, Scanned Worksheet, or PDF
                                </label>
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="text"
                                        value={attachedFileName}
                                        onChange={(e) => setAttachedFileName(e.target.value)}
                                        placeholder="e.g. Science_Practical_Assignment.pdf"
                                        className="flex-1 p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setAttachedFileName(`${currentStudent?.name.replace(/\s+/g, '_')}_Completed_Work.pdf`)}
                                        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-300"
                                    >
                                        Auto-Attach
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setIsSubmitModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition shadow disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit to Teacher'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Teacher Feedback & Rubric View Modal */}
            {isFeedbackModalOpen && viewingSubmission && viewingAssignment && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
                    <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                            <div>
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                    Teacher Grade & Evaluation
                                </h3>
                                <p className="text-xs text-slate-500">
                                    {viewingAssignment.title}
                                </p>
                            </div>
                            <button onClick={() => setIsFeedbackModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                &times;
                            </button>
                        </div>

                        {/* Grade Score Badge */}
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Awarded Score</span>
                                <div className="text-2xl font-extrabold text-emerald-700 dark:text-emerald-300">
                                    {viewingSubmission.score} / {viewingAssignment.totalPoints} Marks
                                </div>
                            </div>
                            <div className="text-3xl font-black text-emerald-600">
                                {viewingSubmission.gradeLetter}
                            </div>
                        </div>

                        {/* Feedback */}
                        {viewingSubmission.teacherFeedback && (
                            <div className="space-y-1">
                                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Teacher Remarks</h4>
                                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 italic">
                                    &ldquo;{viewingSubmission.teacherFeedback}&rdquo;
                                </div>
                            </div>
                        )}

                        {/* Rubric Breakdown */}
                        {viewingSubmission.rubricScores && (
                            <div className="space-y-2">
                                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">CBC Rubric Assessment</h4>
                                <div className="space-y-1.5">
                                    {viewingSubmission.rubricScores.map((rubric, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
                                            <span className="text-slate-700 dark:text-slate-300">{rubric.criterion}</span>
                                            <span className="font-bold text-slate-900 dark:text-slate-100">{rubric.score} / {rubric.maxScore} pts</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setIsFeedbackModalOpen(false)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Virtual Classroom Simulation Modal */}
            <VirtualClassroomModal
                isOpen={isVirtualRoomOpen}
                onClose={() => setIsVirtualRoomOpen(false)}
                liveClass={activeLiveClass}
                currentUserName={currentStudent?.name || currentUser?.name || 'Student'}
                isTeacher={false}
            />
        </div>
    );
};

export default ParentLmsView;
