import React, { useState, useEffect } from 'react';
import type { LmsLiveClass, SchoolClass, Subject } from '../../types';

interface LmsLiveClassModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (classData: Partial<LmsLiveClass>) => Promise<void>;
    classToEdit?: LmsLiveClass | null;
    classes: SchoolClass[];
    subjects: Subject[];
    currentTeacherName?: string;
    currentTeacherId?: string;
}

const LmsLiveClassModal: React.FC<LmsLiveClassModalProps> = ({
    isOpen,
    onClose,
    onSave,
    classToEdit,
    classes,
    subjects,
    currentTeacherName = 'Teacher',
    currentTeacherId = 'teacher-1'
}) => {
    const [title, setTitle] = useState('');
    const [platform, setPlatform] = useState<'Google Meet' | 'Zoom'>('Google Meet');
    const [classId, setClassId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [scheduledDate, setScheduledDate] = useState('');
    const [scheduledTime, setScheduledTime] = useState('10:00');
    const [durationMinutes, setDurationMinutes] = useState(60);
    const [joinUrl, setJoinUrl] = useState('');
    const [meetingId, setMeetingId] = useState('');
    const [passcode, setPasscode] = useState('');
    const [agenda, setAgenda] = useState('');
    const [status, setStatus] = useState<'Scheduled' | 'Live' | 'Completed' | 'Cancelled'>('Scheduled');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (classToEdit) {
            setTitle(classToEdit.title);
            setPlatform(classToEdit.platform?.toString().includes('Zoom') ? 'Zoom' : 'Google Meet');
            setClassId(classToEdit.classId);
            setSubjectId(classToEdit.subjectId);
            const startIso = classToEdit.scheduledStartTime || (classToEdit.date ? `${classToEdit.date}T${classToEdit.startTime || '10:00'}:00` : new Date().toISOString());
            const d = new Date(startIso);
            setScheduledDate(d.toISOString().split('T')[0]);
            setScheduledTime(d.toTimeString().slice(0, 5));
            setDurationMinutes(classToEdit.durationMinutes || 60);
            setJoinUrl(classToEdit.joinUrl || classToEdit.meetingUrl || '');
            setMeetingId(classToEdit.meetingId || '');
            setPasscode(classToEdit.passcode || '');
            setAgenda(classToEdit.agenda || classToEdit.description || classToEdit.topic || '');
            const st = classToEdit.status?.toString();
            if (st === 'Live' || st === 'Completed' || st === 'Cancelled' || st === 'Scheduled') {
                setStatus(st as any);
            } else {
                setStatus('Scheduled');
            }
        } else {
            setTitle('');
            setPlatform('Google Meet');
            setClassId(classes[0]?.id || '');
            setSubjectId(subjects[0]?.id || '');
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            setScheduledDate(tomorrow.toISOString().split('T')[0]);
            setScheduledTime('10:00');
            setDurationMinutes(60);
            setJoinUrl('https://meet.google.com/qwe-rtyu-iop');
            setMeetingId('');
            setPasscode('');
            setAgenda('1. Review homework solutions.\n2. Guided problem-solving.\n3. Student Q&A and practical demonstration.');
            setStatus('Scheduled');
        }
        setError('');
    }, [classToEdit, isOpen, classes, subjects]);

    if (!isOpen) return null;

    const handleAutoGenerateLink = () => {
        if (platform === 'Google Meet') {
            const randomCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
            setJoinUrl(`https://meet.google.com/${randomCode}`);
            setMeetingId('');
            setPasscode('');
        } else {
            const randomZoomId = `${Math.floor(100 + Math.random() * 900)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
            const randomPasscode = Math.random().toString(36).substring(2, 8).toUpperCase();
            setJoinUrl(`https://zoom.us/j/${randomZoomId.replace(/\s/g, '')}?pwd=${randomPasscode}`);
            setMeetingId(randomZoomId);
            setPasscode(randomPasscode);
        }
    };

    const handlePlatformChange = (p: 'Google Meet' | 'Zoom') => {
        setPlatform(p);
        if (p === 'Google Meet') {
            const randomCode = `${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`;
            setJoinUrl(`https://meet.google.com/${randomCode}`);
            setMeetingId('');
            setPasscode('');
        } else {
            const randomZoomId = '849 2039 1192';
            const randomPasscode = 'CBC2026';
            setJoinUrl(`https://zoom.us/j/84920391192?pwd=${randomPasscode}`);
            setMeetingId(randomZoomId);
            setPasscode(randomPasscode);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Please enter a session title');
            return;
        }
        if (!classId) {
            setError('Please select a class');
            return;
        }
        if (!subjectId) {
            setError('Please select a subject');
            return;
        }
        if (!scheduledDate) {
            setError('Please select a date');
            return;
        }
        if (!joinUrl.trim()) {
            setError('Please provide or generate a meeting join link');
            return;
        }

        const selectedClass = classes.find(c => c.id === classId);
        const selectedSubject = subjects.find(s => s.id === subjectId);
        const startDateTime = new Date(`${scheduledDate}T${scheduledTime}:00`).toISOString();

        setIsSubmitting(true);
        setError('');

        try {
            await onSave({
                title: title.trim(),
                topic: title.trim(),
                description: agenda.trim(),
                platform,
                classId,
                className: selectedClass?.name || 'Class',
                subjectId,
                subjectName: selectedSubject?.name || 'Subject',
                teacherId: currentTeacherId,
                teacherName: currentTeacherName,
                scheduledStartTime: startDateTime,
                date: scheduledDate,
                startTime: scheduledTime,
                durationMinutes: Number(durationMinutes) || 60,
                joinUrl: joinUrl.trim(),
                meetingUrl: joinUrl.trim(),
                meetingId: meetingId.trim() || undefined,
                passcode: passcode.trim() || undefined,
                agenda: agenda.trim(),
                status
            });
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Failed to save virtual live class');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-scale-up">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-xl text-white ${platform === 'Zoom' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                {classToEdit ? 'Edit Virtual Live Class' : 'Schedule Virtual Live Class'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Integrated with Google Meet & Zoom for online learning and remote classrooms
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
                        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Platform Selector */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Select Video Conferencing Platform <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => handlePlatformChange('Google Meet')}
                                className={`flex items-center justify-center space-x-2.5 p-3 rounded-xl border-2 transition ${
                                    platform === 'Google Meet'
                                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 font-bold shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                                <span className="text-sm">Google Meet</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => handlePlatformChange('Zoom')}
                                className={`flex items-center justify-center space-x-2.5 p-3 rounded-xl border-2 transition ${
                                    platform === 'Zoom'
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 font-bold shadow-sm'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 text-slate-600 dark:text-slate-400'
                                }`}
                            >
                                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                                <span className="text-sm">Zoom Meetings</span>
                            </button>
                        </div>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Session Topic / Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Live Practical: Stoichiometry & Gas Laws"
                            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            required
                        />
                    </div>

                    {/* Class & Subject */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Target Class <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={classId}
                                onChange={(e) => setClassId(e.target.value)}
                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                required
                            >
                                <option value="" disabled>Select Class</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Subject <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={subjectId}
                                onChange={(e) => setSubjectId(e.target.value)}
                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                required
                            >
                                <option value="" disabled>Select Subject</option>
                                {subjects.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date, Time, Duration */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Start Time <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="time"
                                value={scheduledTime}
                                onChange={(e) => setScheduledTime(e.target.value)}
                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Duration (Minutes)
                            </label>
                            <select
                                value={durationMinutes}
                                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            >
                                <option value={30}>30 Minutes</option>
                                <option value={45}>45 Minutes</option>
                                <option value={60}>60 Minutes (1 hr)</option>
                                <option value={90}>90 Minutes (1.5 hrs)</option>
                                <option value={120}>120 Minutes (2 hrs)</option>
                            </select>
                        </div>
                    </div>

                    {/* Join Link & Generator */}
                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                                Meeting Join URL <span className="text-red-500">*</span>
                            </label>
                            <button
                                type="button"
                                onClick={handleAutoGenerateLink}
                                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-semibold flex items-center"
                            >
                                <svg className="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Auto-Generate {platform} Room Link
                            </button>
                        </div>
                        <input
                            type="url"
                            value={joinUrl}
                            onChange={(e) => setJoinUrl(e.target.value)}
                            placeholder={platform === 'Zoom' ? 'https://zoom.us/j/...' : 'https://meet.google.com/...'}
                            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono text-xs"
                            required
                        />
                    </div>

                    {/* Zoom specific fields */}
                    {platform === 'Zoom' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-100 dark:border-blue-900/50">
                            <div>
                                <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                                    Zoom Meeting ID
                                </label>
                                <input
                                    type="text"
                                    value={meetingId}
                                    onChange={(e) => setMeetingId(e.target.value)}
                                    placeholder="e.g. 849 2039 1192"
                                    className="w-full px-3.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg focus:outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                                    Passcode
                                </label>
                                <input
                                    type="text"
                                    value={passcode}
                                    onChange={(e) => setPasscode(e.target.value)}
                                    placeholder="e.g. CBC2026"
                                    className="w-full px-3.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 rounded-lg focus:outline-none font-mono"
                                />
                            </div>
                        </div>
                    )}

                    {/* Agenda & Instructions */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Session Agenda & Preparation Instructions
                        </label>
                        <textarea
                            rows={3}
                            value={agenda}
                            onChange={(e) => setAgenda(e.target.value)}
                            placeholder="Points to cover, required textbooks or lab sheets..."
                            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>

                    {/* Status */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Class Status:
                        </span>
                        <div className="flex items-center space-x-2">
                            {(['Scheduled', 'Live', 'Completed'] as const).map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setStatus(s)}
                                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                        status === s
                                            ? s === 'Live' ? 'bg-red-500 text-white animate-pulse' : 'bg-primary-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    }`}
                                >
                                    {s === 'Live' && '🔴 '} {s}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Footer buttons */}
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
                            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition shadow-md disabled:opacity-50 flex items-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                                    Saving...
                                </>
                            ) : (
                                classToEdit ? 'Update Virtual Class' : 'Schedule & Broadcast Class'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LmsLiveClassModal;
