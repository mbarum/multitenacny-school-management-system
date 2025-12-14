
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Modal from '../components/common/Modal';
import WebcamCaptureModal from '../components/common/WebcamCaptureModal';
import type { Student, NewStudent, NewCommunicationLog, NewTransaction, SchoolClass, CommunicationLog } from '../types';
import { CommunicationType, StudentStatus, TransactionType } from '../types';
import StudentBillingModal from '../components/common/StudentBillingModal';
import BulkMessageModal from '../components/common/BulkMessageModal';
import PromotionModal from '../components/common/PromotionModal';
import { useData } from '../contexts/DataContext';
import { calculateAge, debounce } from '../utils/helpers';
import ImportModal from '../components/common/ImportModal';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import * as api from '../services/api';

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onViewIdCard: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, student, onViewIdCard }) => {
    const { addCommunicationLog, currentUser, classes, updateStudent, addNotification } = useData();
    const [activeTab, setActiveTab] = useState<'details' | 'communication'>('details');
    const [message, setMessage] = useState('');
    const [formData, setFormData] = useState<Partial<Student>>({});
    
    const [studentLogs, setStudentLogs] = useState<CommunicationLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');
            setMessage('');
            if (student) {
                setFormData({ ...student });
                setLoadingLogs(true);
                api.getCommunicationLogs({ studentId: student.id, limit: 50 })
                    .then(res => setStudentLogs(res.data))
                    .catch(err => console.error("Failed to fetch logs", err))
                    .finally(() => setLoadingLogs(false));
            }
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

    const handleSaveChanges = (e: React.FormEvent) => {
        e.preventDefault();
        if (!student) return;
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { class: _, balance, ...updates } = formData;
        
        updateStudent(student.id, updates).then(() => {
            addNotification(`${student.name}'s profile updated successfully.`, 'success');
            onClose();
        });
    };

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim() || !student || !currentUser) return;

        const newLog: NewCommunicationLog = {
            studentId: student.id,
            type: CommunicationType.PortalMessage,
            message,
            date: new Date().toISOString(),
            sentBy: currentUser.name,
        };
        addCommunicationLog(newLog).then((log) => {
            setStudentLogs(prev => [log, ...prev]);
            setMessage('');
            addNotification('Message sent successfully.', 'success');
        });
    };
    
    if (!isOpen || !student) return null;

    const age = calculateAge(student.dateOfBirth);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${student.name}'s Profile`} size="2xl">
            <div className="border-b border-slate-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Details</button>
                    <button onClick={() => setActiveTab('communication')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'communication' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Communication</button>
                </nav>
            </div>
            {activeTab === 'details' && (
                <form onSubmit={handleSaveChanges} className="space-y-6">
                    <div className="flex items-start space-x-6">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <img 
                                src={formData.profileImage || student.profileImage || 'https://i.imgur.com/S5o7W44.png'} 
                                alt={student.name} 
                                className="h-24 w-24 rounded-full object-cover border-2 border-slate-200 group-hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">Change</span>
                            </div>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handlePhotoUpload}
                            />
                        </div>
                        <div className="flex-1">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="text-xs font-medium text-slate-500">Full Name</label><input name="name" value={formData.name || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                                <div><label className="text-xs font-medium text-slate-500">Admission No.</label><input value={student.admissionNumber} readOnly disabled className="w-full p-2 border rounded-md bg-slate-100"/></div>
                                <div><label className="text-xs font-medium text-slate-500">Class</label><select name="classId" value={formData.classId} onChange={handleFormChange} className="w-full p-2 border rounded-md"><option value="">Select Class</option>{classes.map((c: SchoolClass) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
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
                             <div><label className="text-xs font-medium text-slate-500">Guardian's Name</label><input name="guardianName" value={formData.guardianName || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                             <div><label className="text-xs font-medium text-slate-500">Guardian's Email</label><input type="email" name="guardianEmail" value={formData.guardianEmail || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                             <div><label className="text-xs font-medium text-slate-500">Primary Contact</label><input name="guardianContact" value={formData.guardianContact || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                             <div><label className="text-xs font-medium text-slate-500">Emergency Contact</label><input name="emergencyContact" value={formData.emergencyContact || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                             <div className="col-span-2"><label className="text-xs font-medium text-slate-500">Address</label><input name="guardianAddress" value={formData.guardianAddress || ''} onChange={handleFormChange} className="w-full p-2 border rounded-md"/></div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">
                            Save Changes
                        </button>
                    </div>
                </form>
            )}
            {activeTab === 'communication' && (
                 <div className="flex flex-col h-[60vh]">
                    <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
                       {loadingLogs ? <div className="p-4"><Skeleton className="h-16 w-full mb-2"/><Skeleton className="h-16 w-full"/></div> : 
                       studentLogs.length > 0 ? studentLogs.map(log => (
                           <div key={log.id} className="bg-slate-50 p-3 rounded-lg">
                               <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
                                   <span>{log.sentBy} via {log.type}</span>
                                   <span>{new Date(log.date).toLocaleString()}</span>
                               </div>
                               <p className="text-slate-800">{log.message}</p>
                           </div>
                       )) : <p className="text-center text-slate-500">No communication history.</p>}
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
    const { students, updateStudent, deleteStudent, addStudent, addMultipleTransactions, addBulkCommunicationLogs, classes, currentUser, feeStructure, studentFinancials, addNotification, openIdCardModal, updateMultipleStudents } = useData();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>(StudentStatus.Active);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);
    const addStudentPhotoInputRef = useRef<HTMLInputElement>(null);
    
    // Pagination State
    const [studentsList, setStudentsList] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const initialStudentState: NewStudent = {
        name: '', class: classes[0]?.name || '', classId: classes[0]?.id || '', profileImage: 'https://i.imgur.com/S5o7W44.png',
        guardianName: '', guardianContact: '', guardianAddress: '', guardianEmail: '', emergencyContact: '', dateOfBirth: ''
    };
    
    const [newStudent, setNewStudent] = useState(initialStudentState);

    // Debounced Fetch Logic
    const fetchStudents = useCallback(async (page: number, search: string, classId: string, status: string) => {
        setLoading(true);
        try {
            const response = await api.getStudents({ page, limit: 10, search, classId, status });
            // Fix: Robust check for pagination vs array format
            if (Array.isArray(response)) {
                 setStudentsList(response);
                 setTotalPages(1);
            } else if (response && Array.isArray(response.data)) {
                 setStudentsList(response.data);
                 setTotalPages(response.last_page || 1);
            } else {
                 setStudentsList([]);
                 setTotalPages(1);
            }
            setCurrentPage(page);
        } catch (error) {
            console.error("Error fetching students:", error);
            addNotification("Failed to fetch students", "error");
        } finally {
            setLoading(false);
        }
    }, [addNotification]);

    const debouncedFetch = useMemo(
        () => debounce((page: number, search: string, classId: string, status: string) => {
            fetchStudents(page, search, classId, status);
        }, 500),
        [fetchStudents]
    );

    useEffect(() => {
        fetchStudents(currentPage, searchTerm, selectedClass, statusFilter);
    }, [currentPage, selectedClass, statusFilter, fetchStudents]);

    useEffect(() => {
        // Only trigger debounce search if searchTerm changes
        if (searchTerm) {
             debouncedFetch(1, searchTerm, selectedClass, statusFilter);
        }
    }, [searchTerm, debouncedFetch, selectedClass, statusFilter]);
    
    
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'classId') {
            const selected = classes.find(c => c.id === value);
            setNewStudent(prev => ({ ...prev, classId: value, class: selected?.name || '' }));
        } else {
            setNewStudent(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAddStudent = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Remove 'class' property which causes 400 Bad Request on backend validation
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { class: className, ...studentData } = newStudent;

        const studentToAdd = await addStudent(studentData as NewStudent);
        addNotification(`Student ${studentToAdd.name} added successfully!`, 'success');

        const initialTransactions: NewTransaction[] = feeStructure
            .filter(item => !item.isOptional && item.classSpecificFees.some(fee => fee.classId === studentToAdd.classId))
            .map(item => {
                const classFee = item.classSpecificFees.find(fee => fee.classId === studentToAdd.classId);
                return {
                    studentId: studentToAdd.id,
                    type: TransactionType.Invoice,
                    date: new Date().toISOString().split('T')[0],
                    description: item.name,
                    amount: classFee!.amount,
                };
            });
        
        if(initialTransactions.length > 0) {
            await addMultipleTransactions(initialTransactions);
            addNotification(`Initial invoices created for ${studentToAdd.name}.`, 'info');
        }

        setIsAddModalOpen(false);
        fetchStudents(currentPage, searchTerm, selectedClass, statusFilter);
    };
    
    const handleOpenAddStudentModal = () => {
        setNewStudent({ ...initialStudentState });
        setIsAddModalOpen(true);
    };

    const handleViewProfile = (student: Student) => {
        setSelectedStudent(student);
        setIsProfileModalOpen(true);
    };
    
    const handleDelete = (studentId: string, studentName: string) => {
        if (window.confirm(`Are you sure you want to delete ${studentName}? This will permanently remove all associated records.`)) {
            deleteStudent(studentId).then(() => {
                addNotification(`Student ${studentName} deleted successfully.`, 'success');
                fetchStudents(currentPage, searchTerm, selectedClass, statusFilter);
            });
        }
    };

    const handleManageBilling = (student: Student) => {
        setSelectedStudent(student);
        setIsBillingModalOpen(true);
    }
    
    const handlePhotoCapture = async (imageDataUrl: string) => {
         // Convert base64 to file
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

    const handleExport = async () => {
        try {
            const blob = await api.exportStudents();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_export_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            addNotification('Student data exported successfully.', 'success');
        } catch (error) {
            addNotification('Failed to export students.', 'error');
        }
    };

    const handleImport = async (file: File) => {
        setIsImporting(true);
        const formData = new FormData();
        formData.append('file', file);
        try {
            const result = await api.importStudents(formData);
            if (result.imported > 0) {
                fetchStudents(currentPage, searchTerm, selectedClass, statusFilter);
            }
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during import.";
            addNotification(errorMessage, 'error');
        } finally {
            setIsImporting(false);
        }
    };

    // Bulk Actions Handlers
    const handleSelectStudent = (studentId: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedStudentIds(prev => [...prev, studentId]);
        } else {
            setSelectedStudentIds(prev => prev.filter(id => id !== studentId));
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(studentsList.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleBulkStatusChange = (status: StudentStatus) => {
        const updates = selectedStudentIds.map(id => ({ id, status }));
        updateMultipleStudents(updates).then(() => {
            addNotification(`${selectedStudentIds.length} student(s) status updated to ${status}.`, 'success');
            setSelectedStudentIds([]);
            fetchStudents(currentPage, searchTerm, selectedClass, statusFilter);
        });
    };

    const handleSendBulkMessage = (message: string) => {
        if (!currentUser) return;
        const newLogs: NewCommunicationLog[] = selectedStudentIds.map(studentId => ({
            studentId,
            type: CommunicationType.PortalMessage,
            message,
            date: new Date().toISOString(),
            sentBy: currentUser.name,
        }));
        addBulkCommunicationLogs(newLogs).then(() => {
            addNotification(`Message sent to ${selectedStudentIds.length} student guardians.`, 'success');
            setSelectedStudentIds([]);
            setIsBulkMessageModalOpen(false);
        });
    };

    const handleToggleStatus = (student: Student) => {
        const newStatus = student.status === StudentStatus.Active ? StudentStatus.Inactive : StudentStatus.Active;
        updateStudent(student.id, { status: newStatus }).then(() => {
             fetchStudents(currentPage, searchTerm, selectedClass, statusFilter);
        });
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Student Management</h2>
                <div className="mt-2 sm:mt-0 flex space-x-2">
                    <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 transition-colors">Import</button>
                    <button onClick={handleExport} className="px-4 py-2 bg-slate-500 text-white font-semibold rounded-lg shadow-md hover:bg-slate-600 transition-colors">Export</button>
                    <button onClick={() => setIsPromotionModalOpen(true)} className="px-4 py-2 bg-slate-600 text-white font-semibold rounded-lg shadow-md hover:bg-slate-700 transition-colors">Promote Students</button>
                    <button onClick={handleOpenAddStudentModal} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 transition-colors">Add New Student</button>
                </div>
            </div>
            <div className="mb-4 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 items-center">
                <input type="text" placeholder="Search by name or admission no..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-1/3 p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500"/>
                <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} className="p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500">
                    <option value="all">All Classes</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} className="p-2 border border-slate-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500">
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
                         <button onClick={() => setIsBulkMessageModalOpen(true)} className="px-3 py-1.5 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700">Send Message</button>
                        <button onClick={() => handleBulkStatusChange(StudentStatus.Active)} className="px-3 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-md hover:bg-green-700">Activate</button>
                        <button onClick={() => handleBulkStatusChange(StudentStatus.Inactive)} className="px-3 py-1.5 bg-yellow-600 text-white text-sm font-semibold rounded-md hover:bg-yellow-700">Deactivate</button>
                        <button onClick={() => handleBulkStatusChange(StudentStatus.Graduated)} className="px-3 py-1.5 bg-slate-600 text-white text-sm font-semibold rounded-md hover:bg-slate-700">Graduate</button>
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
                                    checked={studentsList.length > 0 && selectedStudentIds.length === studentsList.length}
                                    ref={el => {
                                        if (el) {
                                            el.indeterminate = selectedStudentIds.length > 0 && selectedStudentIds.length < studentsList.length;
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
                        {loading ? (
                             Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-4 mx-auto"/></td>
                                    <td className="px-4 py-4 flex items-center space-x-3"><Skeleton className="h-10 w-10 rounded-full"/><Skeleton className="h-4 w-32"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-16"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-24"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-20 ml-auto"/></td>
                                    <td className="px-4 py-4"><Skeleton className="h-4 w-32 mx-auto"/></td>
                                </tr>
                            ))
                        ) : studentsList.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="text-center py-12 text-slate-500 flex flex-col items-center justify-center w-full">
                                    <svg className="w-12 h-12 text-slate-300 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197m0 0A5.975 5.975 0 0112 13a5.975 5.975 0 013 5.197M15 21a6 6 0 00-9-5.197" />
                                    </svg>
                                    <p className="font-medium text-lg">No students found</p>
                                    <p className="text-sm">Try adjusting your filters or search terms.</p>
                                </td>
                            </tr>
                        ) : (
                            studentsList.map(student => {
                                const financials = studentFinancials[student.id] || { balance: 0 };
                                return (
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
                                            <img src={student.profileImage} alt={student.name} className={`h-10 w-10 rounded-full object-cover border border-slate-200 ${student.status !== 'Active' ? 'filter grayscale' : ''}`}/>
                                            <div>
                                                <span className={`font-semibold ${student.status === 'Active' ? 'text-slate-800' : ''}`}>{student.name}</span>
                                                {student.status !== 'Active' && <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${student.status === 'Graduated' ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'}`}>{student.status}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">{student.admissionNumber}</td>
                                        <td className="px-4 py-2">{student.class}</td>
                                        <td className="px-4 py-2">{student.guardianContact}</td>
                                        <td className={`px-4 py-2 text-right font-semibold ${financials.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>{financials.balance.toLocaleString()}</td>
                                        <td className="px-4 py-2 text-center space-x-2 whitespace-nowrap">
                                            <button onClick={() => handleManageBilling(student)} className="text-green-600 hover:underline">Billing</button>
                                            <button onClick={() => handleViewProfile(student)} className="text-primary-600 hover:underline">Profile</button>
                                            {student.status !== 'Graduated' && <button onClick={() => handleToggleStatus(student)} className="text-yellow-600 hover:underline">{student.status === 'Active' ? 'Deactivate' : 'Activate'}</button>}
                                            <button onClick={() => handleDelete(student.id, student.name)} className="text-red-600 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
            
             <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Student" size="2xl">
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <div className="relative h-24 w-24 rounded-full overflow-hidden border group">
                            <img src={newStudent.profileImage} alt="New student" className="h-full w-full object-cover"/>
                        </div>
                        <div className="flex space-x-2">
                             <input 
                                type="file" 
                                accept="image/*"
                                ref={addStudentPhotoInputRef}
                                onChange={handleAddStudentPhotoUpload}
                                className="hidden"
                            />
                            <button type="button" onClick={() => addStudentPhotoInputRef.current?.click()} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300">Upload</button>
                            <button type="button" onClick={() => setIsCaptureModalOpen(true)} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">Capture</button>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="name" placeholder="Full Name" value={newStudent.name} onChange={handleInputChange} required className="p-2 border border-slate-300 rounded-lg"/>
                        <input type="text" name="admissionNumber" placeholder="Admission Number (auto-generated)" value="" readOnly disabled className="p-2 border border-slate-300 rounded-lg bg-slate-100"/>
                        <select name="classId" value={newStudent.classId} onChange={handleInputChange} required className="p-2 border border-slate-300 rounded-lg">
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                         <div>
                            <label htmlFor="dateOfBirth" className="text-xs text-slate-500">Date of Birth</label>
                            <input type="date" id="dateOfBirth" name="dateOfBirth" value={newStudent.dateOfBirth} onChange={handleInputChange} required className="w-full p-2 border border-slate-300 rounded-lg"/>
                        </div>
                        <input type="text" name="guardianName" placeholder="Guardian's Name" value={newStudent.guardianName} onChange={handleInputChange} required className="p-2 border border-slate-300 rounded-lg"/>
                        <input type="text" name="guardianContact" placeholder="Guardian's Contact" value={newStudent.guardianContact} onChange={handleInputChange} required className="p-2 border border-slate-300 rounded-lg"/>
                        <input type="email" name="guardianEmail" placeholder="Guardian's Email" value={newStudent.guardianEmail} onChange={handleInputChange} required className="p-2 border border-slate-300 rounded-lg"/>
                        <input type="text" name="emergencyContact" placeholder="Emergency Contact" value={newStudent.emergencyContact} onChange={handleInputChange} required className="p-2 border border-slate-300 rounded-lg"/>
                        <input type="text" name="guardianAddress" placeholder="Guardian's Address" value={newStudent.guardianAddress} onChange={handleInputChange} required className="p-2 border border-slate-300 rounded-lg col-span-full"/>
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Student</button>
                    </div>
                </form>
            </Modal>
             <ImportModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                onUpload={handleImport}
                title="Import Students"
                templateUrl="/public/templates/students_template.csv"
                processing={isImporting}
            />
            <StudentProfileModal 
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                student={selectedStudent}
                onViewIdCard={() => {
                    if (selectedStudent) {
                         openIdCardModal(selectedStudent, 'student');
                    }
                    setIsProfileModalOpen(false);
                }}
            />
            <StudentBillingModal
                isOpen={isBillingModalOpen}
                onClose={() => setIsBillingModalOpen(false)}
                student={selectedStudent}
            />
            <WebcamCaptureModal isOpen={isCaptureModalOpen} onClose={() => setIsCaptureModalOpen(false)} onCapture={handlePhotoCapture} />
             <BulkMessageModal
                isOpen={isBulkMessageModalOpen}
                onClose={() => setIsBulkMessageModalOpen(false)}
                studentsToMessage={studentsList.filter(s => selectedStudentIds.includes(s.id))}
                onSend={handleSendBulkMessage}
            />
            <PromotionModal
                isOpen={isPromotionModalOpen}
                onClose={() => setIsPromotionModalOpen(false)}
            />
        </div>
    );
};

export default StudentsView;
