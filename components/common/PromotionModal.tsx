import React, { useState, useMemo, useEffect } from 'react';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';
import type { Student, SchoolClass } from '../../types';
// Fix: Import StudentStatus enum to use its members.
import { StudentStatus } from '../../types';

interface PromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ isOpen, onClose }) => {
    const { classes, students, updateMultipleStudents, addNotification } = useData();
    const [fromClassId, setFromClassId] = useState('');
    const [toClassId, setToClassId] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const studentsInFromClass = useMemo(() => {
        if (!fromClassId) return [];
        return students.filter(s => s.classId === fromClassId && s.status === 'Active');
    }, [students, fromClassId]);

    useEffect(() => {
        if (fromClassId) {
            setSelectedStudentIds(studentsInFromClass.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    }, [fromClassId, studentsInFromClass]);

    const handleSelectStudent = (studentId: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(studentsInFromClass.map(s => s.id));
        } else {
            setSelectedStudentIds([]);
        }
    };

    const handlePromote = async () => {
        if (!toClassId || selectedStudentIds.length === 0) {
            addNotification('Please select a destination class and at least one student.', 'error');
            return;
        }
        setIsProcessing(true);
        const toClass = classes.find(c => c.id === toClassId);
        if (!toClass) {
            addNotification('Destination class not found.', 'error');
            setIsProcessing(false);
            return;
        }
        const updates = selectedStudentIds.map(id => ({
            id,
            classId: toClass.id,
            class: toClass.name
        }));
        await updateMultipleStudents(updates);
        addNotification(`${selectedStudentIds.length} student(s) promoted to ${toClass.name}.`, 'success');
        setIsProcessing(false);
        onClose();
    };

    const handleGraduate = async () => {
        if (selectedStudentIds.length === 0) {
            addNotification('Please select at least one student to graduate.', 'error');
            return;
        }
        setIsProcessing(true);
        const updates = selectedStudentIds.map(id => ({
            id,
            // Fix: Use StudentStatus enum member instead of string literal.
            status: StudentStatus.Graduated
        }));
        await updateMultipleStudents(updates);
        addNotification(`${selectedStudentIds.length} student(s) have been marked as graduated.`, 'success');
        setIsProcessing(false);
        onClose();
    };
    
    // Reset state when modal is closed
    useEffect(() => {
        if (!isOpen) {
            setFromClassId('');
            setToClassId('');
            setSelectedStudentIds([]);
            setIsProcessing(false);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Promote or Graduate Students" size="2xl">
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Promote from Class</label>
                        <select value={fromClassId} onChange={e => setFromClassId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm">
                            <option value="">-- Select a class --</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Promote to Class</label>
                        <select value={toClassId} onChange={e => setToClassId(e.target.value)} className="w-full p-2 border border-slate-300 rounded-md shadow-sm" disabled={!fromClassId}>
                            <option value="">-- Select a destination --</option>
                            {classes.filter(c => c.id !== fromClassId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {fromClassId && (
                    <div className="border-t pt-4">
                        <h4 className="font-semibold mb-2 text-slate-800">Select students from {classes.find(c => c.id === fromClassId)?.name}</h4>
                        <div className="max-h-64 overflow-y-auto border rounded-md">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-slate-50 border-b sticky top-0">
                                        <th className="p-2 text-left w-10">
                                            <input type="checkbox" onChange={handleSelectAll} checked={studentsInFromClass.length > 0 && selectedStudentIds.length === studentsInFromClass.length}/>
                                        </th>
                                        <th className="p-2 text-left font-semibold text-slate-600">Student Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsInFromClass.map(student => (
                                        <tr key={student.id} className="hover:bg-slate-50 border-b last:border-b-0">
                                            <td className="p-2">
                                                <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => handleSelectStudent(student.id)} />
                                            </td>
                                            <td className="p-2 text-slate-700">{student.name}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                             {studentsInFromClass.length === 0 && <p className="text-center text-slate-500 p-4">No active students in this class.</p>}
                        </div>
                         <p className="text-xs text-slate-500 mt-1">{selectedStudentIds.length} of {studentsInFromClass.length} students selected.</p>
                    </div>
                )}
                 <div className="flex justify-end items-center pt-4 border-t space-x-3">
                    <p className="text-sm text-slate-600 mr-auto">For final year students, use the Graduate option.</p>
                    <button onClick={handleGraduate} disabled={isProcessing || selectedStudentIds.length === 0} className="px-4 py-2 bg-slate-700 text-white font-semibold rounded-lg shadow-md hover:bg-slate-800 disabled:bg-slate-400">
                        {isProcessing ? 'Processing...' : `Graduate Selected (${selectedStudentIds.length})`}
                    </button>
                    <button onClick={handlePromote} disabled={isProcessing || !toClassId || selectedStudentIds.length === 0} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400">
                        {isProcessing ? 'Processing...' : `Promote Selected (${selectedStudentIds.length})`}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default PromotionModal;