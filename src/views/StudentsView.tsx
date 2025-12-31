
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
// FIX: Corrected import path to use the src-based API service.
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
            // FIX: Destructure to remove non-editable or read-only system fields to prevent 400 Bad Request.
            const { 
                id, 
                admissionNumber, 
                class: className, 
                balance, 
                ...updates 
            } = formData as any;

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
        <Modal isOpen={isOpen} onClose={onClose} title={`${student.name}'s Profile`} size="2xl">
            <div className="border-b border-slate-200 mb-4">
                <nav className="-mb-px flex space-x-8">
                    <button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Details</button>
                    <button onClick={() => setActiveTab('communication')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'communication' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Communication</button>
                </nav>
            </div>
            {activeTab === 'details' && (
                <form onSubmit={handleSaveChanges} className="space-y-6">
                    <div className="flex items-start space-x-6">
                         <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <img src={formData.profileImage || DEFAULT_AVATAR} onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} alt={student.name} className="h-24 w-24 rounded-full object-cover border-2 border-slate-200 group-hover:opacity-75 transition-opacity"/>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">Change</span></div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload}/>
                        </div>
                        <div className="flex-1 space-y-2">
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div><label className="text-xs font-medium text-slate-500">Full Name</label><input name="name" value={formData.name || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                                <div><label className="text-xs font-medium text-slate-500">Admission No.</label><input value={student.admissionNumber} readOnly disabled className="w-full p-2 border rounded-md bg-slate-100"/></div>
                             </div>
                        </div>
                        <button type="button" onClick={onViewIdCard} className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 text-sm whitespace-nowrap">View ID Card</button>
                    </div>
                    <div className="pt-4 border-t">
                        <h4 className="text-lg font-semibold text-slate-800 mb-2">Biodata</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-700 mb-4">
                            <div><label className="text-xs font-medium text-slate-500">Date of Birth</label><input type="date" name="dateOfBirth" value={formData.dateOfBirth || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                            <div><label className="text-xs font-medium text-slate-500">Age</label><p className="p-2">{age !== null ? `${age} years old` : 'N/A'}</p></div>
                            <div><label className="text-xs font-medium text-slate-500">Status</label><select name="status" value={formData.status} onChange={handleFormChange} className="w-full p-2 border rounded-md">{Object.values(StudentStatus).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                         </div>
                        <h4 className="text-lg font-semibold text-slate-800 mb-2 pt-4 border-t">Guardian Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                             <div><label className="text-xs font-medium text-slate-500">Guardian Name</label><input name="guardianName" value={formData.guardianName || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                             <div><label className="text-xs font-medium text-slate-500">Guardian Email</label><input type="email" name="guardianEmail" value={formData.guardianEmail || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                             <div><label className="text-xs font-medium text-slate-500">Primary Contact</label><input name="guardianContact" value={formData.guardianContact || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                             <div><label className="text-xs font-medium text-slate-500">Emergency Contact</label><input name="emergencyContact" value={formData.emergencyContact || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                             <div className="col-span-2"><label className="text-xs font-medium text-slate-500">Address</label><input name="guardianAddress" value={formData.guardianAddress || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t"><button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Changes</button></div>
                </form>
            )}
            {activeTab === 'communication' && (
                 <div className="flex flex-col h-[50vh]">
                    <div className="flex-1 overflow-y-auto pr-4 space-y-4">
                       {loadingLogs ? <div className="p-4 space-y-2"><Skeleton className="h-12 w-full"/><Skeleton className="h-12 w-full"/></div> : 
                       studentLogs.length > 0 ? studentLogs.map(log => (
                           <div key={log.id} className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                               <div className="flex justify-between items-center text-xs text-slate-500 mb-1"><span>{log.sentBy} via {log.type}</span><span>{new Date(log.date).toLocaleDateString()}</span></div>
                               <p className="text-slate-800 text-sm">{log.message}</p>
                           </div>
                       )) : <p className="text-center text-slate-500 py-10">No communication history.</p>}
                    </div>
                    <form onSubmit={handleSendMessage} className="mt-4 border-t pt-4">
                        <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." className="w-full border-slate-300 rounded-md p-2 text-sm" rows={2}/>
                        <button type="submit" className="mt-2 px-4 py-2 bg-primary-600 text-white text-sm font-semibold rounded-lg shadow-md hover:bg-primary-700">Send Message</button>
                    </form>
                </div>
            )}
        </Modal>
    )
};


const StudentsView: React.FC = () => {
    const { addNotification, openIdCardModal, updateMultipleStudents, currentUser } = useData();
    const queryClient = useQueryClient();

    // UI State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const addStudentPhotoInputRef = useRef<HTMLInputElement>(null);

    // Filters & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>(StudentStatus.Active);
    const [page, setPage] = useState(1);

    const initialStudentState: NewStudent = {
        name: '', classId: '', class: '', profileImage: DEFAULT_AVATAR,
        guardianName: '', guardianContact: '', guardianAddress: '', guardianEmail: '', emergencyContact: '', dateOfBirth: ''
    };
    const [newStudent, setNewStudent] = useState(initialStudentState);

    // --- Queries ---

    const { data: classes = [] } = useQuery({
        queryKey: ['classes'],
        queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data)
    });

    const { data: feeStructure = [] } = useQuery({
        queryKey: ['fee-structure'],
        queryFn: api.getFeeStructure
    });

    const { data: studentsData, isLoading } = useQuery({
        queryKey: ['students', page, searchTerm, selectedClass, statusFilter],
        queryFn: () => api.getStudents({ 
            page, 
            limit: 10, 
            search: searchTerm, 
            classId: selectedClass !== 'all' ? selectedClass : undefined, 
            status: statusFilter !== 'all' ? statusFilter : undefined
        }),
        placeholderData: (prev) => prev
    });

    const students = studentsData?.data || [];
    const totalPages = studentsData?.last_page || 1;

    // --- Mutations ---

    const addStudentMutation = useMutation({
        mutationFn: api.createStudent,
        onSuccess: async (student) => {
            addNotification(`Student ${student.name} added successfully!`, 'success');
            
            const initialTransactions: NewTransaction[] = feeStructure
                .filter((item: FeeItem) => !item.isOptional && item.classSpecificFees.some(fee => fee.classId === student.classId))
                .map((item: FeeItem) => {
                    const classFee = item.classSpecificFees.find(fee => fee.classId === student.classId);
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
                addNotification(`Initial invoices created for ${student.name}.`, 'info');
            }

            queryClient.invalidateQueries({ queryKey: ['students'] });
            setIsAddModalOpen(false);
            setNewStudent(initialStudentState);
        }
    });

    const deleteStudentMutation = useMutation({
        mutationFn: api.deleteStudent,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification('Student deleted', 'success');
        }
    });

    // --- Handlers ---
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'classId') {
             const selected = classes.find((c: SchoolClass) => c.id === value);
             setNewStudent(prev => ({ ...prev, classId: value, class: selected ? selected.name : '' }));
        } else {
             setNewStudent(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddStudent = (e: React.FormEvent) => {
        e.preventDefault();
        addStudentMutation.mutate(newStudent);
    };
    
    const handleOpenAddStudentModal = () => {
        setNewStudent({
            ...initialStudentState,
            classId: classes[0]?.id || '',
            class: classes[0]?.name || ''
        });
        setIsAddModalOpen(true);
    };

    const handleViewProfile = (student: Student) => {
        setSelectedStudent(student);
        setIsProfileModalOpen(true);
    };

    const handleManageBilling = (student: Student) => {
        setSelectedStudent(student);
        setIsBillingModalOpen(true);
    }
    
    const handleDelete = async (studentId: string, studentName: string) => {
        if (window.confirm(`Are you sure you want to delete ${studentName}? This will permanently remove all associated records.`)) {
            deleteStudentMutation.mutate(studentId);
        }
    };
    
    const handlePhotoCapture = async (imageDataUrl: string) => {
         const res = await fetch(imageDataUrl);
         const blob = await res.blob();
         const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
         
         const formData = new FormData();
         formData.append('file', file);
         try {
            const uploadRes = await api.uploadStudentPhoto(formData);
            setNewStudent(prev => ({ ...prev, profileImage: uploadRes.url }));
            addNotification('Photo captured and uploaded.', 'success');
         } catch (error) {
             addNotification('Failed to upload captured photo.', 'error');
         }
    };

    const handleAddStudentPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
         if (e.target.files && e.target.files[0]) {
            const formData = new FormData();
            formData.append('file', e.target.files[0]);
            try {
                const res = await api.uploadStudentPhoto(formData);
                setNewStudent(prev => ({ ...prev, profileImage: res.url }));
                addNotification('Photo uploaded.', 'success');
            } catch (error) {
                addNotification('Failed to upload photo.', 'error');
            }
        }
    };

    const handleImport = async (file: File) => {
        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const result = await api.importStudents(formData);
            if (result && result.imported > 0) {
                queryClient.invalidateQueries({ queryKey: ['students'] });
            }
            return result || { imported: 0, failed: 0, errors: [] };
        } catch (error: any) {
            addNotification(error.message || "Import failed", 'error');
        } finally {
            setIsImporting(false);
        }
    };
    
    const handleExport = async () => {
        try {
            const blob = await api.exportStudents();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_export.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (error) {
            addNotification('Export failed', 'error');
        }
    };

    const handleSelectStudent = (studentId: string, isSelected: boolean) => {
        if (isSelected) setSelectedStudentIds(prev => [...prev, studentId]);
        else setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedStudentIds(students.map((s:Student) => s.id));
        else setSelectedStudentIds([]);
    };

    const handleBulkStatusChange = (status: StudentStatus) => {
        const updates = selectedStudentIds.map(id => ({ id, status }));
        updateMultipleStudents(updates).then(() => {
            addNotification(`${selectedStudentIds.length} student(s) status updated.`, 'success');
            setSelectedStudentIds([]);
            queryClient.invalidateQueries({ queryKey: ['students'] });
        });
    };
    
    const handleSendBulkMessage = (message: string) => {
        if (!currentUser) return;
        const newLogs = selectedStudentIds.map(studentId => ({
            studentId,
            type: CommunicationType.PortalMessage,
            message,
            date: new Date().toISOString(),
            sentBy: currentUser.name,
        }));
        api.createBulkCommunicationLogs(newLogs).then(() => {
            addNotification(`Message sent to ${selectedStudentIds.length} guardians.`, 'success');
            setSelectedStudentIds([]);
            setIsBulkMessageModalOpen(false);
        });
    };

    const handleToggleStatus = (student: Student) => {
        const newStatus = student.status === StudentStatus.Active ? StudentStatus.Inactive : StudentStatus.Active;
        api.updateStudent(student.id, { status: newStatus }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification(`Student ${student.name} status updated.`, 'success');
        });
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Student Management</h2>
                <div className="mt-2 sm:mt-0 flex space-x-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 transition-colors">Import</button>
                    <button onClick={handleExport} className="px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 transition-colors">Export</button>
                    <button onClick={() => setIsPromotionModalOpen(true)} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 transition-colors">Promote</button>
                    <button onClick={handleOpenAddStudentModal} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors">Add Student</button>
                </div>
            </div>
            
            <div className="mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-center">
                <input type="text" placeholder="Search by name or admission no..." value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} className="w-full sm:w-1/3 p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
                <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setPage(1); }} className="p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Classes</option>
                    {classes.map((c:SchoolClass) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as any); setPage(1); }} className="p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500">
                    <option value={StudentStatus.Active}>Show Active</option>
                    <option value={StudentStatus.Inactive}>Show Inactive</option>
                    <option value={StudentStatus.Graduated}>Show Graduated</option>
                    <option value="all">Show All</option>
                </select>
            </div>

            {selectedStudentIds.length > 0 && (
                <div className="mb-4 bg-primary-100 p-3 rounded-lg flex items-center justify-between shadow">
                    <p className="font-semibold text-primary-800">{selectedStudentIds.length} student(s) selected</p>
                    <div className="space-x-2">
                         <button onClick={() => setIsBulkMessageModalOpen(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-md">Message</button>
                        <button onClick={() => handleBulkStatusChange(StudentStatus.Active)} className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-md">Activate</button>
                        <button onClick={() => handleBulkStatusChange(StudentStatus.Inactive)} className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-semibold rounded-md">Deactivate</button>
                    </div>
                </div>
            )}
            
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                 <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600 w-12 text-center">
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={students.length > 0 && selectedStudentIds.length === students.length}
                                    ref={el => {
                                        if (el) {
                                            el.indeterminate = selectedStudentIds.length > 0 && selectedStudentIds.length < students.length;
                                        }
                                    }}
                                    className="h-4 w-4 rounded text-primary-600"
                                />
                            </th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Student</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Admission No.</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Class</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Guardian Contact</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-right">Balance (KES)</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td colSpan={7} className="px-4 py-4"><Skeleton className="h-4 w-full" /></td>
                                </tr>
                            ))
                        ) : students.length === 0 ? (
                            <tr><td colSpan={7} className="text-center py-12 text-slate-500">No students found.</td></tr>
                        ) : (
                            students.map((student: Student) => (
                                <tr key={student.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${student.status !== 'Active' ? 'bg-slate-50 text-slate-500' : ''}`}>
                                    <td className="px-4 py-2 text-center">
                                         <input 
                                            type="checkbox"
                                            checked={selectedStudentIds.includes(student.id)}
                                            onChange={e => handleSelectStudent(student.id, e.target.checked)}
                                            className="h-4 w-4 rounded text-primary-600"
                                        />
                                    </td>
                                    <td className="px-4 py-2 flex items-center space-x-3">
                                        <img src={student.profileImage || DEFAULT_AVATAR} onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }} alt={student.name} className={`h-10 w-10 rounded-full object-cover ${student.status !== 'Active' ? 'filter grayscale' : ''}`}/>
                                        <div>
                                            <span className={`font-semibold ${student.status === 'Active' ? 'text-slate-800' : ''}`}>{student.name}</span>
                                            {student.status !== 'Active' && <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${student.status === 'Graduated' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{student.status}</span>}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">{student.admissionNumber}</td>
                                    <td className="px-4 py-2">{student.class}</td>
                                    <td className="px-4 py-2">{student.guardianContact}</td>
                                    <td className={`px-4 py-2 text-right font-semibold ${(student.balance || 0) > 0 ? 'text-red-600' : 'text-green-600'}`}>{(student.balance || 0).toLocaleString()}</td>
                                    <td className="px-4 py-2 text-center space-x-2 whitespace-nowrap">
                                        <button onClick={() => handleManageBilling(student)} className="text-green-600 hover:underline">Billing</button>
                                        <button onClick={() => handleViewProfile(student)} className="text-primary-600 hover:underline">Profile</button>
                                        {student.status !== 'Graduated' && <button onClick={() => handleToggleStatus(student)} className="text-yellow-600 hover:underline">{student.status === 'Active' ? 'Deactivate' : 'Activate'}</button>}
                                        <button onClick={() => handleDelete(student.id, student.name)} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
             <Pagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />

             {/* Modals */}
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Student" size="xl">
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <img src={newStudent.profileImage} className="h-20 w-20 rounded-full border" alt="Profile" />
                        <button type="button" onClick={() => addStudentPhotoInputRef.current?.click()} className="px-3 py-1 bg-slate-200 rounded">Upload</button>
                        <input type="file" ref={addStudentPhotoInputRef} className="hidden" onChange={handleAddStudentPhotoUpload}/>
                        <button type="button" onClick={() => setIsCaptureModalOpen(true)} className="px-3 py-1 bg-slate-200 rounded">Capture</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <input name="name" placeholder="Full Name" value={newStudent.name} onChange={handleInputChange} className="p-2 border rounded" required/>
                        <select name="classId" value={newStudent.classId} onChange={handleInputChange} className="p-2 border rounded" required>
                             <option value="">Select Class</option>
                             {classes.map((c:SchoolClass) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <input name="guardianName" placeholder="Guardian Name" value={newStudent.guardianName} onChange={handleInputChange} className="p-2 border rounded" required/>
                        <input name="guardianContact" placeholder="Contact" value={newStudent.guardianContact} onChange={handleInputChange} className="p-2 border rounded" required/>
                        <input name="guardianEmail" placeholder="Email" value={newStudent.guardianEmail} onChange={handleInputChange} className="p-2 border rounded"/>
                        <input name="dateOfBirth" type="date" value={newStudent.dateOfBirth} onChange={handleInputChange} className="p-2 border rounded" required/>
                        <input name="guardianAddress" placeholder="Address" value={newStudent.guardianAddress} onChange={handleInputChange} className="p-2 border rounded col-span-2" required/>
                        <input name="emergencyContact" placeholder="Emergency Contact" value={newStudent.emergencyContact} onChange={handleInputChange} className="p-2 border rounded" required/>
                    </div>
                    <div className="flex justify-end"><button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded">Save Student</button></div>
                </form>
            </Modal>

            <StudentProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} student={selectedStudent} onViewIdCard={() => { openIdCardModal(selectedStudent!, 'student'); setIsProfileModalOpen(false); }} />
            <StudentBillingModal isOpen={isBillingModalOpen} onClose={() => setIsBillingModalOpen(false)} student={selectedStudent} />
            <ImportModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onUpload={handleImport} title="Import Students" templateUrl="/public/templates/students_template.csv" processing={isImporting} />
            <BulkMessageModal isOpen={isBulkMessageModalOpen} onClose={() => setIsBulkMessageModalOpen(false)} studentsToMessage={students.filter((s:Student) => selectedStudentIds.includes(s.id))} onSend={handleSendBulkMessage} />
            <PromotionModal isOpen={isPromotionModalOpen} onClose={() => setIsPromotionModalOpen(false)} />
            <WebcamCaptureModal isOpen={isCaptureModalOpen} onClose={() => setIsCaptureModalOpen(false)} onCapture={handlePhotoCapture} />
        </div>
    );
};

export default StudentsView;
