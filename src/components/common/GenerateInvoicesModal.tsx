
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';
import type { FeeItem, NewTransaction } from '../../types';
import { TransactionType } from '../../types';
import * as api from '../../services/api';
import Spinner from './Spinner';

const GenerateInvoicesModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    const { addNotification } = useData();
    const queryClient = useQueryClient();
    
    const [selectedFeeItemIds, setSelectedFeeItemIds] = useState<string[]>([]);
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);

    const { data: feeStructure = [] } = useQuery({ queryKey: ['fee-structure'], queryFn: api.getFeeStructure });
    const { data: classes = [] } = useQuery({ queryKey: ['classes'], queryFn: () => api.getClasses().then(res => Array.isArray(res) ? res : res.data) });
    const { data: students = [] } = useQuery({ queryKey: ['students-all-list'], queryFn: () => api.getStudents({ limit: 2000, pagination: 'false', status: 'Active' }) });

    const createBatchMutation = useMutation({
        mutationFn: api.createMultipleTransactions,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['transactions'] });
            addNotification(`Successfully generated ${data.length} invoices.`, 'success');
            onClose();
        },
        onError: () => addNotification('Bulk billing failed.', 'error')
    });

    const handleGenerate = () => {
        if (!selectedFeeItemIds.length || !selectedClassIds.length) {
            addNotification('Select at least one fee and one class.', 'error');
            return;
        }

        const newInvoices: NewTransaction[] = [];
        const studentsList = Array.isArray(students) ? students : students.data || [];

        studentsList.filter((s:any) => selectedClassIds.includes(s.classId)).forEach((student: any) => {
            selectedFeeItemIds.forEach(itemId => {
                const feeItem = feeStructure.find((item:any) => item.id === itemId);
                const classFee = feeItem?.classSpecificFees.find((cf:any) => cf.classId === student.classId);

                if (feeItem && classFee && classFee.amount > 0) {
                    newInvoices.push({
                        studentId: student.id,
                        studentName: student.name,
                        type: TransactionType.Invoice,
                        date: invoiceDate,
                        description: feeItem.name,
                        amount: classFee.amount,
                    });
                }
            });
        });
        
        if (newInvoices.length === 0) {
            addNotification('No applicable fees found for the selected students.', 'info');
            return;
        }

        createBatchMutation.mutate(newInvoices);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Automated Bulk Billing" size="2xl">
            <div className="space-y-8 p-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">1. Select Charges</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                           {feeStructure.map((item: any) => (
                               <label key={item.id} className={`flex items-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${selectedFeeItemIds.includes(item.id) ? 'border-primary-500 bg-primary-50/50' : 'border-slate-50 hover:border-slate-100'}`}>
                                   <input type="checkbox" checked={selectedFeeItemIds.includes(item.id)} onChange={() => setSelectedFeeItemIds(p => p.includes(item.id) ? p.filter(i => i !== item.id) : [...p, item.id])} className="h-5 w-5 rounded-lg text-primary-600 mr-3"/>
                                   <div className="flex-grow">
                                       <p className="font-bold text-slate-800 text-sm">{item.name}</p>
                                       <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{item.frequency}</p>
                                   </div>
                               </label>
                           ))}
                        </div>
                    </div>
                     <div className="space-y-4">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">2. Target Groups</h3>
                        <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                            {classes.map((c: any) => (
                                <label key={c.id} className={`flex items-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${selectedClassIds.includes(c.id) ? 'border-blue-500 bg-blue-50/50' : 'border-slate-50 hover:border-slate-100'}`}>
                                    <input type="checkbox" checked={selectedClassIds.includes(c.id)} onChange={() => setSelectedClassIds(p => p.includes(c.id) ? p.filter(i => i !== c.id) : [...p, c.id])} className="h-5 w-5 rounded-lg text-blue-600 mr-3"/>
                                    <span className="font-bold text-slate-800 text-sm">{c.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-6 text-white flex flex-col sm:flex-row justify-between items-center gap-6">
                    <div className="flex-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-2">Effective Billing Date</label>
                        <input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="w-full bg-slate-800 border border-slate-700 p-3 rounded-xl font-bold outline-none focus:border-primary-500" />
                    </div>
                    <button onClick={handleGenerate} disabled={createBatchMutation.isPending} className="px-10 py-5 bg-primary-600 text-white font-black rounded-2xl shadow-2xl hover:scale-105 transition-all flex items-center gap-3">
                        {createBatchMutation.isPending ? <Spinner /> : (
                            <>
                                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/></svg>
                                Run Billing Engine
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default GenerateInvoicesModal;
