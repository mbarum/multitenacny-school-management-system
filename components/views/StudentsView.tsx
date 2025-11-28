import React, { useState, useMemo, useEffect } from 'react';
import Modal from '../common/Modal';
import WebcamCaptureModal from '../common/WebcamCaptureModal';
// Fix: Removed `Student.status` from the import statement as it's invalid syntax.
// Fix: Import enums to fix type errors.
import type { Student, Transaction, CommunicationLog, User, FeeItem, SchoolInfo, NewStudent, NewCommunicationLog, NewTransaction } from '../../types';
import { CommunicationType, StudentStatus, TransactionType } from '../../types';
import StudentBillingModal from '../common/StudentBillingModal';
import BulkMessageModal from '../common/BulkMessageModal';
import PromotionModal from '../common/PromotionModal';
import { useData } from '../../contexts/DataContext';
import { calculateAge } from '../../utils/helpers';

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onViewIdCard: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, student, onViewIdCard }) => {
    const { communicationLogs, addCommunicationLog, currentUser } = useData();
    const [activeTab, setActiveTab] = useState<'details' | 'communication'>('details');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');
            setMessage('');
        }
    }, [isOpen]);

     const studentLogs = useMemo(() => {
        if (!student) return [];
        return communicationLogs
            .filter(log => log.studentId === student.id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [communicationLogs, student]);

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
        addCommunicationLog(newLog);
        setMessage('');
    };
    
    if (!isOpen || !student) return null;

    const age = calculateAge(student.dateOfBirth);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${student.name}'s Profile`} size="xl">
            <div className="border-b border-slate-200 mb-4">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('details')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'details' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Details</button>
                    <button onClick={() => setActiveTab('communication')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'communication' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Communication</button>
                </nav>
            </div>
            {activeTab === 'details' && (
                <div className="space-y-4">
                    <div className="flex items-start space-x-4">
                        <img src={student.profileImage} alt={student.name} className="h-24 w-24 rounded-full object-cover"/>
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold">{student.name}</h3>
                            <p className="text-slate-600">{student.admissionNumber} | {student.class}</p>
                             <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${
                                student.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                student.status === 'Graduated' ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-800'
                            }`}>{student.status}</span>
                        </div>
                         <button onClick={onViewIdCard} className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 text-sm">View ID Card</button>
                    </div>
                     <div className="pt-4 border-t">
                        <h4 className="text-lg font-semibold text-slate-800 mb-2">Biodata</h4>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700 mb-4">
                             <p><strong className="font-semibold text-slate-800">Date of Birth:</strong> {student.dateOfBirth}</p>
                             <p><strong className="font-semibold text-slate-800">Age:</strong> {age !== null ? `${age} years old` : 'N/A'}</p>
                         </div>
                        <h4 className="text-lg font-semibold text-slate-800 mb-2 pt-4 border-t">Guardian Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-700">
                             <p><strong className="font-semibold text-slate-800">Name:</strong> {student.guardianName}</p>
                             <p><strong className="font-semibold text-slate-800">Email:</strong> {student.guardianEmail}</p>
                             <p><strong className="font-semibold text-slate-800">Primary Contact:</strong> {student.guardianContact}</p>
                             <p><strong className="font-semibold text-slate-800">Emergency:</strong> {student.emergencyContact}</p>
                             <p className="col-span-2"><strong className="font-semibold text-slate-800">Address:</strong> {student.guardianAddress}</p>
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'communication' && (
                 <div className="flex flex-col h-[60vh]">
                    <div className="flex-1 overflow-y-auto pr-4 -mr-4 space-y-4">
                       {studentLogs.length > 0 ? studentLogs.map(log => (
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
    const { students, updateStudent, addStudent, addMultipleTransactions, addBulkCommunicationLogs, classes, currentUser, feeStructure, studentFinancials, schoolInfo, addNotification, openIdCardModal, updateMultipleStudents } = useData();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClass, setSelectedClass] = useState('all');
    // Fix: Use StudentStatus enum member for initial state.
    const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>(StudentStatus.Active);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isBillingModalOpen, setIsBillingModalOpen] = useState(false);
    const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false);
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isBulkMessageModalOpen, setIsBulkMessageModalOpen] = useState(false);
    
    // Fix: Removed 'admissionNumber' as it is not part of the NewStudent type.
    const initialStudentState: NewStudent = {
        name: '', class: classes[0]?.name || '', classId: classes[0]?.id || '', profileImage: 'https://i.imgur.com/S5o7W44.png',
        guardianName: '', guardianContact: '', guardianAddress: '', guardianEmail: '', emergencyContact: '', dateOfBirth: ''
    };
    
    const [newStudent, setNewStudent] = useState(initialStudentState);
    
    const filteredStudents = useMemo(() => {
        return students.filter(s => 
            (s.name.toLowerCase().includes(searchTerm.toLowerCase()) || s.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())) &&
            (selectedClass === 'all' || s.classId === selectedClass) &&
            (statusFilter === 'all' || s.status === statusFilter)
        );
    }, [students, searchTerm, selectedClass, statusFilter]);
    
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
        const studentToAdd = await addStudent(newStudent);
        addNotification(`Student ${studentToAdd.name} added successfully!`, 'success');

        const initialTransactions: NewTransaction[] = feeStructure
            .filter(item => !item.isOptional && item.classSpecificFees.some(fee => fee.classId === studentToAdd.classId))
            .map(item => {
                const classFee = item.classSpecificFees.find(fee => fee.classId === studentToAdd.classId);
                return {
                    studentId: studentToAdd.id,
                    // Fix: Use TransactionType enum member instead of string literal.
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
    };
    
    const handleOpenAddStudentModal = () => {
        setNewStudent({ ...initialStudentState });
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
    
    const handlePhotoCapture = (imageDataUrl: string) => {
        setNewStudent(prev => ({ ...prev, profileImage: imageDataUrl }));
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
            setSelectedStudentIds(filteredStudents.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handleBulkStatusChange = (status: StudentStatus) => {
        const updates = selectedStudentIds.map(id => ({ id, status }));
        updateMultipleStudents(updates).then(() => {
            addNotification(`${selectedStudentIds.length} student(s) status updated to ${status}.`, 'success');
            setSelectedStudentIds([]);
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
        // Fix: Use StudentStatus enum members for toggling status.
        const newStatus = student.status === StudentStatus.Active ? StudentStatus.Inactive : StudentStatus.Active;
        updateStudent(student.id, { status: newStatus });
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Student Management</h2>
                <div className="mt-2 sm:mt-0 flex space-x-2">
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
                        {/* Fix: Use StudentStatus enum members for bulk actions. */}
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
                                    checked={filteredStudents.length > 0 && selectedStudentIds.length === filteredStudents.length}
                                    ref={el => {
                                        if (el) {
                                            el.indeterminate = selectedStudentIds.length > 0 && selectedStudentIds.length < filteredStudents.length;
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
                        {filteredStudents.map(student => {
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
                                        <img src={student.profileImage} alt={student.name} className={`h-10 w-10 rounded-full object-cover ${student.status !== 'Active' ? 'filter grayscale' : ''}`}/>
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
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
            <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Student" size="xl">
                <form onSubmit={handleAddStudent} className="space-y-4">
                    <div className="flex items-center space-x-4">
                        <img src={newStudent.profileImage} alt="New student" className="h-24 w-24 rounded-full object-cover border"/>
                        <button type="button" onClick={() => setIsCaptureModalOpen(true)} className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700">Take Photo</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="name" placeholder="Full Name" value={newStudent.name} onChange={handleInputChange} required className="p-2 border border-slate-300 rounded-lg"/>
                        {/* Fix: Set value to empty string as it's auto-generated and not part of the state. */}
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
                studentsToMessage={students.filter(s => selectedStudentIds.includes(s.id))}
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
