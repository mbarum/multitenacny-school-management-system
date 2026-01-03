
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/common/Modal';
import WebcamCaptureModal from '../components/common/WebcamCaptureModal';
import Spinner from '../components/common/Spinner';
import type { Student, NewStudent, NewCommunicationLog, NewTransaction, SchoolClass, CommunicationLog } from '../types';
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

const DEFAULT_AVATAR = 'https://i.imgur.com/S5o7W44.png';

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onViewIdCard: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, student, onViewIdCard }) => {
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
                .then(res => setStudentLogs(res?.data || []))
                .catch(() => {})
                .finally(() => setLoadingLogs(false));
        }
    }, [isOpen, student]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;
        try {
            const { id, admissionNumber, balance, class: className, ...updates } = formData as any;
            await api.updateStudent(student.id, updates);
            addNotification('Registry synchronized successfully', 'success');
            onClose();
        } catch (error) {
            addNotification('Sync failed. Please check your network.', 'error');
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !student || !currentUser) return;
        try {
            const log = await api.createCommunicationLog({
                studentId: student.id,
                type: CommunicationType.PortalMessage,
                message,
                date: new Date().toISOString(),
                sentById: currentUser.id,
            } as any);
            setStudentLogs(prev => [log, ...prev]);
            setMessage('');
            addNotification('Message sent successfully.', 'success');
        } catch (error) {
            addNotification('Failed to send message.', 'error');
        }
    };
    
    if (!isOpen || !student) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Dossier: ${student.name}`} size="2xl">
            <div className="flex border-b border-slate-100 mb-6 overflow-x-auto scrollbar-hide">
                <button onClick={() => setActiveTab('details')} className={`px-6 py-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'details' ? 'text-primary-600 border-b-4 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}>General Info</button>
                <button onClick={() => setActiveTab('communication')} className={`px-6 py-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all whitespace-nowrap ${activeTab === 'communication' ? 'text-primary-600 border-b-4 border-primary-600' : 'text-slate-400 hover:text-slate-600'}`}>Contact History</button>
            </div>

            {activeTab === 'details' && (
                <form onSubmit={handleSaveChanges} className="space-y-8 pb-4">
                    <div className="flex items-center space-x-6 bg-slate-50 p-6 rounded-[2rem] border border-slate-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-600/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <img src={formData.profileImage || DEFAULT_AVATAR} className="h-24 w-24 rounded-3xl object-cover border-4 border-white shadow-xl relative z-10" />
                        <div className="relative z-10 flex-1">
                            <h4 className="text-2xl font-black text-slate-800 leading-tight uppercase tracking-tight">{student.name}</h4>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Adm: {student.admissionNumber}</p>
                            <button type="button" onClick={onViewIdCard} className="mt-4 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all shadow-sm">View Official ID</button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h5 className="text-[11px] font-black text-primary-600 uppercase tracking-[0.3em] border-l-4 border-primary-500 pl-3">Student Details</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                                <input name="name" value={formData.name || ''} onChange={handleFormChange} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary-500 transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Status</label>
                                <select name="status" value={formData.status} onChange={handleFormChange} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary-500 transition-all bg-white">
                                    {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                                <input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleFormChange} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary-500 transition-all" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Grade Level</label>
                                <input value={student.class} readOnly disabled className="w-full p-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-400 bg-slate-50 cursor-not-allowed" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-slate-100">
                        <h5 className="text-[11px] font-black text-amber-600 uppercase tracking-[0.3em] border-l-4 border-amber-500 pl-3">Parental / Guardian Profile</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guardian Name</label>
                                <input name="guardianName" value={formData.guardianName || ''} onChange={handleFormChange} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary-500 transition-all" placeholder="Legal guardian name" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Communication Email</label>
                                <input type="email" name="guardianEmail" value={formData.guardianEmail || ''} onChange={handleFormChange} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary-500 transition-all" placeholder="email@address.com" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Phone</label>
                                <input name="guardianContact" value={formData.guardianContact || ''} onChange={handleFormChange} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary-500 transition-all" placeholder="07XX XXX XXX" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emergency SOS Contact</label>
                                <input name="emergencyContact" value={formData.emergencyContact || ''} onChange={handleFormChange} className="w-full p-3.5 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-primary-500 transition-all" placeholder="Alternative contact number" />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-8 border-t border-slate-100">
                        <button type="submit" className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-black transition-all active:scale-95">
                            Commit Registry Changes
                        </button>
                    </div>
                </form>
            )}

            {activeTab === 'communication' && (
                <div className="space-y-6 h-[600px] flex flex-col">
                    <div className="flex-grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                        {loadingLogs ? (
                             Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)
                        ) : (studentLogs || []).length === 0 ? (
                             <div className="text-center py-20 text-slate-300 font-black uppercase tracking-widest italic">No contact logs recorded.</div>
                        ) : (
                            studentLogs.map(log => (
                                <div key={log.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative group transition-all hover:border-primary-200">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${log.type === CommunicationType.PortalMessage ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {log.type}
                                        </span>
                                        <span className="text-[10px] font-bold text-slate-400">{new Date(log.date).toLocaleString()}</span>
                                    </div>
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed">{log.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </Modal>
    );
};

const StudentsView: React.FC = () => {
    const { addNotification, openIdCardModal, currentUser } = useData();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
    const [page, setPage] = useState(1);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    // Fix: Added explicit (res: any) type to then callback to resolve type inference issues.
    const { data: classesData = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data || [])
    });
    const classes = Array.isArray(classesData) ? classesData : [];

    const initialStudentState: NewStudent = {
        name: '',
        classId: '',
        class: '',
        profileImage: DEFAULT_AVATAR,
        guardianName: '',
        guardianContact: '',
        guardianAddress: '',
        guardianEmail: '',
        emergencyContact: '',
        dateOfBirth: ''
    };
    const [newStudent, setNewStudent] = useState<NewStudent>(initialStudentState);

    useEffect(() => {
        if (isAddModalOpen && classes.length > 0 && !newStudent.classId) {
            setNewStudent(prev => ({
                ...prev,
                classId: classes[0].id,
                class: classes[0].name
            }));
        }
    }, [isAddModalOpen, classes]);

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

    const students = useMemo(() => {
        if (!studentsData) return [];
        if (Array.isArray(studentsData)) return studentsData;
        return studentsData.data || [];
    }, [studentsData]);

    const totalPages = useMemo(() => {
        if (!studentsData || Array.isArray(studentsData)) return 1;
        return studentsData.last_page || 1;
    }, [studentsData]);

    const addStudentMutation = useMutation({
        mutationFn: api.createStudent,
        onSuccess: async (student) => {
            addNotification('Student enrolled successfully!', 'success');
            
            try {
                const feeStructure = await api.getFeeStructure();
                const initialTransactions: NewTransaction[] = (feeStructure || [])
                    .filter((item: any) => !item.isOptional && item.classSpecificFees.some((fee: any) => fee.classId === student.classId))
                    .map((item: any) => {
                        const classFee = item.classSpecificFees.find((fee: any) => fee.classId === student.classId);
                        return {
                            studentId: student.id,
                            type: TransactionType.Invoice,
                            date: new Date().toISOString().split('T')[0],
                            description: item.name,
                            amount: classFee!.amount,
                        };
                    });
                
                if(initialTransactions.length > 0) {
                    await api.createMultipleTransactions(initialTransactions);
                    addNotification(`Invoices created for ${student.name}.`, 'info');
                }
            } catch (err) {
                console.warn("Failed to generate bulk billing for student", err);
            }

            queryClient.invalidateQueries({ queryKey: ['students'] });
            setIsAddModalOpen(false);
            setNewStudent(initialStudentState);
        },
        onError: (error: any) => {
            addNotification(error.message || 'Enrollment failed. Please check inputs.', 'error');
        }
    });

    const deleteStudentMutation = useMutation({
        mutationFn: api.deleteStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification('Student removed from registry.', 'success');
        }
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'classId') {
            const selected = classes.find((c: any) => c.id === value);
            setNewStudent(prev => ({ ...prev, classId: value, class: selected ? selected.name : '' }));
        } else {
            setNewStudent(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newStudent.name || !newStudent.classId || !newStudent.guardianName || !newStudent.guardianContact) {
            addNotification('Please complete all required fields.', 'error');
            return;
        }
        addStudentMutation.mutate(newStudent);
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase">Registry</h2>
                    <p className="text-slate-500 font-medium">Institutional enrollment and dossier management.</p>
                </div>
                <div className="flex items-center space-x-3">
                    <button onClick={() => setIsPromotionModalOpen(true)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl">Promotions</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30">Enroll Student</button>
                </div>
            </div>

            <div className="mb-8 flex flex-col lg:flex-row gap-4 items-center bg-white p-4 rounded-[2rem] shadow-xl border border-slate-100">
                <div className="relative flex-1 w-full">
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input type="text" placeholder="Search registry..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} className="w-full pl-12 pr-4 py-3 border-2 border-slate-50 rounded-2xl outline-none focus:border-primary-500 font-bold text-slate-700 transition-all"/>
                </div>
                <div className="flex gap-4 w-full lg:w-auto">
                    <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setPage(1); }} className="p-3 border-2 border-slate-50 rounded-2xl outline-none focus:border-primary-500 font-bold text-slate-700 bg-white min-w-[150px]">
                        <option value="all">All Grades</option>
                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 text-white">
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Identity</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Index</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px]">Grade</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-right">Ledger</th>
                            <th className="px-6 py-5 font-black uppercase tracking-widest text-[10px] text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (<tr key={i}><td colSpan={5} className="px-6 py-5"><Skeleton className="h-6 w-full" /></td></tr>))
                        ) : students.length === 0 ? (
                            <tr><td colSpan={5} className="text-center py-20 text-slate-400 font-black uppercase tracking-widest italic">No matching results.</td></tr>
                        ) : (
                            students.map((student: Student) => (
                                <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-4">
                                            <img src={student.profileImage || DEFAULT_AVATAR} onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} alt={student.name} className="h-12 w-12 rounded-2xl object-cover border-2 border-white shadow-md" />
                                            <div><div className="font-black text-slate-800 text-lg">{student.name}</div><div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{student.guardianName}</div></div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs font-black text-primary-700">{student.admissionNumber}</td>
                                    <td className="px-6 py-4 font-bold text-slate-600">{student.class}</td>
                                    <td className={`px-6 py-4 text-right font-black text-lg ${student.balance && student.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>KES {(student.balance || 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center space-x-3">
                                        <button onClick={() => { setSelectedStudent(student); setIsBillingModalOpen(true); }} className="p-2 text-slate-400 hover:text-green-600 transition-colors" title="Ledger & Billing"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg></button>
                                        <button onClick={() => { setSelectedStudent(student); setIsProfileModalOpen(true); }} className="p-2 text-slate-400 hover:text-primary-600 transition-colors" title="Full Dossier"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg></button>
                                        <button onClick={() => { if(confirm(`Delete ${student.name}?`)) deleteStudentMutation.mutate(student.id); }} className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Purge Record"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="New Student Enrollment" size="2xl">
                <form onSubmit={handleAddStudent} className="space-y-6 p-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Name</label>
                            <input name="name" value={newStudent.name} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" required placeholder="Legal full name"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Allocated Grade</label>
                            <select name="classId" value={newStudent.classId} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold bg-white" required>
                                <option value="">Select Class...</option>
                                {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                            <input type="date" name="dateOfBirth" value={newStudent.dateOfBirth} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" required/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guardian Name</label>
                            <input name="guardianName" value={newStudent.guardianName} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" required placeholder="Parent or legal guardian"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guardian Phone</label>
                            <input name="guardianContact" value={newStudent.guardianContact} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" required placeholder="07XX XXX XXX"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guardian Email</label>
                            <input type="email" name="guardianEmail" value={newStudent.guardianEmail} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" required placeholder="email@example.com"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Emergency Contact</label>
                            <input name="emergencyContact" value={newStudent.emergencyContact} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" required placeholder="Alternative phone number"/>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                            <input name="guardianAddress" value={newStudent.guardianAddress} onChange={handleInputChange} className="w-full p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary-500 outline-none font-bold" required placeholder="Physical home address"/>
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t gap-3">
                         <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-6 py-4 font-black text-[10px] uppercase text-slate-400 hover:text-slate-600">Cancel</button>
                         <button type="submit" disabled={addStudentMutation.isPending} className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-primary-500/40 hover:-translate-y-1 transition-all active:scale-95 flex items-center gap-3">
                            {addStudentMutation.isPending ? <Spinner /> : 'Complete Enrollment'}
                        </button>
                    </div>
                </form>
            </Modal>

            <StudentProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} student={selectedStudent} onViewIdCard={() => { if(selectedStudent) openIdCardModal(selectedStudent, 'student'); setIsProfileModalOpen(false); }} />
            <StudentBillingModal isOpen={isBillingModalOpen} onClose={() => setIsBillingModalOpen(false)} student={selectedStudent} />
            <PromotionModal isOpen={isPromotionModalOpen} onClose={() => setIsPromotionModalOpen(false)} />
        </div>
    );
};

export default StudentsView;
