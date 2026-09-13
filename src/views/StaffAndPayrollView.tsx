
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet, FileText, Printer, Calendar, Calculator, Sparkles, CheckCircle2, AlertCircle, Info, RefreshCw, FileCheck } from 'lucide-react';
import Modal from '../components/common/Modal';
import WebcamCaptureModal from '../components/common/WebcamCaptureModal';
import Pagination from '../components/common/Pagination';
import Skeleton from '../components/common/Skeleton';
import type { Staff, Payroll, PayrollItem, NewStaff, NewPayrollItem, PayrollEntry } from '../types';
import { PayrollItemType, PayrollItemCategory, CalculationType, Role } from '../types';
import { useData } from '../contexts/DataContext';
import * as api from '../services/api';
import { generateStaffCSV, generateStaffPDF, triggerDownload } from '../services/exportService';
import { optimizeImage } from '../utils/imageOptimizer';

const DEFAULT_AVATAR = 'https://i.imgur.com/S5o7W44.png';

const PayrollEditModal: React.FC<{ isOpen: boolean; onClose: () => void; entry: Payroll | null; onSave: (updatedEntry: Payroll) => void; }> = ({ isOpen, onClose, entry, onSave }) => {
    const { formatCurrency } = useData();
    const [localEntry, setLocalEntry] = useState<Payroll | null>(null);
    const [newItemName, setNewItemName] = useState('');
    const [newItemAmount, setNewItemAmount] = useState(0);
    const [newItemType, setNewItemType] = useState<PayrollItemType>(PayrollItemType.Earning);

    useEffect(() => {
        setLocalEntry(entry ? JSON.parse(JSON.stringify(entry)) : null);
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
                <div>
                    <h4 className="font-semibold text-green-700 border-b pb-1 mb-2">Earnings</h4>
                    <table className="w-full text-sm">
                        <tbody>{localEntry.earnings.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100">
                                <td className="py-2">{item.name}</td>
                                <td className="py-2 text-right"><input type="number" value={item.amount} onChange={e => handleAmountChange('earnings', idx, parseFloat(e.target.value) || 0)} className="w-24 p-1 border rounded text-right"/></td>
                                <td className="py-2 text-right w-8"><button onClick={() => handleDeleteItem('earnings', idx)} className="text-red-500 hover:text-red-700">&times;</button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
                <div>
                    <h4 className="font-semibold text-red-700 border-b pb-1 mb-2">Deductions</h4>
                    <table className="w-full text-sm">
                        <tbody>{localEntry.deductions.map((item, idx) => (
                            <tr key={idx} className="border-b border-slate-100">
                                <td className="py-2">{item.name}</td>
                                <td className="py-2 text-right"><input type="number" value={item.amount} onChange={e => handleAmountChange('deductions', idx, parseFloat(e.target.value) || 0)} className="w-24 p-1 border rounded text-right"/></td>
                                <td className="py-2 text-right w-8"><button onClick={() => handleDeleteItem('deductions', idx)} className="text-red-500 hover:text-red-700">&times;</button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
                <div className="bg-slate-50 p-3 rounded border">
                    <h5 className="text-sm font-semibold mb-2">Add Line Item</h5>
                    <div className="flex gap-2">
                        <input placeholder="Name" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 p-1 border rounded text-sm"/>
                        <select value={newItemType} onChange={e => setNewItemType(e.target.value as PayrollItemType)} className="p-1 border rounded text-sm">
                            <option value={PayrollItemType.Earning}>Earning</option>
                            <option value={PayrollItemType.Deduction}>Deduction</option>
                        </select>
                        <input type="number" placeholder="Amount" value={newItemAmount || ''} onChange={e => setNewItemAmount(parseFloat(e.target.value))} className="w-20 p-1 border rounded text-sm"/>
                        <button onClick={handleAddItem} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Add</button>
                    </div>
                </div>
                <div className="grid grid-cols-3 gap-4 bg-slate-100 p-4 rounded font-bold text-center">
                    <div><div className="text-xs text-slate-500">Gross Pay</div><div className="text-green-700">{formatCurrency(localEntry.grossPay)}</div></div>
                    <div><div className="text-xs text-slate-500">Deductions</div><div className="text-red-700">{formatCurrency(localEntry.totalDeductions)}</div></div>
                    <div><div className="text-xs text-slate-500">Net Pay</div><div className="text-slate-800">{formatCurrency(localEntry.netPay)}</div></div>
                </div>
                <div className="flex justify-end pt-4 border-t"><button onClick={() => onSave(localEntry)} className="px-6 py-2 bg-primary-600 text-white font-semibold rounded shadow hover:bg-primary-700">Update Entry</button></div>
            </div>
        </Modal>
    );
};

const StaffAndPayrollView: React.FC = () => {
    const { schoolInfo, openIdCardModal, addNotification, formatCurrency } = useData();
    const queryClient = useQueryClient();
    
    // UI State
    const [activeTab, setActiveTab] = useState('roster');
    const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [isRunPayrollModalOpen, setIsRunPayrollModalOpen] = useState(false);
    const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
    const [isStaffCaptureModalOpen, setIsStaffCaptureModalOpen] = useState(false);
    const [isP9ModalOpen, setIsP9ModalOpen] = useState(false);
    const [p9Year, setP9Year] = useState<number>(new Date().getFullYear());
    const [p9ProjectionMode, setP9ProjectionMode] = useState<boolean>(false);
    const [isSimulatingYear, setIsSimulatingYear] = useState<boolean>(false);
    
    const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
    const [editingItem, setEditingItem] = useState<PayrollItem | null>(null);
    const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
    const [selectedStaffForP9, setSelectedStaffForP9] = useState<Staff | null>(null);
    const [payrollWorksheet, setPayrollWorksheet] = useState<Payroll[]>([]);
    
    const [editingWorksheetEntry, setEditingWorksheetEntry] = useState<Payroll | null>(null);
    const [isEditEntryModalOpen, setIsEditEntryModalOpen] = useState(false);
    
    // Filters
    const [historyPage, setHistoryPage] = useState(1);
    const [selectedStaffFilter, setSelectedStaffFilter] = useState('');
    const [selectedMonthFilter, setSelectedMonthFilter] = useState('');
    const [isGeneratingPayroll, setIsGeneratingPayroll] = useState(false);
    
    const staffPhotoInputRef = useRef<HTMLInputElement>(null);

    // --- Queries ---

    // 1. Fetch Staff (Roster)
    const { data: staffList = [] } = useQuery({
        queryKey: ['staff'],
        queryFn: () => api.getStaff(),
        enabled: activeTab === 'roster' || activeTab === 'history' 
    });

    // 2. Fetch Payroll Items
    const { data: payrollItems = [] } = useQuery({
        queryKey: ['payroll-items'],
        queryFn: () => api.getPayrollItems(),
        enabled: activeTab === 'items' || activeTab === 'roster' 
    });

    // 3. Fetch Payroll History
    const { data: historyData, isLoading: historyLoading } = useQuery({
        queryKey: ['payroll-history', historyPage, selectedStaffFilter, selectedMonthFilter],
        queryFn: () => api.getPayrollHistory({ 
            page: historyPage, 
            limit: 10,
            staffId: selectedStaffFilter || undefined,
            month: selectedMonthFilter || undefined
        }),
        enabled: activeTab === 'history',
        placeholderData: (prev) => prev
    });
    
    // 4. Fetch P9 Data (On Demand)
    const { data: p9RawResponse, isLoading: isP9Loading } = useQuery({
        queryKey: ['p9-history', selectedStaffForP9?.id],
        queryFn: async () => {
            if (!selectedStaffForP9) return [];
            const res = await api.getPayrollHistory({ staffId: selectedStaffForP9.id, limit: 100 });
            if (Array.isArray(res)) return res;
            if (Array.isArray(res?.data)) return res.data;
            return [];
        },
        enabled: !!selectedStaffForP9 && isP9ModalOpen
    });
    
    const payrollHistory: Payroll[] = Array.isArray(historyData) 
        ? historyData 
        : (Array.isArray(historyData?.data) ? historyData.data : []);
    const historyTotalPages = historyData?.last_page || (Array.isArray(historyData) ? Math.max(1, Math.ceil(historyData.length / 10)) : 1);

    const p9HistoryRecords: Payroll[] = useMemo(() => {
        if (Array.isArray(p9RawResponse)) return p9RawResponse;
        if (Array.isArray((p9RawResponse as any)?.data)) return (p9RawResponse as any).data;
        return [];
    }, [p9RawResponse]);

    // --- Mutations ---

    const addStaffMutation = useMutation({ mutationFn: api.createStaff, onSuccess: () => { queryClient.invalidateQueries({queryKey:['staff']}); setIsStaffModalOpen(false); addNotification('Staff added', 'success'); } });
    const updateStaffMutation = useMutation({ mutationFn: (d: any) => api.updateStaff(d.id, d.data), onSuccess: () => { queryClient.invalidateQueries({queryKey:['staff']}); setIsStaffModalOpen(false); addNotification('Staff updated', 'success'); } });
    
    const addItemMutation = useMutation({ mutationFn: api.createPayrollItem, onSuccess: () => { queryClient.invalidateQueries({queryKey:['payroll-items']}); setIsItemModalOpen(false); } });
    const updateItemMutation = useMutation({ mutationFn: (d: any) => api.updatePayrollItem(d.id, d.data), onSuccess: () => { queryClient.invalidateQueries({queryKey:['payroll-items']}); setIsItemModalOpen(false); } });
    const deleteItemMutation = useMutation({ mutationFn: api.deletePayrollItem, onSuccess: () => { queryClient.invalidateQueries({queryKey:['payroll-items']}); } });
    
    const savePayrollMutation = useMutation({ mutationFn: api.savePayrollRun, onSuccess: () => { queryClient.invalidateQueries({queryKey:['payroll-history']}); setIsRunPayrollModalOpen(false); addNotification('Payroll saved', 'success'); } });

    // --- Form State ---
    const initialStaffState: NewStaff & { photoUrl: string } = {
        name: '', email: '', userRole: Role.Teacher, role: '', salary: 0, joinDate: '', kraPin: '', nssfNumber: '', shaNumber: '',
        bankName: '', accountNumber: '', photoUrl: DEFAULT_AVATAR
    };
    const [staffFormData, setStaffFormData] = useState<any>(initialStaffState);
    const [itemFormData, setItemFormData] = useState<any>({});
    const [staffPhotoUrl, setStaffPhotoUrl] = useState(DEFAULT_AVATAR);

    // --- Handlers ---

    const openStaffModal = (staff?: Staff) => {
        setEditingStaff(staff || null);
        setStaffFormData(staff || initialStaffState);
        setStaffPhotoUrl(staff?.photoUrl || DEFAULT_AVATAR);
        setIsStaffModalOpen(true);
    };

    const handleStaffFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setStaffFormData((prev:any) => ({ ...prev, [name]: name === 'salary' ? parseFloat(value) || 0 : value }));
    };

    const handleSaveStaff = (e: React.FormEvent) => {
        e.preventDefault();
        const payload = { ...staffFormData, photoUrl: staffPhotoUrl };
        if (editingStaff) {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, userId, schoolId, user, ...rest } = payload;
            updateStaffMutation.mutate({ id: editingStaff.id, data: rest });
        } else {
            addStaffMutation.mutate(payload);
        }
    };
    
    const handleStaffPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            try {
                // Resize staff photo to 400x400 WebP for minimal VPS disk footprint
                const optimized = await optimizeImage(e.target.files[0], { preset: 'avatar', maxWidth: 400, maxHeight: 400 });
                const formData = new FormData();
                formData.append('file', optimized.file);
                formData.append('dataUrl', optimized.dataUrl);

                api.uploadStaffPhoto(formData).then(res => { 
                    const finalUrl = res?.url && !res.url.includes('undefined') ? res.url : optimized.dataUrl;
                    setStaffPhotoUrl(finalUrl);
                    addNotification(`Staff photo resized (${optimized.formattedStats}) and uploaded!`, 'success');
                }).catch(() => {
                    setStaffPhotoUrl(optimized.dataUrl);
                    addNotification(`Staff photo resized (${optimized.formattedStats}) and saved locally.`, 'info');
                });
            } catch (err: any) {
                addNotification('Failed to optimize photo: ' + (err?.message || 'Error processing file'), 'error');
            }
        }
    };
    
    const calculatePAYE = (taxablePay: number) => {
        const annualPay = taxablePay * 12;
        let tax = 0;
        if (annualPay <= 288000) tax = annualPay * 0.1;
        else if (annualPay <= 388000) tax = 28800 + (annualPay - 288000) * 0.25;
        else tax = 28800 + 25000 + (annualPay - 388000) * 0.30;
        return Math.max(0, (tax / 12) - 2400);
    };
    
    const generatePayrollWorksheet = () => {
        const month = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' });
        const worksheet = staffList.map((s: any) => {
            const earnings: any[] = [{ name: 'Basic Salary', amount: Number(s.salary) }];
            // Add recurring earnings
            payrollItems.filter((i:any) => i.type === PayrollItemType.Earning && i.isRecurring).forEach((i:any) => {
                const amt = i.calculationType === CalculationType.Percentage ? (i.value/100)*s.salary : i.value;
                earnings.push({ name: i.name, amount: amt });
            });
            
            const gross = earnings.reduce((sum, i) => sum + i.amount, 0);
            
            const deductions: any[] = [
                { name: 'PAYE', amount: calculatePAYE(gross) },
                { name: 'SHA', amount: gross * 0.0275 },
                { name: 'NSSF', amount: Math.min(gross, 18000) * 0.06 },
                { name: 'Levy', amount: gross * 0.015 },
            ];
             // Add recurring deductions
            payrollItems.filter((i:any) => i.type === PayrollItemType.Deduction && i.isRecurring).forEach((i:any) => {
                 const amt = i.calculationType === CalculationType.Percentage ? (i.value/100)*s.salary : i.value;
                 deductions.push({ name: i.name, amount: amt });
            });
            
            const totalDed = deductions.reduce((sum, d) => sum + d.amount, 0);
            return {
                id: `temp-${s.id}`,
                staffId: s.id,
                staffName: s.name,
                month,
                payDate: new Date().toISOString().split('T')[0],
                grossPay: gross,
                totalDeductions: totalDed,
                netPay: gross - totalDed,
                earnings,
                deductions
            };
        });
        setPayrollWorksheet(worksheet as any);
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
        savePayrollMutation.mutate(payrollWorksheet, {
             onSettled: () => setIsGeneratingPayroll(false)
        });
    };
    
    const openPayslipModal = (payrollEntry: Payroll) => {
        setSelectedPayroll(payrollEntry);
        setIsPayslipModalOpen(true);
    };
    
    const openP9Modal = (staffMember: Staff) => {
        setSelectedStaffForP9(staffMember);
        setP9Year(new Date().getFullYear());
        setP9ProjectionMode(false);
        setIsP9ModalOpen(true);
    };
    
    const staffMemberForPayslip = selectedPayroll ? staffList.find((s:Staff) => s.id === selectedPayroll.staffId) : null;
    
    const MONTH_NAMES = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const calculateKraMonthlyTax = (taxablePay: number): number => {
        if (taxablePay <= 0) return 0;
        let tax = 0;
        let rem = taxablePay;

        // Band 1: First 24,000 @ 10%
        const b1 = Math.min(rem, 24000);
        tax += b1 * 0.10;
        rem -= b1;

        // Band 2: Next 8,333.33 @ 25% (24,001 - 32,333)
        if (rem > 0) {
            const b2 = Math.min(rem, 8333.33);
            tax += b2 * 0.25;
            rem -= b2;
        }

        // Band 3: Next 467,666.67 @ 30% (32,334 - 500,000)
        if (rem > 0) {
            const b3 = Math.min(rem, 467666.67);
            tax += b3 * 0.30;
            rem -= b3;
        }

        // Band 4: Next 300,000 @ 32.5% (500,001 - 800,000)
        if (rem > 0) {
            const b4 = Math.min(rem, 300000);
            tax += b4 * 0.325;
            rem -= b4;
        }

        // Band 5: Over 800,000 @ 35%
        if (rem > 0) {
            tax += rem * 0.35;
        }

        return Math.round(tax);
    };

    const p9Rows = useMemo(() => {
        if (!selectedStaffForP9) return [];
        const baseSalary = Number(selectedStaffForP9.salary) || 0;

        // Filter records for this staff & year
        const yearRecords = p9HistoryRecords.filter((p: any) => {
            if (p.staffId !== selectedStaffForP9.id) return false;
            if (p.payDate) {
                const yr = new Date(p.payDate).getFullYear();
                if (yr === p9Year) return true;
            }
            if (p.month && p.month.includes(String(p9Year))) return true;
            return false;
        });

        const hasAnyRecords = yearRecords.length > 0;
        const useProjection = p9ProjectionMode || (!hasAnyRecords && baseSalary > 0);

        return MONTH_NAMES.map((monthName, idx) => {
            const rec = yearRecords.find((p: any) => {
                if (p.month && p.month.toLowerCase().startsWith(monthName.toLowerCase())) return true;
                if (p.payDate) {
                    const d = new Date(p.payDate);
                    return !isNaN(d.getTime()) && d.getMonth() === idx;
                }
                return false;
            });

            if (rec) {
                const basic = rec.earnings?.find((e: any) => e.name?.toLowerCase().includes('basic'))?.amount || rec.grossPay || 0;
                const benefits = 0;
                const allowances = Math.max(0, (rec.grossPay || 0) - basic);
                const gross = rec.grossPay || (basic + allowances);
                const e1 = Math.round(basic * 0.3);
                const actualNssf = rec.deductions?.find((d: any) => d.name?.toLowerCase().includes('nssf'))?.amount || 0;
                const e2 = actualNssf;
                const e3 = 20000;
                const interest = 0;
                const allowableDeduction = Math.min(e1, e2, e3) + interest;
                const taxablePay = Math.max(0, gross - allowableDeduction);
                const paye = rec.deductions?.find((d: any) => d.name?.toLowerCase().includes('paye'))?.amount || 0;
                const sha = rec.deductions?.find((d: any) => d.name?.toLowerCase().includes('sha') || d.name?.toLowerCase().includes('nhif'))?.amount || 0;
                const levy = rec.deductions?.find((d: any) => d.name?.toLowerCase().includes('levy') || d.name?.toLowerCase().includes('housing'))?.amount || 0;
                const personalRelief = 2400;
                const insuranceRelief = Math.round(sha * 0.15);
                const totalRelief = personalRelief + insuranceRelief;
                const taxCharged = paye + totalRelief;

                return {
                    month: monthName,
                    monthIndex: idx,
                    hasRecord: true,
                    isProjected: false,
                    basic,
                    benefits,
                    allowances,
                    gross,
                    e1,
                    e2,
                    e3,
                    interest,
                    allowableDeduction,
                    taxablePay,
                    taxCharged,
                    totalRelief,
                    paye,
                    sha,
                    levy,
                    netPay: rec.netPay || (gross - (rec.totalDeductions || (paye + e2 + sha + levy)))
                };
            }

            if (useProjection && baseSalary > 0) {
                const basic = baseSalary;
                const benefits = 0;
                const allowances = 0;
                const gross = basic;
                const e1 = Math.round(basic * 0.3);
                const e2 = Math.min(2160, Math.round(gross * 0.06));
                const e3 = 20000;
                const interest = 0;
                const allowableDeduction = Math.min(e1, e2, e3) + interest;
                const taxablePay = Math.max(0, gross - allowableDeduction);
                const taxCharged = calculateKraMonthlyTax(taxablePay);
                const sha = Math.max(300, Math.round(gross * 0.0275));
                const levy = Math.round(gross * 0.015);
                const personalRelief = 2400;
                const insuranceRelief = Math.round(sha * 0.15);
                const totalRelief = personalRelief + insuranceRelief;
                const paye = Math.max(0, taxCharged - totalRelief);
                const totalDeductions = paye + e2 + sha + levy;
                const netPay = gross - totalDeductions;

                return {
                    month: monthName,
                    monthIndex: idx,
                    hasRecord: false,
                    isProjected: true,
                    basic,
                    benefits,
                    allowances,
                    gross,
                    e1,
                    e2,
                    e3,
                    interest,
                    allowableDeduction,
                    taxablePay,
                    taxCharged,
                    totalRelief,
                    paye,
                    sha,
                    levy,
                    netPay
                };
            }

            return {
                month: monthName,
                monthIndex: idx,
                hasRecord: false,
                isProjected: false,
                basic: 0,
                benefits: 0,
                allowances: 0,
                gross: 0,
                e1: 0,
                e2: 0,
                e3: 20000,
                interest: 0,
                allowableDeduction: 0,
                taxablePay: 0,
                taxCharged: 0,
                totalRelief: 0,
                paye: 0,
                sha: 0,
                levy: 0,
                netPay: 0
            };
        });
    }, [selectedStaffForP9, p9HistoryRecords, p9Year, p9ProjectionMode]);

    const p9Totals = useMemo(() => {
        return p9Rows.reduce((acc, r) => ({
            basic: acc.basic + r.basic,
            benefits: acc.benefits + r.benefits,
            allowances: acc.allowances + r.allowances,
            gross: acc.gross + r.gross,
            e1: acc.e1 + r.e1,
            e2: acc.e2 + r.e2,
            e3: acc.e3 + r.e3,
            interest: acc.interest + r.interest,
            allowableDeduction: acc.allowableDeduction + r.allowableDeduction,
            taxablePay: acc.taxablePay + r.taxablePay,
            taxCharged: acc.taxCharged + r.taxCharged,
            totalRelief: acc.totalRelief + r.totalRelief,
            paye: acc.paye + r.paye,
            sha: acc.sha + r.sha,
            levy: acc.levy + r.levy,
            netPay: acc.netPay + r.netPay
        }), {
            basic: 0, benefits: 0, allowances: 0, gross: 0, e1: 0, e2: 0, e3: 0,
            interest: 0, allowableDeduction: 0, taxablePay: 0, taxCharged: 0,
            totalRelief: 0, paye: 0, sha: 0, levy: 0, netPay: 0
        });
    }, [p9Rows]);

    const hasRecordedPayrollForYear = useMemo(() => {
        return p9Rows.some(r => r.hasRecord);
    }, [p9Rows]);

    const handleSimulate12Months = async () => {
        if (!selectedStaffForP9) return;
        setIsSimulatingYear(true);
        try {
            const simulatedPayroll: Payroll[] = p9Rows.map(r => ({
                id: `pr-${selectedStaffForP9.id}-${p9Year}-${r.monthIndex + 1}`,
                staffId: selectedStaffForP9.id,
                staffName: selectedStaffForP9.name,
                month: `${r.month} ${p9Year}`,
                payDate: `${p9Year}-${String(r.monthIndex + 1).padStart(2, '0')}-28`,
                grossPay: r.gross,
                totalDeductions: r.paye + r.e2 + r.sha + r.levy,
                netPay: r.netPay,
                earnings: [
                    { name: 'Basic Salary', amount: r.basic }
                ],
                deductions: [
                    { name: 'PAYE', amount: r.paye },
                    { name: 'NSSF', amount: r.e2 },
                    { name: 'SHA', amount: r.sha },
                    { name: 'Affordable Housing Levy', amount: r.levy }
                ]
            }));
            await api.savePayrollRun(simulatedPayroll);
            queryClient.invalidateQueries({ queryKey: ['payroll-history'] });
            queryClient.invalidateQueries({ queryKey: ['p9-history', selectedStaffForP9.id] });
            addNotification(`Successfully saved 12 payroll entries for ${selectedStaffForP9.name} (${p9Year})!`, 'success');
        } catch (err: any) {
            addNotification(`Failed to simulate payroll: ${err.message}`, 'error');
        } finally {
            setIsSimulatingYear(false);
        }
    };

    const handleExportP9CSV = () => {
        if (!selectedStaffForP9 || !schoolInfo) return;
        const headers = [
            'Month',
            'Basic Salary (Col A)',
            'Benefits Non-Cash (Col B)',
            'Value of Quarters (Col C)',
            'Total Gross Pay (Col D)',
            'Defined Contribution 30% (Col E1)',
            'Actual Pension/NSSF (Col E2)',
            'Fixed Limit (Col E3)',
            'Mortgage Interest (Col F)',
            'Allowable Deduction (Col G)',
            'Taxable Pay (Col H)',
            'Tax Charged (Col J)',
            'Total Relief (Col K)',
            'P.A.Y.E Tax (Col L)',
            'SHA (Col M)',
            'Housing Levy (Col N)',
            'Net Pay'
        ];

        const rows = p9Rows.map(r => [
            r.month,
            r.basic,
            r.benefits,
            r.allowances,
            r.gross,
            r.e1,
            r.e2,
            r.e3,
            r.interest,
            r.allowableDeduction,
            r.taxablePay,
            r.taxCharged,
            r.totalRelief,
            r.paye,
            r.sha,
            r.levy,
            r.netPay
        ]);

        const totalRow = [
            'TOTALS',
            p9Totals.basic,
            p9Totals.benefits,
            p9Totals.allowances,
            p9Totals.gross,
            p9Totals.e1,
            p9Totals.e2,
            p9Totals.e3,
            p9Totals.interest,
            p9Totals.allowableDeduction,
            p9Totals.taxablePay,
            p9Totals.taxCharged,
            p9Totals.totalRelief,
            p9Totals.paye,
            p9Totals.sha,
            p9Totals.levy,
            p9Totals.netPay
        ];

        const csvContent = [
            `"KENYA REVENUE AUTHORITY - DOMESTIC TAXES DEPARTMENT"`,
            `"TAX DEDUCTION CARD (P9A) - YEAR ${p9Year}"`,
            `"Employer Name:","${schoolInfo.name}","Employer PIN:","${schoolInfo.taxPin || 'P051234567Z'}"`,
            `"Employee Name:","${selectedStaffForP9.name}","Employee PIN:","${selectedStaffForP9.kraPin || 'A000000000Z'}"`,
            '',
            headers.map(h => `"${h}"`).join(','),
            ...rows.map(row => row.join(',')),
            totalRow.join(',')
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const filename = `${schoolInfo.schoolCode || 'School'}_P9A_${selectedStaffForP9.name.replace(/\s+/g, '_')}_${p9Year}.csv`;
        triggerDownload(blob, filename);
        addNotification(`P9 Tax Deduction Card downloaded for ${selectedStaffForP9.name}.`, 'success');
    };

    if (!schoolInfo) return null;
    
    const handleSaveItem = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingItem) updateItemMutation.mutate({ id: editingItem.id, data: itemFormData });
        else addItemMutation.mutate(itemFormData);
    };

    const handleExportStaffCSV = () => {
        const csvStr = generateStaffCSV(staffList, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Staff_Roster_${new Date().toISOString().slice(0, 10)}.csv`;
        const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
        triggerDownload(blob, filename);
        addNotification(`Exported ${staffList.length} staff records to CSV.`, 'success');
    };

    const handleExportStaffPDF = () => {
        const doc = generateStaffPDF(staffList, schoolInfo);
        const filename = `${schoolInfo?.schoolCode || 'School'}_Staff_Roster_${new Date().toISOString().slice(0, 10)}.pdf`;
        doc.save(filename);
        addNotification(`Exported ${staffList.length} staff records to PDF.`, 'success');
    };

    return (
        <div className="p-6 md:p-8">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-3xl font-bold text-slate-800">Staff & Payroll</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        id="btn-export-staff-csv"
                        onClick={handleExportStaffCSV}
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition-colors"
                        title="Export Staff Records to CSV"
                    >
                        <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
                        Export CSV
                    </button>
                    <button
                        id="btn-export-staff-pdf"
                        onClick={handleExportStaffPDF}
                        className="inline-flex items-center px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg shadow-xs hover:bg-slate-50 transition-colors"
                        title="Export Staff Records to PDF"
                    >
                        <FileText className="w-3.5 h-3.5 mr-1.5 text-blue-600" />
                        Export PDF
                    </button>
                    <button onClick={generatePayrollWorksheet} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 text-xs">Run Payroll</button>
                    <button onClick={() => openStaffModal()} className="px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700 text-xs">Add New Staff</button>
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
                        <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3 font-semibold text-slate-600">Photo</th><th className="px-4 py-3 font-semibold text-slate-600">Name</th><th className="px-4 py-3 font-semibold text-slate-600">Role</th><th className="px-4 py-3 font-semibold text-slate-600">Basic Salary</th><th className="px-4 py-3 font-semibold text-slate-600">Actions</th></tr></thead>
                        <tbody>{staffList.map((s: any) => (
                            <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50">
                                <td className="px-4 py-3">
                                    <img 
                                        src={s.photoUrl || DEFAULT_AVATAR} 
                                        onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
                                        alt="staff" 
                                        className="h-10 w-10 rounded-full object-cover"
                                    />
                                </td>
                                <td className="px-4 py-3 text-slate-800 font-medium">{s.name}</td>
                                <td className="px-4 py-3 text-slate-500">{s.role}</td>
                                <td className="px-4 py-3 text-slate-500">{formatCurrency(s.salary)}</td>
                                <td className="px-4 py-3 space-x-4"><button onClick={() => openStaffModal(s)} className="text-blue-600 hover:underline">Edit</button><button onClick={() => openIdCardModal(s, 'staff')} className="text-purple-600 hover:underline">ID Card</button><button onClick={() => openP9Modal(s)} className="text-green-600 hover:underline">View P9</button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}
            
            {activeTab === 'items' && (
                 <div className="mt-6">
                    <div className="flex justify-between items-center mb-4"><h3 className="text-xl font-bold text-slate-700">Payroll Config</h3><button onClick={() => { setEditingItem(null); setItemFormData({}); setIsItemModalOpen(true); }} className="px-4 py-2 bg-primary-600 text-white rounded-lg shadow-md">Add Item</button></div>
                    <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
                         <table className="w-full text-left table-auto">
                            <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3">Name</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Value</th><th className="px-4 py-3">Recurring</th><th className="px-4 py-3">Actions</th></tr></thead>
                            <tbody>{payrollItems.map((item: any) => (
                                <tr key={item.id} className="border-b border-slate-100">
                                    <td className="px-4 py-3">{item.name}</td>
                                    <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-full ${item.type === 'Earning' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.type}</span></td>
                                    <td className="px-4 py-3">{item.calculationType === 'Percentage' ? `${item.value}%` : item.value}</td>
                                    <td className="px-4 py-3">{item.isRecurring ? 'Yes' : 'No'}</td>
                                    <td className="px-4 py-3 space-x-2">
                                        <button onClick={() => { setEditingItem(item); setItemFormData(item); setIsItemModalOpen(true); }} className="text-blue-600 hover:underline">Edit</button>
                                        <button onClick={() => { if(confirm('Delete?')) deleteItemMutation.mutate(item.id); }} className="text-red-600 hover:underline">Delete</button>
                                    </td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="mt-6 bg-white rounded-xl shadow-lg overflow-x-auto">
                     <div className="flex gap-4 p-4">
                         <select value={selectedStaffFilter} onChange={e => { setSelectedStaffFilter(e.target.value); setHistoryPage(1); }} className="p-2 border rounded">
                             <option value="">All Staff</option>
                             {staffList.map((s:Staff) => <option key={s.id} value={s.id}>{s.name}</option>)}
                         </select>
                         <input placeholder="Month (e.g. October)" value={selectedMonthFilter} onChange={e => { setSelectedMonthFilter(e.target.value); setHistoryPage(1); }} className="p-2 border rounded"/>
                     </div>
                    <table className="w-full text-left table-auto">
                        <thead><tr className="bg-slate-50 border-b border-slate-200"><th className="px-4 py-3">Month</th><th className="px-4 py-3">Staff</th><th className="px-4 py-3">Net Pay</th><th className="px-4 py-3">Actions</th></tr></thead>
                        <tbody>
                            {historyLoading ? <tr><td colSpan={4} className="p-4"><Skeleton className="h-8 w-full"/></td></tr> : 
                            payrollHistory.map((p: any) => (
                                <tr key={p.id} className="border-b border-slate-100">
                                    <td className="px-4 py-3">{p.month}</td>
                                    <td className="px-4 py-3">{p.staffName}</td>
                                    <td className="px-4 py-3 font-bold">{formatCurrency(p.netPay)}</td>
                                    <td className="px-4 py-3"><button onClick={() => { setSelectedPayroll(p); setIsPayslipModalOpen(true); }} className="text-blue-600 hover:underline">Payslip</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <Pagination currentPage={historyPage} totalPages={historyTotalPages} onPageChange={setHistoryPage} />
                </div>
            )}
            
            <Modal isOpen={isStaffModalOpen} onClose={() => setIsStaffModalOpen(false)} title={editingStaff ? 'Edit Staff Details' : 'Add New Staff Member'} size="3xl">
                <form onSubmit={handleSaveStaff} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1 flex flex-col items-center">
                            <img 
                                src={staffPhotoUrl} 
                                onError={(e) => { e.currentTarget.src = DEFAULT_AVATAR; }}
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
                                    {Object.values(Role).filter(r => r !== Role.Parent).map(r => <option key={r} value={r}>{r}</option>)}
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
            
             <Modal isOpen={isItemModalOpen} onClose={() => setIsItemModalOpen(false)} title={editingItem ? "Edit Payroll Item" : "Add Payroll Item"}>
                <form onSubmit={handleSaveItem} className="space-y-4">
                    <input type="text" placeholder="Item Name" value={itemFormData.name} onChange={e => setItemFormData({...itemFormData, name: e.target.value})} required className="w-full p-2 border border-slate-300 rounded-lg"/>
                    <select value={itemFormData.type} onChange={e => setItemFormData({...itemFormData, type: e.target.value as PayrollItemType})} className="w-full p-2 border border-slate-300 rounded-lg"><option value="Earning">Earning</option><option value="Deduction">Deduction</option></select>
                     <select value={itemFormData.calculationType} onChange={e => setItemFormData({...itemFormData, calculationType: e.target.value as CalculationType})} className="w-full p-2 border border-slate-300 rounded-lg">
                        <option value={CalculationType.Fixed}>Fixed Amount</option>
                        <option value={CalculationType.Percentage}>Percentage of Basic</option>
                    </select>
                    <div className="relative">
                        <input 
                            type="number" 
                            placeholder={itemFormData.calculationType === CalculationType.Fixed ? 'Amount' : 'Percentage'}
                            value={itemFormData.value || ''} 
                            onChange={e => setItemFormData({...itemFormData, value: parseFloat(e.target.value) || 0 })} 
                            required 
                            className="w-full p-2 border border-slate-300 rounded-lg pr-12"
                        />
                        <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-slate-500">
                            {itemFormData.calculationType === CalculationType.Fixed ? (schoolInfo.currency || 'KES') : '%'}
                        </span>
                    </div>

                    <label className="flex items-center"><input type="checkbox" checked={itemFormData.isRecurring} onChange={e => setItemFormData({...itemFormData, isRecurring: e.target.checked})} className="h-4 w-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"/> <span className="ml-2 text-slate-700">Is this a recurring monthly item?</span></label>
                    <div className="flex justify-end"><button type="submit" className="px-6 py-2 bg-primary-600 text-white font-semibold rounded-lg shadow-md hover:bg-primary-700">Save Item</button></div>
                </form>
            </Modal>

            <WebcamCaptureModal 
                isOpen={isStaffCaptureModalOpen} 
                onClose={() => setIsStaffCaptureModalOpen(false)} 
                onCapture={(url) => { setStaffPhotoUrl(url); setIsStaffCaptureModalOpen(false); }} 
            />

            <Modal isOpen={isRunPayrollModalOpen} onClose={() => setIsRunPayrollModalOpen(false)} title={`Generate Payroll`} size="3xl">
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
                            {payrollWorksheet.map((p:any) => (
                                <tr key={p.staffId} className="border-b border-slate-100">
                                    <td className="p-2 font-medium">{p.staffName}</td>
                                    <td className="p-2 text-green-700">{formatCurrency(p.grossPay)}</td>
                                    <td className="p-2 text-red-700">{formatCurrency(p.totalDeductions)}</td>
                                    <td className="p-2 font-bold text-slate-800">{formatCurrency(p.netPay)}</td>
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
            
            {/* Payslip & P9 Modals same structure as previous ... */}
             {isPayslipModalOpen && selectedPayroll && staffMemberForPayslip && (
                 <Modal isOpen={isPayslipModalOpen} onClose={() => setIsPayslipModalOpen(false)} title={`Payslip`} size="2xl" footer={<button onClick={() => window.print()} className="px-4 py-2 bg-slate-600 text-white rounded no-print">Print</button>}>
                     <div className="printable-area font-sans text-slate-800 bg-white">
                         <div className="p-8 border border-slate-200 rounded-lg">
                            {/* Header */}
                            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
                                <div className="flex items-center space-x-4">
                                    {schoolInfo.logoUrl && <img src={schoolInfo.logoUrl} alt="logo" className="h-20 w-20 rounded-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />}
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
                                <div><strong className="text-slate-500 block">Employee ID:</strong> <span className="font-semibold">{selectedPayroll.staffId.substring(0, 8).toUpperCase()}</span></div>
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
                                            {selectedPayroll.earnings.map((item, i) => (<tr key={i}><td className="py-1">{item.name}</td><td className="py-1 text-right">{formatCurrency(item.amount)}</td></tr>))}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-lg font-semibold border-b pb-1 text-slate-700">Deductions</h4>
                                    <table className="w-full text-sm">
                                        <tbody>
                                            {selectedPayroll.deductions.map((item, i) => (<tr key={i}><td className="py-1">{item.name}</td><td className="py-1 text-right">({formatCurrency(item.amount)})</td></tr>))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                             {/* Summary Section */}
                            <div className="mt-6 pt-4 border-t-2 border-slate-200 grid grid-cols-2 gap-8 items-end">
                                <div className="text-sm space-y-1">
                                    <div className="flex justify-between font-semibold"><span className="text-slate-600">Gross Pay:</span><span>{formatCurrency(selectedPayroll.grossPay)}</span></div>
                                    <div className="flex justify-between font-semibold"><span className="text-slate-600">Total Deductions:</span><span>({formatCurrency(selectedPayroll.totalDeductions)})</span></div>
                                </div>
                                <div className="bg-primary-50 p-4 rounded-lg text-right">
                                    <p className="text-sm font-semibold text-primary-700">Net Pay</p>
                                    <p className="text-3xl font-bold text-primary-800">{formatCurrency(selectedPayroll.netPay)}</p>
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
             {isP9ModalOpen && selectedStaffForP9 && (
                <Modal 
                    isOpen={isP9ModalOpen} 
                    onClose={() => setIsP9ModalOpen(false)} 
                    title={`P9A Tax Deduction Card: ${selectedStaffForP9.name}`} 
                    size="5xl"
                    footer={
                        <div className="flex flex-wrap items-center justify-between gap-3 w-full no-print">
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                <Info className="h-4 w-4 text-primary-600 shrink-0" />
                                <span>Official KRA Form P9A standard format. Ready for annual tax filing.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                    type="button"
                                    onClick={handleExportP9CSV} 
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors"
                                >
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                                    <span>Export CSV</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => window.print()} 
                                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                                >
                                    <Printer className="h-4 w-4" />
                                    <span>Print P9 Card</span>
                                </button>
                                <button 
                                    type="button"
                                    onClick={() => setIsP9ModalOpen(false)} 
                                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    }
                >
                    <div className="space-y-4">
                        {/* Interactive Controls (Hidden on Print) */}
                        <div className="no-print bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm font-semibold text-slate-700">Tax Year:</span>
                                    <select 
                                        value={p9Year} 
                                        onChange={(e) => setP9Year(Number(e.target.value))}
                                        className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                                    >
                                        {[2027, 2026, 2025, 2024, 2023].map((yr) => (
                                            <option key={yr} value={yr}>{yr}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="h-5 w-px bg-slate-300 hidden sm:block" />

                                <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs">
                                    <button 
                                        type="button"
                                        onClick={() => setP9ProjectionMode(false)}
                                        className={`px-3 py-1 rounded-md font-medium transition-colors ${!p9ProjectionMode ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        {hasRecordedPayrollForYear ? 'Actual Processed Payroll' : 'Actual (Empty)'}
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setP9ProjectionMode(true)}
                                        className={`px-3 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${p9ProjectionMode ? 'bg-primary-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        <span>Contract Annual Projection</span>
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                {!hasRecordedPayrollForYear && (
                                    <button
                                        type="button"
                                        onClick={handleSimulate12Months}
                                        disabled={isSimulatingYear}
                                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                                        title="Generates 12 monthly payroll records for this year based on the contract and saves them to the database"
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${isSimulatingYear ? 'animate-spin' : ''}`} />
                                        <span>{isSimulatingYear ? 'Saving Records...' : 'Save 12-Month Records to DB'}</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Informational Banner if no records recorded */}
                        {!hasRecordedPayrollForYear && (
                            <div className="no-print p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                                <div className="text-xs text-amber-800">
                                    <p className="font-semibold">No processed payroll history found for {selectedStaffForP9.name} in {p9Year}.</p>
                                    <p className="mt-0.5 text-amber-700">
                                        Displaying the statutory 12-month P9 projection calculated from active contracted salary ({formatCurrency(selectedStaffForP9.salary || 0)}/mo). Click <strong>"Save 12-Month Records to DB"</strong> above to record these entries into the payroll history.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Printable Area - Form P9A */}
                        <div className="printable-area p-6 bg-white border border-slate-300 rounded-xl text-slate-900 font-sans shadow-xs">
                            {/* Official KRA Header */}
                            <div className="text-center border-b-2 border-slate-900 pb-3">
                                <div className="inline-block px-3 py-1 bg-emerald-800 text-white text-xs font-bold tracking-widest rounded-md uppercase mb-1.5">
                                    KENYA REVENUE AUTHORITY
                                </div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">DOMESTIC TAXES DEPARTMENT</p>
                                <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 mt-0.5">
                                    TAX DEDUCTION CARD YEAR {p9Year} (FORM P9A - PRIMARY)
                                </h2>
                            </div>

                            {/* Employer & Employee Particulars Box */}
                            <div className="my-4 border border-slate-800 rounded-lg overflow-hidden text-xs">
                                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-800 bg-slate-50/50">
                                    <div className="p-3 space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-600">Employer's Name:</span>
                                            <span className="font-bold text-slate-900">{schoolInfo.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-600">Employer's PIN:</span>
                                            <span className="font-mono font-bold text-slate-900">{schoolInfo.taxPin || 'P051234567Z'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-600">School Code:</span>
                                            <span className="font-mono text-slate-700">{schoolInfo.schoolCode || 'SCH-001'}</span>
                                        </div>
                                    </div>
                                    <div className="p-3 space-y-1.5">
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-600">Employee's Name:</span>
                                            <span className="font-bold text-slate-900">{selectedStaffForP9.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-600">Employee's KRA PIN:</span>
                                            <span className="font-mono font-bold text-slate-900">{selectedStaffForP9.kraPin || 'A000000000Z'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="font-bold text-slate-600">Designation / Role:</span>
                                            <span className="text-slate-700">{selectedStaffForP9.role}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* P9A 12-Month Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-[11px] border-collapse border border-slate-800">
                                    <thead>
                                        <tr className="bg-slate-100 text-slate-900 text-center font-bold border-b border-slate-800">
                                            <th rowSpan={2} className="p-1 border border-slate-800 w-24">MONTH</th>
                                            <th className="p-1 border border-slate-800">Basic Salary</th>
                                            <th className="p-1 border border-slate-800">Benefits (Non-Cash)</th>
                                            <th className="p-1 border border-slate-800">Value of Quarters</th>
                                            <th className="p-1 border border-slate-800">Total Gross Pay</th>
                                            <th colSpan={3} className="p-1 border border-slate-800">Defined Contribution Scheme</th>
                                            <th className="p-1 border border-slate-800">Owner-Occupied Interest</th>
                                            <th className="p-1 border border-slate-800">Retirement & Interest</th>
                                            <th className="p-1 border border-slate-800">Taxable Pay</th>
                                            <th className="p-1 border border-slate-800">Tax Charged</th>
                                            <th className="p-1 border border-slate-800">Tax Relief (Personal + Ins.)</th>
                                            <th className="p-1 border border-slate-800">P.A.Y.E. Tax</th>
                                        </tr>
                                        <tr className="bg-slate-200 text-slate-900 text-center font-mono font-bold text-[10px] border-b border-slate-800">
                                            <th className="p-1 border border-slate-800">A</th>
                                            <th className="p-1 border border-slate-800">B</th>
                                            <th className="p-1 border border-slate-800">C</th>
                                            <th className="p-1 border border-slate-800">D</th>
                                            <th className="p-1 border border-slate-800">E1 (30%)</th>
                                            <th className="p-1 border border-slate-800">E2 (Actual)</th>
                                            <th className="p-1 border border-slate-800">E3 (20k)</th>
                                            <th className="p-1 border border-slate-800">F</th>
                                            <th className="p-1 border border-slate-800">G</th>
                                            <th className="p-1 border border-slate-800">H</th>
                                            <th className="p-1 border border-slate-800">J</th>
                                            <th className="p-1 border border-slate-800">K</th>
                                            <th className="p-1 border border-slate-800">L</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {p9Rows.map((row) => (
                                            <tr key={row.monthIndex} className={`text-right border-b border-slate-400 hover:bg-slate-50/80 ${row.monthIndex % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}>
                                                <td className="p-1.5 border border-slate-800 text-left font-semibold text-slate-800">
                                                    {row.month}
                                                    {row.isProjected && <span className="ml-1 text-[9px] text-slate-400 font-normal no-print">*</span>}
                                                </td>
                                                <td className="p-1.5 border border-slate-800 font-mono">{formatCurrency(row.basic)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono">{formatCurrency(row.benefits)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono">{formatCurrency(row.allowances)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono font-bold text-slate-900 bg-slate-100/50">{formatCurrency(row.gross)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono text-slate-600">{formatCurrency(row.e1)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono">{formatCurrency(row.e2)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono text-slate-600">{formatCurrency(row.e3)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono">{formatCurrency(row.interest)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono text-slate-700">{formatCurrency(row.allowableDeduction)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono font-bold text-slate-900 bg-slate-100/50">{formatCurrency(row.taxablePay)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono">{formatCurrency(row.taxCharged)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono">{formatCurrency(row.totalRelief)}</td>
                                                <td className="p-1.5 border border-slate-800 font-mono font-bold text-emerald-700 bg-emerald-50/40">{formatCurrency(row.paye)}</td>
                                            </tr>
                                        ))}

                                        {/* Totals Row */}
                                        <tr className="bg-slate-200/90 font-bold text-right border-t-2 border-slate-900 text-slate-900">
                                            <td className="p-2 border border-slate-800 text-left font-black tracking-wider">TOTALS</td>
                                            <td className="p-2 border border-slate-800 font-mono">{formatCurrency(p9Totals.basic)}</td>
                                            <td className="p-2 border border-slate-800 font-mono">{formatCurrency(p9Totals.benefits)}</td>
                                            <td className="p-2 border border-slate-800 font-mono">{formatCurrency(p9Totals.allowances)}</td>
                                            <td className="p-2 border border-slate-800 font-mono font-black">{formatCurrency(p9Totals.gross)}</td>
                                            <td className="p-2 border border-slate-800 font-mono">{formatCurrency(p9Totals.e1)}</td>
                                            <td className="p-2 border border-slate-800 font-mono">{formatCurrency(p9Totals.e2)}</td>
                                            <td className="p-2 border border-slate-800 font-mono">{formatCurrency(p9Totals.e3 * 12)}</td>
                                            <td className="p-2 border border-slate-800 font-mono">{formatCurrency(p9Totals.interest)}</td>
                                            <td className="p-2 border border-slate-800 font-mono">{formatCurrency(p9Totals.allowableDeduction)}</td>
                                            <td className="p-2 border border-slate-800 font-mono font-black">{formatCurrency(p9Totals.taxablePay)}</td>
                                            <td className="p-2 border border-slate-800 font-mono">{formatCurrency(p9Totals.taxCharged)}</td>
                                            <td className="p-2 border border-slate-800 font-mono">{formatCurrency(p9Totals.totalRelief)}</td>
                                            <td className="p-2 border border-slate-800 font-mono font-black text-emerald-800 bg-emerald-100/50">{formatCurrency(p9Totals.paye)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Statutory Footnote summary: SHA and Housing Levy */}
                            <div className="mt-3 p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-6">
                                    <div>
                                        <span className="text-slate-500 font-medium">Total NSSF (Col E2): </span>
                                        <span className="font-mono font-bold text-slate-800">{formatCurrency(p9Totals.e2)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 font-medium">Total SHA (2.75%): </span>
                                        <span className="font-mono font-bold text-slate-800">{formatCurrency(p9Totals.sha)}</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 font-medium">Total Housing Levy (1.5%): </span>
                                        <span className="font-mono font-bold text-slate-800">{formatCurrency(p9Totals.levy)}</span>
                                    </div>
                                </div>
                                <div>
                                    <span className="text-slate-500 font-medium">Total Annual Net Pay: </span>
                                    <span className="font-mono font-bold text-primary-700 text-sm">{formatCurrency(p9Totals.netPay)}</span>
                                </div>
                            </div>

                            {/* Official Certification Section (Kenya Revenue Authority Mandate) */}
                            <div className="mt-4 pt-3 border-t-2 border-slate-800 text-[11px] text-slate-800">
                                <p className="font-bold uppercase tracking-wider mb-2">To be completed by Employer at end of year:</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p><strong>TOTAL TAX (COL. L):</strong> <span className="font-mono font-bold text-sm text-emerald-700">{formatCurrency(p9Totals.paye)}</span></p>
                                        <p className="text-[10px] text-slate-600 leading-relaxed">
                                            I/We certify that the summary of particulars above are correct in all details relating to this employee and that the tax deducted has been remitted to the Commissioner of Domestic Taxes.
                                        </p>
                                    </div>
                                    <div className="space-y-4 border-t md:border-t-0 md:border-l border-slate-300 md:pl-4 pt-2 md:pt-0">
                                        <div className="flex justify-between items-end border-b border-slate-400 pb-1">
                                            <span className="text-slate-500">Employer's Name:</span>
                                            <span className="font-bold">{schoolInfo.name}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-slate-400 pb-1">
                                            <span className="text-slate-500">Signature & Official Rubber Stamp:</span>
                                            <span className="text-slate-400 italic">___________________</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="text-slate-500">Date:</span>
                                            <span className="font-mono">{new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    )
};

export default StaffAndPayrollView;
