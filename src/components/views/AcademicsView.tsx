
import React, { useState } from 'react';
import type { SchoolClass, Subject, ClassSubjectAssignment, Staff } from '../../types';
import { Role } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../contexts/DataContext';
import * as api from '../services/api';

const AcademicsView: React.FC = () => {
    const { classes, updateClasses, subjects, updateSubjects, classSubjectAssignments, updateAssignments, staff, addNotification } = useData();
    const [activeTab, setActiveTab] = useState('classes');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingData, setEditingData] = useState<any>(null);

    const handleSaveClass = (formData: any) => {
        let updatedClasses;
        if (editingData) {
            updatedClasses = classes.map(c => c.id === editingData.id ? { ...c, ...formData } : c);
        } else {
            updatedClasses = [...classes, { ...formData }];
        }
        updateClasses(updatedClasses);
        setIsModalOpen(false);
    };

    const handleDeleteClass = async (id: string) => {
        if (!window.confirm("Delete this class? This will fail if students are assigned.")) return;
        try {
            await api.deleteClass(id);
            // Refresh logic: filter out locally
            updateClasses(classes.filter(c => c.id !== id));
            addNotification("Class deleted.", "success");
        } catch (e: any) {
            addNotification(e.message || "Failed to delete class.", "error");
        }
    };

    const handleSaveSubject = (formData: any) => {
        let updatedSubjects;
        if (editingData) {
            updatedSubjects = subjects.map(s => s.id === editingData.id ? { ...s, ...formData } : s);
        } else {
            updatedSubjects = [...subjects, { ...formData }];
        }
        updateSubjects(updatedSubjects);
        setIsModalOpen(false);
    };

    const handleDeleteSubject = async (id: string) => {
        if (!window.confirm("Delete this subject?")) return;
        try {
            await api.deleteSubject(id);
            updateSubjects(subjects.filter(s => s.id !== id));
            addNotification("Subject deleted.", "success");
        } catch (e: any) {
            addNotification("Failed to delete subject. It may be assigned to a class.", "error");
        }
    };
    
    const handleSaveAssignment = (formData: any) => {
        let updatedAssignments;
        if (editingData) {
            updatedAssignments = classSubjectAssignments.map(a => a.id === editingData.id ? { ...a, ...formData } : a);
        } else {
            updatedAssignments = [...classSubjectAssignments, { ...formData }];
        }
        updateAssignments(updatedAssignments);
        setIsModalOpen(false);
    };

    const handleDeleteAssignment = async (id: string) => {
        if (!window.confirm("Remove this teacher assignment?")) return;
        try {
            await api.deleteAssignment(id);
            updateAssignments(classSubjectAssignments.filter(a => a.id !== id));
            addNotification("Assignment removed.", "success");
        } catch (e) {
            addNotification("Failed to remove assignment.", "error");
        }
    };


    const openModal = (type: string, data: any = null) => {
        setModalType(type);
        setEditingData(data);
        setIsModalOpen(true);
    };

    const teachers = staff.filter(s => s.userRole === Role.Teacher);

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">Academics Management</h2>
            <div className="border-b border-slate-200 mb-6">
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
                        <tbody>{classes.map(c => (<tr key={c.id} className="border-b">
                            <td className="p-2">{c.name}</td>
                            <td className="p-2">{c.classCode}</td>
                            <td className="p-2">{c.formTeacherName || 'Not Assigned'}</td>
                            <td className="p-2 space-x-2">
                                <button onClick={() => openModal('class', c)} className="text-blue-600 hover:underline">Edit</button>
                                <button onClick={() => handleDeleteClass(c.id)} className="text-red-600 hover:underline">Delete</button>
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
                        <tbody>{subjects.map(s => (<tr key={s.id} className="border-b">
                            <td className="p-2">{s.name}</td>
                            <td className="p-2 space-x-2">
                                <button onClick={() => openModal('subject', s)} className="text-blue-600 hover:underline">Edit</button>
                                <button onClick={() => handleDeleteSubject(s.id)} className="text-red-600 hover:underline">Delete</button>
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
                        <tbody>{classSubjectAssignments.map(a => (<tr key={a.id} className="border-b">
                            <td className="p-2">{classes.find(c=>c.id === a.classId)?.name}</td>
                            <td className="p-2">{subjects.find(s=>s.id === a.subjectId)?.name}</td>
                            <td className="p-2">{staff.find(s=>s.userId === a.teacherId)?.name}</td>
                            <td className="p-2 space-x-2">
                                <button onClick={() => openModal('assignment', a)} className="text-blue-600 hover:underline">Edit</button>
                                <button onClick={() => handleDeleteAssignment(a.id)} className="text-red-600 hover:underline">Delete</button>
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
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name, 
            classCode, 
            formTeacherId: formTeacherId || null // Ensure empty string becomes null
        });
    };

    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Class" : "Add Class"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Class Name" className="w-full p-2 border rounded" required />
            <input type="text" value={classCode} onChange={e => setClassCode(e.target.value)} placeholder="Class Code (e.g., 001)" className="w-full p-2 border rounded" required />
            <select value={formTeacherId} onChange={e => setFormTeacherId(e.target.value)} className="w-full p-2 border rounded">
                <option value="">Select Form Teacher</option>
                {teachers.map((t:Staff) => <option key={t.userId} value={t.userId}>{t.name}</option>)}
            </select>
            <div className="flex justify-end">
                <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button>
            </div>
        </form>
    </Modal>
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
