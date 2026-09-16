
import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SchoolClass, Subject, ClassSubjectAssignment, Staff } from '../types';
import { Role } from '../types';
import Modal from '../components/common/Modal';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';

const AcademicsView: React.FC = () => {
    const { addNotification } = useData();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState('classes');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingData, setEditingData] = useState<any>(null);

    const { data: rawClasses = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])) });
    const { data: rawSubjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.getSubjects().then((res: any) => Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])) });
    const { data: rawAssignments = [] } = useQuery({ queryKey: ['assignments'], queryFn: () => api.findAllAssignments().then((res: any) => Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])) });
    const { data: rawStaff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => api.getStaff().then((res: any) => Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : [])) });

    const classes: SchoolClass[] = React.useMemo(() => {
        const list = Array.isArray(rawClasses) ? rawClasses : [];
        return list.filter((c: any) => Boolean(c && typeof c === 'object' && c.id));
    }, [rawClasses]);

    const subjects: Subject[] = React.useMemo(() => {
        const list = Array.isArray(rawSubjects) ? rawSubjects : [];
        return list.filter((s: any) => Boolean(s && typeof s === 'object' && s.id));
    }, [rawSubjects]);

    const assignments: ClassSubjectAssignment[] = React.useMemo(() => {
        const list = Array.isArray(rawAssignments) ? rawAssignments : [];
        return list.filter((a: any) => Boolean(a && typeof a === 'object' && a.id));
    }, [rawAssignments]);

    const staffList: Staff[] = React.useMemo(() => {
        const list = Array.isArray(rawStaff) ? rawStaff : [];
        return list.filter((s: any): s is Staff => Boolean(s && typeof s === 'object' && s.id));
    }, [rawStaff]);

    const createClassMutation = useMutation({ 
        mutationFn: api.createClass, 
        onSuccess: () => { queryClient.invalidateQueries({queryKey:['classes']}); setIsModalOpen(false); addNotification('Class created successfully', 'success'); },
        onError: (err: any) => addNotification(`Failed to create class: ${err?.message || 'Unknown error'}`, 'error')
    });
    const updateClassMutation = useMutation({ 
        mutationFn: (d:any) => api.updateClass(d.id, d.data), 
        onSuccess: () => { queryClient.invalidateQueries({queryKey:['classes']}); setIsModalOpen(false); addNotification('Class updated successfully', 'success'); },
        onError: (err: any) => addNotification(`Failed to update class: ${err?.message || 'Unknown error'}`, 'error')
    });
    const deleteClassMutation = useMutation({ 
        mutationFn: api.deleteClass, 
        onSuccess: () => { queryClient.invalidateQueries({queryKey:['classes']}); addNotification('Class deleted successfully', 'success'); },
        onError: (err: any) => addNotification(`Failed to delete class: ${err?.message || 'Unknown error'}`, 'error')
    });

    const createSubjectMutation = useMutation({ 
        mutationFn: api.createSubject, 
        onSuccess: () => { queryClient.invalidateQueries({queryKey:['subjects']}); setIsModalOpen(false); addNotification('Subject created successfully', 'success'); },
        onError: (err: any) => addNotification(`Failed to create subject: ${err?.message || 'Unknown error'}`, 'error')
    });
    const updateSubjectMutation = useMutation({ 
        mutationFn: (d:any) => api.updateSubject(d.id, d.data), 
        onSuccess: () => { queryClient.invalidateQueries({queryKey:['subjects']}); setIsModalOpen(false); addNotification('Subject updated successfully', 'success'); },
        onError: (err: any) => addNotification(`Failed to update subject: ${err?.message || 'Unknown error'}`, 'error')
    });
    const deleteSubjectMutation = useMutation({ 
        mutationFn: api.deleteSubject, 
        onSuccess: () => { queryClient.invalidateQueries({queryKey:['subjects']}); addNotification('Subject deleted successfully', 'success'); },
        onError: (err: any) => addNotification(`Failed to delete subject: ${err?.message || 'Unknown error'}`, 'error')
    });

    const createAssignMutation = useMutation({ 
        mutationFn: api.createAssignment, 
        onSuccess: () => { queryClient.invalidateQueries({queryKey:['assignments']}); setIsModalOpen(false); addNotification('Assignment created successfully', 'success'); },
        onError: (err: any) => addNotification(`Failed to create assignment: ${err?.message || 'Unknown error'}`, 'error')
    });
    const deleteAssignMutation = useMutation({ 
        mutationFn: api.deleteAssignment, 
        onSuccess: () => { queryClient.invalidateQueries({queryKey:['assignments']}); addNotification('Assignment removed successfully', 'success'); },
        onError: (err: any) => addNotification(`Failed to remove assignment: ${err?.message || 'Unknown error'}`, 'error')
    });

    const openModal = (type: string, data: any = null) => {
        setModalType(type);
        setEditingData(data);
        setIsModalOpen(true);
    };

    const handleSaveClass = (formData: any) => {
        if (editingData) updateClassMutation.mutate({ id: editingData.id, data: formData });
        else createClassMutation.mutate(formData);
    };

    const handleSaveSubject = (formData: any) => {
        if (editingData) updateSubjectMutation.mutate({ id: editingData.id, data: formData });
        else createSubjectMutation.mutate(formData);
    };

    const handleSaveAssignment = (formData: any) => {
        createAssignMutation.mutate(formData);
    };

    const teachers = React.useMemo(() => {
        return staffList.filter((s: any) => {
            if (!s || typeof s !== 'object') return false;
            return s.userRole === Role.Teacher || s.role === 'Teacher' || s.role === Role.Teacher;
        });
    }, [staffList]);

    return (
        <div className="p-4 sm:p-6">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Academics Management</h2>
            <div className="border-b border-slate-200 mb-6 overflow-x-auto">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('classes')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'classes' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Classes</button>
                    <button onClick={() => setActiveTab('subjects')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'subjects' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Subjects</button>
                    <button onClick={() => setActiveTab('assignments')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'assignments' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Assignments</button>
                </nav>
            </div>

            {activeTab === 'classes' && (
                <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Manage Classes</h3>
                        <button onClick={() => openModal('class')} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Add Class</button>
                    </div>
                     <table className="w-full text-left table-auto">
                        <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3 font-semibold text-slate-600">Class Name</th><th className="px-4 py-3 font-semibold text-slate-600">Class Code</th><th className="px-4 py-3 font-semibold text-slate-600">Form Teacher</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
                        <tbody>{classes.map((c:any) => (<tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                            <td className="px-4 py-3 text-slate-600">{c.classCode}</td>
                            <td className="px-4 py-3 text-slate-600">{c.formTeacherName || 'Not Assigned'}</td>
                            <td className="px-4 py-3 space-x-2">
                                <button onClick={() => openModal('class', c)} className="text-blue-600 hover:underline text-sm font-bold">Edit</button>
                                <button onClick={() => { if(confirm('Delete class?')) deleteClassMutation.mutate(c.id); }} className="text-red-600 hover:underline text-sm font-bold">Delete</button>
                            </td></tr>))}</tbody>
                    </table>
                </div>
            )}
            
            {activeTab === 'subjects' && (
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-slate-800">Learning Areas (Subjects)</h3>
                        <button onClick={() => openModal('subject')} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Add Subject</button>
                    </div>
                     <table className="w-full text-left table-auto">
                        <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3 font-semibold text-slate-600">Subject Code</th><th className="px-4 py-3 font-semibold text-slate-600">Subject Name</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
                        <tbody>{subjects.map((s:any) => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                            <td className="px-4 py-3 font-mono text-primary-700 font-bold">{s.code}</td>
                            <td className="px-4 py-3 font-medium text-slate-800 uppercase">{s.name}</td>
                            <td className="px-4 py-3 space-x-2">
                                <button onClick={() => openModal('subject', s)} className="text-blue-600 hover:underline text-sm font-bold">Edit</button>
                                <button onClick={() => { if(confirm('Delete subject?')) deleteSubjectMutation.mutate(s.id); }} className="text-red-600 hover:underline text-sm font-bold">Delete</button>
                            </td></tr>))}</tbody>
                    </table>
                </div>
            )}

            {activeTab === 'assignments' && (
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Teacher Assignments</h3>
                        <button onClick={() => openModal('assignment')} className="px-4 py-2 bg-primary-600 text-white rounded-lg">New Assignment</button>
                    </div>
                     <table className="w-full text-left table-auto">
                        <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3 font-semibold text-slate-600">Class</th><th className="px-4 py-3 font-semibold text-slate-600">Subject</th><th className="px-4 py-3 font-semibold text-slate-600">Teacher</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
                        <tbody>
                            {assignments.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                                        No teacher assignments found. Click "New Assignment" to assign a teacher to a class subject.
                                    </td>
                                </tr>
                            ) : (
                                assignments.map((a: any) => {
                                    if (!a) return null;
                                    const assignedClass = classes.find((c: any) => c?.id === a.classId);
                                    const assignedSubject = subjects.find((s: any) => s?.id === a.subjectId);
                                    const assignedTeacher = staffList.find((s: any) => (s?.userId && s.userId === a.teacherId) || (s?.id && s.id === a.teacherId));

                                    return (
                                        <tr key={a.id || Math.random()} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-800">{assignedClass?.name || 'Unknown Class'}</td>
                                            <td className="px-4 py-3 text-slate-600">{assignedSubject?.name || 'Unknown Subject'}</td>
                                            <td className="px-4 py-3 text-slate-600 font-bold">{assignedTeacher?.name || 'Unknown Teacher'}</td>
                                            <td className="px-4 py-3 space-x-2">
                                                <button onClick={() => { if(confirm('Remove assignment?')) deleteAssignMutation.mutate(a.id); }} className="text-red-600 hover:underline text-sm font-bold">Delete</button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            )}

            {isModalOpen && modalType === 'class' && (
                <ClassModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveClass} 
                    data={editingData} 
                    teachers={teachers} 
                    isPending={createClassMutation.isPending || updateClassMutation.isPending} 
                />
            )}
            {isModalOpen && modalType === 'subject' && (
                <SubjectModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveSubject} 
                    data={editingData} 
                    isPending={createSubjectMutation.isPending || updateSubjectMutation.isPending} 
                />
            )}
            {isModalOpen && modalType === 'assignment' && (
                <AssignmentModal 
                    isOpen={isModalOpen} 
                    onClose={() => setIsModalOpen(false)} 
                    onSave={handleSaveAssignment} 
                    data={editingData} 
                    classes={classes} 
                    subjects={subjects} 
                    teachers={teachers} 
                    isPending={createAssignMutation.isPending} 
                />
            )}
        </div>
    );
};

const ClassModal: React.FC<any> = ({ isOpen, onClose, onSave, data, teachers, isPending }) => {
    const [name, setName] = useState(data?.name || '');
    const [classCode, setClassCode] = useState(data?.classCode || '');
    const [formTeacherId, setFormTeacherId] = useState(data?.formTeacherId || '');

    useEffect(() => {
        setName(data?.name || '');
        setClassCode(data?.classCode || '');
        setFormTeacherId(data?.formTeacherId || '');
    }, [data, isOpen]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name: name.trim(), classCode: classCode.trim(), formTeacherId: formTeacherId || null });
    };

    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Class" : "Add Class"}><form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Grade 1 East" className="w-full p-2 border rounded" required />
        </div>
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Class Code</label>
            <input type="text" value={classCode} onChange={e => setClassCode(e.target.value)} placeholder="e.g. G1-E or 001" className="w-full p-2 border rounded" required />
        </div>
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Form Teacher</label>
            <select value={formTeacherId} onChange={e => setFormTeacherId(e.target.value)} className="w-full p-2 border rounded">
                <option value="">Select Form Teacher (Optional)</option>
                {teachers.map((t: Staff) => {
                    if (!t) return null;
                    const value = t.userId || t.id;
                    return <option key={value} value={value}>{t.name || 'Unnamed Teacher'}</option>;
                })}
            </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary-600 text-white rounded font-medium disabled:opacity-50">
                {isPending ? 'Saving...' : 'Save Class'}
            </button>
        </div>
    </form></Modal>
}

