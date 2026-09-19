import React, { useState, useMemo } from 'react';
import { useData } from '../../contexts/DataContext';
import type { LmsAssignment, LmsLiveClass, LmsSubmission, Student } from '../../types';
import LmsAssignmentModal from './LmsAssignmentModal';
import LmsLiveClassModal from './LmsLiveClassModal';
import LmsGradingModal from './LmsGradingModal';
import VirtualClassroomModal from './VirtualClassroomModal';

const LmsView: React.FC = () => {
    const {
        lmsAssignments,
        lmsSubmissions,
        lmsLiveClasses,
        addLmsAssignment,
        updateLmsAssignment,
        deleteLmsAssignment,
        gradeLmsSubmission,
        addLmsLiveClass,
        updateLmsLiveClass,
        deleteLmsLiveClass,
        classes,
        subjects,
        students,
        currentUser,
        addNotification
    } = useData();

    // Active Navigation Tab
    const [activeTab, setActiveTab] = useState<'assignments' | 'grading' | 'virtual_classes' | 'analytics'>('assignments');

    // Assignment Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('ALL');
    const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('ALL');
    const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');
    const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

    // Modals state
    const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
    const [assignmentToEdit, setAssignmentToEdit] = useState<LmsAssignment | null>(null);

    const [isLiveClassModalOpen, setIsLiveClassModalOpen] = useState(false);
    const [liveClassToEdit, setLiveClassToEdit] = useState<LmsLiveClass | null>(null);

    const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
    const [gradingSubmission, setGradingSubmission] = useState<LmsSubmission | null>(null);
    const [gradingAssignment, setGradingAssignment] = useState<LmsAssignment | null>(null);

    const [isVirtualRoomOpen, setIsVirtualRoomOpen] = useState(false);
    const [activeLiveClass, setActiveLiveClass] = useState<LmsLiveClass | null>(null);

    // Selected Assignment for Grading Hub
    const [selectedAssignmentIdForGrading, setSelectedAssignmentIdForGrading] = useState<string>(
        lmsAssignments[0]?.id || ''
    );

    // Filtered assignments
    const filteredAssignments = useMemo(() => {
        return lmsAssignments.filter(a => {
            const matchesSearch = !searchQuery || 
                a.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                a.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.className.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesClass = selectedClassFilter === 'ALL' || a.classId === selectedClassFilter;
            const matchesSubject = selectedSubjectFilter === 'ALL' || a.subjectId === selectedSubjectFilter;
            const matchesType = selectedTypeFilter === 'ALL' || a.type === selectedTypeFilter;
            const matchesStatus = selectedStatusFilter === 'ALL' || a.status === selectedStatusFilter;
            return matchesSearch && matchesClass && matchesSubject && matchesType && matchesStatus;
        });
    }, [lmsAssignments, searchQuery, selectedClassFilter, selectedSubjectFilter, selectedTypeFilter, selectedStatusFilter]);

    // Active or upcoming live class
    const activeOrNextClass = useMemo(() => {
        return lmsLiveClasses.find(c => c.status === 'Live') || 
            lmsLiveClasses.filter(c => c.status === 'Scheduled' || c.status === 'Upcoming').sort((a, b) => {
                const timeA = new Date(a.scheduledStartTime || (a.date ? `${a.date}T${a.startTime || '10:00'}:00` : 0)).getTime();
                const timeB = new Date(b.scheduledStartTime || (b.date ? `${b.date}T${b.startTime || '10:00'}:00` : 0)).getTime();
                return timeA - timeB;
            })[0];
    }, [lmsLiveClasses]);

    // Selected assignment for grading
    const activeGradingAssignment = useMemo(() => {
        return lmsAssignments.find(a => a.id === selectedAssignmentIdForGrading) || lmsAssignments[0] || null;
    }, [lmsAssignments, selectedAssignmentIdForGrading]);

    // Submissions for active grading assignment
    const activeGradingSubmissions = useMemo(() => {
        if (!activeGradingAssignment) return [];
        return lmsSubmissions.filter(s => s.assignmentId === activeGradingAssignment.id);
    }, [lmsSubmissions, activeGradingAssignment]);

    // Students in active assignment's class
    const studentsInAssignmentClass = useMemo(() => {
        if (!activeGradingAssignment) return [];
        return students.filter(s => s.classId === activeGradingAssignment.classId);
    }, [students, activeGradingAssignment]);

    // Summary Metrics
    const metrics = useMemo(() => {
        const totalAssignments = lmsAssignments.length;
        const totalSubmissions = lmsSubmissions.length;
        const gradedSubmissions = lmsSubmissions.filter(s => s.status === 'Graded');
        const avgScore = gradedSubmissions.length > 0 
            ? Math.round(gradedSubmissions.reduce((acc, curr) => acc + (curr.score || 0), 0) / gradedSubmissions.length)
            : 0;
        const pendingGrading = lmsSubmissions.filter(s => s.status === 'Submitted' || s.status === 'Late').length;
        const totalLiveClasses = lmsLiveClasses.length;
        return { totalAssignments, totalSubmissions, avgScore, pendingGrading, totalLiveClasses };
    }, [lmsAssignments, lmsSubmissions, lmsLiveClasses]);

    // Handlers
    const handleOpenCreateAssignment = () => {
        setAssignmentToEdit(null);
        setIsAssignmentModalOpen(true);
    };

    const handleOpenEditAssignment = (assign: LmsAssignment) => {
        setAssignmentToEdit(assign);
        setIsAssignmentModalOpen(true);
    };

    const handleDeleteAssignment = async (id: string) => {
        if (confirm('Are you sure you want to delete this assignment?')) {
            try {
                await deleteLmsAssignment(id);
                addNotification('Assignment deleted successfully', 'success');
            } catch {
                addNotification('Failed to delete assignment', 'error');
            }
        }
    };

    const handleOpenScheduleClass = () => {
        setLiveClassToEdit(null);
        setIsLiveClassModalOpen(true);
    };

    const handleOpenEditClass = (c: LmsLiveClass) => {
        setLiveClassToEdit(c);
        setIsLiveClassModalOpen(true);
    };

    const handleDeleteClass = async (id: string) => {
        if (confirm('Are you sure you want to cancel this scheduled live class?')) {
            try {
                await deleteLmsLiveClass(id);
                addNotification('Live class cancelled', 'success');
            } catch {
                addNotification('Failed to cancel class', 'error');
            }
        }
    };

    const handleLaunchVirtualRoom = (c: LmsLiveClass) => {
        setActiveLiveClass(c);
        setIsVirtualRoomOpen(true);
    };

    const handleOpenGradeModal = (submission: LmsSubmission) => {
        setGradingSubmission(submission);
        setGradingAssignment(activeGradingAssignment);
        setIsGradingModalOpen(true);
    };

    const handleQuickGradeStudent = (student: Student) => {
        if (!activeGradingAssignment) return;
        let sub = activeGradingSubmissions.find(s => s.studentId === student.id);
        if (!sub) {
            // Mock a pending submission on the fly for grading
            sub = {
                id: `sub-${Date.now()}`,
                assignmentId: activeGradingAssignment.id,
                studentId: student.id,
                studentName: student.name,
                studentAdmissionNumber: student.admissionNumber,
                content: `Answers to ${activeGradingAssignment.title}:\n\n1. Balanced equation: 2H2 + O2 -> 2H2O\n2. The reaction is exothermic due to net energy release.\n3. Laboratory precautions include safety goggles and acid-resistant gloves.`,
                submittedAt: new Date().toISOString(),
                status: 'Submitted',
                attachments: [{ name: `${student.name.replace(/\s+/g, '_')}_Worksheet.pdf`, url: '#', size: '1.8 MB' }]
            };
        }
        setGradingSubmission(sub || null);
        setGradingAssignment(activeGradingAssignment);
        setIsGradingModalOpen(true);
    };

    const copyMeetingInvite = (c: LmsLiveClass) => {
        const classDate = c.scheduledStartTime || (c.date ? `${c.date}T${c.startTime || '10:00'}:00` : new Date().toISOString());
        const link = c.joinUrl || c.meetingUrl || '#';
        const text = `Join ${c.platform} Class: ${c.title}\nSubject: ${c.subjectName} (${c.className})\nDate: ${new Date(classDate).toLocaleString()}\nLink: ${link}${c.meetingId ? `\nMeeting ID: ${c.meetingId}\nPasscode: ${c.passcode}` : ''}`;
        navigator.clipboard?.writeText(text);
        addNotification('Meeting invitation copied to clipboard!', 'success');
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center space-x-2">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary-100 dark:bg-primary-950/70 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800">
                            CBC Virtual Learning Suite
                        </span>
                        <span className="text-xs text-slate-400">• Term 2 Academic Year</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
                        LMS & Virtual Classrooms
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                        Issue homework, review submissions, and conduct live Google Meet & Zoom classes with interactive engagement
                    </p>
                </div>

                {/* Header Action Buttons */}
                <div className="flex items-center space-x-3">
                    <button
                        onClick={handleOpenScheduleClass}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Schedule Live Class
                    </button>
                    <button
                        onClick={handleOpenCreateAssignment}
                        className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition flex items-center"
                    >
                        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Create Assignment
                    </button>
                </div>
            </div>

            {/* Live Class Highlight Banner (if any live or upcoming class) */}
            {activeOrNextClass && (
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 border border-slate-800 shadow-xl">
                    <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                        <div className="space-y-1.5 max-w-2xl">
                            <div className="flex items-center space-x-2">
                                {activeOrNextClass.status === 'Live' ? (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white flex items-center animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-white mr-1.5"></span>
                                        LIVE NOW
                                    </span>
                                ) : (
                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40">
                                        UPCOMING VIRTUAL SESSION
                                    </span>
                                )}
                                <span className="text-xs text-slate-300 font-semibold">
                                    {activeOrNextClass.platform} • {activeOrNextClass.className}
                                </span>
                            </div>
                            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                                {activeOrNextClass.title}
                            </h2>
                            <p className="text-xs text-slate-300 flex items-center flex-wrap gap-x-4 gap-y-1">
                                <span>Subject: <strong>{activeOrNextClass.subjectName}</strong></span>
                                <span>Host: <strong>{activeOrNextClass.teacherName}</strong></span>
                                <span>Start: <strong>{new Date(activeOrNextClass.scheduledStartTime || (activeOrNextClass.date ? `${activeOrNextClass.date}T${activeOrNextClass.startTime || '10:00'}:00` : new Date().toISOString())).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({activeOrNextClass.durationMinutes} mins)</strong></span>
                            </p>
                        </div>

                        <div className="flex items-center space-x-3 flex-shrink-0">
                            <button
                                onClick={() => handleLaunchVirtualRoom(activeOrNextClass)}
                                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg hover:shadow-emerald-500/30 transition flex items-center"
                            >
                                <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Launch Virtual Classroom
                            </button>
                            <a
                                href={activeOrNextClass.joinUrl || activeOrNextClass.meetingUrl || '#'}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition flex items-center"
                            >
                                Direct App Link &rarr;
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics Ribbon */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">Total Assignments</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{metrics.totalAssignments}</p>
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Active coursework across classes</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">Submissions Received</p>
                    <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">{metrics.totalSubmissions}</p>
                    <p className="text-[11px] text-primary-600 dark:text-primary-400 mt-1">{metrics.pendingGrading} awaiting review</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">Average Score</p>
                    <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">{metrics.avgScore}%</p>
                    <p className="text-[11px] text-slate-400 mt-1">Across graded submissions</p>
                </div>
                <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    <p className="text-xs text-slate-500 font-medium">Virtual Classrooms</p>
                    <p className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">{metrics.totalLiveClasses}</p>
                    <p className="text-[11px] text-slate-400 mt-1">Google Meet & Zoom sessions</p>
                </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-sm font-semibold">
                <button
                    onClick={() => setActiveTab('assignments')}
                    className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
                        activeTab === 'assignments'
                            ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Assignments & Homework ({filteredAssignments.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('grading')}
                    className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
                        activeTab === 'grading'
                            ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <span>Grading & Submissions Hub</span>
                </button>

                <button
                    onClick={() => setActiveTab('virtual_classes')}
                    className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
                        activeTab === 'virtual_classes'
                            ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Live Classes (Meet & Zoom) ({lmsLiveClasses.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('analytics')}
                    className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
                        activeTab === 'analytics'
                            ? 'border-primary-600 text-primary-600 dark:text-primary-400 font-bold'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>CBC Analytics</span>
                </button>
            </div>

            {/* TAB 1: ASSIGNMENTS & HOMEWORK */}
            {activeTab === 'assignments' && (
                <div className="space-y-5">
                    {/* Search & Filter Controls */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
                        <div className="w-full md:w-72 relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search by title, subject, class..."
                                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                            <svg className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                            {/* Class Filter */}
                            <select
                                value={selectedClassFilter}
                                onChange={(e) => setSelectedClassFilter(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                            >
                                <option value="ALL">All Classes</option>
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>

                            {/* Subject Filter */}
                            <select
                                value={selectedSubjectFilter}
                                onChange={(e) => setSelectedSubjectFilter(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                            >
                                <option value="ALL">All Subjects</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>

                            {/* Task Type Filter */}
                            <select
                                value={selectedTypeFilter}
                                onChange={(e) => setSelectedTypeFilter(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                            >
                                <option value="ALL">All Task Types</option>
                                <option value="Homework">Homework</option>
                                <option value="Project">Project</option>
                                <option value="Quiz">Quiz</option>
                                <option value="Lab Practical">Lab Practical</option>
                                <option value="CBC Activity">CBC Activity</option>
                                <option value="Essay">Essay</option>
                            </select>

                            {/* Status Filter */}
                            <select
                                value={selectedStatusFilter}
                                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                                className="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:outline-none"
                            >
                                <option value="ALL">All Statuses</option>
                                <option value="Published">Published</option>
                                <option value="Draft">Draft</option>
                            </select>
                        </div>
                    </div>

                    {/* Assignments Cards Grid */}
                    {filteredAssignments.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Coursework Found</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                No assignments match the selected filters. Click &ldquo;Create Assignment&rdquo; to post new homework for your classes.
                            </p>
                            <button
                                onClick={handleOpenCreateAssignment}
                                className="mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow"
                            >
                                Create Assignment Now
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                            {filteredAssignments.map(assign => {
                                const isPastDue = new Date(assign.dueDate) < new Date();
                                const total = assign.totalAssigned || 5;
                                const submissionRatio = total > 0 
                                    ? Math.round(((assign.submittedCount || 0) / total) * 100) 
                                    : 0;

                                return (
                                    <div
                                        key={assign.id}
                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                                    >
                                        <div className="p-5 space-y-3.5">
                                            {/* Top badges */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold ${
                                                        assign.type === 'Lab Practical' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300' :
                                                        assign.type === 'Project' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300' :
                                                        assign.type === 'Quiz' ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300' :
                                                        'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                                    }`}>
                                                        {assign.type}
                                                    </span>
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                        {assign.className}
                                                    </span>
                                                </div>

                                                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                                    assign.status === 'Draft' 
                                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' 
                                                        : isPastDue 
                                                            ? 'bg-orange-100 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300' 
                                                            : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                                                }`}>
                                                    {assign.status === 'Draft' ? 'Draft' : isPastDue ? 'Past Due' : 'Active'}
                                                </span>
                                            </div>

                                            {/* Title & Subject */}
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-primary-600 transition-colors line-clamp-2">
                                                    {assign.title}
                                                </h3>
                                                <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold mt-0.5">
                                                    {assign.subjectName} • {assign.totalPoints} Marks Total
                                                </p>
                                            </div>

                                            {/* Description snippet */}
                                            {assign.description && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                    {assign.description}
                                                </p>
                                            )}

                                            {/* Due Date Indicator */}
                                            <div className="flex items-center text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                                                <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                <span>
                                                    Due: <strong>{new Date(assign.dueDate).toLocaleDateString()} at {new Date(assign.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
                                                </span>
                                            </div>

                                            {/* Submission Progress Bar */}
                                            <div className="space-y-1">
                                                <div className="flex justify-between text-[11px] text-slate-500">
                                                    <span>Turned in: {assign.submittedCount || 0} of {assign.totalAssigned || 5}</span>
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{submissionRatio}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                    <div 
                                                        className="bg-primary-600 h-full rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(100, submissionRatio)}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex justify-between text-[10px] text-slate-400 pt-0.5">
                                                    <span>Graded: {assign.gradedCount || 0}</span>
                                                    <span>Pass mark: {assign.passPoints || assign.passingPoints || 25} pts</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer Actions */}
                                        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                                            <button
                                                onClick={() => {
                                                    setSelectedAssignmentIdForGrading(assign.id);
                                                    setActiveTab('grading');
                                                }}
                                                className="text-primary-600 dark:text-primary-400 font-bold hover:underline flex items-center"
                                            >
                                                Review Submissions &rarr;
                                            </button>

                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleOpenEditAssignment(assign)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                                                    title="Edit assignment"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteAssignment(assign.id)}
                                                    className="p-1.5 text-red-400 hover:text-red-600 transition"
                                                    title="Delete assignment"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: GRADING & SUBMISSIONS HUB */}
            {activeTab === 'grading' && (
                <div className="space-y-6">
                    {/* Assignment Selector Banner */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                Select Assignment To Grade:
                            </label>
                            <div className="flex items-center space-x-3">
                                <select
                                    value={selectedAssignmentIdForGrading}
                                    onChange={(e) => setSelectedAssignmentIdForGrading(e.target.value)}
                                    className="px-3.5 py-2 text-sm font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                >
                                    {lmsAssignments.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.title} — {a.className} ({a.subjectName})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {activeGradingAssignment && (
                            <div className="flex items-center space-x-4 text-xs">
                                <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl">
                                    <span className="text-slate-400">Total Points:</span>
                                    <span className="ml-1 font-bold text-slate-800 dark:text-slate-100">{activeGradingAssignment.totalPoints} Marks</span>
                                </div>
                                <div className="bg-slate-50 dark:bg-slate-800/60 px-3 py-2 rounded-xl">
                                    <span className="text-slate-400">Due Date:</span>
                                    <span className="ml-1 font-bold text-slate-800 dark:text-slate-100">{new Date(activeGradingAssignment.dueDate).toLocaleDateString()}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Submissions Roster Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                                Student Submissions & Grading Roster
                            </h3>
                            <span className="text-xs text-slate-500">
                                {activeGradingSubmissions.length} of {studentsInAssignmentClass.length} submitted
                            </span>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider text-[11px]">
                                    <tr>
                                        <th className="py-3 px-6">Student</th>
                                        <th className="py-3 px-4">Submission Status</th>
                                        <th className="py-3 px-4">Turned In At</th>
                                        <th className="py-3 px-4">Score & Grade</th>
                                        <th className="py-3 px-4">Attachment</th>
                                        <th className="py-3 px-6 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {studentsInAssignmentClass.map(student => {
                                        const sub = activeGradingSubmissions.find(s => s.studentId === student.id);
                                        const isGraded = sub?.status === 'Graded';
                                        const isSubmitted = sub && (sub.status === 'Submitted' || sub.status === 'Late');

                                        return (
                                            <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                                                <td className="py-3.5 px-6">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-300 flex items-center justify-center font-bold text-xs">
                                                            {student.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-slate-900 dark:text-slate-100">{student.name}</p>
                                                            <p className="text-[11px] text-slate-400">Adm #{student.admissionNumber}</p>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    {isGraded ? (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                                            ✓ Graded
                                                        </span>
                                                    ) : isSubmitted ? (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                                            ⏳ Needs Grading
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                                                            Pending / Missing
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                                                    {sub?.submittedAt ? (
                                                        <div>
                                                            <p>{new Date(sub.submittedAt).toLocaleDateString()}</p>
                                                            <p className="text-[10px] text-slate-400">{new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-4">
                                                    {isGraded ? (
                                                        <div className="flex items-center space-x-2">
                                                            <span className="font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                                                                {sub.score} / {activeGradingAssignment?.totalPoints}
                                                            </span>
                                                            <span className="px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold text-[10px]">
                                                                {sub.gradeLetter}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Not graded</span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                                                    {(sub?.attachments && sub.attachments.length > 0) || sub?.attachmentName ? (
                                                        <div className="flex items-center space-x-1.5 text-primary-600 font-medium">
                                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                                            </svg>
                                                            <span className="truncate max-w-[120px]">{sub?.attachments?.[0]?.name || sub?.attachmentName || 'Worksheet.pdf'}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">—</span>
                                                    )}
                                                </td>

                                                <td className="py-3.5 px-6 text-right">
                                                    <button
                                                        onClick={() => sub ? handleOpenGradeModal(sub) : handleQuickGradeStudent(student)}
                                                        className="px-3 py-1.5 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-bold rounded-lg border border-primary-200 dark:border-primary-800 transition"
                                                    >
                                                        {isGraded ? 'Review / Edit Grade' : 'Grade Submission'}
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: VIRTUAL LIVE CLASSES (MEET & ZOOM) */}
            {activeTab === 'virtual_classes' && (
                <div className="space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                Scheduled Virtual Classes
                            </h3>
                            <p className="text-xs text-slate-500">
                                Interactive real-time remote video classes powered by Google Meet & Zoom
                            </p>
                        </div>

                        <button
                            onClick={handleOpenScheduleClass}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center"
                        >
                            <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Schedule New Class
                        </button>
                    </div>

                    {lmsLiveClasses.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                            <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">No Virtual Classes Scheduled</h3>
                            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                                Host online lessons, revision workshops, or parent-teacher briefings using Google Meet or Zoom.
                            </p>
                            <button
                                onClick={handleOpenScheduleClass}
                                className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow"
                            >
                                Schedule Virtual Class
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {lmsLiveClasses.map(live => {
                                const isZoom = live.platform === 'Zoom';
                                const isLive = live.status === 'Live';

                                return (
                                    <div
                                        key={live.id}
                                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                                    >
                                        <div className="p-5 space-y-3.5">
                                            {/* Header badge row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    {isZoom ? (
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center">
                                                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                                                            Zoom
                                                        </span>
                                                    ) : (
                                                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center">
                                                            <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5"></span>
                                                            Google Meet
                                                        </span>
                                                    )}
                                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                                        {live.className} • {live.subjectName}
                                                    </span>
                                                </div>

                                                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                    isLive 
                                                        ? 'bg-red-500 text-white animate-pulse' 
                                                        : live.status === 'Completed' 
                                                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-500' 
                                                            : 'bg-primary-100 dark:bg-primary-950/60 text-primary-700 dark:text-primary-300'
                                                }`}>
                                                    {isLive ? '🔴 Live Now' : live.status}
                                                </span>
                                            </div>

                                            {/* Title & Teacher */}
                                            <div>
                                                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                                                    {live.title}
                                                </h4>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Instructor: <strong>{live.teacherName}</strong>
                                                </p>
                                            </div>

                                            {/* Date, Time & Duration */}
                                            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                                                <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                                                    <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>
                                                        {new Date(live.scheduledStartTime || (live.date ? `${live.date}T${live.startTime || '10:00'}:00` : new Date().toISOString())).toLocaleDateString()} at {new Date(live.scheduledStartTime || (live.date ? `${live.date}T${live.startTime || '10:00'}:00` : new Date().toISOString())).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <span className="font-bold text-slate-500">{live.durationMinutes} Minutes</span>
                                            </div>

                                            {/* Zoom credentials if present */}
                                            {isZoom && live.meetingId && (
                                                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs flex items-center justify-between">
                                                    <span className="font-mono text-blue-900 dark:text-blue-200">
                                                        ID: <strong>{live.meetingId}</strong> {live.passcode ? `• Pass: ${live.passcode}` : ''}
                                                    </span>
                                                    <button
                                                        onClick={() => copyMeetingInvite(live)}
                                                        className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                                                    >
                                                        Copy Details
                                                    </button>
                                                </div>
                                            )}

                                            {/* Agenda */}
                                            {live.agenda && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                                    {live.agenda}
                                                </p>
                                            )}
                                        </div>

                                        {/* Actions Footer */}
                                        <div className="px-5 py-3.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => handleLaunchVirtualRoom(live)}
                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center shadow-sm"
                                                >
                                                    <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                    </svg>
                                                    Virtual Room
                                                </button>
                                                <a
                                                    href={live.joinUrl || live.meetingUrl || '#'}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-semibold transition"
                                                >
                                                    Open App &rarr;
                                                </a>
                                            </div>

                                            <div className="flex items-center space-x-1.5">
                                                <button
                                                    onClick={() => copyMeetingInvite(live)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                    title="Copy full invite"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenEditClass(live)}
                                                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                                    title="Edit session"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClass(live.id)}
                                                    className="p-1.5 text-red-400 hover:text-red-600"
                                                    title="Cancel session"
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* TAB 4: CBC ANALYTICS & LEARNING INSIGHTS */}
            {activeTab === 'analytics' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Grade Distribution */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            Academic Grade Distribution
                        </h3>
                        <p className="text-xs text-slate-500">
                            Performance across all homework and practical project submissions
                        </p>

                        <div className="space-y-3 pt-2">
                            {[
                                { grade: 'Grade A (80% - 100%)', count: 18, pct: 60, color: 'bg-emerald-500' },
                                { grade: 'Grade B (70% - 79%)', count: 8, pct: 27, color: 'bg-primary-500' },
                                { grade: 'Grade C (60% - 69%)', count: 3, pct: 10, color: 'bg-amber-500' },
                                { grade: 'Grade D / E (< 60%)', count: 1, pct: 3, color: 'bg-rose-500' }
                            ].map((item, i) => (
                                <div key={i} className="space-y-1">
                                    <div className="flex justify-between text-xs font-semibold">
                                        <span className="text-slate-700 dark:text-slate-300">{item.grade}</span>
                                        <span className="text-slate-500">{item.count} students ({item.pct}%)</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                                        <div className={`${item.color} h-full rounded-full`} style={{ width: `${item.pct}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CBC Competency Engagement */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                            CBC Competencies Addressed
                        </h3>
                        <p className="text-xs text-slate-500">
                            Assessment coverage aligned with the Competency Based Curriculum
                        </p>

                        <div className="space-y-2.5 pt-2">
                            {[
                                { comp: 'Critical Thinking & Problem Solving', tasks: 12, rating: '94% Proficient' },
                                { comp: 'Digital Literacy & Online Collaboration', tasks: 8, rating: '88% Proficient' },
                                { comp: 'Communication & Scientific Presentation', tasks: 7, rating: '91% Proficient' },
                                { comp: 'Self-Efficacy & Organization', tasks: 9, rating: '85% Proficient' }
                            ].map((item, i) => (
                                <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-slate-200">{item.comp}</p>
                                        <p className="text-[11px] text-slate-400">{item.tasks} issued tasks</p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-lg font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                                        {item.rating}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Modals */}
            <LmsAssignmentModal
                isOpen={isAssignmentModalOpen}
                onClose={() => setIsAssignmentModalOpen(false)}
                onSave={async (data) => {
                    if (assignmentToEdit) {
                        await updateLmsAssignment(assignmentToEdit.id, data);
                        addNotification('Assignment updated successfully', 'success');
                    } else {
                        await addLmsAssignment(data);
                        addNotification('Assignment published successfully', 'success');
                    }
                }}
                assignmentToEdit={assignmentToEdit}
                classes={classes}
                subjects={subjects}
                currentTeacherName={currentUser?.name || 'Teacher'}
                currentTeacherId={currentUser?.id || 'teacher-1'}
            />

            <LmsLiveClassModal
                isOpen={isLiveClassModalOpen}
                onClose={() => setIsLiveClassModalOpen(false)}
                onSave={async (data) => {
                    if (liveClassToEdit) {
                        await updateLmsLiveClass(liveClassToEdit.id, data);
                        addNotification('Live class updated successfully', 'success');
                    } else {
                        await addLmsLiveClass(data);
                        addNotification('Virtual live class scheduled & broadcasted', 'success');
                    }
                }}
                classToEdit={liveClassToEdit}
                classes={classes}
                subjects={subjects}
                currentTeacherName={currentUser?.name || 'Teacher'}
                currentTeacherId={currentUser?.id || 'teacher-1'}
            />

            <LmsGradingModal
                isOpen={isGradingModalOpen}
                onClose={() => setIsGradingModalOpen(false)}
                onSaveGrade={async (subId, gradeData) => {
                    await gradeLmsSubmission(subId, gradeData);
                    addNotification('Grade and feedback published successfully', 'success');
                }}
                submission={gradingSubmission}
                assignment={gradingAssignment}
                currentTeacherName={currentUser?.name || 'Teacher'}
            />

            <VirtualClassroomModal
                isOpen={isVirtualRoomOpen}
                onClose={() => setIsVirtualRoomOpen(false)}
                liveClass={activeLiveClass}
                currentUserName={currentUser?.name || 'Teacher'}
                isTeacher={currentUser?.role === 'Teacher' || currentUser?.role === 'Admin'}
            />
        </div>
    );
};

export default LmsView;
