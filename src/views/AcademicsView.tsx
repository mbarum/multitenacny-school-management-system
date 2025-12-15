
import React, { useState } from 'react';
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
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingData, setEditingData] = useState<any>(null);

    // --- Queries ---
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data) });
    const { data: subjects = [] } = useQuery({ queryKey: ['subjects'], queryFn: () => api.getSubjects().then(res => Array.isArray(res) ? res : res.data) });
    const { data: assignments = [] } = useQuery({ queryKey: ['assignments'], queryFn: () => api.findAllAssignments().then(res => Array.isArray(res) ? res : res.data) });
    const { data: staff = [] } = useQuery({ queryKey: ['staff'], queryFn: () => api.getStaff() }); // Need staff for dropdowns

    // --- Mutations ---
    const createClassMutation = useMutation({ mutationFn: api.createClass, onSuccess: () => { queryClient.invalidateQueries({queryKey:['classes']}); setIsModalOpen(false); addNotification('Class created', 'success'); } });
    const updateClassMutation = useMutation({ mutationFn: (d:any) => api.updateClass(d.id, d.data), onSuccess: () => { queryClient.invalidateQueries({queryKey:['classes']}); setIsModalOpen(false); addNotification('Class updated', 'success'); } });
    const deleteClassMutation = useMutation({ mutationFn: api.deleteClass, onSuccess: () => { queryClient.invalidateQueries({queryKey:['classes']}); addNotification('Class deleted', 'success'); } });

    const createSubjectMutation = useMutation({ mutationFn: api.createSubject, onSuccess: () => { queryClient.invalidateQueries({queryKey:['subjects']}); setIsModalOpen(false); addNotification('Subject created', 'success'); } });
    const updateSubjectMutation = useMutation({ mutationFn: (d:any) => api.updateSubject(d.id, d.data), onSuccess: () => { queryClient.invalidateQueries({queryKey:['subjects']}); setIsModalOpen(false); addNotification('Subject updated', 'success'); } });
    const deleteSubjectMutation = useMutation({ mutationFn: api.deleteSubject, onSuccess: () => { queryClient.invalidateQueries({queryKey:['subjects']}); addNotification('Subject deleted', 'success'); } });

    const createAssignMutation = useMutation({ mutationFn: api.createAssignment, onSuccess: () => { queryClient.invalidateQueries({queryKey:['assignments']}); setIsModalOpen(false); addNotification('Assignment created', 'success'); } });
    const deleteAssignMutation = useMutation({ mutationFn: api.deleteAssignment, onSuccess: () => { queryClient.invalidateQueries({queryKey:['assignments']}); addNotification('Assignment removed', 'success'); } });

    // --- Handlers ---

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

    const teachers = staff.filter((s:any) => s.userRole === Role.Teacher);

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
                        <thead><tr className="bg-slate-50 border-b"><th className="p-2">Class Name</th><th className="p-2">Class Code</th><th className="p-2">Form Teacher</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>{classes.map((c:any) => (<tr key={c.id} className="border-b">
                            <td className="p-2">{c.name}</td>
                            <td className="p-2">{c.classCode}</td>
                            <td className="p-2">{c.formTeacherName || 'Not Assigned'}</td>
                            <td className="p-2 space-x-2">
                                <button onClick={() => openModal('class', c)} className="text-blue-600 hover:underline">Edit</button>
                                <button onClick={() => { if(confirm('Delete class?')) deleteClassMutation.mutate(c.id); }} className="text-red-600 hover:underline">Delete</button>
                            </td></tr>))}</tbody>
                    </table>
                </div>
            )}
            
            {activeTab === 'subjects' && (
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Manage Subjects</h3>
                        <button onClick={() => openModal('subject')} className="px-4 py-2 bg-primary-600 text-white rounded-lg">Add Subject</button>
                    </div>
                     <table className="w-full text-left table-auto">
                        <thead><tr className="bg-slate-50 border-b"><th className="p-2">Subject Name</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>{subjects.map((s:any) => (<tr key={s.id} className="border-b">
                            <td className="p-2">{s.name}</td>
                            <td className="p-2 space-x-2">
                                <button onClick={() => openModal('subject', s)} className="text-blue-600 hover:underline">Edit</button>
                                <button onClick={() => { if(confirm('Delete subject?')) deleteSubjectMutation.mutate(s.id); }} className="text-red-600 hover:underline">Delete</button>
                            </td></tr>))}</tbody>
                    </table>
                </div>
            )}

            {activeTab === 'assignments' && (
                 <div className="bg-white p-6 rounded-xl shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">Subject & Teacher Assignments</h3>
                        <button onClick={() => openModal('assignment')} className="px-4 py-2 bg-primary-600 text-white rounded-lg">New Assignment</button>
                    </div>
                     <table className="w-full text-left table-auto">
                        <thead><tr className="bg-slate-50 border-b"><th className="p-2">Class</th><th className="p-2">Subject</th><th className="p-2">Teacher</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>{assignments.map((a:any) => (<tr key={a.id} className="border-b">
                            <td className="p-2">{classes.find((c:any)=>c.id === a.classId)?.name}</td>
                            <td className="p-2">{subjects.find((s:any)=>s.id === a.subjectId)?.name}</td>
                            <td className="p-2">{staff.find((s:any)=>s.userId === a.teacherId)?.name}</td>
                            <td className="p-2 space-x-2">
                                <button onClick={() => { if(confirm('Remove assignment?')) deleteAssignMutation.mutate(a.id); }} className="text-red-600 hover:underline">Delete</button>
                            </td></tr>))}</tbody>
                    </table>
                </div>
            )}

            {isModalOpen && modalType === 'class' && <ClassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveClass} data={editingData} teachers={teachers} />}
            {isModalOpen && modalType === 'subject' && <SubjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveSubject} data={editingData} />}
            {isModalOpen && modalType === 'assignment' && <AssignmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveAssignment} data={editingData} classes={classes} subjects={subjects} teachers={teachers} />}
        </div>
    );
};

