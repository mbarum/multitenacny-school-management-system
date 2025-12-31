
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/common/Modal';
import WebcamCaptureModal from '../components/common/WebcamCaptureModal';
import type { Student, NewStudent, NewCommunicationLog, NewTransaction, SchoolClass, CommunicationLog, FeeItem } from '../types';
import { CommunicationType, StudentStatus, TransactionType } from '../types';
import StudentBillingModal from '../components/common/StudentBillingModal';
import BulkMessageModal from '../components/common/BulkMessageModal';
import PromotionModal from '../components/common/PromotionModal';
import { useData } from '../contexts/DataContext';
import ImportModal from '../components/common/ImportModal';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import * as api from '../services/api';
import { calculateAge } from '../utils/helpers';

const DEFAULT_AVATAR = 'https://i.imgur.cc/S5o7W44.png';

// --- Sub-components (Profile & Communication) ---

const StudentProfileModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onViewIdCard: () => void;
}> = ({ isOpen, onClose, student, onViewIdCard }) => {
    const { currentUser, addNotification } = useData();
    const [activeTab, setActiveTab] = useState<'details' | 'communication'>('details');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState<Partial<Student>>({});
    const [studentLogs, setStudentLogs] = useState<CommunicationLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && student) {
            setActiveTab('details');
            setFormData({ ...student });
            setLoadingLogs(true);
            api.getCommunicationLogs({ studentId: student.id, limit: 20 })
                .then(res => setStudentLogs(res.data))
                .catch(() => {})
                .finally(() => setLoadingLogs(false));
        }
    }, [isOpen, student]);

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;
        try {
            // Enterprise standard: strip calculated fields before sending back to API
            const { id, admissionNumber, balance, class: clsName, ...updates } = formData as any;
            await api.updateStudent(student.id, updates);
            addNotification('Profile synchronized successfully', 'success');
            onClose();
        } catch (error) {
            addNotification('Sync failed. Please check field validation.', 'error');
        }
    };

    if (!isOpen || !student) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Student Dossier: ${student.name}`} size="2xl">
            <div className="flex border-b border-slate-100 mb-6">
                <button onClick={() => setActiveTab('details')} className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'details' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400'}`}>Information</button>
                <button onClick={() => setActiveTab('communication')} className={`px-6 py-3 font-black text-xs uppercase tracking-widest transition-all ${activeTab === 'communication' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-400'}`}>Logbook</button>
            </div>
            {activeTab === 'details' && (
                <form onSubmit={handleSaveChanges} className="space-y-6">
                    <div className="flex items-center space-x-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                        <img src={formData.profileImage || DEFAULT_AVATAR} className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-lg" />
                        <div>
                            <h4 className="text-xl font-black text-slate-800">{student.name}</h4>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{student.admissionNumber}</p>
                            <button type="button" onClick={onViewIdCard} className="mt-3 px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition-all">Generate ID</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Legal Name</label>
                            <input name="name" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3 border border-slate-200 rounded-xl font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</label>
                            <select name="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as StudentStatus})} className="w-full p-3 border border-slate-200 rounded-xl font-bold bg-white">
                                {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t">
                        <button type="submit" className="px-10 py-3 bg-primary-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary-600/20">Update Records</button>
                    </div>
                </form>
            )}
            {activeTab === 'communication' && (
                <div className="space-y-4">
                    {loadingLogs ? <Skeleton className="h-20 w-full" /> : 
                        studentLogs.length > 0 ? studentLogs.map(log => (
                            <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between mb-2">
                                    <span className="text-[10px] font-black text-primary-600 uppercase">{log.type}</span>
                                    <span className="text-[10px] font-bold text-slate-400">{new Date(log.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-sm text-slate-700 font-medium">{log.message}</p>
                            </div>
                        )) : <p className="text-center py-10 text-slate-400 font-bold uppercase text-xs tracking-widest">No previous logs found.</p>
                    }
                </div>
            )}
        </Modal>
    );
};

// --- Main View ---

const StudentsView: React.FC = () => {
    const { addNotification, openIdCardModal, currentUser } = useData();
    const queryClient = useQueryClient();

    // UI States
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

    // Filtering - CRITICAL: Default status is 'all' to prevent hiding students initially
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
    const [page, setPage] = useState(1);

    const initialStudentState: NewStudent = {
        name: '', classId: '', class: '', profileImage: DEFAULT_AVATAR,
        guardianName: '', guardianContact: '', guardianAddress: '', guardianEmail: '', emergencyContact: '', dateOfBirth: ''
    };
    const [newStudent, setNewStudent] = useState(initialStudentState);

    // Queries
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data) });
    const { data: feeStructure = [] } = useQuery({ queryKey: ['fee-structure'], queryFn: api.getFeeStructure });
    
    const { data: studentsData, isLoading } = useQuery({
        queryKey: ['students', page, searchTerm, selectedClass, statusFilter],
        queryFn: () => api.getStudents({ 
            page, 
            limit: 15, 
            search: searchTerm || undefined, 
            classId: selectedClass !== 'all' ? selectedClass : undefined, 
            status: statusFilter !== 'all' ? statusFilter : undefined
        }),
        placeholderData: (prev) => prev
    });

    // Enterprise Grade Data Handling: Service can return a direct array or a paginated object
    const students = useMemo(() => {
        if (!studentsData) return [];
        if (Array.isArray(studentsData)) return studentsData;
        return studentsData.data || [];
    }, [studentsData]);

    const totalPages = useMemo(() => {
        if (!studentsData || Array.isArray(studentsData)) return 1;
        return studentsData.last_page || 1;
    }, [studentsData]);

    // Mutations
    const addStudentMutation = useMutation({
        mutationFn: api.createStudent,
        onSuccess: async (student) => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification(`${student.name} provisioned successfully.`, 'success');
            setIsAddModalOpen(false);
            setNewStudent(initialStudentState);
        }
    });

    const deleteStudentMutation = useMutation({
        mutationFn: api.deleteStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification('Registry updated: student removed.', 'success');
        }
    });

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedStudentIds(students.map((s: Student) => s.id));
        else setSelectedStudentIds([]);
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Student Registry</h2>
                    <p className="text-slate-500 font-medium">Manage institutional enrollment and student dossier.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={() => setIsImportModalOpen(true)} className="px-5 py-2.5 bg-white text-slate-700 border border-slate-200 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Bulk Import</button>
                    <button onClick={() => setIsPromotionModalOpen(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Promotions</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30">Enroll Student</button>
                </div>
            </div>

            <div className="mb-8 flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100">
                <div className="relative flex-1 w-full">
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input 
                        type="text" 
                        placeholder="Search identity or admission index..." 
                        value={searchTerm} 
                        onChange={e => { setSearchTerm(e.target.value); setPage(1); }} 
                        className="w-full pl-12 pr-4 py-3 border-2 border-slate-50 rounded-2xl outline-none focus:border-primary-500 font-bold text-slate-700 transition-all"
                    />
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setPage(1); }} className="p-3 border-2 border-slate-50 rounded-2xl outline-none focus:border-primary-500 font-bold text-slate-700 bg-white min-w-[150px]">
                        <option value="all">All Grades</option>
                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }} className="p-3 border-2 border-slate-50 rounded-2xl outline-none focus:border-primary-500 font-bold text-slate-700 bg-white min-w-[150px]">
                        <option value="all">Any Status</option>
                        <option value={StudentStatus.Active}>Active Only</option>
                        <option value={StudentStatus.Inactive}>Inactive</option>
                        <option value={StudentStatus.Graduated}>Graduated</option>
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white">
                        <tr>
                            <th className="px-6 py-5 w-12 text-center">
                                <input type="checkbox" onChange={handleSelectAll} checked={students.length > 0 && selectedStudentIds.length === students.length} className="h-5 w-5 rounded-lg border-slate-700 bg-slate-800 text-primary-500 focus:ring-primary-500" />
                            </th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Registry Identity</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Admission</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Current Grade</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-right">Ledger Balance</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={6} className="px-6 py-5"><Skeleton className="h-6 w-full" /></td></tr>
                            ))
                        ) : students.length === 0 ? (
                            <tr><td colSpan={6} className="text-center py-20 text-slate-400 font-black uppercase tracking-widest italic">No students found in registry.</td></tr>
                        ) : (
                            students.map((student: Student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4 text-center">
                                        <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={e => setSelectedStudentIds(prev => e.target.checked ? [...prev, student.id] : prev.filter(id => id !== student.id))} className="h-5 w-5 rounded-lg text-primary-600" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-4">
                                            <img src={student.profileImage || DEFAULT_AVATAR} className="h-12 w-12 rounded-2xl object-cover border-2 border-white shadow-md" />
                                            <div>
                                                <div className="font-black text-slate-800 text-lg">{student.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Guardian: {student.guardianName}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs font-black text-primary-700">{student.admissionNumber}</td>
                                    <td className="px-6 py-4 font-bold text-slate-600">{student.class}</td>
                                    <td className={`px-6 py-4 text-right font-black text-lg ${student.balance && student.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        KES {(student.balance || 0).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 text-center space-x-3">
                                        <button onClick={() => { setSelectedStudent(student); setIsBillingModalOpen(true); }} className="p-2 text-slate-400 hover:text-green-600 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg></button>
                                        <button onClick={() => { setSelectedStudent(student); setIsProfileModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary-600 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></button>
                                        <button onClick={() => { if(confirm(`Delete ${student.name}?`)) deleteStudentMutation.mutate(student.id); }} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

            {/* Modals are globally linked here */}
            <StudentProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} student={selectedStudent} onViewIdCard={() => { if(selectedStudent) openIdCardModal(selectedStudent, 'student'); setIsProfileModalOpen(false); }} />
            <StudentBillingModal isOpen={isBillingModalOpen} onClose={() => setIsBillingModalOpen(false)} student={selectedStudent} />
            <PromotionModal isOpen={isPromotionModalOpen} onClose={() => setIsPromotionModalOpen(false)} />
        </div>
    );
};

export default StudentsView;