const SubjectModal: React.FC<any> = ({ isOpen, onClose, onSave, data, isPending }) => {
    const [name, setName] = useState(data?.name || '');
    const [code, setCode] = useState(data?.code || '');

    useEffect(() => {
        setName(data?.name || '');
        setCode(data?.code || '');
    }, [data, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name: name.trim(), code: code.trim().toUpperCase() });
    };

    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Subject" : "Add Subject"}><form onSubmit={handleSubmit} className="space-y-4">
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Code</label>
            <input type="text" value={code} onChange={e => setCode(e.target.value)} placeholder="e.g. 901 or ENG" className="w-full p-2 border rounded uppercase" required />
        </div>
        <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Subject Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Mathematics" className="w-full p-2 border rounded" required />
        </div>
        <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
            <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary-600 text-white rounded font-medium disabled:opacity-50">
                {isPending ? 'Saving...' : 'Save Subject'}
            </button>
        </div>
    </form></Modal>
}

const AssignmentModal: React.FC<any> = ({ isOpen, onClose, onSave, data, classes, subjects, teachers, isPending }) => {
    const [classId, setClassId] = useState(data?.classId || '');
    const [subjectId, setSubjectId] = useState(data?.subjectId || '');
    const [teacherId, setTeacherId] = useState(data?.teacherId || '');

    useEffect(() => {
        setClassId(data?.classId || '');
        setSubjectId(data?.subjectId || '');
        setTeacherId(data?.teacherId || '');
    }, [data, isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Assignment" : "New Assignment"}>
            <form onSubmit={e => { e.preventDefault(); onSave({ classId, subjectId, teacherId }); }} className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Class</label>
                    <select value={classId} onChange={e => setClassId(e.target.value)} className="w-full p-2 border rounded" required>
                        <option value="">Select Class</option>
                        {classes.map((c: SchoolClass) => c?.id ? <option key={c.id} value={c.id}>{c.name || c.id}</option> : null)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                    <select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full p-2 border rounded" required>
                        <option value="">Select Subject</option>
                        {subjects.map((s: Subject) => s?.id ? <option key={s.id} value={s.id}>{s.name || s.id}</option> : null)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Teacher</label>
                    <select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full p-2 border rounded" required>
                        <option value="">Select Teacher</option>
                        {teachers.map((t: Staff) => {
                            if (!t) return null;
                            const value = t.userId || t.id;
                            return <option key={value} value={value}>{t.name || 'Unnamed Teacher'}</option>;
                        })}
                    </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded">Cancel</button>
                    <button type="submit" disabled={isPending} className="px-4 py-2 bg-primary-600 text-white rounded font-medium disabled:opacity-50">
                        {isPending ? 'Saving...' : 'Save Assignment'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default AcademicsView;
