
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import type { Student, CommunicationLog, User, SchoolClass, NewCommunicationLog } from '../../types';
import { CommunicationType, StudentStatus, TransactionType } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';
import Skeleton from '../common/Skeleton';

interface StudentProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    student: Student | null;
    onViewIdCard: () => void;
}

const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ isOpen, onClose, student, onViewIdCard }) => {
    // Removed communicationLogs from useData
    const { addCommunicationLog, currentUser, addNotification } = useData();
    const [activeTab, setActiveTab] = useState<'details' | 'communication'>('details');
    const [message, setMessage] = useState('');
    
    // Local state for logs
    const [studentLogs, setStudentLogs] = useState<CommunicationLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('details');
            setMessage('');
            if (student) {
                setLoadingLogs(true);
                api.getCommunicationLogs({ studentId: student.id, limit: 50 })
                    .then(res => setStudentLogs(res.data))
                    .catch(err => console.error("Failed to fetch logs", err))
                    .finally(() => setLoadingLogs(false));
            }
        }
    }, [isOpen, student]);

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
                        </div>
                         <button onClick={onViewIdCard} className="px-3 py-1.5 bg-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-300 text-sm">View ID Card</button>
                    </div>
                     <div className="pt-4 border-t">
                        <h4 className="text-lg font-semibold text-slate-800 mb-2">Guardian Information</h4>
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

const MyClassView: React.FC = () => {
    const { students, assignedClass, openIdCardModal, isLoading } = useData();
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    if (isLoading) return <div className="p-8 text-center">Loading class data...</div>;

    if (!assignedClass) {
        return (
             <div className="p-8 text-center text-slate-500 bg-white rounded-xl shadow m-8">
                <h3 className="text-xl font-bold mb-2">No Class Assigned</h3>
                <p>You need to be assigned to a class by the administrator to view students here.</p>
            </div>
        );
    }

    const studentsInClass = students.filter(s => s.classId === assignedClass.id);

    const handleViewProfile = (student: Student) => {
        setSelectedStudent(student);
        setIsProfileModalOpen(true);
    };

    return (
        <div className="p-6 md:p-8">
            <h2 className="text-3xl font-bold text-slate-800 mb-6">My Class: {assignedClass.name}</h2>
            <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                 <table className="w-full text-left table-auto">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-3 font-semibold text-slate-600">Student</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Admission No.</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Guardian Name</th>
                            <th className="px-4 py-3 font-semibold text-slate-600">Guardian Contact</th>
                            <th className="px-4 py-3 font-semibold text-slate-600 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {studentsInClass.length > 0 ? studentsInClass.map(student => (
                            <tr key={student.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-2 flex items-center space-x-3">
                                    <img src={student.profileImage} alt={student.name} className="h-10 w-10 rounded-full object-cover"/>
                                    <span className="font-semibold">{student.name}</span>
                                </td>
                                <td className="px-4 py-2">{student.admissionNumber}</td>
                                <td className="px-4 py-2">{student.guardianName}</td>
                                <td className="px-4 py-2">{student.guardianContact}</td>
                                <td className="px-4 py-2 text-center">
                                    <button onClick={() => handleViewProfile(student)} className="text-primary-600 hover:underline">View Profile</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="text-center py-6 text-slate-500">No students found in this class.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <StudentProfileModal 
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                student={selectedStudent}
                onViewIdCard={() => {
                    if (selectedStudent) {
                        openIdCardModal(selectedStudent, 'student');
                        setIsProfileModalOpen(false);
                    }
                }}
            />
        </div>
    );
};

export default MyClassView;