const ClassModal: React.FC<any> = ({ isOpen, onClose, onSave, data, teachers }) => {
    const [name, setName] = useState(data?.name || '');
    const [classCode, setClassCode] = useState(data?.classCode || '');
    const [formTeacherId, setFormTeacherId] = useState(data?.formTeacherId || '');
    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Class" : "Add Class"}><form onSubmit={e => {e.preventDefault(); onSave({name, classCode, formTeacherId: formTeacherId || null})}} className="space-y-4">
        <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Class Name" className="w-full p-2 border rounded" required />
        <input type="text" value={classCode} onChange={e => setClassCode(e.target.value)} placeholder="Class Code (e.g., 001)" className="w-full p-2 border rounded" required />
        <select value={formTeacherId} onChange={e => setFormTeacherId(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Form Teacher</option>{teachers.map((t:Staff) => <option key={t.userId} value={t.userId}>{t.name}</option>)}</select>
        <div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button></div>
    </form></Modal>
}

const SubjectModal: React.FC<any> = ({ isOpen, onClose, onSave, data }) => {
    const [name, setName] = useState(data?.name || '');
    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Subject" : "Add Subject"}><form onSubmit={e => {e.preventDefault(); onSave({name})}} className="space-y-4"><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Subject Name" className="w-full p-2 border rounded" required /><div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button></div></form></Modal>
}

const AssignmentModal: React.FC<any> = ({ isOpen, onClose, onSave, data, classes, subjects, teachers }) => {
    const [classId, setClassId] = useState(data?.classId || '');
    const [subjectId, setSubjectId] = useState(data?.subjectId || '');
    const [teacherId, setTeacherId] = useState(data?.teacherId || '');
    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Assignment" : "New Assignment"}><form onSubmit={e => {e.preventDefault(); onSave({classId, subjectId, teacherId})}} className="space-y-4"><select value={classId} onChange={e => setClassId(e.target.value)} className="w-full p-2 border rounded" required><option value="">Select Class</option>{classes.map((c:SchoolClass) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full p-2 border rounded" required><option value="">Select Subject</option>{subjects.map((s:Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full p-2 border rounded" required><option value="">Select Teacher</option>{teachers.map((t:Staff) => <option key={t.userId} value={t.userId}>{t.name}</option>)}</select><div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button></div></form></Modal>
}

export default AcademicsView;
