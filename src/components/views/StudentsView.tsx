import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from '../common/Modal';
import WebcamCaptureModal from '../common/WebcamCaptureModal';
import type { Student, NewStudent, NewCommunicationLog, NewTransaction, CommunicationLog } from '../../types';
import { CommunicationType, StudentStatus, TransactionType } from '../../types';
import StudentBillingModal from '../common/StudentBillingModal';
import BulkMessageModal from '../common/BulkMessageModal';
import PromotionModal from '../common/PromotionModal';
import { useData } from '../../contexts/DataContext';
import Pagination from '../common/Pagination';
import Skeleton from '../common/Skeleton';
import Spinner from '../common/Spinner';
import * as api from '../../services/api';
import { calculateAge } from '../../utils/helpers';

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
                .catch(() => {})
                .finally(() => setLoadingLogs(false));
        }
    }, [isOpen, student]);

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;
        setIsSaving(true);
        try {
            const { id, admissionNumber, class: className, balance, ...updates } = formData;
            await api.updateStudent(student.id, updates);
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification('Scholar record successfully revised.', 'success');
            onClose();
        } catch (e: any) {
            addNotification(e.message || 'Revision rejected by server.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !student || !currentUser) return;

        const newLog: NewCommunicationLog = {
            studentId: student.id,
            type: CommunicationType.PortalMessage,
            message,
            date: new Date().toISOString(),
            sentBy: currentUser.name,
        };
        
        try {
            const log = await api.createCommunicationLog(newLog);
            setStudentLogs(prev => [log, ...prev]);
            setMessage('');
            addNotification('Message dispatched to guardian.', 'success');
        } catch (error) {
            addNotification('Failed to send message.', 'error');
        }
    };

    if (!isOpen || !student) return null;

    const age = calculateAge(student.dateOfBirth);

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose} 
            title={`Scholar Hub: ${student.admissionNumber}`} 
            size="xl"
            footer={
                <div className="flex justify-between items-center w-full">
                    <button type="button" onClick={onViewIdCard} className="px-6 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all">ID Card</button>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-3 font-black text-[10px] uppercase text-slate-400">Close</button>
                        {activeTab === 'details' && (
                            <button onClick={handleSaveChanges} disabled={isSaving} className="px-10 py-3 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-primary-600/30">
                                {isSaving ? <Spinner /> : 'Apply Revisions'}
                            </button>
                        )}
                    </div>
                </div>
            }
        >
            <div className="flex space-x-6 mb-8 border-b border-slate-100">
                <button onClick={() => setActiveTab('details')} className={`pb-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'details' ? 'border-b-4 border-primary-600 text-slate-800' : 'text-slate-300'}`}>Institutional Bio</button>
                <button onClick={() => setActiveTab('communication')} className={`pb-4 font-black text-[10px] uppercase tracking-[0.2em] transition-all ${activeTab === 'communication' ? 'border-b-4 border-primary-600 text-slate-800' : 'text-slate-300'}`}>Contact Archive</button>
            </div>

            {activeTab === 'details' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="flex items-center gap-6">
                            <img src={formData.profileImage || DEFAULT_AVATAR} className="h-24 w-24 rounded-[2rem] object-cover border-4 border-slate-50 shadow-md" />
                            <div>
                                <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{student.name}</h4>
                                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{student.class}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Legal Name</label>
                                <input value={formData.name || ''} onChange={e=>setFormData({...formData, name: e.target.value})} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold outline-none focus:border-primary-500 focus:bg-white transition-all"/>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</label>
                                    <select value={formData.classId || ''} onChange={e=>setFormData({...formData, classId: e.target.value})} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold outline-none">
                                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Status</label>
                                    <select value={formData.status || ''} onChange={e=>setFormData({...formData, status: e.target.value})} className="w-full p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold outline-none">
                                        {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Guardian Profile</h5>
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Primary Guardian</label>
                                <input value={formData.guardianName || ''} onChange={e=>setFormData({...formData, guardianName: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input value={formData.guardianContact || ''} onChange={e=>setFormData({...formData, guardianContact: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold"/>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
                                <input value={formData.guardianEmail || ''} onChange={e=>setFormData({...formData, guardianEmail: e.target.value})} className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold"/>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col h-[50vh]">
                    <div className="flex-1 overflow-y-auto pr-4 space-y-4 custom-scrollbar">
                        {loadingLogs ? <Skeleton className="h-32 w-full rounded-2xl" /> : 
                         studentLogs.length === 0 ? <p className="text-center py-20 text-slate-300 font-bold uppercase text-xs">No dispatch records.</p> :
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
                    <form onSubmit={handleSendMessage} className="mt-6 pt-6 border-t border-slate-100 flex gap-3">
                        <input 
                            value={message} 
                            onChange={e=>setMessage(e.target.value)} 
                            placeholder="Type a secure message to the portal..." 
                            className="flex-1 p-4 border-2 border-slate-50 bg-slate-50 rounded-2xl font-bold focus:bg-white focus:border-primary-500 outline-none transition-all"
                        />
                        <button type="submit" className="p-4 bg-primary-600 text-white rounded-2xl shadow-lg hover:bg-primary-700 transition-all"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg></button>
                    </form>
                </div>
            )}
        </Modal>
    );
};

const StudentsView: React.FC = () => {
    const { addNotification, openIdCardModal, formatCurrency } = useData();
    const queryClient = useQueryClient();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>(StudentStatus.Active);
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

    const { data: classes = [] } = useQuery({ 
        queryKey: ['classes'], 
        queryFn: () => api.getClasses().then((res: any) => Array.isArray(res) ? res : res.data || []) 
    });

    const { data: registry, isLoading } = useQuery({
        queryKey: ['students', page, searchTerm, selectedClass, statusFilter],
        queryFn: () => api.getStudents({ 
            page, limit: 12, search: searchTerm || undefined, 
            classId: selectedClass !== 'all' ? selectedClass : undefined,
            status: statusFilter !== 'all' ? statusFilter : undefined
        }),
        placeholderData: (prev) => prev
    });

    const students = registry?.data || [];
    const totalPages = registry?.last_page || 1;

    const enrollMutation = useMutation({
        mutationFn: api.createStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification('Scholar enrolled successfully.', 'success');
            setIsAddModalOpen(false);
            setNewStudent(initialStudentState);
        }
    });

    return (
        <div className="p-6 md:p-10 space-y-10 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter uppercase leading-none">Scholar Registry</h2>
                    <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-2">Institutional Enrollment Database</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsPromotionModalOpen(true)} className="px-6 py-3 bg-white text-slate-700 border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm">Promotion</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-8 py-4 bg-primary-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-primary-600/30 hover:bg-primary-700 transition-all active:scale-95">Enroll Scholar</button>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col md:flex-row gap-6">
                <div className="relative flex-1">
                    <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    <input 
                        placeholder="Search by legal name or index..." 
                        value={searchTerm} 
                        onChange={e=>{setSearchTerm(e.target.value); setPage(1);}} 
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-primary-500 font-bold text-slate-700 transition-all text-sm outline-none"
                    />
                </div>
                <div className="flex gap-4">
                    <select value={selectedClass} onChange={e=>{setSelectedClass(e.target.value); setPage(1);}} className="p-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 cursor-pointer outline-none">
                        <option value="all">All Grades</option>
                        {classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select value={statusFilter} onChange={e=>{setStatusFilter(e.target.value as any); setPage(1);}} className="p-4 bg-slate-50 border-none rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] text-slate-500 cursor-pointer outline-none">
                        <option value="all">All States</option>
                        {Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white">
                        <tr>
                            <th className="px-10 py-6 font-black uppercase text-[10px] tracking-widest">Scholar</th>
                            <th className="px-10 py-6 font-black uppercase text-[10px] tracking-widest text-center">Adm #</th>
                            <th className="px-10 py-6 font-black uppercase text-[10px] tracking-widest text-right">Ledger Balance</th>
                            <th className="px-10 py-6 font-black uppercase text-[10px] tracking-widest text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}><td colSpan={4} className="px-10 py-6"><Skeleton className="h-10 w-full rounded-2xl" /></td></tr>
                            ))
                        ) : students.length === 0 ? (
                            <tr><td colSpan={4} className="text-center py-24 text-slate-300 font-black uppercase tracking-[0.3em] italic">Database Empty or No Matches.</td></tr>
                        ) : students.map((s: any) => (
                            <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="px-10 py-5">
                                    <div className="flex items-center gap-5">
                                        <img src={s.profileImage || DEFAULT_AVATAR} className="h-14 w-14 rounded-2xl object-cover shadow-lg border-2 border-white transition-transform duration-500 group-hover:scale-110" />
                                        <div>
                                            <div className="font-black text-slate-800 text-xl uppercase tracking-tighter leading-none mb-1.5">{s.name}</div>
                                            <span className="px-2 py-0.5 bg-primary-50 text-primary-600 rounded text-[9px] font-black uppercase tracking-widest">{s.class}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-10 py-5 text-center">
                                    <div className="font-mono text-slate-400 font-black text-xs tracking-tighter">{s.admissionNumber}</div>
                                </td>
                                <td className="px-10 py-5 text-right font-black text-xl">
                                    <span className={s.balance > 0 ? 'text-red-600' : 'text-green-600'}>
                                        {formatCurrency(s.balance || 0)}
                                    </span>
                                </td>
                                <td className="px-10 py-5 text-center space-x-2">
                                    <button onClick={()=>{setSelectedStudent(s); setIsProfileModalOpen(true);}} className="px-5 py-2 bg-slate-900 text-white font-black text-[10px] uppercase rounded-xl hover:bg-black transition-all shadow-lg opacity-0 group-hover:opacity-100">Profile</button>
                                    <button onClick={()=>{setSelectedStudent(s); setIsBillingModalOpen(true);}} className="px-5 py-2 bg-primary-50 text-primary-700 font-black text-[10px] uppercase rounded-xl hover:bg-primary-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">Ledger</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

            {/* MODALS */}
            <Modal isOpen={isAddModalOpen} onClose={()=>setIsAddModalOpen(false)} title="Mass Enrollment Gateway" size="xl">
                <form onSubmit={e=>{e.preventDefault(); enrollMutation.mutate(newStudent);}} className="space-y-8">
                    <div className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2.5rem] border-2 border-white shadow-inner">
                        <img src={newStudent.profileImage} className="h-24 w-24 rounded-[2rem] object-cover border-4 border-white shadow-xl" />
                        <div className="space-y-2">
                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Scholar Identity Image</h4>
                            <button type="button" onClick={()=>setIsCaptureModalOpen(true)} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all">Launch Lens</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Full Legal Name</label><input value={newStudent.name} onChange={e=>setNewStudent({...newStudent, name:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 outline-none focus:bg-white focus:border-primary-500 transition-all" required/></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assigned Grade</label><select value={newStudent.classId} onChange={e=>setNewStudent({...newStudent, classId:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50 outline-none" required><option value="">Choose Class...</option>{classes.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guardian Identity</label><input value={newStudent.guardianName} onChange={e=>setNewStudent({...newStudent, guardianName:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50" required/></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Guardian Contact</label><input value={newStudent.guardianContact} onChange={e=>setNewStudent({...newStudent, guardianContact:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50" required/></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enrollment Date</label><input type="date" value={newStudent.dateOfBirth} onChange={e=>setNewStudent({...newStudent, dateOfBirth:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50" required/></div>
                        <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Registry Email</label><input value={newStudent.guardianEmail} onChange={e=>setNewStudent({...newStudent, guardianEmail:e.target.value})} className="w-full p-4 border-2 border-slate-100 rounded-2xl font-bold bg-slate-50" required/></div>
                    </div>
                    <button type="submit" disabled={enrollMutation.isPending} className="w-full py-5 bg-primary-600 text-white rounded-[1.5rem] font-black uppercase text-sm tracking-widest shadow-2xl shadow-primary-600/30 hover:bg-primary-700 transition-all flex justify-center items-center">
                        {enrollMutation.isPending ? <Spinner /> : 'Finalize Enrollment'}
                    </button>
                </form>
            </Modal>

            <StudentProfileModal 
                isOpen={isProfileModalOpen} onClose={()=>setIsProfileModalOpen(false)} student={selectedStudent} classes={classes}
                onViewIdCard={()=>selectedStudent && openIdCardModal(selectedStudent, 'student')}
            />
            <StudentBillingModal isOpen={isBillingModalOpen} onClose={()=>setIsBillingModalOpen(false)} student={selectedStudent} />
            <PromotionModal isOpen={isPromotionModalOpen} onClose={()=>setIsPromotionModalOpen(false)} />
            <WebcamCaptureModal isOpen={isCaptureModalOpen} onClose={()=>setIsCaptureModalOpen(false)} onCapture={url => setNewStudent({...newStudent, profileImage: url})} />
        </div>
    );
};

export default StudentsView;