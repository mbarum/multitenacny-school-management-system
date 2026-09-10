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

const DEFAULT_AVATAR = 'https://i.imgur.com/S5o7W44.png';

// --- Sub-components ---

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onViewIdCard: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, student, onViewIdCard }) => {
    const { currentUser, addNotification, classes } = useData();
    const [activeTab, setActiveTab] = useState<'details' | 'communication'>('details');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState<Partial<Student>>({});
    
    const [studentLogs, setStudentLogs] = useState<CommunicationLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && student) {
            setActiveTab('details');
            setMessage('');
            setFormData({ ...student });
            
            setLoadingLogs(true);
            api.getCommunicationLogs({ studentId: student.id, limit: 20 })
                .then(res => setStudentLogs(res.data))
                .catch(err => console.error(err))
                .finally(() => setLoadingLogs(false));
        }
    }, [isOpen, student]);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('file', e.target.files[0]);
            try {
                const res = await api.uploadStudentPhoto(formData);
                setFormData(prev => ({ ...prev, profileImage: res.url }));
                addNotification('Photo uploaded successfully', 'success');
            } catch (error) {
                addNotification('Failed to upload photo', 'error');
            }
        }
    };

    const handleSaveChanges = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;
        try {
            const { id, admissionNumber, class: className, balance, ...updates } = formData as any;
            await api.updateStudent(student.id, updates);
            addNotification(`${student.name}'s profile updated successfully.`, 'success');
            onClose();
        } catch (error) {
            addNotification('Failed to update student.', 'error');
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
            addNotification('Message sent successfully.', 'success');
        } catch (error) {
            addNotification('Failed to send message.', 'error');
        }
    };

    if (!isOpen || !student) return null;

    const age = calculateAge(student.dateOfBirth);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${student.name}'s Profile`} size="xl">
            <div className="border-b border-slate-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Details</button>
                    <button onClick={() => setActiveTab('communication')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'communication' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Communication</button>
                </nav>
            </div>
            {activeTab === 'details' && (
                <form onSubmit={handleSaveChanges} className="space-y-4">
                    <div className="flex items-start space-x-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <img src={formData.profileImage || DEFAULT_AVATAR} alt={student.name} className="h-24 w-24 rounded-full object-cover border-2 border-slate-100 group-hover:opacity-75 transition-opacity"/>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100"><span className="bg-black/50 text-white text-[10px] px-2 py-1 rounded font-bold">Edit</span></div>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*"/>
                        </div>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold">{student.name}</h3>
                            <p className="text-slate-600">{student.admissionNumber} | {student.class}</p>
                             <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                                student.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-800'
                            }`}>{student.status}</span>
                        </div>
                         <button type="button" onClick={onViewIdCard} className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 text-sm">View ID Card</button>
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                         <div><label className="text-xs font-bold text-slate-400 uppercase">Full Name</label><input name="name" value={formData.name || ''} onChange={handleFormChange} className="w-full p-2 border rounded mt-1"/></div>
                         <div><label className="text-xs font-bold text-slate-400 uppercase">Grade</label>
                            <select name="classId" value={formData.classId || ''} onChange={handleFormChange} className="w-full p-2 border rounded mt-1">
                                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                         </div>
                         <div><label className="text-xs font-bold text-slate-400 uppercase">Guardian Name</label><input name="guardianName" value={formData.guardianName || ''} onChange={handleFormChange} className="w-full p-2 border rounded mt-1"/></div>
                         <div><label className="text-xs font-bold text-slate-400 uppercase">Guardian Contact</label><input name="guardianContact" value={formData.guardianContact || ''} onChange={handleFormChange} className="w-full p-2 border rounded mt-1"/></div>
                     </div>
                     <div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded font-bold shadow-md hover:bg-primary-700">Update Profile</button></div>
                </form>
            )}
            {activeTab === 'communication' && (
                 <div className="flex flex-col h-[50vh]">
                    <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                       {loadingLogs ? <div className="p-4"><Skeleton className="h-12 w-full mb-2"/><Skeleton className="h-12 w-full"/></div> : 
                       studentLogs.length > 0 ? studentLogs.map(log => (
                           <div key={log.id} className="bg-slate-50 p-3 rounded-lg">
                               <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                                   <span>{log.sentBy} • {new Date(log.date).toLocaleString()}</span>
                               </div>
                               <p className="text-slate-800">{log.message}</p>
                           </div>
                       )) : <p className="text-center text-slate-500 mt-10">No communication history.</p>}
                    </div>
                    <form onSubmit={handleSendMessage} className="mt-4 border-t pt-4">
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message to the guardian..."
                            className="w-full border-slate-300 rounded-md p-2 focus:ring-primary-500 focus:border-primary-500"
                            rows={3}
                        />
                        <button type="submit" className="mt-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Send Message</button>
                    </form>
                </div>
            )}
        </Modal>
    )
};

const StudentsView: React.FC = () => {
    const { students, classes, studentFinancials, openIdCardModal, addNotification, updateStudent, addStudent } = useData();
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [page, setPage] = useState(1);
    
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const filteredStudents = useMemo(() => {
        return students.filter(s => 
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (selectedClass === 'all' || s.classId === selectedClass)
        );
    }, [students, searchTerm, selectedClass]);

    const handleViewProfile = (student: Student) => {
        setSelectedStudent(student);
        setIsProfileModalOpen(true);
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800 uppercase tracking-tight">Scholar Directory</h2>
                <div className="flex gap-2">
                    <button onClick={() => setIsPromotionModalOpen(true)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold border border-slate-200">Promotion</button>
                    <button onClick={() => setIsAddModalOpen(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-md hover:bg-primary-700 transition-all">Enroll Scholar</button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1">
                    <input 
                        placeholder="Search by name or admission number..." 
                        value={searchTerm} 
                        onChange={e=>setSearchTerm(e.target.value)} 
                        className="w-full p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>
                <select value={selectedClass} onChange={e=>setSelectedClass(e.target.value)} className="p-2 border border-slate-200 rounded-lg bg-white outline-none">
                    <option value="all">All Grades</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-widest">
                            <th className="px-6 py-4">Scholar</th>
                            <th className="px-6 py-4">Adm #</th>
                            <th className="px-6 py-4 text-right">Balance</th>
                            <th className="px-6 py-4 text-center">Manage</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {filteredStudents.map(s => {
                            const financials = studentFinancials[s.id] || { balance: 0 };
                            return (
                                <tr key={s.id} className="hover:bg-slate-50 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="flex items-center gap-3">
                                            <img src={s.profileImage || DEFAULT_AVATAR} className="h-10 w-10 rounded-full object-cover border"/>
                                            <div>
                                                <div className="font-bold text-slate-800">{s.name}</div>
                                                <div className="text-[10px] text-slate-400 font-bold uppercase">{s.class}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-mono text-xs text-slate-500">{s.admissionNumber}</td>
                                    <td className={`px-6 py-3 text-right font-bold ${financials.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {financials.balance.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-3 text-center space-x-2">
                                        <button onClick={() => handleViewProfile(s)} className="text-primary-600 hover:underline font-bold text-xs">PROFILE</button>
                                        <button onClick={() => { setSelectedStudent(s); setIsBillingModalOpen(true); }} className="text-blue-600 hover:underline font-bold text-xs">LEDGER</button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <StudentProfileModal 
                isOpen={isProfileModalOpen} 
                onClose={()=>setIsProfileModalOpen(false)} 
                student={selectedStudent} 
                onViewIdCard={()=>selectedStudent && openIdCardModal(selectedStudent, 'student')}
            />
            <StudentBillingModal isOpen={isBillingModalOpen} onClose={()=>setIsBillingModalOpen(false)} student={selectedStudent} />
            <PromotionModal isOpen={isPromotionModalOpen} onClose={()=>setIsPromotionModalOpen(false)} />
        </div>
    );
};

export default StudentsView;
