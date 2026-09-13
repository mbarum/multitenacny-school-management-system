import React, { useState, useEffect } from 'react';
import type { LmsAssignment, SchoolClass, Subject } from '../../types';

interface LmsAssignmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (assignmentData: Partial<LmsAssignment>) => Promise<void>;
    assignmentToEdit?: LmsAssignment | null;
    classes: SchoolClass[];
    subjects: Subject[];
    currentTeacherName?: string;
    currentTeacherId?: string;
}

const LmsAssignmentModal: React.FC<LmsAssignmentModalProps> = ({
    isOpen,
    onClose,
    onSave,
    assignmentToEdit,
    classes,
    subjects,
    currentTeacherName = 'Teacher',
    currentTeacherId = 'teacher-1'
}) => {
    const [title, setTitle] = useState('');
    const [classId, setClassId] = useState('');
    const [subjectId, setSubjectId] = useState('');
    const [type, setType] = useState<'Homework' | 'Project' | 'Quiz' | 'Lab Practical' | 'CBC Activity' | 'Essay'>('Homework');
    const [dueDate, setDueDate] = useState('');
    const [dueTime, setDueTime] = useState('23:59');
    const [totalPoints, setTotalPoints] = useState<number>(50);
    const [passingPoints, setPassingPoints] = useState<number>(25);
    const [description, setDescription] = useState('');
    const [instructions, setInstructions] = useState('');
    const [status, setStatus] = useState<'Published' | 'Draft'>('Published');
    const [allowLateSubmission, setAllowLateSubmission] = useState(true);
    
    // CBC Competencies
    const [selectedCompetencies, setSelectedCompetencies] = useState<string[]>(['Critical Thinking & Problem Solving']);
    
    // Attachments
    const [resourceName, setResourceName] = useState('');
    const [resourceUrl, setResourceUrl] = useState('');
    const [resources, setResources] = useState<Array<{ id?: string; title?: string; name: string; url: string; size?: string; type?: any }>>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (assignmentToEdit) {
            setTitle(assignmentToEdit.title);
            setClassId(assignmentToEdit.classId);
            setSubjectId(assignmentToEdit.subjectId);
            setType(assignmentToEdit.type as any || 'Homework');
            const d = new Date(assignmentToEdit.dueDate);
            setDueDate(d.toISOString().split('T')[0]);
            setDueTime(d.toTimeString().slice(0, 5));
            setTotalPoints(assignmentToEdit.totalPoints || 50);
            setPassingPoints(assignmentToEdit.passPoints || assignmentToEdit.passingPoints || 25);
            setDescription(assignmentToEdit.description || '');
            setInstructions(assignmentToEdit.instructions || '');
            setStatus(assignmentToEdit.status === 'Draft' ? 'Draft' : 'Published');
            setAllowLateSubmission(assignmentToEdit.allowLateSubmission !== false);
            setResources((assignmentToEdit.resources || []).map(r => ({
                id: r.id,
                title: r.title || r.name || 'Resource',
                name: r.name || r.title || 'Resource',
                url: r.url,
                size: r.size || '1.5 MB',
                type: r.type || 'pdf'
            })));
            setSelectedCompetencies(assignmentToEdit.cbcCompetencies || ['Critical Thinking & Problem Solving']);
        } else {
            // Defaults for new assignment
            setTitle('');
            setClassId(classes[0]?.id || '');
            setSubjectId(subjects[0]?.id || '');
            setType('Homework');
            const nextWeek = new Date();
            nextWeek.setDate(nextWeek.getDate() + 5);
            setDueDate(nextWeek.toISOString().split('T')[0]);
            setDueTime('17:00');
            setTotalPoints(50);
            setPassingPoints(25);
            setDescription('');
            setInstructions('1. Read the instructions carefully.\n2. Complete all calculations showing your working clearly.\n3. Upload your scanned sheet or PDF file.');
            setStatus('Published');
            setAllowLateSubmission(true);
            setResources([]);
            setSelectedCompetencies(['Critical Thinking & Problem Solving']);
        }
        setError('');
    }, [assignmentToEdit, isOpen, classes, subjects]);

    if (!isOpen) return null;

    const handleAddResource = () => {
        if (!resourceName.trim()) return;
        setResources(prev => [
            ...prev, 
            { 
                name: resourceName.trim(), 
                url: resourceUrl.trim() || '#',
                size: '2.4 MB PDF'
            }
        ]);
        setResourceName('');
        setResourceUrl('');
    };

    const handleRemoveResource = (index: number) => {
        setResources(prev => prev.filter((_, i) => i !== index));
    };

    const toggleCompetency = (comp: string) => {
        setSelectedCompetencies(prev => 
            prev.includes(comp) ? prev.filter(c => c !== comp) : [...prev, comp]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Please enter an assignment title');
            return;
        }
        if (!classId) {
            setError('Please select a target class');
            return;
        }
        if (!subjectId) {
            setError('Please select a subject');
            return;
        }
        if (!dueDate) {
            setError('Please select a due date');
            return;
        }

        const selectedClass = classes.find(c => c.id === classId);
        const selectedSubject = subjects.find(s => s.id === subjectId);
        const dueDateTimeString = new Date(`${dueDate}T${dueTime || '23:59'}:00`).toISOString();

        setIsSubmitting(true);
        setError('');

        try {
            await onSave({
                title: title.trim(),
                classId,
                className: selectedClass?.name || 'Class',
                subjectId,
                subjectName: selectedSubject?.name || 'Subject',
                teacherId: currentTeacherId,
                teacherName: currentTeacherName,
                type,
                description: description.trim(),
                instructions: instructions.trim(),
                totalPoints: Number(totalPoints) || 50,
                passPoints: Number(passingPoints) || 25,
                passingPoints: Number(passingPoints) || 25,
                dueDate: dueDateTimeString,
                status,
                allowLateSubmission,
                resources: resources.map((r, i) => ({
                    id: r.id || `res-${i}-${Date.now()}`,
                    title: r.title || r.name || 'Resource',
                    url: r.url || '#',
                    type: (r.type as any) || 'pdf',
                    name: r.name || r.title || 'Resource',
                    size: r.size || '1.2 MB'
                })),
                attachments: resources.map(r => ({ name: r.name, url: r.url, size: r.size })),
                cbcCompetencies: selectedCompetencies
            });
            onClose();
        } catch (err: any) {
            setError(err?.message || 'Failed to save assignment');
        } finally {
            setIsSubmitting(false);
        }
    };

    const allCompetencies = [
        'Critical Thinking & Problem Solving',
        'Digital Literacy',
        'Communication & Collaboration',
        'Creativity & Imagination',
        'Self-Efficacy & Organization'
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl w-full max-w-3xl shadow-2xl border border-slate-200 dark:border-slate-800 my-8 overflow-hidden animate-scale-up">
                {/* Modal Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 rounded-xl">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
                                {assignmentToEdit ? 'Edit Assignment / Homework' : 'Create New Assignment & Homework'}
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Issue coursework, homework, quizzes, and practical tasks to your students
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

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-xl text-xs flex items-center">
                            <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Assignment Title <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Chapter 4: Chemical Bonding & Reaction Kinetics Worksheet"
                            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            required
                        />
                    </div>

                    {/* Class, Subject, Assignment Type */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Task Type
                            </label>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value as any)}
                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            >
                                <option value="Homework">Homework</option>
                                <option value="Project">Project</option>
                                <option value="Quiz">Quiz</option>
                                <option value="Lab Practical">Lab Practical</option>
                                <option value="CBC Activity">CBC Activity</option>
                                <option value="Essay">Essay</option>
                            </select>
                        </div>
                    </div>

                    {/* Due Date & Time, Points */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Due Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={dueDate}
                                onChange={(e) => setDueDate(e.target.value)}
                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Due Time
                            </label>
                            <input
                                type="time"
                                value={dueTime}
                                onChange={(e) => setDueTime(e.target.value)}
                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Total Points
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                value={totalPoints}
                                onChange={(e) => setTotalPoints(Number(e.target.value))}
                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                Pass Mark
                            </label>
                            <input
                                type="number"
                                min="1"
                                max={totalPoints}
                                value={passingPoints}
                                onChange={(e) => setPassingPoints(Number(e.target.value))}
                                className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* Description / Prompt */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Overview / Description
                        </label>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief summary of the homework or practical task..."
                            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                        />
                    </div>

                    {/* Detailed Instructions & Rubric Guidelines */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Detailed Student Instructions & Rubric Guidelines
                        </label>
                        <textarea
                            rows={3}
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            placeholder="Provide numbered instructions or criteria for grading..."
                            className="w-full px-3.5 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono text-xs"
                        />
                    </div>

                    {/* CBC Competencies Selection */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            CBC Core Competencies Targeted
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {allCompetencies.map(comp => {
                                const isSelected = selectedCompetencies.includes(comp);
                                return (
                                    <button
                                        key={comp}
                                        type="button"
                                        onClick={() => toggleCompetency(comp)}
                                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                                            isSelected 
                                                ? 'bg-primary-600 text-white shadow-sm' 
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        {isSelected && '✓ '} {comp}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Resource Attachments */}
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            Reference Resources & Attached Files
                        </label>
                        
                        <div className="flex flex-col sm:flex-row gap-2 mb-3">
                            <input
                                type="text"
                                value={resourceName}
                                onChange={(e) => setResourceName(e.target.value)}
                                placeholder="Resource name (e.g. Chapter 4 Practice Sheet.pdf)"
                                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none"
                            />
                            <input
                                type="text"
                                value={resourceUrl}
                                onChange={(e) => setResourceUrl(e.target.value)}
                                placeholder="Download link or drive URL (optional)"
                                className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={handleAddResource}
                                className="px-4 py-1.5 bg-slate-800 dark:bg-slate-700 text-white rounded-lg text-xs font-semibold hover:bg-slate-700 transition"
                            >
                                Add File
                            </button>
                        </div>

                        {resources.length > 0 && (
                            <div className="space-y-1.5">
                                {resources.map((res, i) => (
                                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-white dark:bg-slate-800 rounded-lg text-xs border border-slate-200 dark:border-slate-700">
                                        <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-200">
                                            <svg className="w-4 h-4 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                                            </svg>
                                            <span className="font-medium">{res.name}</span>
                                            {res.size && <span className="text-slate-400 text-[10px]">({res.size})</span>}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveResource(i)}
                                            className="text-red-500 hover:text-red-700 text-xs font-semibold"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Submission Settings */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-200 dark:border-slate-800">
                        <label className="flex items-center space-x-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={allowLateSubmission}
                                onChange={(e) => setAllowLateSubmission(e.target.checked)}
                                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-xs text-slate-600 dark:text-slate-300">
                                Allow late submissions after due date (marked as &quot;Late&quot;)
                            </span>
                        </label>

                        <div className="flex items-center space-x-2">
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Status:</span>
                            <button
                                type="button"
                                onClick={() => setStatus(status === 'Published' ? 'Draft' : 'Published')}
                                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                                    status === 'Published' 
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' 
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                }`}
                            >
                                {status === 'Published' ? '✓ Published (Visible to Students)' : 'Draft (Hidden)'}
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
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
                                assignmentToEdit ? 'Update Assignment' : 'Publish Assignment'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LmsAssignmentModal;
