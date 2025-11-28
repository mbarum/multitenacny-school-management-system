

import React, { useState } from 'react';
import type { SchoolClass, Subject, ClassSubjectAssignment, Staff } from '../../types';
import Modal from '../common/Modal';
import { useData } from '../../contexts/DataContext';

const AcademicsView: React.FC = () => {
    const { classes, updateClasses, subjects, updateSubjects, classSubjectAssignments, updateAssignments, staff } = useData();
    const [activeTab, setActiveTab] = useState('classes');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState('');
    const [editingData, setEditingData] = useState<any>(null);

    const handleSaveClass = (formData: any) => {
        let updatedClasses;
        if (editingData) {
            updatedClasses = classes.map(c => c.id === editingData.id ? { ...c, ...formData } : c);
        } else {
            updatedClasses = [...classes, { ...formData, id: `cls-${Date.now()}` }];
        }
        updateClasses(updatedClasses);
        setIsModalOpen(false);
    };

    const handleSaveSubject = (formData: any) => {
        let updatedSubjects;
        if (editingData) {
            updatedSubjects = subjects.map(s => s.id === editingData.id ? { ...s, ...formData } : s);
        } else {
            updatedSubjects = [...subjects, { ...formData, id: `sub-${Date.now()}` }];
        }
        updateSubjects(updatedSubjects);
        setIsModalOpen(false);
    };
    
    const handleSaveAssignment = (formData: any) => {
        let updatedAssignments;
        if (editingData) {
            updatedAssignments = classSubjectAssignments.map(a => a.id === editingData.id ? { ...a, ...formData } : a);
        } else {
            updatedAssignments = [...classSubjectAssignments, { ...formData, id: `csa-${Date.now()}` }];
        }
        updateAssignments(updatedAssignments);
        setIsModalOpen(false);
    };


    const openModal = (type: string, data: any = null) => {
        setModalType(type);
        setEditingData(data);
        setIsModalOpen(true);
    };

    const teachers = staff.filter(s => s.role.toLowerCase().includes('teacher'));

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
                        <thead><tr className="bg-slate-50 border-b"><th className="p-2">Class Name</th><th className="p-2">Form Teacher</th><th className="p-2">Actions</th></tr></thead>
                        <tbody>{classes.map(c => (<tr key={c.id} className="border-b">
                            <td className="p-2">{c.name}</td>
                            <td className="p-2">{staff.find(s => s.id === c.formTeacherId)?.name || 'Not Assigned'}</td>
                            <td className="p-2"><button onClick={() => openModal('class', c)} className="text-blue-600">Edit</button></td></tr>))}</tbody>
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
                        <tbody>{subjects.map(s => (<tr key={s.id} className="border-b"><td className="p-2">{s.name}</td><td className="p-2"><button onClick={() => openModal('subject', s)} className="text-blue-600">Edit</button></td></tr>))}</tbody>
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
                            <td className="p-2">{staff.find(s=>s.id === a.teacherId)?.name}</td>
                            <td className="p-2"><button onClick={() => openModal('assignment', a)} className="text-blue-600">Edit</button></td></tr>))}</tbody>
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
    const [formTeacherId, setFormTeacherId] = useState(data?.formTeacherId || '');
    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Class" : "Add Class"}><form onSubmit={e => {e.preventDefault(); onSave({name, formTeacherId})}} className="space-y-4"><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Class Name" className="w-full p-2 border rounded" required /><select value={formTeacherId} onChange={e => setFormTeacherId(e.target.value)} className="w-full p-2 border rounded"><option value="">Select Form Teacher</option>{teachers.map((t:Staff) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button></div></form></Modal>
}

const SubjectModal: React.FC<any> = ({ isOpen, onClose, onSave, data }) => {
    const [name, setName] = useState(data?.name || '');
    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Subject" : "Add Subject"}><form onSubmit={e => {e.preventDefault(); onSave({name})}} className="space-y-4"><input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Subject Name" className="w-full p-2 border rounded" required /><div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button></div></form></Modal>
}

const AssignmentModal: React.FC<any> = ({ isOpen, onClose, onSave, data, classes, subjects, teachers }) => {
    const [classId, setClassId] = useState(data?.classId || '');
    const [subjectId, setSubjectId] = useState(data?.subjectId || '');
    const [teacherId, setTeacherId] = useState(data?.teacherId || '');
    return <Modal isOpen={isOpen} onClose={onClose} title={data ? "Edit Assignment" : "New Assignment"}><form onSubmit={e => {e.preventDefault(); onSave({classId, subjectId, teacherId})}} className="space-y-4"><select value={classId} onChange={e => setClassId(e.target.value)} className="w-full p-2 border rounded" required><option value="">Select Class</option>{classes.map((c:SchoolClass) => <option key={c.id} value={c.id}>{c.name}</option>)}</select><select value={subjectId} onChange={e => setSubjectId(e.target.value)} className="w-full p-2 border rounded" required><option value="">Select Subject</option>{subjects.map((s:Subject) => <option key={s.id} value={s.id}>{s.name}</option>)}</select><select value={teacherId} onChange={e => setTeacherId(e.target.value)} className="w-full p-2 border rounded" required><option value="">Select Teacher</option>{teachers.map((t:Staff) => <option key={t.id} value={t.id}>{t.name}</option>)}</select><div className="flex justify-end"><button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded">Save</button></div></form></Modal>
}

export default AcademicsView;