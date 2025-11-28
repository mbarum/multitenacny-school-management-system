import React, { useState, useMemo } from 'react';
import Modal from './Modal';
import { useData } from '../../contexts/DataContext';
import type { FeeItem, SchoolClass, NewTransaction } from '../../types';
import { TransactionType } from '../../types';

interface GenerateInvoicesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const GenerateInvoicesModal: React.FC<GenerateInvoicesModalProps> = ({ isOpen, onClose }) => {
    const { feeStructure, classes, students, addMultipleTransactions, addNotification } = useData();
    
    const [selectedFeeItemIds, setSelectedFeeItemIds] = useState<string[]>([]);
    const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
    const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
    const [isProcessing, setIsProcessing] = useState(false);

    const feeItemsByCategory = useMemo(() => {
        return feeStructure.reduce((acc, item) => {
            if (!acc[item.category]) {
                acc[item.category] = [];
            }
            acc[item.category].push(item);
            return acc;
        }, {} as Record<string, FeeItem[]>);
    }, [feeStructure]);

    const handleToggleFeeItem = (id: string) => {
        setSelectedFeeItemIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleToggleClass = (id: string) => {
        setSelectedClassIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const studentsToBill = useMemo(() => {
        if (selectedClassIds.length === 0) return [];
        return students.filter(s => selectedClassIds.includes(s.classId) && s.status === 'Active');
    }, [students, selectedClassIds]);

    const handleGenerate = async () => {
        if (selectedFeeItemIds.length === 0 || selectedClassIds.length === 0) {
            addNotification('Please select at least one fee item and one class.', 'error');
            return;
        }

        setIsProcessing(true);
        const newInvoices: NewTransaction[] = [];

        studentsToBill.forEach(student => {
            selectedFeeItemIds.forEach(itemId => {
                const feeItem = feeStructure.find(item => item.id === itemId);
                const classFee = feeItem?.classSpecificFees.find(cf => cf.classId === student.classId);

                if (feeItem && classFee && classFee.amount > 0) {
                    newInvoices.push({
                        studentId: student.id,
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
            setIsProcessing(false);
            return;
        }

        try {
            await addMultipleTransactions(newInvoices);
            addNotification(`${newInvoices.length} invoices generated successfully for ${studentsToBill.length} students.`, 'success');
            onClose();
        } finally {
            setIsProcessing(false);
        }
    };


    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Generate Bulk Invoices" size="2xl">
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h3 className="font-semibold text-slate-800 mb-2">1. Select Fee Items to Bill</h3>
                        <div className="p-2 border rounded-md max-h-64 overflow-y-auto space-y-3 bg-slate-50">
                           {Object.entries(feeItemsByCategory).map(([category, items]: [string, FeeItem[]]) => (
                               <div key={category}>
                                   <h4 className="font-medium text-sm text-slate-600 sticky top-0 bg-slate-50 py-1">{category}</h4>
                                   {items.map(item => (
                                       <label key={item.id} className="flex items-center space-x-2 p-1 cursor-pointer hover:bg-slate-100 rounded">
                                           <input type="checkbox" checked={selectedFeeItemIds.includes(item.id)} onChange={() => handleToggleFeeItem(item.id)} className="h-4 w-4 rounded text-primary-600"/>
                                           <span>{item.name} ({item.frequency})</span>
                                       </label>
                                   ))}
                               </div>
                           ))}
                        </div>
                    </div>
                     <div>
                        <h3 className="font-semibold text-slate-800 mb-2">2. Select Classes to Bill</h3>
                        <div className="p-2 border rounded-md max-h-64 overflow-y-auto space-y-2 bg-slate-50">
                            {classes.map(c => (
                                <label key={c.id} className="flex items-center space-x-2 p-1 cursor-pointer hover:bg-slate-100 rounded">
                                    <input type="checkbox" checked={selectedClassIds.includes(c.id)} onChange={() => handleToggleClass(c.id)} className="h-4 w-4 rounded text-primary-600"/>
                                    <span>{c.name}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
                <div>
                     <label htmlFor="invoiceDate" className="block text-sm font-medium text-slate-700">3. Invoice Date</label>
                     <input type="date" id="invoiceDate" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} className="mt-1 block p-2 border border-slate-300 rounded-md" />
                </div>
                <div className="p-4 bg-primary-50 border-l-4 border-primary-500 rounded-r-md">
                    <h4 className="font-bold text-primary-800">Summary</h4>
                    <p className="text-primary-700">You are about to generate invoices for <strong>{studentsToBill.length} active students</strong> in the selected classes.</p>
                </div>
            </div>
            <div className="flex justify-end pt-6 border-t mt-6">
                <button onClick={handleGenerate} disabled={isProcessing} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 disabled:bg-slate-400">
                    {isProcessing ? 'Generating...' : `Generate Invoices`}
                </button>
            </div>
        </Modal>
    );
};

export default GenerateInvoicesModal;
