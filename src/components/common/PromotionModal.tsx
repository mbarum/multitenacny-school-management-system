
import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';
import type { Student } from '../../types';
import { StudentStatus } from '../../types';
import * as api from '../../services/api';
import Skeleton from './Skeleton';

interface PromotionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PromotionModal: React.FC<PromotionModalProps> = ({ isOpen, onClose }) => {
    const { updateMultipleStudents, addNotification } = useData();
    const queryClient = useQueryClient();
    
    const [fromClassId, setFromClassId] = useState('');
    const [toClassId, setToClassId] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [studentsInFromClass, setStudentsInFromClass] = useState<Student[]>([]);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);

    useEffect(() => {
        api.getClasses().then(res => setClasses(Array.isArray(res) ? res : res?.data || []));
    }, [isOpen]);

    useEffect(() => {
        if (fromClassId && isOpen) {
            setIsLoadingStudents(true);
            api.getStudents({ classId: fromClassId, status: 'Active', pagination: 'false' })
                .then((data: any) => {
                    const list = Array.isArray(data) ? data : data?.data || [];
                    setStudentsInFromClass(list);
                    setSelectedStudentIds([]); 
                })
                .catch(() => addNotification("Failed to load students.", "error"))
                .finally(() => setIsLoadingStudents(false));
        }
    }, [fromClassId, isOpen, addNotification]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) setSelectedStudentIds((studentsInFromClass || []).map(s => s.id));
        else setSelectedStudentIds([]);
    };

    const handlePromote = async () => {
        if (!toClassId || selectedStudentIds.length === 0) {
            addNotification('Select destination class and students.', 'error');
            return;
        }
        setIsProcessing(true);
        try {
            const toClass = (classes || []).find(c => c.id === toClassId);
            if (!toClass) throw new Error('Target class invalid');

            const updates = selectedStudentIds.map(id => ({
                id,
                classId: toClass.id,
                status: StudentStatus.Active
            }));
            
            await updateMultipleStudents(updates);
            queryClient.invalidateQueries({ queryKey: ['students'] });
            
            addNotification(`${selectedStudentIds.length} students promoted to ${toClass.name}.`, 'success');
            onClose();
        } catch (e: any) {
            addNotification(e.message || 'Operation failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGraduate = async () => {
        if (selectedStudentIds.length === 0) {
            addNotification('Select students to graduate.', 'error');
            return;
        }
        setIsProcessing(true);
        try {
            const updates = selectedStudentIds.map(id => ({
                id,
                status: StudentStatus.Graduated
            }));
            await updateMultipleStudents(updates);
            queryClient.invalidateQueries({ queryKey: ['students'] });
            addNotification(`${selectedStudentIds.length} students marked as Graduated.`, 'success');
            onClose();
        } catch (e: any) {
            addNotification(e.message || 'Operation failed', 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    useEffect(() => {
        if (!isOpen) {
            setFromClassId(''); setToClassId('');
            setSelectedStudentIds([]); setStudentsInFromClass([]);
        }
    }, [isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mass Student Promotion" size="2xl">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Source Grade</label>
                        <select value={fromClassId} onChange={e => setFromClassId(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold bg-slate-50 outline-none focus:border-primary-500">
                            <option value="">Choose class...</option>
                            {(classes || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Grade</label>
                        <select value={toClassId} onChange={e => setToClassId(e.target.value)} className="w-full p-3 border-2 border-slate-100 rounded-xl font-bold bg-slate-50 outline-none focus:border-primary-500" disabled={!fromClassId}>
                            <option value="">Choose target...</option>
                            {(classes || []).filter(c => c.id !== fromClassId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                {fromClassId && (
                    <div className="animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-black text-slate-800 uppercase text-xs tracking-tight">Select Individuals</h4>
                            <span className="text-[10px] font-black text-slate-400 uppercase">{selectedStudentIds.length} Selected</span>
                        </div>
                        <div className="max-h-64 overflow-y-auto border-2 border-slate-100 rounded-2xl bg-white shadow-inner">
                            {isLoadingStudents ? <div className="p-4 space-y-2"><Skeleton className="h-6 w-full" /><Skeleton className="h-6 w-full" /></div> : (
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b sticky top-0">
                                            <th className="p-3 text-left w-10">
                                                <input type="checkbox" onChange={handleSelectAll} checked={studentsInFromClass.length > 0 && selectedStudentIds.length === studentsInFromClass.length} className="h-5 w-5 rounded text-primary-600"/>
                                            </th>
                                            <th className="p-3 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest">Full Name</th>
                                            <th className="p-3 text-left font-black text-slate-400 uppercase text-[10px] tracking-widest">Adm #</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {(studentsInFromClass || []).map(student => (
                                            <tr key={student.id} className={`hover:bg-primary-50/50 transition-colors ${selectedStudentIds.includes(student.id) ? 'bg-primary-50/30' : ''}`}>
                                                <td className="p-3">
                                                    <input type="checkbox" checked={selectedStudentIds.includes(student.id)} onChange={() => setSelectedStudentIds(p => p.includes(student.id) ? p.filter(id => id !== student.id) : [...p, student.id])} className="h-5 w-5 rounded text-primary-600" />
                                                </td>
                                                <td className="p-3 font-bold text-slate-700">{student.name}</td>
                                                <td className="p-3 font-mono text-xs font-black text-slate-400">{student.admissionNumber}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                )}
                 <div className="flex flex-col sm:row justify-between items-center pt-6 border-t gap-4">
                    <button onClick={handleGraduate} disabled={isProcessing || selectedStudentIds.length === 0} className="w-full sm:w-auto px-8 py-3 bg-slate-900 text-white font-black rounded-xl shadow-lg hover:bg-black transition-all uppercase text-[10px] tracking-widest disabled:bg-slate-400">
                        Graduate Selected
                    </button>
                    <button onClick={handlePromote} disabled={isProcessing || !toClassId || selectedStudentIds.length === 0} className="w-full sm:w-auto px-10 py-3 bg-primary-600 text-white font-black rounded-xl shadow-lg shadow-primary-600/30 hover:bg-primary-700 transition-all uppercase text-[10px] tracking-widest disabled:bg-slate-400">
                        {isProcessing ? 'Processing Batch...' : 'Execute Promotion'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
export default PromotionModal;
