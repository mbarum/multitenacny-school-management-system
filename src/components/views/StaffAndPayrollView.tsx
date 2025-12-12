
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Modal from '../components/common/Modal';
import WebcamCaptureModal from '../components/common/WebcamCaptureModal';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import type { Staff, Payroll, PayrollItem, SchoolInfo, NewStaff, NewPayrollItem, PayrollEntry } from '../../types';
import { PayrollItemType, PayrollItemCategory, CalculationType, Role } from '../../types';
import { useData } from '../../contexts/DataContext';
import * as api from '../../services/api';

// --- Sub-components for better organization ---

const PayrollEditModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    entry: Payroll | null;
    onSave: (updatedEntry: Payroll) => void;
}> = ({ isOpen, onClose, entry, onSave }) => {
    const [localEntry, setLocalEntry] = useState<Payroll | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [newItemAmount, setNewItemAmount] = useState(0);
    const [newItemType, setNewItemType] = useState<PayrollItemType>(PayrollItemType.Earning);

    useEffect(() => {
        setLocalEntry(entry ? JSON.parse(JSON.stringify(entry)) : null); // Deep copy to avoid mutating prop
    }, [entry, isOpen]);

    const calculateTotals = (e: Payroll) => {
        const gross = e.earnings.reduce((sum, item) => sum + item.amount, 0);
        const ded = e.deductions.reduce((sum, item) => sum + item.amount, 0);
        return { gross, ded, net: gross - ded };
    }

    const handleAmountChange = (type: 'earnings' | 'deductions', index: number, val: number) => {
        if (!localEntry) return;
        const list = [...localEntry[type]];
        list[index].amount = val;
        
        const updated = { ...localEntry, [type]: list };
        const { gross, ded, net } = calculateTotals(updated);
        setLocalEntry({ ...updated, grossPay: gross, totalDeductions: ded, netPay: net });
    };

    const handleDeleteItem = (type: 'earnings' | 'deductions', index: number) => {
        if (!localEntry) return;
        const list = [...localEntry[type]];
        list.splice(index, 1);
        
        const updated = { ...localEntry, [type]: list };
        const { gross, ded, net } = calculateTotals(updated);
        setLocalEntry({ ...updated, grossPay: gross, totalDeductions: ded, netPay: net });
    };

    const handleAddItem = () => {
        if (!localEntry || !newItemName || newItemAmount <= 0) return;
        const newItem: PayrollEntry = { name: newItemName, amount: newItemAmount };
        const typeKey = newItemType === PayrollItemType.Earning ? 'earnings' : 'deductions';
        
        const updated = { ...localEntry, [typeKey]: [...localEntry[typeKey], newItem] };
        const { gross, ded, net } = calculateTotals(updated);
        setLocalEntry({ ...updated, grossPay: gross, totalDeductions: ded, netPay: net });
        
        setNewItemName('');
        setNewItemAmount(0);
    };

    if (!localEntry) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Edit Payroll: ${localEntry.staffName}`}>
            <div className="space-y-6">
                {/* Earnings Section */}
                <div>
                    <h4 className="font-semibold text-green-700 border-b pb-1 mb-2">Earnings</h4>
                    <table className="w-full text-sm">
                        <tbody>
                            {localEntry.earnings.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100">
                                    <td className="py-2">{item.name}</td>
                                    <td className="py-2 text-right">
                                        <input 
                                            type="number" 
                                            value={item.amount} 
                                            onChange={e => handleAmountChange('earnings', idx, parseFloat(e.target.value) || 0)}
                                            className="w-24 p-1 border rounded text-right"
                                        />
                                    </td>
                                    <td className="py-2 text-right w-8">
                                        <button onClick={() => handleDeleteItem('earnings', idx)} className="text-red-500 hover:text-red-700">&times;</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Deductions Section */}
                <div>
                    <h4 className="font-semibold text-red-700 border-b pb-1 mb-2">Deductions</h4>
                    <table className="w-full text-sm">
                        <tbody>
                            {localEntry.deductions.map((item, idx) => (
                                <tr key={idx} className="border-b border-slate-100">
                                    <td className="py-2">{item.name}</td>
                                    <td className="py-2 text-right">
                                        <input 
                                            type="number" 
                                            value={item.amount} 
                                            onChange={e => handleAmountChange('deductions', idx, parseFloat(e.target.value) || 0)}
                                            className="w-24 p-1 border rounded text-right"
                                        />
                                    </td>
                                    <td className="py-2 text-right w-8">
                                        <button onClick={() => handleDeleteItem('deductions', idx)} className="text-red-500 hover:text-red-700">&times;</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Add New Item */}
                <div className="bg-slate-50 p-3 rounded border">
                    <h5 className="text-sm font-semibold mb-2">Add Line Item</h5>
                    <div className="flex gap-2">
                        <input placeholder="Name (e.g. Bonus)" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 p-1 border rounded text-sm"/>
                        <select value={newItemType} onChange={e => setNewItemType(e.target.value as PayrollItemType)} className="p-1 border rounded text-sm">
                            <option value={PayrollItemType.Earning}>Earning</option>
                            <option value={PayrollItemType.Deduction}>Deduction</option>
                        </select>
                        <input type="number" placeholder="Amount" value={newItemAmount || ''} onChange={e => setNewItemAmount(parseFloat(e.target.value))} className="w-20 p-1 border rounded text-sm"/>
                        <button onClick={handleAddItem} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add</button>
                    </div>
                </div>

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 bg-slate-100 p-4 rounded font-bold text-center">
                    <div>
                        <div className="text-xs text-slate-500">Gross Pay</div>
                        <div className="text-green-700">{localEntry.grossPay.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Deductions</div>
                        <div className="text-red-700">{localEntry.totalDeductions.toLocaleString()}</div>
                    </div>
                    <div>
                        <div className="text-xs text-slate-500">Net Pay</div>
                        <div className="text-slate-800">{localEntry.netPay.toLocaleString()}</div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t">
                    <button onClick={() => onSave(localEntry)} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded shadow hover:bg-primary-700">Update Entry</button>
                </div>
            </div>
        </Modal>
    );
};

// --- Main Component ---

const StaffAndPayrollView: React.FC = () => {
    const { staff, addStaff, updateStaff, savePayrollRun, payrollItems, addPayrollItem, updatePayrollItem, deletePayrollItem, schoolInfo, openIdCardModal, addNotification } = useData();

    const [activeTab, setActiveTab] = useState('roster');
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [isRunPayrollModalOpen, setIsRunPayrollModalOpen] = useState(false);
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
    const [isP9ModalOpen, setIsP9ModalOpen] = useState(false);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [selectedStaffForP9, setSelectedStaffForP9] = useState<Staff | null>(null);
    const [p9Data, setP9Data] = useState<Payroll[]>([]);
    
    // Worksheet State
    const [payrollWorksheet, setPayrollWorksheet] = useState<Payroll[]>([]);
    const [editingWorksheetEntry, setEditingWorksheetEntry] = useState<Payroll | null>(null);
    const [isEditEntryModalOpen, setIsEditEntryModalOpen] = useState(false);
    
    // Payroll History State
    const [payrollHistory, setPayrollHistory] = useState<Payroll[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);
    const [selectedStaffFilter, setSelectedStaffFilter] = useState('');
    const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
    const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false);
    
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<PayrollItem | null>(null);
    const [itemFormData, setItemFormData] = useState<NewPayrollItem>({
        name: '', type: PayrollItemType.Earning, category: PayrollItemCategory.Allowance, calculationType: CalculationType.Fixed, value: 0, isRecurring: false
    });
    
    const [isStaffCaptureModalOpen, setIsStaffCaptureModalOpen] = useState(false);
    const staffPhotoInputRef = useRef<HTMLInputElement>(null);
    
    const initialStaffState: NewStaff = {
        name: '', email: '', userRole: Role.Teacher, role: '', salary: 0, joinDate: '', kraPin: '', nssfNumber: '', shaNumber: '',
        bankName: '', accountNumber: '', photoUrl: 'https://i.imgur.com/S5o7W44.png'
    };

    const [staffFormData, setStaffFormData] = useState<NewStaff | Staff>(initialStaffState);
    const [staffPhotoUrl, setStaffPhotoUrl] = useState<string>('https://i.imgur.com/S5o7W44.png');

    useEffect(() => {
        if (isStaffModalOpen) {
            setStaffFormData(editingStaff || initialStaffState);
            setStaffPhotoUrl(editingStaff?.photoUrl || 'https://i.imgur.com/S5o7W44.png');
        }
        if (isItemModalOpen) {
            setItemFormData(editingItem || { name: '', type: PayrollItemType.Earning, category: PayrollItemCategory.Allowance, calculationType: CalculationType.Fixed, value: 0, isRecurring: false });
        }
    }, [isStaffModalOpen, editingStaff, isItemModalOpen, editingItem]);
    
    const fetchPayrollHistory = useCallback(async (page: number, staffId?: string, month?: string) => {
        setHistoryLoading(true);
        try {
            const response = await api.getPayrollHistory({ page, limit: 10, staffId, month });
            setPayrollHistory(response.data);
            setHistoryTotalPages(response.last_page);
            setHistoryPage(page);
        } catch (error) {
            console.error("Error fetching payroll history:", error);
            addNotification("Failed to fetch payroll history", "error");
        } finally {
            setHistoryLoading(false);
        }
    }, [addNotification]);

    useEffect(() => {
        if (activeTab === 'history') {
            fetchPayrollHistory(historyPage, selectedStaffFilter, selectedMonthFilter);
        }
    }, [activeTab, historyPage, selectedStaffFilter, selectedMonthFilter, fetchPayrollHistory]);

    const handleStaffFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setStaffFormData(prev => ({ ...prev, [name]: name === 'salary' ? parseFloat(value) || 0 : value }));
    };

    const handleStaffPhotoCapture = async (imageDataUrl: string) => {
         // Convert base64 to file
         const res = await fetch(imageDataUrl);
         const blob = await res.blob();
         const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
         
         const formData = new FormData();
         formData.append('file', file);
         try {
            const uploadRes = await api.uploadStaffPhoto(formData);
            setStaffPhotoUrl(uploadRes.url);
            addNotification('Photo captured and uploaded.', 'success');
         } catch (error) {
             addNotification('Failed to upload captured photo.', 'error');
         }
    };

    const handleStaffPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
             const formData = new FormData();
            formData.append('file', e.target.files[0]);
            try {
                const res = await api.uploadStaffPhoto(formData);
                setStaffPhotoUrl(res.url);
                addNotification('Photo uploaded.', 'success');
            } catch (error) {
                addNotification('Failed to upload photo.', 'error');
            }
        }
    };
    
    const handleSaveStaff = (e: React.FormEvent) => {
        e.preventDefault();
        const staffData = { ...staffFormData, photoUrl: staffPhotoUrl };
        if ('id' in staffFormData) { // Editing
            updateStaff(staffFormData.id, staffData);
        } else { // Adding
            addStaff(staffData as NewStaff);
        }
        setIsStaffModalOpen(false);
    };

    const openStaffModal = (staffMember: Staff | null = null) => {
        setEditingStaff(staffMember);
        setIsStaffModalOpen(true);
    };
    
    // Payroll Item Management
    const openItemModal = (item: PayrollItem | null) => {
        setEditingItem(item);
        setIsItemModalOpen(true);
    };
    
    const handleSaveItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) {
            updatePayrollItem(editingItem.id, itemFormData);
        } else {
            addPayrollItem(itemFormData);
        }
        setIsItemModalOpen(false);
    };
    
    const handleDeleteItem = (itemId: string) => {
        if (window.confirm("Are you sure you want to delete this payroll item?")) {
            deletePayrollItem(itemId);
        }
    };

    // Payroll Calculation Logic
    const calculatePAYE = (taxablePay: number) => {
        const annualPay = taxablePay * 12;
        let tax = 0;
        if (annualPay <= 288000) tax = annualPay * 0.1;
        else if (annualPay <= 388000) tax = 28800 + (annualPay - 288000) * 0.25;
        else tax = 28800 + 25000 + (annualPay - 388000) * 0.30;
        return Math.max(0, (tax / 12) - 2400);
    };

    const calculateSHA = (grossPay: number) => grossPay * 0.0275;
    const calculateNSSF = (grossPay: number) => Math.min(grossPay, 18000) * 0.06;
    const calculateHousingLevy = (grossPay: number) => grossPay * 0.015;

    const generatePayrollWorksheet = () => {
        // Enforce consistent locale for month string to avoid backend mismatch issues
        const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
        
        const worksheet = staff.map(staffMember => {
            const earnings: PayrollEntry[] = [{ name: 'Basic Salary', amount: staffMember.salary }];
            
            payrollItems
                .filter(i => i.type === PayrollItemType.Earning && i.isRecurring)
                .forEach(item => {
                    const earningAmount = item.calculationType === CalculationType.Percentage
                        ? (item.value / 100) * staffMember.salary
                        : item.value;
                    earnings.push({ name: item.name, amount: earningAmount });
                });

            const grossPay = earnings.reduce((sum, item) => sum + item.amount, 0);
            
            const deductions: PayrollEntry[] = [
                { name: 'PAYE', amount: calculatePAYE(grossPay) },
                { name: 'SHA Contribution', amount: calculateSHA(grossPay) },
                { name: 'NSSF', amount: calculateNSSF(grossPay) },
                { name: 'Housing Levy', amount: calculateHousingLevy(grossPay) },
            ];

            // Add Recurring Deductions (Missing in previous version)
             payrollItems
                .filter(i => i.type === PayrollItemType.Deduction && i.isRecurring)
                .forEach(item => {
                     const deductionAmount = item.calculationType === CalculationType.Percentage
                        ? (item.value / 100) * staffMember.salary
                        : item.value;
                     deductions.push({ name: item.name, amount: deductionAmount });
                });
            
            const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
            const netPay = grossPay - totalDeductions;
            
            return {
                id: `payroll-${staffMember.id}-${Date.now()}`, 
                staffId: staffMember.id, 
                staffName: staffMember.name,
                month, 
                payDate: new Date().toISOString().split('T')[0],
                grossPay, 
                totalDeductions, 
                netPay, 
                earnings, 
                deductions,
            };
        });
        setPayrollWorksheet(worksheet);
        setIsRunPayrollModalOpen(true);
    };

    const handleOpenEditEntry = (entry: Payroll) => {
        setEditingWorksheetEntry(entry);
        setIsEditEntryModalOpen(true);
    };

    const handleUpdateWorksheetEntry = (updatedEntry: Payroll) => {
        setPayrollWorksheet(prev => prev.map(p => p.id === updatedEntry.id ? updatedEntry : p));
        setIsEditEntryModalOpen(false);
    };

    const finalizePayroll = () => {
        setIsGeneratingPayroll(true);
        savePayrollRun(payrollWorksheet).then(() => {
            setIsGeneratingPayroll(false);
            setIsRunPayrollModalOpen(false);
            addNotification(`Payroll for ${payrollWorksheet[0]?.month} finalized successfully.`, "success");
            // Always refresh history to ensure consistency
            if (activeTab === 'history') {
                fetchPayrollHistory(1, selectedStaffFilter, selectedMonthFilter);
            }
        }).catch(() => setIsGeneratingPayroll(false));
    };
    
    const openPayslipModal = (payrollEntry: Payroll) => {
        setSelectedPayroll(payrollEntry);
        setIsPayslipModalOpen(true);
    };
    
    const openP9Modal = async (staffMember: Staff) => {
        setSelectedStaffForP9(staffMember);
        // Fetch full history for P9 aggregation
        try {
            const history = await api.getPayrollHistory({ staffId: staffMember.id, limit: 50 }); // Get plenty of history
            setP9Data(history.data);
            setIsP9ModalOpen(true);
        } catch (e) {
            addNotification('Failed to load P9 data', 'error');
        }
    };
    
    const staffMemberForPayslip = selectedPayroll ? staff.find(s => s.id === selectedPayroll.staffId) : null;
    
    // Calculate P9 Aggregates
    const p9Aggregates = useMemo(() => {
        if(!p9Data.length) return null;
        const year = new Date().getFullYear();
        // Filter for current year
        const yearData = p9Data.filter(p => new Date(p.payDate).getFullYear() === year);
        
        // Sort months jan-dec
        yearData.sort((a,b) => new Date(a.payDate).getTime() - new Date(b.payDate).getTime());

        const totals = yearData.reduce((acc, curr) => ({
            basic: acc.basic + (curr.earnings.find(e => e.name === 'Basic Salary')?.amount || 0),
            gross: acc.gross + curr.grossPay,
            paye: acc.paye + (curr.deductions.find(d => d.name === 'PAYE')?.amount || 0),
            nssf: acc.nssf + (curr.deductions.find(d => d.name === 'NSSF')?.amount || 0),
            sha: acc.sha + (curr.deductions.find(d => d.name === 'SHA Contribution')?.amount || 0),
            levy: acc.levy + (curr.deductions.find(d => d.name === 'Housing Levy')?.amount || 0),
        }), { basic: 0, gross: 0, paye: 0, nssf: 0, sha: 0, levy: 0 });

        return { yearData, totals };
    }, [p9Data]);

    if (!schoolInfo) return null;

    const staffRoles = Object.values(Role).filter(r => r !== Role.Parent);

    return (
        <div className="p-6 md:p-8">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Staff & Payroll</h2>
                <div>
                     <button onClick={generatePayrollWorksheet} className="mr-4 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">Run Payroll</button>
                    <button onClick={() => openStaffModal()} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Add New Staff</button>
                </div>
            </div>
             <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button onClick={() => setActiveTab('roster')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'roster' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Staff Roster</button>
                    <button onClick={() => setActiveTab('items')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'items' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Payroll Items</button>
                    <button onClick={() => setActiveTab('history')} className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'history' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}`}>Payroll History</button>
                </nav>
            </div>
            {activeTab === 'roster' && (
                <div className="mt-6 bg-white rounded-xl shadow-lg overflow-x-auto">
                    <table className="w-full text-left table-auto">
                        <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3 font-semibold text-slate-600">Name</th><th className="px-4 py-3 font-semibold text-slate-600">Role</th><th className="px-4 py-3 font-semibold text-slate-600">Basic Salary (KES)</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
                        <tbody>{staff.map(s => (<tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 text-slate-800 font-medium">{s.name}</td><td className="px-4 py-3 text-slate-500">{s.role}</td><td className="px-4 py-3 text-slate-500">{s.salary.toLocaleString()}</td><td className="px-4 py-3 space-x-4"><button onClick={() => openStaffModal(s)} className="text-blue-600 hover:underline">Edit</button><button onClick={() => openIdCardModal(s, 'staff')} className="text-purple-600 hover:underline">ID Card</button><button onClick={() => openP9Modal(s)} className="text-green-600 hover:underline">View P9</button></td></tr>))}</tbody>
                    </table>
                </div>
            )}
            {activeTab === 'items' && (
                 <div className="mt-6">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-700">Custom Payroll Earnings & Deductions</h3><button onClick={() => openItemModal(null)} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Add Item</button></div>
                    <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                         <table className="w-full text-left table-auto">
                            <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3 font-semibold text-slate-600">Name</th><th className="px-4 py-3 font-semibold text-slate-600">Type</th><th className="px-4 py-3 font-semibold text-slate-600">Value</th><th className="px-4 py-3 font-semibold text-slate-600">Recurring</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
                            <tbody>{payrollItems.map(item => (<tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50"><td className="px-4 py-3 text-slate-800 font-medium">{item.name}</td><td className="px-4 py-3"><span className={`px-2 py-1 text-xs font-semibold rounded-full ${item.type === 'Earning' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.type}</span></td>
                                <td className="px-4 py-3 text-slate-500">
                                    {item.calculationType === CalculationType.Percentage
                                        ? `${item.value}% of Basic`
                                        : item.value.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}
                                </td>
                            <td className="px-4 py-3 text-slate-500">{item.isRecurring ? 'Yes' : 'No'}</td><td className="px-4 py-3 space-x-4"><button onClick={() => openItemModal(item)} className="text-blue-600 hover:underline">Edit</button><button onClick={() => handleDeleteItem(item.id)} className="text-red-600 hover:underline">Delete</button></td></tr>))}</tbody>
                        </table>
                    </div>
                </div>
            )}
            {activeTab === 'history' && (
                <div className="mt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
                        <select 
                            value={selectedStaffFilter} 
                            onChange={e => setSelectedStaffFilter(e.target.value)} 
                            className="p-2 border border-slate-300 rounded-lg"
                        >
                            <option value="">All Staff</option>
                            {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                        <input 
                            type="text" 
                            placeholder="Filter by month (e.g. October 2023)" 
                            value={selectedMonthFilter} 
                            onChange={e => setSelectedMonthFilter(e.target.value)} 
                            className="p-2 border border-slate-300 rounded-lg"
                        />
                    </div>

                    <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                        <table className="w-full text-left table-auto">
                            <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3 font-semibold text-slate-600">Month</th><th className="px-4 py-3 font-semibold text-slate-600">Staff Name</th><th className="px-4 py-3 font-semibold text-slate-600">Net Pay (KES)</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
                            <tbody>
                                {historyLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="border-b border-slate-100">
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-24"/></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-32"/></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-20"/></td>
                                            <td className="px-4 py-4"><Skeleton className="h-4 w-24"/></td>
                                        </tr>
                                    ))
                                ) : payrollHistory.length === 0 ? (
                                    <tr><td colSpan={4} className="text-center py-8 text-slate-500">No payroll records found.</td></tr>
                                ) : (
                                    payrollHistory.map(p => (
                                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 text-slate-500">{p.month}</td>
                                            <td className="px-4 py-3 text-slate-800 font-medium">{p.staffName}</td>
                                            <td className="px-4 py-3 font-semibold text-slate-800">{p.netPay.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</td>
                                            <td className="px-4 py-3"><button onClick={() => openPayslipModal(p)} className="text-blue-600 hover:underline">View Payslip</button></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={historyPage} totalPages={historyTotalPages} onPageChange={setHistoryPage} />
                </div>
            )}
            
            <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title={editingItem ? "Edit Payroll Item" : "Add Payroll Item"}>
                <form onSubmit={handleSaveItem} className="space-y-4">
                    <input type="text" placeholder="Item Name" value={itemFormData.name} onChange={e => setItemFormData(p => ({...p, name: e.target.value}))} required className="w-full p-2 border border-slate-300 rounded-lg"/>
                    <select value={itemFormData.type} onChange={e => setItemFormData(p => ({...p, type: e.target.value as PayrollItemType}))} className="w-full p-2 border border-slate-300 rounded-lg"><option value="Earning">Earning</option><option value="Deduction">Deduction</option></select>
                     <select value={itemFormData.calculationType} onChange={e => setItemFormData(p => ({...p, calculationType: e.target.value as CalculationType}))} className="w-full p-2 border border-slate-300 rounded-lg">
                        <option value={CalculationType.Fixed}>Fixed Amount</option>
                        <option value={CalculationType.Percentage}>Percentage of Basic</option>
                    </select>
                    <div className="relative">
                        <input 
                            type="number" 
                            placeholder={itemFormData.calculationType === CalculationType.Fixed ? 'Amount in KES' : 'Percentage'}
                            value={itemFormData.value || ''} 
                            onChange={e => setItemFormData(p => ({...p, value: parseFloat(e.target.value) || 0 }))} 
                            required 
                            className="w-full p-2 border border-slate-300 rounded-lg pr-12"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-slate-500">
                            {itemFormData.calculationType === CalculationType.Fixed ? 'KES' : '%'}
                        </span>
                    </div>

                    <label className="flex items-center"><input type="checkbox" checked={itemFormData.isRecurring} onChange={e => setItemFormData(p => ({...p, isRecurring: e.target.checked}))} className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"/> <span className="ml-2 text-slate-700">Is this a recurring monthly item?</span></label>
                    <div className="flex justify-end"><button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Item</button></div>
                </form>
            </Modal>
            
            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title={editingStaff ? 'Edit Staff Details' : 'Add New Staff Member'} size="3xl">
                <form onSubmit={handleSaveStaff} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 flex flex-col items-center">
                            <img 
                                src={staffPhotoUrl} 
                                alt="Staff" 
                                className="h-32 w-32 rounded-full object-cover border-4 border-slate-200 mb-4" 
                            />
                            <div className="flex space-x-2">
                                <button type="button" onClick={() => setIsStaffCaptureModalOpen(true)} className="px-3 py-1.5 bg-slate-600 text-white text-xs font-semibold rounded-lg hover:bg-slate-700">Capture</button>
                                <input type="file" accept="image/*" ref={staffPhotoInputRef} onChange={handleStaffPhotoUpload} className="hidden" />
                                <button type="button" onClick={() => staffPhotoInputRef.current?.click()} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-300">Upload</button>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                             <h4 className="text-lg font-semibold text-slate-700 mb-2">Account Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input type="text" name="name" placeholder="Full Name" value={staffFormData.name} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/>
                                <input type="email" name="email" placeholder="Email Address" value={staffFormData.email} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/>
                                <input type="password" name="password" placeholder={editingStaff ? 'New Password (optional)' : 'Password'} onChange={handleStaffFormChange} className="p-2 border border-slate-300 rounded-lg" />
                                <select name="userRole" value={staffFormData.userRole} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg">
                                    {staffRoles.map(r => <option key={r} value={r}>{r}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">Professional Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <input type="text" name="role" placeholder="Job Title (e.g., Grade 1 Teacher)" value={staffFormData.role} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/>
                            <input type="date" name="joinDate" value={staffFormData.joinDate} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/>
                            <input type="number" name="salary" placeholder="Basic Salary" value={staffFormData.salary || ''} onChange={handleStaffFormChange} required className="p-2 border border-slate-300 rounded-lg"/>
                        </div>
                    </div>

                    <div className="pt-4 border-t">
                        <h4 className="text-lg font-semibold text-slate-700 mb-2">Financial & Statutory Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" name="bankName" placeholder="Bank Name" value={staffFormData.bankName} onChange={handleStaffFormChange} className="p-2 border border-slate-300 rounded-lg"/>
                            <input type="text" name="accountNumber" placeholder="Bank Account Number" value={staffFormData.accountNumber} onChange={handleStaffFormChange} className="p-2 border border-slate-300 rounded-lg"/>
                            <input type="text" name="kraPin" placeholder="KRA PIN" value={staffFormData.kraPin} onChange={handleStaffFormChange} className="p-2 border border-slate-300 rounded-lg"/>
                            <input type="text" name="nssfNumber" placeholder="NSSF Number" value={staffFormData.nssfNumber} onChange={handleStaffFormChange} className="p-2 border border-slate-300 rounded-lg"/>
                            <input type="text" name="shaNumber" placeholder="SHA Number" value={staffFormData.shaNumber} onChange={handleStaffFormChange} className="p-2 border border-slate-300 rounded-lg"/>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Staff</button></div>
                </form>
            </Modal>

            <WebcamCaptureModal 
                isOpen={isStaffCaptureModalOpen} 
                onClose={() => setIsStaffCaptureModalOpen(false)} 
                onCapture={handleStaffPhotoCapture} 
            />

            <Modal isOpen={isRunPayrollModalOpen} onClose={() => setIsRunPayrollModalOpen(false)} title={`Generate Payroll for ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`} size="3xl">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm table-auto">
                        <thead>
                            <tr className="bg-slate-50">
                                <th className="p-2 font-semibold text-slate-600">Staff</th>
                                <th className="p-2 font-semibold text-slate-600">Gross</th>
                                <th className="p-2 font-semibold text-slate-600">Deductions</th>
                                <th className="p-2 font-semibold text-slate-600">Net Pay</th>
                                <th className="p-2 font-semibold text-slate-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {payrollWorksheet.map(p => (
                                <tr key={p.staffId} className="border-b border-slate-100">
                                    <td className="p-2 font-medium">{p.staffName}</td>
                                    <td className="p-2 text-green-700">{p.grossPay.toLocaleString()}</td>
                                    <td className="p-2 text-red-700">{p.totalDeductions.toLocaleString()}</td>
                                    <td className="p-2 font-bold text-slate-800">{p.netPay.toLocaleString()}</td>
                                    <td className="p-2">
                                        <button onClick={() => handleOpenEditEntry(p)} className="text-blue-600 hover:underline font-medium">Edit</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={finalizePayroll} disabled={isGeneratingPayroll} className="px-4 py-2 bg-primary-600 text-white rounded font-bold shadow-md hover:bg-primary-700 disabled:bg-slate-400">
                        {isGeneratingPayroll ? 'Saving...' : 'Finalize & Save Payroll'}
                    </button>
                </div>
            </Modal>

            <PayrollEditModal 
                isOpen={isEditEntryModalOpen}
                onClose={() => setIsEditEntryModalOpen(false)}
                entry={editingWorksheetEntry}
                onSave={handleUpdateWorksheetEntry}
            />
            
            {isPayslipModalOpen && selectedPayroll && staffMemberForPayslip && (
                 <Modal isOpen={isPayslipModalOpen} onClose={() => setIsPayslipModalOpen(false)} title={`Payslip`} size="2xl" footer={<button onClick={() => window.print()} className="px-4 py-2 bg-slate-600 text-white rounded no-print">Print</button>}>
                     <div className="printable-area font-sans text-slate-800 bg-white">
                         <div className="p-8 border border-slate-200 rounded-lg">
                            {/* Header */}
                            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                                <div className="flex items-center space-x-4">
                                    {schoolInfo.logoUrl && <img src={schoolInfo.logoUrl} alt="logo" className="h-20 w-20 rounded-full object-cover" />}
                                    <div>
                                        <h2 className="text-3xl font-bold text-primary-800">{schoolInfo.name}</h2>
                                        <p className="text-slate-500 text-sm">{schoolInfo.address}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h3 className="text-2xl font-bold text-slate-700">Payslip</h3>
                                    <p className="text-slate-500">{selectedPayroll.month}</p>
                                </div>
                            </div>
                            {/* Employee Details */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-3 my-6 text-sm">
                                <div><strong className="text-slate-500 block">Employee:</strong> <span className="font-semibold">{selectedPayroll.staffName}</span></div>
                                <div><strong className="text-slate-500 block">Employee ID:</strong> <span className="font-semibold">{selectedPayroll.staffId}</span></div>
                                <div><strong className="text-slate-500 block">Pay Date:</strong> <span className="font-semibold">{selectedPayroll.payDate}</span></div>
                                <div><strong className="text-slate-500 block">KRA PIN:</strong> <span className="font-semibold">{staffMemberForPayslip.kraPin}</span></div>
                                <div><strong className="text-slate-500 block">NSSF No:</strong> <span className="font-semibold">{staffMemberForPayslip.nssfNumber}</span></div>
                                <div><strong className="text-slate-500 block">SHA No:</strong> <span className="font-semibold">{staffMemberForPayslip.shaNumber}</span></div>
                            </div>
                            {/* Main Body */}
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <h4 className="text-lg font-semibold border-b pb-1 text-slate-700">Earnings</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {selectedPayroll.earnings.map((item, i) => (<tr key={i}><td className="py-1">{item.name}</td><td className="py-1 text-right">{item.amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</td></tr>))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-semibold border-b pb-1 text-slate-700">Deductions</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {selectedPayroll.deductions.map((item, i) => (<tr key={i}><td className="py-1">{item.name}</td><td className="py-1 text-right">({item.amount.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })})</td></tr>))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                             {/* Summary Section */}
                            <div className="mt-6 pt-4 border-t-2 border-slate-200 grid grid-cols-2 gap-8 items-end">
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between font-semibold"><span className="text-slate-600">Gross Pay:</span><span>{selectedPayroll.grossPay.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</span></div>
                                    <div className="flex justify-between font-semibold"><span className="text-slate-600">Total Deductions:</span><span>({selectedPayroll.totalDeductions.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })})</span></div>
                                </div>
                                <div className="bg-primary-50 p-4 rounded-lg text-right">
                                    <p className="text-sm font-semibold text-primary-700">Net Pay</p>
                                    <p className="text-3xl font-bold text-primary-800">{selectedPayroll.netPay.toLocaleString('en-KE', { style: 'currency', currency: 'KES' })}</p>
                                </div>
                            </div>
                            {/* Footer */}
                            <div className="mt-8 pt-4 border-t text-center text-xs text-slate-400">
                                <p>This is a computer-generated payslip and does not require a signature.</p>
                                <p>Generated by Saaslink School Management System &copy; {new Date().getFullYear()}</p>
                            </div>
                         </div>
                     </div>
                 </Modal>
            )}
             {isP9ModalOpen && selectedStaffForP9 && p9Aggregates && (
                <Modal isOpen={isP9ModalOpen} onClose={() => setIsP9ModalOpen(false)} title={`P9 Form: ${selectedStaffForP9.name}`} size="2xl" footer={<button onClick={() => window.print()} className="px-4 py-2 bg-slate-600 text-white rounded no-print">Print</button>}>
                     <div className="printable-area p-4 border border-slate-200 rounded-lg bg-white">
                        <h2 className="text-center font-bold text-xl uppercase">P9 A - Tax Deduction Card {new Date().getFullYear()}</h2>
                        <div className="my-4 text-sm grid grid-cols-2 gap-4">
                            <div>
                                <p><strong>Employer Name:</strong> {schoolInfo.name}</p>
                                <p><strong>Employer PIN:</strong> P000000000A</p>
                            </div>
                            <div>
                                <p><strong>Employee Name:</strong> {selectedStaffForP9.name}</p>
                                <p><strong>Employee PIN:</strong> {selectedStaffForP9.kraPin}</p>
                            </div>
                        </div>
                        <table className="w-full text-left text-xs table-auto border-collapse border border-slate-400">
                            <thead className="bg-slate-100">
                                <tr className="border border-slate-400 text-center font-bold">
                                    <th className="p-1 border border-slate-400">Month</th>
                                    <th className="p-1 border border-slate-400">Basic Pay</th>
                                    <th className="p-1 border border-slate-400">Benefits</th>
                                    <th className="p-1 border border-slate-400">Gross Pay</th>
                                    <th className="p-1 border border-slate-400">PAYE</th>
                                    <th className="p-1 border border-slate-400">NSSF</th>
                                    <th className="p-1 border border-slate-400">SHA</th>
                                    <th className="p-1 border border-slate-400">Housing Levy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {p9Aggregates.yearData.map(p => {
                                    const basic = p.earnings.find(e => e.name === 'Basic Salary')?.amount || 0;
                                    const benefits = p.grossPay - basic;
                                    const paye = p.deductions.find(d => d.name === 'PAYE')?.amount || 0;
                                    const nssf = p.deductions.find(d => d.name === 'NSSF')?.amount || 0;
                                    const sha = p.deductions.find(d => d.name === 'SHA Contribution')?.amount || 0;
                                    const levy = p.deductions.find(d => d.name === 'Housing Levy')?.amount || 0;

                                    return (
                                        <tr key={p.id} className="border border-slate-400 text-right">
                                            <td className="p-1 border border-slate-400 text-left">{p.month.split(' ')[0]}</td>
                                            <td className="p-1 border border-slate-400">{basic.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-1 border border-slate-400">{benefits.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-1 border border-slate-400 font-bold">{p.grossPay.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-1 border border-slate-400">{paye.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-1 border border-slate-400">{nssf.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-1 border border-slate-400">{sha.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                            <td className="p-1 border border-slate-400">{levy.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                        </tr>
                                    );
                                })}
                                <tr className="bg-slate-200 font-bold text-right">
                                    <td className="p-2 border border-slate-400 text-left">TOTALS</td>
                                    <td className="p-2 border border-slate-400">{p9Aggregates.totals.basic.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="p-2 border border-slate-400">{(p9Aggregates.totals.gross - p9Aggregates.totals.basic).toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="p-2 border border-slate-400">{p9Aggregates.totals.gross.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="p-2 border border-slate-400">{p9Aggregates.totals.paye.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="p-2 border border-slate-400">{p9Aggregates.totals.nssf.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="p-2 border border-slate-400">{p9Aggregates.totals.sha.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="p-2 border border-slate-400">{p9Aggregates.totals.levy.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </Modal>
            )}
        </div>
    )
};

export default StaffAndPayrollView;
