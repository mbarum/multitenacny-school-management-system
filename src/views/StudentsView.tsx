
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../components/common/Modal';
import WebcamCaptureModal from '../components/common/WebcamCaptureModal';
import type { Student, NewStudent, CommunicationLog, FeeItem, NewTransaction } from '../types';
import { CommunicationType, StudentStatus, TransactionType } from '../types';
import StudentBillingModal from '../components/common/StudentBillingModal';
import PromotionModal from '../components/common/PromotionModal';
import { useData } from '../contexts/DataContext';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import Spinner from '../components/common/Spinner';
import * as api from '../services/api';

const DEFAULT_AVATAR = 'https://i.imgur.com/S5o7W44.png';

// --- Sub-components ---

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    classes: any[];
    onViewIdCard: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, student, classes, onViewIdCard }) => {
    const { currentUser, addNotification } = useData();
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'details' | 'communication'>('details');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [studentLogs, setStudentLogs] = useState<CommunicationLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        if (isOpen && student) {
            setActiveTab('details');
            setFormData({ ...student });
            setLoadingLogs(true);
            api.getCommunicationLogs({ studentId: student.id, limit: 20 })
                .then(res => setStudentLogs(res.data))
                .finally(() => setLoadingLogs(false));
        }
    }, [isOpen, student]);

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;
        setIsSaving(true);
        try {
            const payload = {
                name: formData.name,
                classId: formData.classId,
                profileImage: formData.profileImage,
                guardianName: formData.guardianName,
                guardianContact: formData.guardianContact,
                guardianAddress: formData.guardianAddress,
                guardianEmail: formData.guardianEmail,
                emergencyContact: formData.emergencyContact,
                dateOfBirth: formData.dateOfBirth,
                status: formData.status
            };

            await api.updateStudent(student.id, payload as any);
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification('Scholar record successfully revised.', 'success');
            onClose();
        } catch (e: any) {
            addNotification(e.message || 'Revision rejected by server.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !student) return null;

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Scholar Revision: ${student.admissionNumber}`} 
            size="xl"
            footer={
                <div className="flex justify-between items-center w-full gap-4">
                    <button type="button" onClick={onViewIdCard} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">ID Card</button>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-3 font-black text-[10px] uppercase text-slate-400 hover:text-slate-600 transition-colors">Discard</button>
                        <button 
                            type="button" 
                            onClick={handleSaveChanges} 
                            disabled={isSaving}
                            className="px-10 py-3 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-600/30 hover:bg-primary-700 transition-all flex items-center gap-2"
                        >
                            {isSaving ? <Spinner /> : 'Commit Revision'}
                        </button>
                    </div>
                </div>
            }
        >
            <div className="flex space-x-6 mb-8 border-b border-slate-100">
                <button onClick={() => setActiveTab('details')} className={`pb-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'details' ? 'border-b-4 border-primary-600 text-slate-800' : 'text-slate-300'}`}>Academic Data</button>
                <button onClick={() => setActiveTab('communication')} className={`pb-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'communication' ? 'border-b-4 border-primary-600 text-slate-800' : 'text-slate-300'}`}>Dispatch Log</button>
            </div>

            {activeTab === 'details' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label>
                        <input value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Current Grade</label>
                        <select value={formData.classId || ''} onChange={e=>setFormData({...formData, classId: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 outline-none focus:border-primary-500">
                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guardian Identity</label>
                        <input value={formData.guardianName || ''} onChange={e=>setFormData({...formData, guardianName: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guardian Phone</label>
                        <input value={formData.guardianContact || ''} onChange={e=>setFormData({...formData, guardianContact: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all"/>
                    </div>
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Email</label>
                        <input value={formData.guardianEmail || ''} onChange={e=>setFormData({...formData, guardianEmail: e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all"/>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {loadingLogs ? <Skeleton className="h-32 w-full rounded-2xl" /> : 
                     studentLogs.length === 0 ? <p className="text-center py-10 text-slate-400 italic">No communication records found.</p> :
                     studentLogs.map(log => (
                        <div key={log.id} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                            <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                <span>{log.sentBy} • {log.type}</span>
                                <span>{new Date(log.date).toLocaleString()}</span>
                            </div>
                            <p className="text-sm font-medium text-slate-700 leading-relaxed italic">"{log.message}"</p>
                        </div>
                     ))}
                </div>
            )}
        </Modal>
    );
};

// --- Main View ---

const StudentsView: React.FC = () => {
    const { addNotification, openIdCardModal } = useData();
    const queryClient = useQueryClient();
    
    // UI State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [page, setPage] = useState(1);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const initialStudentState: any = {
        name: '', classId: '', profileImage: DEFAULT_AVATAR,
        guardianName: '', guardianContact: '', guardianAddress: '', guardianEmail: '', emergencyContact: '', dateOfBirth: ''
    };
    const [newStudent, setNewStudent] = useState<any>(initialStudentState);

    // Queries
    const { data: classes = [] } = useQuery({ 
        queryKey: ['classes'], 
        queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data || []) 
    });

    const { data: registry, isLoading: registryLoading } = useQuery({
        queryKey: ['students', page, searchTerm, selectedClass],
        queryFn: () => api.getStudents({ 
            page, limit: 12, search: searchTerm || undefined, 
            classId: selectedClass !== 'all' ? selectedClass : undefined 
        }),
        placeholderData: (prev) => prev
    });

    const students = registry?.data || [];
    const totalPages = registry?.last_page || 1;

    // Enrollment Mutation
    const enrollMutation = useMutation({
        mutationFn: api.createStudent,
        onSuccess: async (data: Student) => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
            addNotification(`Scholar ${data.name} enrolled successfully.`, 'success');
            setIsAddModalOpen(false);
            setNewStudent(initialStudentState);
        },
        onError: (e: any) => addNotification(e.message || 'Enrollment rejected.', 'error')
    });

    return (
        <div className="p-4 sm:p-8 space-y-8 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-black text-slate-800 uppercase tracking-tight leading-none">Scholar Directory</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Institutional Enrollment Registry</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button onClick={() => setIsPromotionModalOpen(true)} className="flex-1 sm:flex-none px-6 py-4 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 shadow-sm">Promotion</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="flex-1 sm:flex-none px-6 py-4 bg-primary-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95">Enroll Scholar</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-3xl shadow-xl border border-slate-100 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input 
                        placeholder="Search registry by name or index..." 
                        value={searchTerm} 
                        onChange={e=>{setSearchTerm(e.target.value); setPage(1);}} 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-slate-700 transition-all text-sm outline-none"
                    />
                </div>
                <select value={selectedClass} onChange={e=>{setSelectedClass(e.target.value); setPage(1);}} className="w-full md:w-48 p-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 cursor-pointer outline-none">
                    <option value="all">All Grades</option>
                    {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-900 text-white">
                            <tr>
                                <th className="px-8 py-6 font-black uppercase text-[10px] tracking-widest">Scholar</th>
                                <th className="px-8 py-6 font-black uppercase text-[10px] tracking-widest">Adm #</th>
                                <th className="px-8 py-6 font-black uppercase text-[10px] tracking-widest text-right">Fee Balance</th>
                                <th className="px-8 py-6 font-black uppercase text-[10px] tracking-widest text-center">Manage</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {registryLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}><td colSpan={4} className="px-8 py-6"><Skeleton className="h-12 w-full rounded-2xl" /></td></tr>
                                ))
                            ) : students.length === 0 ? (
                                <tr><td colSpan={4} className="text-center py-24 text-slate-300 font-black uppercase tracking-[0.3em] italic">No matching records found.</td></tr>
                            ) : students.map((s: any) => (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <img src={s.profileImage || DEFAULT_AVATAR} className="h-12 w-12 rounded-xl object-cover shadow-md border-2 border-white transition-transform duration-500 group-hover:scale-110" />
                                            <div>
                                                <div className="font-black text-slate-800 text-lg uppercase tracking-tight mb-1 leading-none">{s.name}</div>
                                                <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{s.class}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="font-mono text-primary-600 font-black tracking-tighter bg-primary-50 px-3 py-1 rounded-lg inline-block text-xs">{s.admissionNumber}</div>
                                    </td>
                                    <td className="px-8 py-5 text-right font-black text-lg">
                                        <span className={s.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                                            {(s.balance || 0).toLocaleString()}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-center space-x-2">
                                        <button onClick={()=>{setSelectedStudent(s); setIsProfileModalOpen(true);}} className="px-6 py-2 bg-slate-900 text-white font-black text-[10px] uppercase rounded-xl hover:bg-black transition-all shadow-lg opacity-0 group-hover:opacity-100">Audit</button>
                                        <button onClick={()=>{setSelectedStudent(s); setIsBillingModalOpen(true);}} className="px-6 py-2 bg-primary-50 text-primary-700 font-black text-[10px] uppercase rounded-xl hover:bg-primary-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">Ledger</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

            {/* ENROLLMENT MODAL */}
            <Modal 
                isOpen={isAddModalOpen} 
                onClose={() => setIsAddModalOpen(false)} 
                title="Scholar Enrollment Engine" 
                size="xl"
                footer={
                    <div className="flex justify-end gap-3 w-full">
                        <button type="button" onClick={()=>setIsAddModalOpen(false)} className="px-8 py-4 font-black text-[10px] uppercase text-slate-400 hover:text-slate-600 transition-colors">Discard</button>
                        <button type="button" onClick={()=>enrollMutation.mutate(newStudent)} disabled={enrollMutation.isPending} className="px-12 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-500/30 hover:bg-primary-700 transition-all flex items-center justify-center">
                            {enrollMutation.isPending ? <Spinner /> : 'Finalize Enrollment'}
                        </button>
                    </div>
                }
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pb-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Scholar Full Name</label>
                        <input value={newStudent.name} onChange={e=>setNewStudent({...newStudent, name:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all" placeholder="Enter name..."/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admitted Grade</label>
                        <select value={newStudent.classId} onChange={e=>setNewStudent({...newStudent, classId:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 outline-none focus:border-primary-500">
                            <option value="">Choose Class...</option>
                            {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Parent Identity</label>
                        <input value={newStudent.guardianName} onChange={e=>setNewStudent({...newStudent, guardianName:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all" placeholder="Legal guardian name"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact Phone</label>
                        <input value={newStudent.guardianContact} onChange={e=>setNewStudent({...newStudent, guardianContact:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all" placeholder="07XX XXX XXX"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notification Email</label>
                        <input type="email" value={newStudent.guardianEmail} onChange={e=>setNewStudent({...newStudent, guardianEmail:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all" placeholder="parent@institution.com"/>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date of Birth</label>
                        <input type="date" value={newStudent.dateOfBirth} onChange={e=>setNewStudent({...newStudent, dateOfBirth:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all"/>
                    </div>
                    <div className="space-y-2 col-span-1 sm:col-span-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Residential Address</label>
                        <input value={newStudent.guardianAddress} onChange={e=>setNewStudent({...newStudent, guardianAddress:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 focus:bg-white outline-none focus:border-primary-500 transition-all" placeholder="Physical location details"/>
                    </div>
                </div>
            </Modal>

            <StudentProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={()=>setIsProfileModalOpen(false)} 
                student={selectedStudent} 
                classes={classes}
                onViewIdCard={()=>selectedStudent && openIdCardModal(selectedStudent, 'student')}
            />
            <StudentBillingModal 
                isOpen={isBillingModalOpen} 
                onClose={()=>setIsBillingModalOpen(false)} 
                student={selectedStudent}
            />
            <PromotionModal 
                isOpen={isPromotionModalOpen} 
                onClose={()=>setIsPromotionModalOpen(false)} 
            />
            <WebcamCaptureModal 
                isOpen={isCaptureModalOpen} 
                onClose={()=>setIsCaptureModalOpen(false)} 
                onCapture={url => setNewStudent((prev: any) => ({...prev, profileImage: url}))} 
            />
        </div>
    );
};

export default StudentsView;
